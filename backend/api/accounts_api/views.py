from decimal import Decimal
import uuid

import requests

from apps.cards_apps.models import Cards
from apps.transactions_apps.models import BankDepositAccounts, CryptoWallets
from api.accounts_api.serializers import AdminSettingsSerializer, ContactSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.accounts_apps.models import AdminSettings, Contacts, Profiles
from .apofiz_client import ApofizClient

def generate_uid_tail(user_id):
    return str(user_id).zfill(6)[-6:]

def sync_apofiz_token_and_user(phone_number, apofiz_token, apofiz_user_data=None):
    apofiz_id = apofiz_user_data.get('id') if apofiz_user_data else None
    user = User.objects.filter(username=phone_number).first()
    created = False
    if not user:
        if apofiz_id and isinstance(apofiz_id, int):
            user = User.objects.create(id=apofiz_id, username=phone_number)
        else:
            user = User.objects.create(username=phone_number)
        created = True
    if apofiz_user_data:
        if 'email' in apofiz_user_data and apofiz_user_data['email']:
            user.email = apofiz_user_data['email']
        if 'full_name' in apofiz_user_data:
            names = apofiz_user_data['full_name'].split(' ', 1)
            user.first_name = names[0]
            if len(names) > 1:
                user.last_name = names[1]
        user.save()
    profile, _ = Profiles.objects.get_or_create(user_id=str(user.id), defaults={'phone': phone_number})
    if apofiz_user_data and 'avatar' in apofiz_user_data and apofiz_user_data['avatar']:
        profile.avatar_url = apofiz_user_data['avatar'].get('file')
        profile.save()
    tail = generate_uid_tail(user.id)
    if not Cards.objects.filter(user_id=str(user.id)).exists():
        Cards.objects.create(
            user_id=str(user.id), type='metal', name='Metal Card', status='active',
            balance=Decimal('50000.00'), last_four_digits=tail[-4:], card_number_encrypted=f"4532112233{tail}",
        )
        Cards.objects.create(
            user_id=str(user.id), type='virtual', name='Virtual Card', status='active',
            balance=Decimal('50000.00'), last_four_digits=tail[-4:], card_number_encrypted=f"4532112244{tail}",
        )
    if not BankDepositAccounts.objects.filter(user_id=str(user.id)).exists():
        BankDepositAccounts.objects.create(
            user_id=str(user.id), iban=f"AE070331234567890{tail}", bank_name="EasyCard Default Bank",
            beneficiary=f"{user.first_name} {user.last_name}".strip() or "EasyCard Client", balance=Decimal('200000.00'), is_active=True
        )
    if not CryptoWallets.objects.filter(user_id=str(user.id)).exists():
        mock_address = f"T{uuid.uuid4().hex[:33]}"
        CryptoWallets.objects.create(
            user_id=str(user.id), network="TRC20", token="USDT", address=mock_address, balance=Decimal('200000.000000'), is_active=True
        )
    Token.objects.filter(user=user).delete()
    if apofiz_token:
        Token.objects.create(key=apofiz_token, user=user)
    return user, created


class SendOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Отправить OTP (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /otp/send/]**\nОтправляет одноразовый пароль на телефон пользователя через SMS или WhatsApp.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'type': openapi.Schema(type=openapi.TYPE_STRING, enum=['sms', 'whatsapp'])}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        status_code, data = ApofizClient.send_otp(request.data.get('phone_number'), request.data.get('type', 'whatsapp'))
        return Response(data, status=status_code)


class VerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Подтвердить OTP (Apofiz + EasyCard SSO)",
        operation_description="**[СИМФОНИЯ SSO: POST /otp/verify/]**\nПроверяет код в Apofiz. При успехе бэкенд перехватывает токен, создает пользователя в EasyCard и выпускает 4 счета.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number', 'code'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'code': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        status_code, data = ApofizClient.verify_otp(phone_number, request.data.get('code'))
        if status_code == 200 and data.get('token'):
            sync_apofiz_token_and_user(phone_number, data['token'])
        return Response(data, status=status_code)


class RegisterAuthView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Быстрая регистрация (Автоматический вход)",
        operation_description="Делает запрос в Apofiz. Если юзер новый и Apofiz возвращает token: null, бэкенд делает второй запрос автоматически, получает токен, создает локального юзера и 4 кошелька (Metal, Virtual, Bank, Crypto).",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING, example="+996777999991")}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({"error": "phone_number is required"}, status=status.HTTP_400_BAD_REQUEST)
        status_code, data = ApofizClient.register_auth(phone_number)
        if status_code == 200 and data.get('token') is None:
            status_code, data = ApofizClient.register_auth(phone_number)
        if status_code == 200 and data.get('token'):
            sync_apofiz_token_and_user(phone_number, data['token'])  
        return Response(data, status=status_code)


