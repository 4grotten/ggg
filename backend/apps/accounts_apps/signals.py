from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminActionHistory, Profiles
from apps.transactions_apps.models import Transactions
from .notifications import dispatch_notifications, notify_transaction_parties
import threading

@receiver(post_save, sender=AdminActionHistory)
def admin_action_notification(sender, instance, created, **kwargs):
    if created:
        threading.Thread(target=dispatch_notifications, args=(instance,), daemon=True).start()


@receiver(post_save, sender=Transactions)
def transaction_status_notification(sender, instance, created, update_fields, **kwargs):
    if created:
        threading.Thread(target=notify_transaction_parties, args=(instance.id,), daemon=True).start()
    elif update_fields and 'status' in update_fields and instance.status == 'completed':
        threading.Thread(target=notify_transaction_parties, args=(instance.id,), daemon=True).start()