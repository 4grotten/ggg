from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminActionHistory
from .notifications import dispatch_notifications
import threading

@receiver(post_save, sender=AdminActionHistory)
def admin_action_notification(sender, instance, created, **kwargs):
    if created:
        threading.Thread(target=dispatch_notifications, args=(instance,), daemon=True).start()