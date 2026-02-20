import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.accounts_apps.models import OTPRecord, Profiles
from .serializers import UserProfileSerializer

class RegisterAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Идентификация пользователя по номеру телефона",
        operation_description="Данный метод выполняет проверку наличия учетной записи в базе данных. Метод необходим для определения дальнейшего сценария маршрутизации клиента: направление на форму ввода пароля или на форму регистрации через OTP код.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description="Номер телефона клиента в международном формате"),
            }
        ),
        responses={
            200: openapi.Response(
                description="Статус проверки успешно получен",
                examples={
                    "application/json": {
                        "message": "User checked",
                        "is_new_user": True,
                        "token": None,
                        "email": False
                    }
                }
            )
        },
        tags=["Аутентификация"]
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
        operation_summary="Генерация и отправка одноразового пароля (OTP)",
        operation_description="Метод формирует шестизначный код безопасности и регистрирует его в базе данных с привязкой к номеру телефона. Код действителен в течение 5 минут.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description="Номер телефона получателя"),
                'type': openapi.Schema(type=openapi.TYPE_STRING, description="Канал доставки (sms или whatsapp)"),
            }
        ),
        responses={
            200: openapi.Response(
                description="Код успешно сгенерирован и отправлен",
                examples={"application/json": {"message": "Code sent via sms"}}
            )
        },
        tags=["Аутентификация"]
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
        operation_summary="Верификация OTP кода и авторизация",
        operation_description="Процедура проверки предоставленного кода. При успешной валидации система создает учетную запись (если она отсутствует) и генерирует бессрочный токен доступа (DRF Token) для обеспечения сквозной авторизации (SSO).",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number', 'code'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description="Номер телефона"),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description="Шестизначный проверочный код"),
            }
        ),
        responses={
            200: openapi.Response(
                description="Результат проверки кода",
                examples={
                    "application/json": {
                        "is_valid": True,
                        "token": "a1b2c3d4e5f6g7h8i9j0",
                        "is_new_user": True
                    }
                }
            )
        },
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        
        otp = OTPRecord.objects.filter(phone_number=phone_number, code=code).last()
        
        if not otp or not otp.is_valid():
            return Response({"is_valid": False, "error": "Неверный или просроченный код"}, status=status.HTTP_200_OK)
            
        otp.is_used = True
        otp.save()

        user, created = User.objects.get_or_create(username=phone_number)
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "is_valid": True,
            "token": token.key,
            "is_new_user": created
        })


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary="Авторизация по постоянному паролю",
        operation_description="Метод авторизации для существующих клиентов. Требует передачи данных об устройстве и локации для ведения журнала безопасности.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['phone_number', 'password'],
            properties={
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description="Логин (Номер телефона)"),
                'password': openapi.Schema(type=openapi.TYPE_STRING, description="Постоянный пароль пользователя"),
                'device': openapi.Schema(type=openapi.TYPE_STRING, description="Сведения об устройстве"),
                'location': openapi.Schema(type=openapi.TYPE_STRING, description="Географическое положение"),
            }
        ),
        responses={
            200: openapi.Response(description="Успешная авторизация. Возвращается токен и профиль клиента."),
            400: openapi.Response(description="Отказ в доступе. Неверные учетные данные.")
        },
        tags=["Аутентификация"]
    )
    def post(self, request):
        phone_number = request.data.get('phone_number')
        password = request.data.get('password')

        user = authenticate(username=phone_number, password=password)
        if not user:
            return Response({"message": "Неверный логин или пароль"}, status=status.HTTP_400_BAD_REQUEST)

        token, _ = Token.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(user)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": serializer.data
        })


class InitProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Первичная инициализация профиля",
        operation_description="Обновление персональных данных клиента после успешной верификации номера. Требует передачи токена авторизации в заголовке запроса.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'full_name': openapi.Schema(type=openapi.TYPE_STRING, description="Полное имя (Имя и Фамилия)"),
                'email': openapi.Schema(type=openapi.TYPE_STRING, description="Адрес электронной почты"),
                'gender': openapi.Schema(type=openapi.TYPE_STRING, description="Пол клиента"),
            }
        ),
        responses={200: openapi.Response(description="Профиль успешно обновлен")},
        tags=["Управление профилем"]
    )
    def post(self, request):
        user = request.user
        data = request.data
        
        if 'full_name' in data:
            names = data['full_name'].split(' ', 1)
            user.first_name = names[0]
            user.last_name = names[1] if len(names) > 1 else ''
        if 'email' in data:
            user.email = data['email']
        user.save()

        profile, _ = Profiles.objects.get_or_create(user_id=user.id)
        if 'gender' in data:
            profile.gender = data['gender']
        profile.save()

        return Response(UserProfileSerializer(user).data)


class SetPasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Установка постоянного пароля",
        operation_description="Сохранение криптографического хэша пароля в базе данных. Выполняется на финальном этапе регистрации нового клиента.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['password'],
            properties={
                'password': openapi.Schema(type=openapi.TYPE_STRING, description="Новый пароль клиента"),
            }
        ),
        responses={
            200: openapi.Response(description="Пароль успешно установлен"),
            400: openapi.Response(description="Ошибка валидации запроса")
        },
        tags=["Управление профилем"]
    )
    def post(self, request):
        user = request.user
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
            return Response({"message": "Password set successfully"})
        return Response({"error": "Password required"}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получение данных текущего клиента",
        operation_description="Возвращает полную структуру данных профиля на основании токена авторизации, предоставленного в заголовке запроса.",
        responses={200: openapi.Response(description="Данные профиля получены")},
        tags=["Управление профилем"]
    )
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)