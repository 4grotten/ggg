from decimal import Decimal
import uuid

import requests
from django.db.models import Q
from apps.cards_apps.models import Cards
from apps.transactions_apps.models import BankDepositAccounts, CryptoWallets, Transactions
from api.accounts_api.serializers import AdminActionHistorySerializer, AdminNotificationSettingsSerializer, AdminSettingsSerializer, ContactSerializer, UserLimitsSerializer, UserNotificationSettingsSerializer
from apps.accounts_apps.notifications import dispatch_test_notification
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.accounts_apps.models import AdminNotificationSettings, AdminSettings, Contacts, Profiles, UserNotificationSettings
from .apofiz_client import ApofizClient
from django.db.models import Sum, Count
from apps.accounts_apps.models import UserRoles
from apps.accounts_apps.models import AdminActionHistory, UserRoles
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

def generate_uid_tail(user_id):
    return str(user_id).zfill(6)[-6:]

def sync_apofiz_token_and_user(phone_number, apofiz_token, apofiz_user_data=None):
    if not apofiz_user_data:
        status_code, fetched_data = ApofizClient.get_me(apofiz_token)
        if status_code == 200:
            apofiz_user_data = fetched_data
    apofiz_id = apofiz_user_data.get('id') if apofiz_user_data else None
    user = User.objects.filter(username=phone_number).first()
    created = False
    if not user:
        if apofiz_id and isinstance(apofiz_id, int):
            user = User.objects.create(id=apofiz_id, username=phone_number)
        else:
            user = User.objects.create(username=phone_number)
        created = True
    has_init_profile = False
    if apofiz_user_data:
        if 'email' in apofiz_user_data and apofiz_user_data['email']:
            user.email = apofiz_user_data['email']
        if 'full_name' in apofiz_user_data and apofiz_user_data['full_name']:
            names = apofiz_user_data['full_name'].split(' ', 1)
            user.first_name = names[0]
            if len(names) > 1:
                user.last_name = names[1]
            has_init_profile = True
        user.save()
    profile, _ = Profiles.objects.get_or_create(user_id=str(user.id), defaults={'phone': phone_number})
    profile_updated = False
    if apofiz_user_data:
        if 'full_name' in apofiz_user_data and apofiz_user_data['full_name']:
            names = apofiz_user_data['full_name'].split(' ', 1)
            profile.first_name = names[0]
            if len(names) > 1:
                profile.last_name = names[1]
            profile_updated = True
        
        avatar_val = apofiz_user_data.get('avatar') or apofiz_user_data.get('avatar_url')
        if avatar_val:
            profile.avatar_url = avatar_val.get('file') if isinstance(avatar_val, dict) else avatar_val
            profile_updated = True
    if profile_updated:
        profile.save()
    if has_init_profile:
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
        operation_summary="Получить текущего пользователя (Детально)",
        operation_description="Синхронизируется с Apofiz и возвращает полную сводку по текущему пользователю (карты, счета, кошельки, лимиты, роль).",
        tags=["Профиль пользователя"]
    )
    def get(self, request):
        uid = str(request.user.id)
        status_code, apofiz_data = ApofizClient.get_me(request.auth.key)
        if status_code == 200 and apofiz_data:
            sync_apofiz_token_and_user(request.user.username, request.auth.key, apofiz_data)
        profile = Profiles.objects.filter(user_id=uid).first()
        if not profile:
            return Response({"error": "Профиль не найден"}, status=status.HTTP_404_NOT_FOUND)
        user_role_obj = UserRoles.objects.filter(user_id=uid).first()
        current_role = user_role_obj.role if user_role_obj else 'user'

        fname = getattr(profile, 'first_name', None) or ''
        lname = getattr(profile, 'last_name', None) or ''
        full_name = f"{fname} {lname}".strip()
        
        if not full_name:
            full_name = f"{request.user.first_name or ''} {request.user.last_name or ''}".strip()
            
        cards_qs = Cards.objects.filter(user_id=uid).values()
        cards = []
        for c in cards_qs:
            c.pop('cvv', None)
            c.pop('cvc', None)
            c['balance'] = round(float(c.get('balance') or 0), 2)
            cards.append(c)
            
        accounts_qs = BankDepositAccounts.objects.filter(user_id=uid).values()
        accounts = []
        for a in accounts_qs:
            a['balance'] = round(float(a.get('balance') or 0), 2)
            accounts.append(a)
            
        wallets_qs = CryptoWallets.objects.filter(user_id=uid).values()
        wallets = []
        for w in wallets_qs:
            w['balance'] = round(float(w.get('balance') or 0), 5)
            wallets.append(w)
            
        transactions_qs = Transactions.objects.filter(
            Q(user_id=uid) | Q(sender_id=uid) | Q(receiver_id=uid)
        ).order_by('-created_at')[:5].values()
        
        transactions = []
        for tx in transactions_qs:
            tx['amount'] = round(float(tx.get('amount') or 0), 2)
            tx['fee'] = round(float(tx.get('fee') or 0), 2) if tx.get('fee') is not None else None
            tx['exchange_rate'] = round(float(tx.get('exchange_rate') or 0), 2) if tx.get('exchange_rate') is not None else None
            tx['original_amount'] = round(float(tx.get('original_amount') or 0), 2) if tx.get('original_amount') is not None else None

            sender_id = str(tx.get('sender_id')) if tx.get('sender_id') else None
            receiver_id = str(tx.get('receiver_id')) if tx.get('receiver_id') else None
            
            if sender_id == uid and receiver_id == uid:
                tx['direction'] = 'internal'
            elif receiver_id == uid:
                tx['direction'] = 'inbound'
            else:
                tx['direction'] = 'outbound'
                
            transactions.append(tx)

        limits_serializer = UserLimitsSerializer(profile)
        
        is_verified = (getattr(profile, 'verification_status', 'unverified') == 'verified')
        verification_status = getattr(profile, 'verification_status', 'unverified')
        
        return Response({
            "user_id": uid,
            "full_name": full_name or "Unknown User",
            "phone": getattr(profile, 'phone', ''),
            "email": request.user.email or '',
            "gender": getattr(profile, 'gender', None),
            "language": getattr(profile, 'language', None),
            "avatar_url": getattr(profile, 'avatar_url', None),
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "is_verified": is_verified,
            "verification_status": verification_status,
            "role": current_role,
            "is_blocked": profile.is_blocked,
            "is_vip": profile.is_vip,
            "subscription_type": profile.subscription_type,
            "referral_level": profile.referral_level,
            "cards": cards,
            "accounts": accounts,
            "wallets": wallets,
            "transactions": transactions,
            "limits_and_settings": limits_serializer.data,
            "apofiz_data": apofiz_data if status_code == 200 else None
        }, status=status.HTTP_200_OK)


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
            sync_apofiz_token_and_user(request.user.username, request.auth.key, data.get('user', request.data))
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
    

class AdminUserLimitsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Список пользователей с полной информацией (Админ/Root)",
        tags=["Админ: Управление пользователями"]
    )
    def get(self, request):
        profiles = Profiles.objects.all().order_by('-created_at')
        serializer = UserLimitsSerializer(profiles, many=True)
        user_ids = [p.user_id for p in profiles]

        cards_agg = {}
        for row in Cards.objects.filter(user_id__in=user_ids).values('user_id').annotate(
            cards_count=Count('id'), total_cards_balance=Sum('balance')
        ):
            cards_agg[row['user_id']] = row

        accounts_agg = {}
        for row in BankDepositAccounts.objects.filter(user_id__in=user_ids).values('user_id').annotate(
            accounts_count=Count('id'), total_bank_balance=Sum('balance')
        ):
            accounts_agg[row['user_id']] = row
        crypto_agg = {}
        for row in CryptoWallets.objects.filter(user_id__in=user_ids).values('user_id').annotate(
            wallets_count=Count('id'), total_crypto_balance=Sum('balance')
        ):
            crypto_agg[row['user_id']] = row
        roles_map = {}
        for role_row in UserRoles.objects.filter(user_id__in=user_ids).values('user_id', 'role'):
            uid = role_row['user_id']
            role = role_row['role']
            if uid not in roles_map:
                roles_map[uid] = role
            else:
                current_role = roles_map[uid]
                if role == 'root':
                    roles_map[uid] = 'root'
                elif role == 'admin' and current_role != 'root':
                    roles_map[uid] = 'admin'
        numeric_uids = [uid for uid in user_ids if str(uid).isdigit()]
        users_map = {}
        if numeric_uids:
            for u in User.objects.filter(id__in=[int(uid) for uid in numeric_uids]):
                users_map[str(u.id)] = u

        data = []
        for i, profile in enumerate(profiles):
            fname = getattr(profile, 'first_name', None) or ''
            lname = getattr(profile, 'last_name', None) or ''
            full_name = f"{fname} {lname}".strip()

            if not full_name:
                user_obj = users_map.get(profile.user_id)
                if user_obj:
                    full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()

            uid = profile.user_id
            c = cards_agg.get(uid, {})
            a = accounts_agg.get(uid, {})
            w = crypto_agg.get(uid, {})
            
            is_verified = (getattr(profile, 'verification_status', 'unverified') == 'verified')
            verification_status = getattr(profile, 'verification_status', 'unverified')

            user_obj = users_map.get(uid)
            email = user_obj.email if user_obj else ''

            data.append({
                "user_id": uid,
                "full_name": full_name or "Unknown User",
                "phone": getattr(profile, 'phone', ''),
                "email": email or '',
                "gender": getattr(profile, 'gender', None),
                "language": getattr(profile, 'language', None),
                "avatar_url": getattr(profile, 'avatar_url', None),
                "created_at": profile.created_at.isoformat() if profile.created_at else None,
                "role": roles_map.get(uid, 'user'),
                "is_verified": is_verified,
                "verification_status": verification_status,
                "referral_level": getattr(profile, 'referral_level', 'r1'),
                "cards_count": c.get('cards_count', 0),
                "total_cards_balance": round(float(c.get('total_cards_balance', 0) or 0), 2),
                "accounts_count": a.get('accounts_count', 0),
                "total_bank_balance": round(float(a.get('total_bank_balance', 0) or 0), 2),
                "crypto_wallets_count": w.get('wallets_count', 0),
                "total_crypto_balance": round(float(w.get('total_crypto_balance', 0) or 0), 5),
                "limits": serializer.data[i]
            })
            
        return Response(data, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    """GET full details for a single user (cards, accounts, wallets, transactions)"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Полная информация о пользователе (Админ/Root)",
        tags=["Админ: Управление пользователями"]
    )
    def get(self, request, user_id):
        uid = str(user_id)
        profile = Profiles.objects.filter(user_id=uid).first()
        if not profile:
            return Response({"error": "Профиль не найден"}, status=status.HTTP_404_NOT_FOUND)
        user_role_obj = UserRoles.objects.filter(user_id=uid).first()
        current_role = user_role_obj.role if user_role_obj else 'user'

        fname = getattr(profile, 'first_name', None) or ''
        lname = getattr(profile, 'last_name', None) or ''
        full_name = f"{fname} {lname}".strip()
        email = ''
        
        if uid.isdigit():
            try:
                user_obj = User.objects.get(id=int(uid))
                if not full_name:
                    full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()
                email = user_obj.email or ''
            except User.DoesNotExist:
                pass

        cards_qs = Cards.objects.filter(user_id=uid).values()
        cards = []
        for c in cards_qs:
            c.pop('cvv', None)
            c.pop('cvc', None)
            c['balance'] = round(float(c.get('balance') or 0), 2)
            cards.append(c)

        accounts_qs = BankDepositAccounts.objects.filter(user_id=uid).values()
        accounts = []
        for a in accounts_qs:
            a['balance'] = round(float(a.get('balance') or 0), 2)
            accounts.append(a)

        wallets_qs = CryptoWallets.objects.filter(user_id=uid).values()
        wallets = []
        for w in wallets_qs:
            w['balance'] = round(float(w.get('balance') or 0), 5)
            wallets.append(w)

        transactions_qs = Transactions.objects.filter(
            Q(user_id=uid) | Q(sender_id=uid) | Q(receiver_id=uid)
        ).order_by('-created_at')[:3].values()
        
        transactions = []
        for tx in transactions_qs:
            tx['amount'] = round(float(tx.get('amount') or 0), 2)
            tx['fee'] = round(float(tx.get('fee') or 0), 2) if tx.get('fee') is not None else None
            tx['exchange_rate'] = round(float(tx.get('exchange_rate') or 0), 2) if tx.get('exchange_rate') is not None else None
            tx['original_amount'] = round(float(tx.get('original_amount') or 0), 2) if tx.get('original_amount') is not None else None

            sender_id = str(tx.get('sender_id')) if tx.get('sender_id') else None
            receiver_id = str(tx.get('receiver_id')) if tx.get('receiver_id') else None
            
            if sender_id == uid and receiver_id == uid:
                tx['direction'] = 'internal'
            elif receiver_id == uid:
                tx['direction'] = 'inbound'
            else:
                tx['direction'] = 'outbound'
                
            transactions.append(tx)

        limits_serializer = UserLimitsSerializer(profile)
        
        is_verified = (getattr(profile, 'verification_status', 'unverified') == 'verified')
        verification_status = getattr(profile, 'verification_status', 'unverified')
        
        return Response({
            "user_id": uid,
            "full_name": full_name or "Unknown User",
            "phone": getattr(profile, 'phone', ''),
            "email": email,
            "gender": getattr(profile, 'gender', None),
            "language": getattr(profile, 'language', None),
            "avatar_url": getattr(profile, 'avatar_url', None),
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "is_verified": is_verified,
            "verification_status": verification_status,
            "role": current_role,
            "is_blocked": profile.is_blocked,
            "is_vip": profile.is_vip,
            "subscription_type": profile.subscription_type,
            "referral_level": profile.referral_level,

            "cards": cards,
            "accounts": accounts,
            "wallets": wallets,
            "transactions": transactions,
            "limits_and_settings": limits_serializer.data,
        }, status=status.HTTP_200_OK)


class AdminUserLimitDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Изменить лимиты, роли и данные пользователя (Root/Admin)",
        tags=["Админ: Управление пользователями"]
    )
    def patch(self, request, user_id):
        uid_str = str(user_id)
        
        profile = Profiles.objects.filter(user_id=uid_str).first()
        if not profile:
            return Response({"error": "Профиль не найден"}, status=status.HTTP_404_NOT_FOUND)
        
        acting_user_id = str(request.user.id)
        acting_user_role_obj = UserRoles.objects.filter(user_id=acting_user_id).first()
        acting_role = acting_user_role_obj.role if acting_user_role_obj else 'user'

        if acting_role not in ['root', 'admin']:
            return Response({"error": "У вас нет прав для выполнения этой операции"}, status=status.HTTP_403_FORBIDDEN)

        new_role = request.data.get('role')
        target_user_role_obj = UserRoles.objects.filter(user_id=uid_str).first()
        target_role = target_user_role_obj.role if target_user_role_obj else 'user'

        if new_role and new_role != target_role:
            if acting_role != 'root':
                return Response({"error": "Только Root может назначать или изменять роли"}, status=status.HTTP_403_FORBIDDEN)

        old_state = UserLimitsSerializer(profile).data
        old_state['role'] = target_role

        limit_keys = [
            'transfer_min', 'transfer_max', 'daily_transfer_limit', 'monthly_transfer_limit', 
            'withdrawal_min', 'withdrawal_max', 'daily_withdrawal_limit', 'monthly_withdrawal_limit',
            'daily_top_up_limit', 'monthly_top_up_limit',
            'daily_usdt_send_limit', 'monthly_usdt_send_limit',
            'daily_usdt_receive_limit', 'monthly_usdt_receive_limit',
            'card_to_card_percent', 'bank_transfer_percent', 'network_fee_percent', 'currency_conversion_percent',
            'is_blocked', 'is_vip', 'subscription_type', 'referral_level'
        ]
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        if any(k in data for k in limit_keys):
            data['custom_settings_enabled'] = True
            
        serializer = UserLimitsSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if new_role and new_role != target_role:
                if target_user_role_obj:
                    target_user_role_obj.role = new_role
                    target_user_role_obj.save()
                else:
                    UserRoles.objects.create(user_id=uid_str, role=new_role)
                target_role = new_role
                if uid_str.isdigit():
                    try:
                        django_user = User.objects.get(id=int(uid_str))
                        is_admin_val = (new_role in ['root', 'admin'])
                        django_user.is_staff = is_admin_val
                        django_user.is_superuser = (new_role == 'root')
                        django_user.save()
                    except User.DoesNotExist:
                        pass

            fname = getattr(profile, 'first_name', None) or ''
            lname = getattr(profile, 'last_name', None) or ''
            full_name = f"{fname} {lname}".strip() or "Unknown User"

            new_state = UserLimitsSerializer(profile).data
            new_state['role'] = target_role

            changes = {}
            from decimal import Decimal
            for key in set(old_state.keys()) | set(new_state.keys()):
                old_val = old_state.get(key)
                new_val = new_state.get(key)
                if isinstance(old_val, Decimal):
                    old_val = float(old_val)
                if isinstance(new_val, Decimal):
                    new_val = float(new_val)
                
                if str(old_val) != str(new_val):
                    changes[key] = {'было': old_val, 'стало': new_val}
                    
            if changes:
                action_type = "UPDATE_USER_DATA"
                if new_role and new_role != old_state.get('role'):
                    action_type = "ROLE_CHANGED"
                
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip_addr = x_forwarded_for.split(',')[0].strip()
                else:
                    ip_addr = request.META.get('REMOTE_ADDR')
                
                try:
                    AdminActionHistory.objects.create(
                        admin_id=acting_user_id,
                        admin_name=request.user.get_full_name() or request.user.username,
                        action=action_type,
                        target_user_id=uid_str,
                        target_user_name=full_name,
                        details={"changes": changes, "acting_role": acting_role},
                        ip_address=ip_addr,
                        user_agent=request.META.get('HTTP_USER_AGENT')
                    )
                except Exception as e:
                    print(f"ОШИБКА АУДИТ-ЛОГА: {e}")
            return Response({
                "user_id": uid_str,
                "full_name": full_name,
                "phone": getattr(profile, 'phone', ''),
                "role": target_role,
                "is_blocked": profile.is_blocked,
                "is_vip": profile.is_vip,
                "subscription_type": profile.subscription_type,
                "referral_level": profile.referral_level,
                "limits_and_settings": serializer.data
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class AdminActionHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="История действий администраторов (Аудит)",
        operation_description="Получить общий список логов или отфильтровать по конкретному админу (передав параметр ?admin_id=... в URL).",
        manual_parameters=[
            openapi.Parameter('admin_id', openapi.IN_QUERY, description="ID администратора для фильтрации", type=openapi.TYPE_STRING)
        ],
        tags=["Админ: Аудит"]
    )
    def get(self, request):
        acting_user_role_obj = UserRoles.objects.filter(user_id=str(request.user.id)).first()
        acting_role = acting_user_role_obj.role if acting_user_role_obj else 'user'
        if acting_role not in ['root', 'admin']:
            return Response({"error": "Доступ запрещен. Только администраторы могут просматривать аудит."}, status=status.HTTP_403_FORBIDDEN)
        admin_id_filter = request.query_params.get('admin_id')
        queryset = AdminActionHistory.objects.all().order_by('-created_at')
        if admin_id_filter:
            queryset = queryset.filter(admin_id=admin_id_filter)
        queryset = queryset[:200]
        serializer = AdminActionHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Записать действие администратора в аудит-лог",
        operation_description="Создает запись в admin_action_history. Используется фронтендом для логирования действий типа VIEW_TRANSACTION_HISTORY, BLOCK_USER и т.д.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['action'],
            properties={
                'action': openapi.Schema(type=openapi.TYPE_STRING, description="Тип действия"),
                'target_user_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID целевого пользователя"),
                'details': openapi.Schema(type=openapi.TYPE_OBJECT, description="Дополнительные данные"),
            }
        ),
        tags=["Админ: Аудит"]
    )
    def post(self, request):
        acting_user_role_obj = UserRoles.objects.filter(user_id=str(request.user.id)).first()
        acting_role = acting_user_role_obj.role if acting_user_role_obj else 'user'
        if acting_role not in ['root', 'admin']:
            return Response({"error": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        if not action:
            return Response({"error": "action is required"}, status=status.HTTP_400_BAD_REQUEST)

        target_user_id = request.data.get('target_user_id')
        details = request.data.get('details', {})

        target_user_name = details.get('target_name', '')
        if not target_user_name and target_user_id:
            try:
                tp = Profiles.objects.get(user_id=str(target_user_id))
                target_user_name = f"{tp.first_name or ''} {tp.last_name or ''}".strip()
            except Profiles.DoesNotExist:
                pass

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_addr = x_forwarded_for.split(',')[0].strip()
        else:
            ip_addr = request.META.get('REMOTE_ADDR')

        details['acting_role'] = acting_role

        try:
            AdminActionHistory.objects.create(
                admin_id=str(request.user.id),
                admin_name=request.user.get_full_name() or request.user.username,
                action=action,
                target_user_id=str(target_user_id) if target_user_id else None,
                target_user_name=target_user_name or None,
                details=details,
                ip_address=ip_addr,
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)


class AdminStaffListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Список персонала (Админы и Руты)",
        operation_description="Возвращает список пользователей, у которых есть права admin или root. Без тяжелых финансовых данных.",
        tags=["Админ: Управление пользователями"]
    )
    def get(self, request):
        acting_user_role_obj = UserRoles.objects.filter(user_id=str(request.user.id)).first()
        acting_role = acting_user_role_obj.role if acting_user_role_obj else 'user'

        if acting_role not in ['root', 'admin']:
            return Response({"error": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)
        staff_roles = UserRoles.objects.filter(role__in=['root', 'admin'])
        
        if not staff_roles.exists():
            return Response([], status=status.HTTP_200_OK)

        roles_map = {}
        for role_record in staff_roles:
            uid = role_record.user_id
            r = role_record.role
            if uid not in roles_map:
                roles_map[uid] = r
            else:
                if r == 'root':
                    roles_map[uid] = 'root'
        
        user_ids = list(roles_map.keys())
        
        profiles = Profiles.objects.filter(user_id__in=user_ids).order_by('-created_at')
        
        numeric_uids = [uid for uid in user_ids if str(uid).isdigit()]
        users_map = {}
        if numeric_uids:
            for u in User.objects.filter(id__in=[int(uid) for uid in numeric_uids]):
                users_map[str(u.id)] = u
        data = []
        for profile in profiles:
            uid = profile.user_id
            role = roles_map.get(uid, 'user')
            
            fname = getattr(profile, 'first_name', None) or ''
            lname = getattr(profile, 'last_name', None) or ''
            full_name = f"{fname} {lname}".strip()
            
            user_obj = users_map.get(uid)
            if not full_name and user_obj:
                full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()
                
            email = user_obj.email if user_obj else ''
            is_verified = bool(full_name and full_name != "Unknown User" and getattr(profile, 'avatar_url', None))

            data.append({
                "user_id": uid,
                "full_name": full_name or "Unknown User",
                "phone": getattr(profile, 'phone', ''),
                "email": email,
                "avatar_url": getattr(profile, 'avatar_url', None),
                "role": role,
                "is_verified": is_verified,
                "is_blocked": profile.is_blocked,
                "created_at": profile.created_at.isoformat() if profile.created_at else None,
            })
            
        return Response(data, status=status.HTTP_200_OK)


class IsAdminOrRoot(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return UserRoles.objects.filter(
            user_id=request.user.id, 
            role__in=['admin', 'root']
        ).exists()


class IsRoot(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return UserRoles.objects.filter(
            user_id=request.user.id,
            role='root'
        ).exists()


def _is_root(user):
    return UserRoles.objects.filter(user_id=user.id, role='root').exists()


class AdminNotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def check_permissions_and_roles(self, request, method):
        requester_roles = UserRoles.objects.filter(user_id=request.user.id).values_list('role', flat=True)
        
        if 'root' not in requester_roles and 'admin' not in requester_roles:
            raise PermissionDenied("Доступ запрещен. Требуется роль Admin или Root.")

        if method in ['PUT', 'PATCH'] and 'root' not in requester_roles:
            raise PermissionDenied("Изменять настройки уведомлений может только пользователь с ролью Root.")

    def get_object(self, user_id):
        target_roles = UserRoles.objects.filter(user_id=user_id).values_list('role', flat=True)
        if 'admin' not in target_roles and 'root' not in target_roles:
            raise PermissionDenied("Указанный пользователь не является Admin или Root.")
            
        obj, _ = AdminNotificationSettings.objects.get_or_create(user_id=user_id)
        return obj

    def get(self, request, user_id):
        self.check_permissions_and_roles(request, request.method)
        settings_obj = self.get_object(user_id)
        serializer = AdminNotificationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request, user_id):
        self.check_permissions_and_roles(request, request.method)
        settings_obj = self.get_object(user_id)
        serializer = AdminNotificationSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        settings_obj, _ = AdminNotificationSettings.objects.get_or_create(user_id=user_id)
        dispatch_test_notification(settings_obj)
        return Response({"detail": "Тестовое уведомление отправлено."}, status=status.HTTP_200_OK)


class OpenUserDetailView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Полная информация о пользователе (БЕЗ ТОКЕНА)",
        tags=["Открытые API (Публичные)"]
    )
    def get(self, request, user_id):
        uid = str(user_id)
        profile = Profiles.objects.filter(user_id=uid).first()
        if not profile:
            return Response({"error": "Профиль не найден"}, status=status.HTTP_404_NOT_FOUND)
            
        user_role_obj = UserRoles.objects.filter(user_id=uid).first()
        current_role = user_role_obj.role if user_role_obj else 'user'

        fname = getattr(profile, 'first_name', None) or ''
        lname = getattr(profile, 'last_name', None) or ''
        full_name = f"{fname} {lname}".strip()
        email = ''
        
        if uid.isdigit():
            try:
                user_obj = User.objects.get(id=int(uid))
                if not full_name:
                    full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()
                email = user_obj.email or ''
            except User.DoesNotExist:
                pass

        cards = [
            {**c, 'balance': round(float(c.get('balance') or 0), 2), 'cvv': None, 'cvc': None} 
            for c in Cards.objects.filter(user_id=uid).values()
        ]
        
        accounts = [
            {**a, 'balance': round(float(a.get('balance') or 0), 2)} 
            for a in BankDepositAccounts.objects.filter(user_id=uid).values()
        ]
        
        wallets = [
            {**w, 'balance': round(float(w.get('balance') or 0), 5)} 
            for w in CryptoWallets.objects.filter(user_id=uid).values()
        ]

        from api.transactions_api.serializers import AdminTransactionSerializerDirect
        txs_queryset = Transactions.objects.filter(
            Q(user_id=uid) | Q(sender_id=uid) | Q(receiver_id=uid)
        ).order_by('-created_at')[:5]
        
        txs_data = AdminTransactionSerializerDirect(txs_queryset, many=True, context={'target_user_id': uid}).data

        limits_serializer = UserLimitsSerializer(profile)
        is_verified = bool(full_name and full_name != "Unknown User" and getattr(profile, 'avatar_url', None))

        return Response({
            "user_id": uid,
            "full_name": full_name or "Unknown User",
            "phone": getattr(profile, 'phone', ''),
            "email": email,
            "gender": getattr(profile, 'gender', None),
            "language": getattr(profile, 'language', None),
            "avatar_url": getattr(profile, 'avatar_url', None),
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "is_verified": is_verified,
            "role": current_role,
            "is_blocked": profile.is_blocked,
            "is_vip": profile.is_vip,
            "subscription_type": profile.subscription_type,
            "referral_level": profile.referral_level,
            "cards": cards,
            "accounts": accounts,
            "wallets": wallets,
            "transactions": txs_data,
            "limits_and_settings": limits_serializer.data,
            "apofiz_data": None 
        }, status=status.HTTP_200_OK)
    

class UserNotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить настройки уведомлений текущего пользователя",
        tags=["Настройки уведомлений (Пользователь)"]
    )
    def get(self, request):
        obj, _ = UserNotificationSettings.objects.get_or_create(user_id=str(request.user.id))
        serializer = UserNotificationSettingsSerializer(obj)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Обновить настройки уведомлений текущего пользователя",
        request_body=UserNotificationSettingsSerializer,
        tags=["Настройки уведомлений (Пользователь)"]
    )
    def put(self, request):
        obj, _ = UserNotificationSettings.objects.get_or_create(user_id=str(request.user.id))
        serializer = UserNotificationSettingsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminVerifyUserView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Изменить статус верификации пользователя (Admin/Root)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['verification_status'],
            properties={'verification_status': openapi.Schema(type=openapi.TYPE_STRING, enum=['unverified', 'pending', 'verified', 'rejected'])}
        ),
        tags=["Админ: Управление пользователями"]
    )
    def patch(self, request, user_id):
        acting_user_role_obj = UserRoles.objects.filter(user_id=str(request.user.id)).first()
        acting_role = acting_user_role_obj.role if acting_user_role_obj else 'user'
        if acting_role not in ['root', 'admin']:
            return Response({"error": "Доступ запрещен"}, status=status.HTTP_403_FORBIDDEN)

        profile = Profiles.objects.filter(user_id=str(user_id)).first()
        if not profile:
            return Response({"error": "Профиль не найден"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('verification_status')
        if new_status not in ['unverified', 'pending', 'verified', 'rejected']:
            return Response({"error": "Неверный статус"}, status=status.HTTP_400_BAD_REQUEST)

        old_status = profile.verification_status
        profile.verification_status = new_status
        profile.save()
        try:
            AdminActionHistory.objects.create(
                admin_id=str(request.user.id),
                admin_name=request.user.get_full_name() or request.user.username,
                action="VERIFICATION_STATUS_CHANGED",
                target_user_id=str(user_id),
                details={"changes": {"verification_status": {"было": old_status, "стало": new_status}}, "acting_role": acting_role},
                ip_address=request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR')),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        except Exception:
            pass

        return Response({"status": "success", "user_id": user_id, "verification_status": new_status}, status=status.HTTP_200_OK)


class UpdateLanguageView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Изменить язык интерфейса пользователя",
        operation_description="Обновляет предпочитаемый язык для пользователя (влияет на push-уведомления).",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['language'],
            properties={
                'language': openapi.Schema(
                    type=openapi.TYPE_STRING, 
                    description="Код языка: ru, en, de, tr, zh, ar, es"
                )
            }
        ),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        lang = request.data.get('language')
        if not lang:
            return Response({"error": "language is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        profile, _ = Profiles.objects.get_or_create(
            user_id=str(request.user.id), 
            defaults={'phone': request.user.username}
        )
        profile.language = lang
        profile.save()
        
        return Response({"status": "success", "language": lang}, status=status.HTTP_200_OK)


class TelegramWebhookSaveChatIdView(APIView):
    """Публичный эндпоинт для сохранения telegram chat_id по username (вызывается webhook-ом бота)."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip().lower().replace('@', '')
        chat_id = request.data.get('chat_id', '').strip()

        if not username or not chat_id:
            return Response({"error": "username and chat_id required"}, status=status.HTTP_400_BAD_REQUEST)

        # Update admin notification settings
        updated_admin = AdminNotificationSettings.objects.filter(
            telegram_username__iexact=username
        ).update(telegram_chat_id=chat_id)

        updated_admin2 = AdminNotificationSettings.objects.filter(
            telegram_username__iexact=f"@{username}"
        ).update(telegram_chat_id=chat_id)

        # Update user notification settings
        updated_user = UserNotificationSettings.objects.filter(
            telegram_username__iexact=username
        ).update(telegram_chat_id=chat_id)

        updated_user2 = UserNotificationSettings.objects.filter(
            telegram_username__iexact=f"@{username}"
        ).update(telegram_chat_id=chat_id)

        total = updated_admin + updated_admin2 + updated_user + updated_user2

        return Response({
            "detail": f"Updated {total} record(s) for @{username}",
            "chat_id": chat_id,
        }, status=status.HTTP_200_OK)


class StatementSendView(APIView):
    """Send generated statement HTML to user channels (Telegram, WhatsApp, Email)."""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Отправить выписку через каналы уведомлений",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['pdf_base64', 'channels'],
            properties={
                'pdf_base64': openapi.Schema(type=openapi.TYPE_STRING, description='Base64-encoded PDF file'),
                'file_name': openapi.Schema(type=openapi.TYPE_STRING),
                'channels': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'period_label': openapi.Schema(type=openapi.TYPE_STRING),
                'asset_labels': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                'lang': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={200: openapi.Response(description="Результаты отправки")},
        tags=["Выписки (Statements)"]
    )
    def post(self, request):
        from apps.accounts_apps.notifications import send_statement_to_channels

        pdf_base64 = request.data.get('pdf_base64', '')
        file_name = request.data.get('file_name', '')
        channels = request.data.get('channels', [])
        period_label = request.data.get('period_label', '')
        asset_labels = request.data.get('asset_labels', [])
        lang = request.data.get('lang', 'en')

        if not pdf_base64 or not channels:
            return Response({"error": "pdf_base64 and channels are required"}, status=status.HTTP_400_BAD_REQUEST)

        results = send_statement_to_channels(
            user_id=request.user.id,
            channels=channels,
            period_label=period_label,
            asset_labels=asset_labels,
            lang=lang,
            pdf_base64=pdf_base64,
            file_name=file_name,
        )

        return Response({"results": results}, status=status.HTTP_200_OK)