import requests
import logging
from django.conf import settings
from django.core.cache import cache
import uuid


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
        

    @classmethod
    def create_crypto_deposit(cls, merchant_id, merchant_name, email, network, token, amount, tx_hash, wallet_address):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/crypto-deposit"
        headers = {"Authorization": f"Bearer {token_jwt}"}
        
        payload = {
            "crypto_amount": float(amount),
            "crypto_currency": token,
            "blockchain_tx_hash": tx_hash,
            "network": network,  # ожидается 'tron', 'ethereum' и тд
            "wallet": wallet_address,
            "merchant_id": str(merchant_id),
            "merchant_name": merchant_name or f"User {merchant_id}",
            "email": email or f"user_{merchant_id}@easycard.local",
            "review_id": f"R-{uuid.uuid4().hex[:8].upper()}" # Генерируем уникальный ID
        }
            
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 409:
            raise ValueError(f"Транзакция с таким хэшем ({tx_hash}) уже зарегистрирована в сети {network}.")
            
        response.raise_for_status()
        return response.json()
    
    @classmethod
    def create_rub_to_crypto_deposit(cls, merchant_id, amount_rub, crypto_currency="USDT"):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/rub-to-crypto"
        headers = {"Authorization": f"Bearer {token_jwt}"}
        
        payload = {
            "rub_amount": float(amount_rub),
            "crypto_currency": crypto_currency,
            "merchant_id": str(merchant_id),
            "review_id": f"R-{uuid.uuid4().hex[:8].upper()}"
        }
            
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        return response.json()
    
    @classmethod
    def get_transactions_history(cls, merchant_id=None, status=None):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/transactions"
        headers = {"Authorization": f"Bearer {token_jwt}"}
        
        params = {}
        if merchant_id:
            params["merchant_id"] = str(merchant_id)
        if status:
            params["status"] = status
            
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    
    @classmethod
    def get_transaction_details(cls, reference_id):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/transactions/{reference_id}"
        headers = {"Authorization": f"Bearer {token_jwt}"}
            
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()

    @classmethod
    def create_crypto_withdrawal(cls, merchant_id, network, token, amount, destination_address, external_reference):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/crypto-withdrawal"
        headers = {"Authorization": f"Bearer {token_jwt}"}
        
        payload = {
            "merchant_id": str(merchant_id),
            "crypto_currency": token,
            "crypto_amount": float(amount),
            "destination_address": destination_address,
            "network": network,
            "external_reference": external_reference
        }
            
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 422:
            raise ValueError("Недостаточно средств на балансе провайдера (Xerime) для совершения вывода.")
        if response.status_code == 409:
            raise ValueError(f"Заявка на вывод с ID {external_reference} уже существует (Дубликат).")
        if response.status_code == 400:
            err_data = response.json()
            raise ValueError(f"Ошибка параметров вывода: {err_data.get('detail', 'Неверная сеть или токен')}")
            
        response.raise_for_status()
        return response.json()

    @classmethod
    def get_crypto_withdrawals_history(cls, merchant_id=None, status=None):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/crypto-withdrawals"
        headers = {"Authorization": f"Bearer {token_jwt}"}
        
        params = {}
        if merchant_id:
            params["merchant_id"] = str(merchant_id)
        if status:
            params["status"] = status
            
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    @classmethod
    def get_crypto_withdrawal_details(cls, reference_id):
        token_jwt = cls.get_token()
        url = f"{cls.get_base_url()}/crypto-withdrawals/{reference_id}"
        headers = {"Authorization": f"Bearer {token_jwt}"}
            
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()