class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Подтвердить SMS-код регистрации (Apofiz + EasyCard SSO)",
        operation_description="**[СИМФОНИЯ SSO: POST /verify_code/]**\nКак и verify_otp, перехватывает токен и инициирует создание счетов.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number', 'code'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'code': openapi.Schema(type=openapi.TYPE_INTEGER)}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        status_code, data = ApofizClient.verify_code(phone_number, request.data.get('code'))
        if status_code == 200 and data.get('token'):
            sync_apofiz_token_and_user(phone_number, data['token'])
        return Response(data, status=status_code)


class ResendCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Отправить код повторно (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /resend_code/]**",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'type': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        status_code, data = ApofizClient.resend_code(request.data.get('phone_number'), request.data.get('type', 'whatsapp_auth_type'))
        return Response(data, status=status_code)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Вход по паролю (Apofiz + EasyCard SSO)",
        operation_description="**[СИМФОНИЯ SSO: POST /login/]**\nВход. Обновляет локальный токен и данные профиля на основе ответа Apofiz.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number', 'password'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'password': openapi.Schema(type=openapi.TYPE_STRING), 
                        'location': openapi.Schema(type=openapi.TYPE_STRING), 'device': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        status_code, data = ApofizClient.login(
            phone_number, request.data.get('password'), 
            request.data.get('location', 'Unknown'), request.data.get('device', 'Unknown')
        )
        if status_code == 200 and data.get('token'):
            sync_apofiz_token_and_user(phone_number, data['token'], data.get('user'))
        return Response(data, status=status_code)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Выход (Apofiz)",
        operation_description="**[Интеграция с Apofiz: POST /logout/]**\nИнвалидирует токен в Apofiz и удаляет его в локальной БД EasyCard.",
        tags=["Аутентификация"]
    )
    def post(self, request):
        status_code, data = ApofizClient.logout(request.auth.key)
        if status_code == 200:
            request.auth.delete()
        return Response(data, status=status_code)


class SetPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Установить пароль",
        operation_description="Устанавливает пароль для нового пользователя в Apofiz и дублирует его в локальной БД Django.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['password'], 
            properties={'password': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Управление паролями"]
    )
    def post(self, request):
        password = request.data.get('password')
        if not password:
             return Response({"error": "password is required"}, status=status.HTTP_400_BAD_REQUEST)  
        status_code, data = ApofizClient.set_password(request.auth.key, password)
        if status_code == 200:
            request.user.set_password(password)
            request.user.save()
        return Response(data, status=status_code)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Изменить пароль (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /users/doChangePassword/]**",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['old_password', 'new_password'],
            properties={'old_password': openapi.Schema(type=openapi.TYPE_STRING), 'new_password': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Управление паролями"]
    )
    def post(self, request):
        status_code, data = ApofizClient.change_password(request.auth.key, request.data.get('old_password'), request.data.get('new_password'))
        if status_code == 200:
            request.user.set_password(request.data.get('new_password'))
            request.user.save()
        return Response(data, status=status_code)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(operation_summary="Забыли пароль (Apofiz)", operation_description="**[Прокси на Apofiz: POST /users/forgot_password/]**",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING), 'method': openapi.Schema(type=openapi.TYPE_STRING, enum=['sms', 'whatsapp', 'email'])}),
        tags=["Управление паролями"])
    def post(self, request):
        status_code, data = ApofizClient.forgot_password(request.data.get('phone_number'), request.data.get('method', 'whatsapp'))
        return Response(data, status=status_code)


class ForgotPasswordEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Забыли пароль (Email) (Apofiz)", operation_description="**[Прокси на Apofiz: POST /users/forgot_password_email/]**", tags=["Управление паролями"])
    def post(self, request):
        status_code, data = ApofizClient.forgot_password_email(request.auth.key)
        return Response(data, status=status_code)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить текущего пользователя (Apofiz)",
        operation_description="**[Прокси на Apofiz: GET /users/me/]**\nЗабирает свежие данные профиля с сервера Apofiz.",
        tags=["Профиль пользователя"]
    )
    def get(self, request):
        status_code, data = ApofizClient.get_me(request.auth.key)
        return Response(data, status=status_code)


class InitProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Инициализация / Обновление профиля",
        operation_description="Отправляет данные в Apofiz и синхронизирует их с локальной БД (Django User + Profiles).",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties={
            'gender': openapi.Schema(type=openapi.TYPE_STRING, description="male / female"), 
            'avatar_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            'username': openapi.Schema(type=openapi.TYPE_STRING), 
            'email': openapi.Schema(type=openapi.TYPE_STRING),
            'full_name': openapi.Schema(type=openapi.TYPE_STRING), 
            'date_of_birth': openapi.Schema(type=openapi.TYPE_STRING, description="YYYY-MM-DD"), 
            'device_type': openapi.Schema(type=openapi.TYPE_STRING, description="android, ios, null")
        }),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        status_code, data = ApofizClient.init_profile(request.auth.key, request.data)
        if status_code == 200:
            user = request.user
            if 'full_name' in request.data:
                names = request.data['full_name'].split(' ', 1)
                user.first_name = names[0]
                user.last_name = names[1] if len(names) > 1 else ''
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()

            profile, _ = Profiles.objects.get_or_create(user_id=str(user.id), defaults={'phone': user.username})
            if 'gender' in request.data:
                profile.gender = request.data['gender']
            if 'date_of_birth' in request.data:
                profile.date_of_birth = request.data['date_of_birth']
            if data.get('avatar'):
                profile.avatar_url = data['avatar'].get('file')
            profile.save()

        return Response(data, status=status_code)


class GetEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Получить email (Apofiz)", tags=["Профиль пользователя"])
    def get(self, request):
        status_code, data = ApofizClient.get_email(request.auth.key)
        return Response(data, status=status_code)


class DeactivateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Деактивировать профиль (Apofiz)", tags=["Профиль пользователя"])
    def post(self, request):
        status_code, data = ApofizClient.deactivate(request.auth.key)
        if status_code == 200:
            request.user.is_active = False
            request.user.save()
        return Response(data, status=status_code)


class UserPhoneNumbersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Получить номера телефонов (Apofiz)", tags=["Профиль пользователя"])
    def get(self, request, user_id):
        status_code, data = ApofizClient.get_phone_numbers(request.auth.key, user_id)
        return Response(data, status=status_code)


class UpdatePhoneNumbersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Обновить номера телефонов (Apofiz)", 
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_numbers'], properties={'phone_numbers': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING))}),
        tags=["Профиль пользователя"])
    def post(self, request):
        status_code, data = ApofizClient.update_phone_numbers(request.auth.key, request.data.get('phone_numbers', []))
        return Response(data, status=status_code)


class UploadAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Загрузить аватар",
        operation_description="Передает Multipart файл на сервер Apofiz, локально сохраняет полученный URL в профиль пользователя.",
        consumes=['multipart/form-data'],
        manual_parameters=[openapi.Parameter('file', openapi.IN_FORM, type=openapi.TYPE_FILE, description='Изображение (JPEG, PNG)', required=True)],
        tags=["Файлы и Соцсети"]
    )
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "Файл не предоставлен"}, status=status.HTTP_400_BAD_REQUEST)
        status_code, data = ApofizClient.upload_avatar(request.auth.key, file_obj)
        if status_code == 200 and 'file' in data:
            profile, _ = Profiles.objects.get_or_create(user_id=str(request.user.id), defaults={'phone': request.user.username})
            profile.avatar_url = data['file']
            profile.save()
        return Response(data, status=status_code)


class UserSocialNetworksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Получить соцсети (Apofiz)", tags=["Файлы и Соцсети"])
    def get(self, request, user_id):
        status_code, data = ApofizClient.get_social_networks(request.auth.key, user_id)
        return Response(data, status=status_code)


class SetSocialNetworksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Установить соцсети (Apofiz)", 
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['networks'], properties={'networks': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING))}),
        tags=["Файлы и Соцсети"])
    def post(self, request):
        status_code, data = ApofizClient.set_social_networks(request.auth.key, request.data.get('networks', []))
        return Response(data, status=status_code)


class ActiveDevicesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Получить активные устройства (Apofiz)", 
        manual_parameters=[openapi.Parameter('page', openapi.IN_QUERY, type=openapi.TYPE_INTEGER), openapi.Parameter('limit', openapi.IN_QUERY, type=openapi.TYPE_INTEGER)],
        tags=["Сессии"])
    def get(self, request):
        status_code, data = ApofizClient.get_active_devices(request.auth.key, request.query_params.get('page', 1), request.query_params.get('limit', 50))
        return Response(data, status=status_code)


class AuthHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="История авторизаций (Apofiz)", 
        manual_parameters=[openapi.Parameter('page', openapi.IN_QUERY, type=openapi.TYPE_INTEGER), openapi.Parameter('limit', openapi.IN_QUERY, type=openapi.TYPE_INTEGER)],
        tags=["Сессии"])
    def get(self, request):
        status_code, data = ApofizClient.get_auth_history(request.auth.key, request.query_params.get('page', 1), request.query_params.get('limit', 20))
        return Response(data, status=status_code)


class TokenDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Детали устройства/сессии (Apofiz)", tags=["Сессии"])
    def get(self, request, device_id):
        status_code, data = ApofizClient.get_token_detail(request.auth.key, device_id)
        return Response(data, status=status_code)
    

class SyncContactsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Синхронизация и получение контактов",
        operation_description="Стучится в Apofiz, забирает свежие контакты, сохраняет/обновляет их в локальной БД EasyCard и возвращает актуальный список.",
        responses={200: ContactSerializer(many=True)},
        tags=["Контакты"]
    )
    def get(self, request):
        user = request.user
        token_obj = Token.objects.filter(user=user).first()
        if token_obj:
            headers = {'Authorization': f'Bearer {token_obj.key}'}
            try:
                url = 'https://apofiz.com/api/v1/contacts/?page=1&limit=200'
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    apofiz_data = response.json().get('list', [])
                    for c_data in apofiz_data:
                        apofiz_id = c_data.get('id')
                        if not apofiz_id:
                            continue
                            
                        Contacts.objects.update_or_create(
                            user=user,
                            apofiz_id=apofiz_id,
                            defaults={
                                'full_name': c_data.get('full_name') or 'Без имени',
                                'phone': c_data.get('phone'),
                                'email': c_data.get('email'),
                                'company': c_data.get('company'),
                                'position': c_data.get('position'),
                                'avatar_url': c_data.get('avatar_url') or c_data.get('avatar'),
                                'notes': c_data.get('notes'),
                                'payment_methods': c_data.get('payment_methods') or [],
                                'social_links': c_data.get('social_links') or [],
                            }
                        )
            except requests.RequestException as e:
                print(f"Apofiz Sync Error: {str(e)}")
        local_contacts = Contacts.objects.filter(user=user).order_by('full_name')
        serializer = ContactSerializer(local_contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Создать контакт",
        operation_description="Создает новый контакт в локальной БД EasyCard.",
        request_body=ContactSerializer,
        responses={201: ContactSerializer},
        tags=["Контакты"]
    )
    def post(self, request):
        data = request.data.copy()
        serializer = ContactSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Contacts.objects.get(pk=pk, user=user)
        except Contacts.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Получить контакт",
        responses={200: ContactSerializer},
        tags=["Контакты"]
    )
    def get(self, request, pk):
        contact = self.get_object(pk, request.user)
        if not contact:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ContactSerializer(contact)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Обновить контакт",
        request_body=ContactSerializer,
        responses={200: ContactSerializer},
        tags=["Контакты"]
    )
    def patch(self, request, pk):
        contact = self.get_object(pk, request.user)
        if not contact:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ContactSerializer(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Удалить контакт",
        tags=["Контакты"]
    )
    def delete(self, request, pk):
        contact = self.get_object(pk, request.user)
        if not contact:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        contact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk, user):
        try:
            return Contacts.objects.get(pk=pk, user=user)
        except Contacts.DoesNotExist:
            return None
    @swagger_auto_schema(
        operation_summary="Загрузить аватар контакта",
        tags=["Контакты"]
    )
    def post(self, request, pk):
        contact = self.get_object(pk, request.user)
        if not contact:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        from .apofiz_client import ApofizClient
        token = request.META.get('HTTP_AUTHORIZATION', '').replace('Token ', '')
        status_code, result = ApofizClient.upload_avatar(token, file)

        if status_code in (200, 201):
            avatar_url = result.get('file_url') or result.get('url') or result.get('avatar_url', '')
            if avatar_url:
                contact.avatar_url = avatar_url
                contact.save()
            serializer = ContactSerializer(contact)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(result, status=status_code)

    @swagger_auto_schema(
        operation_summary="Удалить аватар контакта",
        tags=["Контакты"]
    )
    def delete(self, request, pk):
        contact = self.get_object(pk, request.user)
        if not contact:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        contact.avatar_url = None
        contact.save()
        serializer = ContactSerializer(contact)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class AdminSettingsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Получить все настройки администратора",
        responses={200: AdminSettingsSerializer(many=True)},
        tags=["Админ Настройки"]
    )
    def get(self, request):
        settings = AdminSettings.objects.all().order_by('category', 'key')
        serializer = AdminSettingsSerializer(settings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Обновить или создать настройку",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['category', 'key', 'value'],
            properties={
                'category': openapi.Schema(type=openapi.TYPE_STRING),
                'key': openapi.Schema(type=openapi.TYPE_STRING),
                'value': openapi.Schema(type=openapi.TYPE_NUMBER),
            }
        ),
        tags=["Админ Настройки"]
    )
    def put(self, request):
        category = request.data.get('category')
        key = request.data.get('key')
        value = request.data.get('value')
        if not category or not key or value is None:
            return Response({"error": "Отсутствуют обязательные параметры (category, key, value)"}, status=status.HTTP_400_BAD_REQUEST)
        setting, created = AdminSettings.objects.get_or_create(
            category=category, 
            key=key,
            defaults={'value': value}
        )
        if not created:
            setting.value = value
            setting.save()
        serializer = AdminSettingsSerializer(setting)
        return Response(serializer.data, status=status.HTTP_200_OK)