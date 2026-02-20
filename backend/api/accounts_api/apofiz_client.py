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
            logger.error(f"Apofiz API Error [{endpoint}]: {e}")
            return 503, {"error": "Сервис Apofiz временно недоступен", "details": str(e)}

    @classmethod
    def send_otp(cls, phone_number, otp_type="whatsapp"):
        return cls._make_request("POST", "/otp/send/", {"phone_number": phone_number, "type": otp_type})

    @classmethod
    def verify_otp(cls, phone_number, code):
        return cls._make_request("POST", "/otp/verify/", {"phone_number": phone_number, "code": code})

    @classmethod
    def register_auth(cls, phone_number):
        return cls._make_request("POST", "/register_auth/", {"phone_number": phone_number})

    @classmethod
    def verify_code(cls, phone_number, code):
        return cls._make_request("POST", "/verify_code/", {"phone_number": phone_number, "code": code})

    @classmethod
    def resend_code(cls, phone_number, auth_type):
        return cls._make_request("POST", "/resend_code/", {"phone_number": phone_number, "type": auth_type})

    @classmethod
    def login(cls, phone_number, password, location="Unknown", device="Unknown"):
        return cls._make_request("POST", "/login/", {
            "phone_number": phone_number, "password": password, 
            "location": location, "device": device
        })

    @classmethod
    def logout(cls, token):
        return cls._make_request("POST", "/logout/", token=token)

    @classmethod
    def set_password(cls, token, password):
        return cls._make_request("POST", "/set_password/", {"password": password}, token=token)

    @classmethod
    def change_password(cls, token, old_password, new_password):
        return cls._make_request("POST", "/users/doChangePassword/", {
            "old_password": old_password, "new_password": new_password
        }, token=token)

    @classmethod
    def forgot_password(cls, phone_number, method="whatsapp"):
        return cls._make_request("POST", "/users/forgot_password/", {"phone_number": phone_number, "method": method})

    @classmethod
    def forgot_password_email(cls, token):
        return cls._make_request("POST", "/users/forgot_password_email/", token=token)

    @classmethod
    def get_me(cls, token):
        return cls._make_request("GET", "/users/me/", token=token)

    @classmethod
    def init_profile(cls, token, profile_data):
        return cls._make_request("POST", "/init_profile/", profile_data, token=token)

    @classmethod
    def get_email(cls, token):
        return cls._make_request("GET", "/users/get_email/", token=token)

    @classmethod
    def deactivate(cls, token):
        return cls._make_request("POST", "/users/deactivate/", token=token)

    @classmethod
    def get_phone_numbers(cls, token, user_id):
        return cls._make_request("GET", f"/users/{user_id}/phone_numbers/", token=token)

    @classmethod
    def update_phone_numbers(cls, token, phone_numbers):
        return cls._make_request("POST", "/users/phone_numbers/", {"phone_numbers": phone_numbers}, token=token)

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
    def get_social_networks(cls, token, user_id):
        return cls._make_request("GET", f"/users/{user_id}/social_networks/", token=token)

    @classmethod
    def set_social_networks(cls, token, networks_array):
        return cls._make_request("POST", "/users/social_networks/", {"networks": networks_array}, token=token)

    @classmethod
    def get_active_devices(cls, token, page=1, limit=50):
        return cls._make_request("GET", "/users/get_active_devices/", params={"page": page, "limit": limit}, token=token)

    @classmethod
    def get_auth_history(cls, token, page=1, limit=20):
        return cls._make_request("GET", "/users/authorisation_history/", params={"page": page, "limit": limit}, token=token)

    @classmethod
    def get_token_detail(cls, token, device_id):
        return cls._make_request("GET", f"/users/get_token_detail/{device_id}/", token=token)