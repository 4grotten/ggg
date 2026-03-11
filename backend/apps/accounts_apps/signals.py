from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminActionHistory, Profiles
from apps.transactions_apps.models import Transactions
from .notifications import dispatch_notifications, notify_transaction_parties
import threading
import requests
import logging

logger = logging.getLogger(__name__)

SUPABASE_TRANSACTION_WEBHOOK = "https://uefgvthkwhpvpayteyif.supabase.co/functions/v1/transaction-webhook"


def broadcast_transaction_to_frontend(transaction):
    """Send realtime broadcast to frontend UI via Supabase edge function."""
    try:
        direction = getattr(transaction, 'direction', None)
        if not direction:
            direction = 'inbound' if str(transaction.sender_id) != str(transaction.user_id) else 'outgoing'

        # Broadcast for all involved users
        user_ids = set()
        if transaction.sender_id and transaction.sender_id != 'EXTERNAL':
            user_ids.add(str(transaction.sender_id))
        if transaction.receiver_id and transaction.receiver_id != 'EXTERNAL':
            user_ids.add(str(transaction.receiver_id))
        if transaction.user_id:
            user_ids.add(str(transaction.user_id))

        for uid in user_ids:
            requests.post(
                SUPABASE_TRANSACTION_WEBHOOK,
                json={
                    "event": "transaction_incoming" if direction == "inbound" else "transaction_outgoing",
                    "user_id": uid,
                    "transaction_id": str(transaction.id),
                    "amount": float(transaction.amount),
                    "currency": transaction.currency or "AED",
                },
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
        logger.info(f"[signals] Frontend broadcast sent for tx {transaction.id}")
    except Exception as e:
        logger.warning(f"[signals] Frontend broadcast failed for tx {transaction.id}: {e}")


@receiver(post_save, sender=AdminActionHistory)
def admin_action_notification(sender, instance, created, **kwargs):
    if created:
        threading.Thread(target=dispatch_notifications, args=(instance,), daemon=True).start()


@receiver(post_save, sender=Transactions)
def transaction_status_notification(sender, instance, created, **kwargs):
    update_fields = kwargs.get('update_fields')
    is_completed = str(getattr(instance, 'status', '')).lower() == 'completed'

    # created=True: шлём только если уже completed
    # created=False: шлём при completed даже если save() был без update_fields
    should_notify = (created and is_completed) or (
        not created and is_completed and (not update_fields or 'status' in update_fields)
    )

    if should_notify:
        # Broadcast to frontend FIRST (fastest path for UI update)
        threading.Thread(target=broadcast_transaction_to_frontend, args=(instance,), daemon=True).start()
        # Then send Telegram/WhatsApp/Email notifications
        threading.Thread(target=notify_transaction_parties, args=(instance.id,), daemon=True).start()