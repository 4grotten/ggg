import threading
import requests
import logging
from datetime import timedelta, timezone
from django.conf import settings
from django.core.mail import send_mail
from .models import AdminNotificationSettings, UserRoles

logger = logging.getLogger(__name__)

def send_telegram(chat_id, text):
    try:
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": chat_id, "text": text}, timeout=10)
    except Exception as e:
        logger.error(f"Telegram Notification Error: {e}")

def send_whatsapp(phone, text):
    try:
        url = f"{settings.WAHA_API_URL.rstrip('/')}/api/sendText"
        payload = {
            "chatId": f"{phone}@c.us",
            "text": text,
            "session": settings.WAHA_SESSION_NAME
        }
        headers = {"Content-Type": "application/json"}
        requests.post(url, json=payload, headers=headers, timeout=10)
    except Exception as e:
        logger.error(f"WhatsApp Notification Error: {e}")

def send_email_async(email, text):
    try:
        send_mail(
            subject="🔔 Уведомление системы EasyCard",
            message=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Email Notification Error: {e}")

def format_notification_message(instance):
    tz_utc_4 = timezone(timedelta(hours=4))
    local_time = instance.created_at.astimezone(tz_utc_4).strftime('%d.%m.%Y %H:%M:%S')

    return (
        f"🔔 Admin Action Log\n"
        f"Кто: {instance.admin_name or instance.admin_id}\n"
        f"Действие: {instance.action}\n"
        f"Над кем: {instance.target_user_name or instance.target_user_id or 'N/A'}\n"
        f"Время: {local_time} (UTC+4)\n"
        f"Детали: {instance.details or 'Нет деталей'}"
    )

def dispatch_notifications(instance):
    privileged_users = UserRoles.objects.filter(role__in=['admin', 'root']).values_list('user_id', flat=True)
    active_settings = AdminNotificationSettings.objects.filter(user_id__in=privileged_users)
    text = format_notification_message(instance)
    for s in active_settings:
        if s.telegram_enabled and s.telegram_chat_id:
            threading.Thread(target=send_telegram, args=(s.telegram_chat_id, text), daemon=True).start()
        
        if s.whatsapp_enabled and s.whatsapp_number:
            threading.Thread(target=send_whatsapp, args=(s.whatsapp_number, text), daemon=True).start()
            
        if s.email_enabled and s.email_address:
            threading.Thread(target=send_email_async, args=(s.email_address, text), daemon=True).start()

def dispatch_test_notification(settings_obj):
    """Отправка тестового сообщения конкретному пользователю"""
    text = "🔧 Тестовое уведомление из системы EasyCard. Если вы это читаете, интеграция работает успешно!"
    
    if settings_obj.telegram_enabled and settings_obj.telegram_chat_id:
        threading.Thread(target=send_telegram, args=(settings_obj.telegram_chat_id, text), daemon=True).start()
    if settings_obj.whatsapp_enabled and settings_obj.whatsapp_number:
        threading.Thread(target=send_whatsapp, args=(settings_obj.whatsapp_number, text), daemon=True).start()
    if settings_obj.email_enabled and settings_obj.email_address:
        threading.Thread(target=send_email_async, args=(settings_obj.email_address, text), daemon=True).start()