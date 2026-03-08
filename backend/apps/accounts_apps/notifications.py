
import threading
import requests
import logging
import ast
from datetime import timedelta, timezone
from django.conf import settings
from django.core.mail import send_mail
from .models import AdminNotificationSettings, UserRoles, WahaSession, UserNotificationSettings
from django.apps import apps

logger = logging.getLogger(__name__)

def resolve_telegram_username_to_id(username):
    username = username.replace('@', '').strip().lower()
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getUpdates"
    try:
        resp = requests.get(url, timeout=10).json()
        if resp.get('ok'):
            for update in resp['result']:
                msg = update.get('message', {})
                chat = msg.get('chat', {})
                if chat.get('username', '').lower() == username:
                    return str(chat.get('id'))
    except Exception as e:
        logger.error(f"TG Resolve Error: {e}")
    return None

def send_telegram(settings_obj, text):
    try:
        chat_id = settings_obj.telegram_chat_id
        if not chat_id and settings_obj.telegram_username:
            chat_id = resolve_telegram_username_to_id(settings_obj.telegram_username)
            if chat_id:
                settings_obj.telegram_chat_id = chat_id
                settings_obj.save(update_fields=['telegram_chat_id'])
        
        if not chat_id:
            logger.error(f"TG: Не найден chat_id для {settings_obj.telegram_username}. Пользователь должен нажать /start в боте!")
            return

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
    except Exception as e:
        logger.error(f"Telegram Notification Error: {e}")

