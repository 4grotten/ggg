import requests
from django.contrib import admin
from django.apps import apps
from django.utils.html import format_html
from .models import AdminSettings, Profiles, WahaSession

@admin.register(Profiles)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'phone', 'first_name', 'last_name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user_id', 'phone', 'first_name', 'last_name', 'id')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user_id', 'phone', 'first_name', 'last_name', 'gender', 'language')
        }),
        ('Медиа', {
            'fields': ('avatar_url',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AdminSettings)
class AdminSettingsAdmin(admin.ModelAdmin):
    list_display = ('category', 'key', 'value', 'updated_at')
    list_filter = ('category',)
    search_fields = ('key', 'category')


@admin.register(WahaSession)
class WahaSessionAdmin(admin.ModelAdmin):
    list_display = ('session_name', 'api_url', 'is_active', 'waha_status_badge')
    readonly_fields = ('waha_status_badge', 'qr_code_display')
    
    fieldsets = (
        ('Настройки сессии', {
            'fields': ('session_name', 'api_url', 'api_key', 'is_active')
        }),
        ('Статус и Подключение (WAHA)', {
            'fields': ('waha_status_badge', 'qr_code_display'),
            'description': 'Сохраните сессию, чтобы Джанго связался с сервером WAHA и вывел QR-код.'
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        api_url = obj.api_url.rstrip('/')
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": obj.api_key or "5f0ed637143a4fddac67e3108cfd80ed"
        }
        try:
            requests.post(f"{api_url}/api/sessions/start", json={"name": obj.session_name}, headers=headers, timeout=5)
        except Exception:
            pass

    def waha_status_badge(self, obj):
        if not obj.pk:
            return "Сначала сохраните сессию"
        
        api_url = obj.api_url.rstrip('/')
        headers = {
            "accept": "application/json",
            "X-Api-Key": obj.api_key or "5f0ed637143a4fddac67e3108cfd80ed"
        }
        try:
            resp = requests.get(f"{api_url}/api/sessions?all=true", headers=headers, timeout=3)
            if resp.status_code == 200:
                for s in resp.json():
                    if s.get('name') == obj.session_name:
                        status = s.get('status', 'UNKNOWN')
                        color = "green" if status == "WORKING" else "red" if status == "FAILED" else "orange"
                        return format_html('<b style="color:{}; font-size:14px;">{}</b>', color, status)
            return format_html('<b style="color:gray;">СЕССИЯ НЕ СОЗДАНА В WAHA</b>')
        except Exception:
            return format_html('<b style="color:red;">ОШИБКА СВЯЗИ С СЕРВЕРОМ WAHA</b>')
            
    waha_status_badge.short_description = "Текущий статус в WAHA"

    def qr_code_display(self, obj):
        if not obj.pk:
            return "Нажмите «Сохранить и продолжить редактирование», чтобы сгенерировать QR"
            
        api_url = obj.api_url.rstrip('/')
        headers = {
            "accept": "application/json",
            "X-Api-Key": obj.api_key or "5f0ed637143a4fddac67e3108cfd80ed"
        }
        try:
            resp = requests.get(f"{api_url}/api/{obj.session_name}/auth/qr", headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                b64_img = data.get('data')
                if b64_img:
                    return format_html(
                        '<img src="data:image/png;base64,{}" width="260" height="260" style="border: 2px solid #ccc; border-radius: 8px;"/><br>'
                        '<i style="color: #666;">Сканируйте этот QR-код через "Связанные устройства" в WhatsApp</i>', 
                        b64_img
                    )
                return format_html('<b style="color:green; font-size:14px;">Авторизовано (QR код больше не нужен, статус WORKING)</b>')
            elif resp.status_code == 404:
                return "Сессия запускается... Обновите страницу через пару секунд (F5)."
            else:
                return f"QR недоступен (WAHA вернул код: {resp.status_code})"
        except Exception as e:
            return f"Ошибка получения QR: {str(e)}"
            
    qr_code_display.short_description = "QR Код для WhatsApp"


app = apps.get_app_config('accounts_apps')
for model_name, model in app.models.items():
    try:
        if model.__name__ in ['WahaSession', 'Profiles', 'AdminSettings']:
            continue 
            
        @admin.register(model)
        class GenericAdmin(admin.ModelAdmin):
            list_display = [field.name for field in model._meta.fields if field.name not in ['details', 'password']]
    except admin.sites.AlreadyRegistered:
        pass