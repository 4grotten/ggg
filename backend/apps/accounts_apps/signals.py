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


@receiver(post_save, sender=Profiles)
def notify_admins_on_new_user(sender, instance, created, **kwargs):
    if created:
        full_name = f"{instance.first_name or ''} {instance.last_name or ''}".strip()
        if not full_name:
            full_name = "No Name Provided"
        user_ident = instance.user_id
        details = {
            "acting_role": "System Auto-Registration",
            "changes": {
                "New User Account": {
                    "was": "None",
                    "became": f"{full_name} (ID: {user_ident})"
                }
            }
        }
        AdminActionHistory.objects.create(
            admin_id="SYSTEM",
            action="NEW_USER_REGISTRATION",
            target_user_id=str(user_ident),
            details=details
        )