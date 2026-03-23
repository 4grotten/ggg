import requests
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class XerimeClient:    
    @classmethod
    def get_base_url(cls):
        return getattr(settings, 'XERIME_API_URL', 'https://api.xerime.com/xerimeAPI/api/v2').rstrip('/')

    @classmethod
    def login(cls):
        url = f"{cls.get_base_url()}/login"
        username = getattr(settings, 'XERIME_USERNAME', '')
        password = getattr(settings, 'XERIME_PASSWORD', '')
        
        try:
            response = requests.post(url, json={"username": username, "password": password}, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            token = data.get('access_token')
            expires_in = data.get('expires_in', 86400)
            cache.set('xerime_jwt_token', token, timeout=expires_in - 300)
            return token
        except requests.RequestException as e:
            logger.error(f"XerimeAPI Login Error: {e}")
            raise ValueError("Не удалось авторизоваться в провайдере криптокошельков.")

    @classmethod
    def get_token(cls):
        token = cache.get('xerime_jwt_token')
        if not token:
            token = cls.login()
        return token

    @classmethod
    def get_merchant_wallets(cls, merchant_id, merchant_name):
        token = cls.get_token()
        url = f"{cls.get_base_url()}/merchant-wallets/{merchant_id}"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"merchant_name": merchant_name}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=15)
            if response.status_code == 401:
                token = cls.login()
                headers["Authorization"] = f"Bearer {token}"
                response = requests.get(url, headers=headers, params=params, timeout=15)
                
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"XerimeAPI Get Wallets Error: {e}")
            raise ValueError("Ошибка получения реквизитов криптокошелька от провайдера.")