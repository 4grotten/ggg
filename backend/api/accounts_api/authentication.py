import requests
import logging
from rest_framework.authentication import TokenAuthentication
from rest_framework import exceptions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

class ApofizTokenAuthentication(TokenAuthentication):
    keyword = 'Token'
    def authenticate_credentials(self, key):
        try:
            token = Token.objects.select_related('user').get(key=key)
            return (token.user, token)
        except Token.DoesNotExist:
            apofiz_profile_url = "https://apofiz.com/api/v1/users/me/" 
            headers = {"Authorization": f"Token {key}"}
            try:
                response = requests.get(apofiz_profile_url, headers=headers, timeout=5)
            except requests.exceptions.RequestException as e:
                logger.error(f"Ошибка связи с Apofiz при проверке токена: {e}")
                raise exceptions.AuthenticationFailed('Не удалось связаться с сервером авторизации Apofiz.')
            if response.status_code == 200:
                user_data = response.json()
                phone = user_data.get('phone_number') or user_data.get('username')
                if not phone:
                    raise exceptions.AuthenticationFailed('Apofiz не вернул номер телефона пользователя (username).')
                user, created = User.objects.get_or_create(username=phone)
                if created:
                    user.first_name = user_data.get('first_name', '')
                    user.last_name = user_data.get('last_name', '')
                    user.email = user_data.get('email', '')
                    user.save()
                Token.objects.filter(user=user).delete()
                token = Token.objects.create(user=user, key=key)
                return (user, token)
            else:
                raise exceptions.AuthenticationFailed('Недействительный токен авторизации (Отклонено сервером Apofiz).')