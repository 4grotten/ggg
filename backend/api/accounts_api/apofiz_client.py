import requests
import logging

logger = logging.getLogger(__name__)

class ApofizClient:
    BASE_URL = "https://apofiz.com/api/v1"

    @classmethod
    def _make_request(cls, method, endpoint, data=None, params=None, token=None):
        url = f"{cls.BASE_URL}{endpoint}"
        headers = {}
        if token:
            headers['Authorization'] = f"Token {token}"
        try:
            response = requests.request(method, url, json=data, params=params, headers=headers, timeout=15)
            try:
                response_data = response.json()
            except ValueError:
                response_data = {"detail": response.text}
            return response.status_code, response_data
        except requests.RequestException as e:
            logger.error(f"Apofiz API Error: {e}")
            return 503, {"error": "Сервис Apofiz временно недоступен", "details": str(e)}

    @classmethod
    def verify_code(cls, phone_number, code):
        return cls._make_request("POST", "/verify_code/", {"phone_number": phone_number, "code": code})

    @classmethod
    def login(cls, phone_number, password, location="Unknown", device="Unknown"):
        return cls._make_request("POST", "/login/", {
            "phone_number": phone_number, "password": password, 
            "location": location, "device": device
        })

    @classmethod
    def change_password(cls, token, old_password, new_password):
        return cls._make_request("POST", "/users/doChangePassword/", {
            "old_password": old_password, "new_password": new_password
        }, token=token)

    @classmethod
    def init_profile(cls, token, profile_data):
        return cls._make_request("POST", "/init_profile/", profile_data, token=token)

    @classmethod
    def get_phone_numbers(cls, token, user_id):
        return cls._make_request("GET", f"/users/{user_id}/phone_numbers/", token=token)

    @classmethod
    def upload_avatar(cls, token, file_obj):
        url = f"{cls.BASE_URL}/files/"
        headers = {'Authorization': f"Token {token}"} if token else {}
        try:
            files = {'file': (file_obj.name, file_obj.read(), file_obj.content_type)}
            response = requests.post(url, headers=headers, files=files, timeout=20)
            return response.status_code, response.json()
        except requests.RequestException as e:
            logger.error(f"Apofiz Upload Error: {e}")
            return 503, {"error": "Ошибка загрузки файла в Apofiz"}

    @classmethod
    def set_social_networks(cls, token, networks_array):
        return cls._make_request("POST", "/users/social_networks/", {"networks": networks_array}, token=token)

    @classmethod
    def get_auth_history(cls, token, page=1, limit=20):
        return cls._make_request("GET", "/users/authorisation_history/", params={"page": page, "limit": limit}, token=token)

    @classmethod
    def change_token_expiration(cls, token, token_id, days):
        return cls._make_request("POST", f"/users/change_token_expired_time/{token_id}/", {"expired_time_choice": days}, token=token)

    @classmethod
    def terminate_session(cls, token, token_id):
        return cls._make_request("DELETE", f"/users/get_or_deactivate_token/{token_id}/", token=token)