def send_whatsapp(phone, text):
    try:
        clean_phone = ''.join(filter(str.isdigit, str(phone)))
        try:
            WahaSession = apps.get_model('accounts_apps', 'WahaSession')
            session = WahaSession.objects.filter(is_active=True).first()
        except Exception:
            session = None
        api_url = session.api_url if session else getattr(settings, 'WAHA_API_URL', 'http://waha:3000')
        session_name = session.session_name if session else getattr(settings, 'WAHA_SESSION_NAME', 'default')
        api_key = session.api_key if session else getattr(settings, 'WAHA_API_KEY', '5f0ed637143a4fddac67e3108cfd80ed')
        url = f"{api_url.rstrip('/')}/api/sendText"
        payload = {
            "chatId": f"{clean_phone}@c.us",
            "text": text,
            "session": session_name
        }
        headers = {
            "Content-Type": "application/json",
            "X-Api-Key": api_key
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if resp.status_code not in [200, 201]:
            logger.error(f"WAHA Error: {resp.status_code} - {resp.text}")
        else:
            logger.info(f"WhatsApp message sent to {clean_phone} successfully.")
    except Exception as e:
        logger.error(f"WhatsApp Notification Error: {str(e)}")


def send_email_async(email, text):
    try:
        send_mail(
            subject="🔔 Уведомление системы uEasyCard",
            message=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Email Notification Error: {e}")

def format_human_readable_details(details_str):
    if not details_str:
        return "Нет деталей"
    try:
        data = ast.literal_eval(details_str) if isinstance(details_str, str) else details_str
        if isinstance(data, dict):
            lines = []
            if 'acting_role' in data:
                lines.append(f"<b>Роль исполнителя:</b> {data['acting_role']}")
            if 'changes' in data:
                lines.append("<b>Изменения:</b>")
                for field, values in data['changes'].items():
                    old_v = values.get('было', 'Пусто')
                    new_v = values.get('стало', 'Пусто')
                    lines.append(f" └ <i>{field}</i>: {old_v} ➔ {new_v}")
            return "\n".join(lines) if lines else str(data)
        return str(details_str)
    except Exception:
        return str(details_str)

def format_notification_message(instance):
    tz_utc_4 = timezone(timedelta(hours=4))
    local_time = instance.created_at.astimezone(tz_utc_4).strftime('%d.%m.%Y %H:%M:%S')
    pretty_details = format_human_readable_details(instance.details)

    return (
        f"🔔 <b>Admin Action Log</b>\n"
        f"👤 <b>Кто:</b> {instance.admin_name or instance.admin_id}\n"
        f"🎯 <b>Действие:</b> {instance.action}\n"
        f"👥 <b>Кому:</b> {instance.target_user_name or instance.target_user_id or 'N/A'}\n"
        f"🕒 <b>Время:</b> {local_time} (UTC+4)\n"
        f"📝 <b>Детали:</b>\n{pretty_details}"
    )

def dispatch_notifications(instance):
    privileged_users = UserRoles.objects.filter(role__in=['admin', 'root']).values_list('user_id', flat=True)
    active_settings = AdminNotificationSettings.objects.filter(user_id__in=privileged_users)
    text = format_notification_message(instance)
    wa_text = text.replace('<b>', '*').replace('</b>', '*').replace('<i>', '_').replace('</i>', '_')
    plain_text = text.replace('<b>', '').replace('</b>', '').replace('<i>', '').replace('</i>', '')

    for s in active_settings:
        if s.telegram_enabled and s.telegram_username:
            threading.Thread(target=send_telegram, args=(s, text), daemon=True).start()
        if s.whatsapp_enabled and s.whatsapp_number:
            threading.Thread(target=send_whatsapp, args=(s.whatsapp_number, wa_text), daemon=True).start()
        if s.email_enabled and s.email_address:
            threading.Thread(target=send_email_async, args=(s.email_address, plain_text), daemon=True).start()

def dispatch_test_notification(s):
    text = "🔧 <b>Тестовое уведомление из системы uEasyCard</b>\nЕсли вы это читаете, интеграция работает успешно!"
    if s.telegram_enabled and s.telegram_username:
        threading.Thread(target=send_telegram, args=(s, text), daemon=True).start()
    if s.whatsapp_enabled and s.whatsapp_number:
        threading.Thread(target=send_whatsapp, args=(s.whatsapp_number, text), daemon=True).start()
    if s.email_enabled and s.email_address:
        plain_text = text.replace('<b>', '').replace('</b>', '')
        threading.Thread(target=send_email_async, args=(s.email_address, plain_text), daemon=True).start()


def resolve_user_telegram_username_to_id(username):
    username = username.replace('@', '').strip().lower()
    bot_token = getattr(settings, 'USER_TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return None
    url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
    try:
        resp = requests.get(url, timeout=10).json()
        if resp.get('ok'):
            for update in resp['result']:
                msg = update.get('message', {})
                chat = msg.get('chat', {})
                if chat.get('username', '').lower() == username:
                    return str(chat.get('id'))
    except Exception as e:
        logger.error(f"User TG Resolve Error: {e}")
    return None


def send_user_telegram(settings_obj, text):
    try:
        bot_token = getattr(settings, 'USER_TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            logger.error("USER_TELEGRAM_BOT_TOKEN не настроен!")
            return

        chat_id = settings_obj.telegram_chat_id
        if not chat_id and settings_obj.telegram_username:
            chat_id = resolve_user_telegram_username_to_id(settings_obj.telegram_username)
            if chat_id:
                settings_obj.telegram_chat_id = chat_id
                settings_obj.save(update_fields=['telegram_chat_id'])
        
        if not chat_id:
            logger.error(f"User TG: Не найден chat_id для {settings_obj.telegram_username}. Пользователь должен запустить бота!")
            return

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=10)
    except Exception as e:
        logger.error(f"User Telegram Notification Error: {e}")


def dispatch_user_transaction_notification(user_id, tx_details_text):
    try:
        settings_obj = UserNotificationSettings.objects.get(user_id=str(user_id))
    except UserNotificationSettings.DoesNotExist:
        return

    wa_text = tx_details_text.replace('<b>', '*').replace('</b>', '*').replace('<i>', '_').replace('</i>', '_')
    plain_text = tx_details_text.replace('<b>', '').replace('</b>', '').replace('<i>', '').replace('</i>', '')

    if settings_obj.telegram_enabled and settings_obj.telegram_username:
        threading.Thread(target=send_user_telegram, args=(settings_obj, tx_details_text), daemon=True).start()
    if settings_obj.whatsapp_enabled and settings_obj.whatsapp_number:
        threading.Thread(target=send_whatsapp, args=(settings_obj.whatsapp_number, wa_text), daemon=True).start()
    if settings_obj.email_enabled and settings_obj.email_address:
        threading.Thread(target=send_email_async, args=(settings_obj.email_address, plain_text), daemon=True).start()