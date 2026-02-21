from decimal import Decimal

from apps.cards_apps.models import Cards
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.accounts_apps.models import Profiles
from .apofiz_client import ApofizClient

def generate_uid_tail(user_id):
    return str(user_id).zfill(6)[-6:]

def sync_apofiz_token_and_user(phone_number, apofiz_token, apofiz_user_data=None):
    user, created = User.objects.get_or_create(username=phone_number)
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
    if not Cards.objects.filter(user_id=str(user.id)).exists():
        tail = generate_uid_tail(user.id)
        Cards.objects.create(
            user_id=str(user.id),
            type='metal',
            name='Metal Card',
            status='active',
            balance=Decimal('50000.00'),
            last_four_digits=tail[-4:],
            card_number_encrypted=f"4532112233{tail}",
        )
        Cards.objects.create(
            user_id=str(user.id),
            type='virtual',
            name='Virtual Card',
            status='active',
            balance=Decimal('50000.00'),
            last_four_digits=tail[-4:],
            card_number_encrypted=f"4532112244{tail}",
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
        operation_description="**[СИМФОНИЯ SSO: POST /otp/verify/]**\nПроверяет код в Apofiz. При успехе бэкенд перехватывает токен, создает пользователя в EasyCard и **выпускает карты на 50k AED**.",
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
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Регистрация / Проверка телефона (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /register_auth/]**\nПроверяет, существует ли номер в Apofiz и начинает регистрацию.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Аутентификация"]
    )
    def post(self, request):
        status_code, data = ApofizClient.register_auth(request.data.get('phone_number'))
        return Response(data, status=status_code)


class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Подтвердить SMS-код регистрации (Apofiz + EasyCard SSO)",
        operation_description="**[СИМФОНИЯ SSO: POST /verify_code/]**\nКак и verify_otp, перехватывает токен и инициирует создание карт.",
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
        operation_summary="Установить пароль (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /set_password/]**\nУстанавливает пароль новому пользователю.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, required=['password'], properties={'password': openapi.Schema(type=openapi.TYPE_STRING)}),
        tags=["Управление паролями"]
    )
    def post(self, request):
        password = request.data.get('password')
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
        operation_summary="Создать / Обновить профиль (Apofiz + EasyCard)",
        operation_description="**[СИМФОНИЯ: POST /init_profile/]**\nОбновляет данные в Apofiz и синхронизирует их с локальной базой Django.",
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties={
            'full_name': openapi.Schema(type=openapi.TYPE_STRING), 'email': openapi.Schema(type=openapi.TYPE_STRING),
            'username': openapi.Schema(type=openapi.TYPE_STRING), 'gender': openapi.Schema(type=openapi.TYPE_STRING),
            'date_of_birth': openapi.Schema(type=openapi.TYPE_STRING), 'avatar_id': openapi.Schema(type=openapi.TYPE_INTEGER)
        }),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        status_code, data = ApofizClient.init_profile(request.auth.key, request.data)
        if status_code == 200:
            # Обновляем локальные таблицы
            user = request.user
            if 'full_name' in request.data:
                names = request.data['full_name'].split(' ', 1)
                user.first_name = names[0]
                user.last_name = names[1] if len(names) > 1 else ''
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()

            profile, _ = Profiles.objects.get_or_create(user_id=user.id)
            if 'gender' in request.data:
                profile.gender = request.data['gender']
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
        operation_summary="Загрузить аватар (Apofiz)",
        operation_description="**[Прокси на Apofiz: POST /files/]**\nПередает Multipart файл на сервер Apofiz, локально сохраняет полученный URL.",
        consumes=['multipart/form-data'],
        manual_parameters=[openapi.Parameter('file', openapi.IN_FORM, type=openapi.TYPE_FILE, description='Изображение (JPEG, PNG)')],
        tags=["Файлы и Соцсети"]
    )
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "Файл не предоставлен"}, status=400)

        status_code, data = ApofizClient.upload_avatar(request.auth.key, file_obj)
        if status_code == 200 and 'file' in data:
            profile, _ = Profiles.objects.get_or_create(user_id=request.user.id)
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