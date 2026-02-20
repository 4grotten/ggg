import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.accounts_apps.models import OTPRecord, Profiles
from .serializers import UserProfileSerializer
from .apofiz_client import ApofizClient

def sync_apofiz_token_and_user(phone_number, apofiz_token, apofiz_user_data=None):
    user, created = User.objects.get_or_create(username=phone_number)
    if apofiz_user_data:
        if 'email' in apofiz_user_data:
            user.email = apofiz_user_data['email']
        if 'full_name' in apofiz_user_data:
            names = apofiz_user_data['full_name'].split(' ', 1)
            user.first_name = names[0]
            if len(names) > 1:
                user.last_name = names[1]
        user.save()
    Profiles.objects.get_or_create(user_id=user.id, defaults={'phone': phone_number})
    Token.objects.filter(user=user).delete()
    Token.objects.create(key=apofiz_token, user=user)
    return user, created


class RegisterAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="1. Проверка существования пользователя",
        operation_description=(
            "**[Локальный метод - без участия Apofiz]**\n\n"
            "Этот метод проверяет, существует ли пользователь с таким номером телефона в локальной базе EasyCard. "
            "Фронтенд должен использовать этот метод первым, чтобы понять, куда перенаправить пользователя: "
            "на экран ввода пароля (если `is_new_user: false`) или на экран запроса OTP кода (если `is_new_user: true`)."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number'],
            properties={'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description="Номер телефона в международном формате (напр. +971501234567)")},
        ),
        tags=["Аутентификация (SSO)"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        user_exists = User.objects.filter(username=phone_number).exists()
        return Response({
            "message": "User checked",
            "is_new_user": not user_exists,
            "token": None,
            "email": False
        })


class SendOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="2. Отправка OTP кода",
        operation_description=(
            "**[Локальный метод - Заглушка]**\n\n"
            "Генерирует 6-значный код и сохраняет его локально. В официальной документации Apofiz "
            "отсутствует эндпоинт отправки SMS, поэтому на данный момент код генерируется и выводится в консоль бэкенда."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING),
                'type': openapi.Schema(type=openapi.TYPE_STRING, description="Канал доставки (sms или whatsapp)"),
            },
        ),
        tags=["Аутентификация (SSO)"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp_type = request.data.get('type', 'whatsapp')
        code = str(random.randint(100000, 999999))
        OTPRecord.objects.create(phone_number=phone_number, code=code)
        print(f"[MOCK OTP] Код для {phone_number}: {code}")
        return Response({"message": f"Code sent via {otp_type}"}, status=status.HTTP_200_OK)


class VerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="3. Верификация OTP кода (SSO Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /verify_code/]**\n\n"
            "Что происходит под капотом:\n"
            "1. Бэкенд EasyCard отправляет номер и код на сервер Apofiz.\n"
            "2. Если Apofiz отвечает успехом (200 OK) и выдает свой токен доступа, бэкенд перехватывает его.\n"
            "3. Создается локальный профиль (теневая регистрация), и токен Apofiz жестко привязывается к локальному юзеру.\n"
            "4. В этот же момент **автоматически выпускаются 2 карты (Virtual и Metal) на 50,000 AED** (через Django Signals).\n"
            "5. Фронтенд получает токен Apofiz и далее использует его в заголовке `Authorization: Token <token>`."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number', 'code'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description="6-значный код"),
            },
        ),
        tags=["Аутентификация (SSO)"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        apofiz_status, apofiz_data = ApofizClient.verify_code(phone_number, code)
        
        if apofiz_status != 200:
            return Response(apofiz_data, status=apofiz_status)
        
        apofiz_token = apofiz_data.get('token')
        user, created = sync_apofiz_token_and_user(phone_number, apofiz_token)
        
        return Response({
            "is_valid": True, 
            "token": apofiz_token, 
            "is_new_user": apofiz_data.get('is_new_user', created),
            "message": apofiz_data.get('message', 'Code verified successfully')
        })


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Авторизация по паролю (SSO Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /login/]**\n\n"
            "Используется для входа существующих пользователей. Бэкенд проксирует данные авторизации в Apofiz, "
            "забирает токен и профиль, синхронизирует их с локальной БД EasyCard и отдает фронтенду."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number', 'password'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
                'device': openapi.Schema(type=openapi.TYPE_STRING, description="Информация об устройстве для логов"),
                'location': openapi.Schema(type=openapi.TYPE_STRING, description="Геолокация для логов"),
            },
        ),
        tags=["Аутентификация (SSO)"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        password = request.data.get('password')
        device = request.data.get('device', 'Unknown Browser')
        location = request.data.get('location', 'Unknown Location')

        apofiz_status, apofiz_data = ApofizClient.login(phone_number, password, location, device)
        if apofiz_status != 200:
            return Response(apofiz_data, status=apofiz_status)

        apofiz_token = apofiz_data.get('token')
        user, _ = sync_apofiz_token_and_user(phone_number, apofiz_token, apofiz_data.get('user', {}))
        return Response({
            "message": "Login successful", 
            "token": apofiz_token, 
            "user": UserProfileSerializer(user).data
        })
    

class InitProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Инициализация / Обновление профиля (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /init_profile/]**\n\n"
            "Обновляет данные профиля пользователя. Важно: если пользователь загрузил аватар через `/files/`, "
            "фронтенд должен передать сюда полученный `avatar_id`.\n\n"
            "**Обязательные поля для Apofiz:** `full_name`, `username`, `email`, `date_of_birth`, `gender`. "
            "Бэкенд обновляет данные в Apofiz, а при успехе обновляет локальные таблицы `User` и `Profiles`."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'full_name': openapi.Schema(type=openapi.TYPE_STRING),
                'username': openapi.Schema(type=openapi.TYPE_STRING),
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'gender': openapi.Schema(type=openapi.TYPE_STRING, description="enum: male, female"),
                'date_of_birth': openapi.Schema(type=openapi.TYPE_STRING, description="Формат: YYYY-MM-DD"),
                'avatar_id': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID загруженного файла аватара"),
            },
        ),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        token_key = request.auth.key if request.auth else None
        apofiz_status, apofiz_data = ApofizClient.init_profile(token_key, request.data)
        if apofiz_status != 200:
            return Response(apofiz_data, status=apofiz_status)
        user = request.user
        data = request.data
        if 'full_name' in data:
            names = data['full_name'].split(' ', 1)
            user.first_name, user.last_name = names[0], names[1] if len(names) > 1 else ''
        if 'email' in data:
            user.email = data['email']
        user.save()
        profile, _ = Profiles.objects.get_or_create(user_id=user.id)
        if 'gender' in data:
            profile.gender = data['gender']
        profile.save()
        return Response(UserProfileSerializer(user).data)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить текущего пользователя",
        operation_description=(
            "**[Локальный метод]**\n\n"
            "Возвращает локальную (EasyCard) структуру данных профиля. Благодаря SSO классу авторизации, "
            "даже если пользователя нет в локальной БД, но его токен Apofiz валиден, профиль будет создан "
            "на лету перед выполнением этого метода."
        ),
        tags=["Профиль пользователя"]
    )
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Смена пароля (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /users/doChangePassword/]**\n\n"
            "Меняет пароль пользователя в системе Apofiz. При успешном ответе бэкенд также обновляет "
            "хэш пароля в локальной базе Django на всякий случай."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['old_password', 'new_password'],
            properties={
                'old_password': openapi.Schema(type=openapi.TYPE_STRING),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, description="Минимум 6 символов"),
            },
        ),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        token_key = request.auth.key
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        apofiz_status, apofiz_data = ApofizClient.change_password(token_key, old_password, new_password)
        if apofiz_status == 200:
            request.user.set_password(new_password)
            request.user.save()
        return Response(apofiz_data, status=apofiz_status)


class UserPhoneNumbersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить связанные номера телефонов (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: GET /users/{user_id}/phone_numbers/]**\n\n"
            "Возвращает список всех номеров телефонов, привязанных к данному аккаунту в системе Apofiz."
        ),
        tags=["Профиль пользователя"]
    )
    def get(self, request, user_id):
        token_key = request.auth.key
        apofiz_status, apofiz_data = ApofizClient.get_phone_numbers(token_key, user_id)
        return Response(apofiz_data, status=apofiz_status)


class SocialNetworksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Установка соцсетей (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /users/social_networks/]**\n\n"
            "Полностью заменяет текущие социальные сети пользователя в Apofiz. "
            "Отправка пустого массива удалит все существующие ссылки."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['networks'],
            properties={
                'networks': openapi.Schema(
                    type=openapi.TYPE_ARRAY, 
                    items=openapi.Schema(type=openapi.TYPE_STRING),
                    description='Массив ссылок, например: ["https://instagram.com/johndoe"]'
                ),
            },
        ),
        tags=["Профиль пользователя"]
    )
    def post(self, request):
        token_key = request.auth.key
        networks = request.data.get('networks', [])
        apofiz_status, apofiz_data = ApofizClient.set_social_networks(token_key, networks)
        return Response(apofiz_data, status=apofiz_status)
    

class UploadAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Загрузка аватара (Apofiz Multipart)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /files/]**\n\n"
            "Ожидает файл формата `multipart/form-data` (ключ `file`).\n"
            "1. Бэкенд EasyCard пересылает физический файл на сервер Apofiz.\n"
            "2. Apofiz возвращает объект с `id` файла и ссылками (large, medium, small).\n"
            "3. Бэкенд сохраняет оригинальный URL в локальную таблицу `Profiles`.\n"
            "4. Фронтенд должен сохранить полученный `id` файла, чтобы затем передать его в метод `/init_profile/`."
        ),
        consumes=['multipart/form-data'],
        manual_parameters=[
            openapi.Parameter('file', openapi.IN_FORM, type=openapi.TYPE_FILE, description='Изображение (JPEG, PNG. Макс 5MB)'),
        ],
        tags=["Файлы"]
    )
    def post(self, request):
        token_key = request.auth.key
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)
        apofiz_status, apofiz_data = ApofizClient.upload_avatar(token_key, file_obj)
        if apofiz_status == 200 and 'file' in apofiz_data:
            profile, _ = Profiles.objects.get_or_create(user_id=request.user.id)
            profile.avatar_url = apofiz_data['file']
            profile.save()
        return Response(apofiz_data, status=apofiz_status)


class AuthHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="История авторизаций (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: GET /users/authorisation_history/]**\n\n"
            "Возвращает пагинированный список всех активных и истекших сессий пользователя (устройств)."
        ),
        manual_parameters=[
            openapi.Parameter('page', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, description='Номер страницы (default: 1)'),
            openapi.Parameter('limit', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, description='Элементов на страницу (default: 20)'),
        ],
        tags=["Сессии и Безопасность"]
    )
    def get(self, request):
        token_key = request.auth.key
        page = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 20)
        apofiz_status, apofiz_data = ApofizClient.get_auth_history(token_key, page, limit)
        return Response(apofiz_data, status=apofiz_status)


class ChangeTokenExpirationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Изменить срок действия сессии (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: POST /users/change_token_expired_time/{token_id}/]**\n\n"
            "Изменяет время жизни конкретного токена (сессии). Пользователь может изменять только свои сессии."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['expired_time_choice'],
            properties={'expired_time_choice': openapi.Schema(type=openapi.TYPE_INTEGER, description="Новый срок действия в днях")},
        ),
        tags=["Сессии и Безопасность"]
    )
    def post(self, request, token_id):
        token_key = request.auth.key
        days = request.data.get('expired_time_choice', 30)
        apofiz_status, apofiz_data = ApofizClient.change_token_expiration(token_key, token_id, days)
        return Response(apofiz_data, status=apofiz_status)


class TerminateSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Завершить сессию устройства (Apofiz)",
        operation_description=(
            "**[Интеграция с Apofiz: DELETE /users/get_or_deactivate_token/{token_id}/]**\n\n"
            "Мгновенно деактивирует токен указанного устройства, разлогинивая пользователя на нем."
        ),
        tags=["Сессии и Безопасность"]
    )
    def delete(self, request, token_id):
        token_key = request.auth.key
        apofiz_status, apofiz_data = ApofizClient.terminate_session(token_key, token_id)
        return Response(apofiz_data, status=apofiz_status)