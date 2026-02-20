import uuid
import random
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Profiles
from apps.cards_apps.models import Cards

@receiver(post_save, sender=User)
def create_user_profile_and_cards(sender, instance, created, **kwargs):
    if created:
        now = timezone.now()
        Profiles.objects.create(
            id=uuid.uuid4(),
            user_id=instance.id,
            phone=instance.username,
            first_name=instance.first_name,
            last_name=instance.last_name,
            created_at=now,
            updated_at=now
        )
        expiry_date = (now + timedelta(days=365*3)).date()
        Cards.objects.create(
            id=uuid.uuid4(),
            user_id=instance.id,
            type='virtual',
            name='Virtual Card',
            status='active',
            balance=50000.00,
            last_four_digits=str(random.randint(1000, 9999)),
            expiry_date=expiry_date,
            card_number_encrypted="mock_virtual_encrypted_number",
            cvv_encrypted="mock_virtual_cvv",
            activated_at=now,
            created_at=now,
            updated_at=now
        )
        Cards.objects.create(
            id=uuid.uuid4(),
            user_id=instance.id,
            type='metal',
            name='Metal Card',
            status='active',
            balance=50000.00,
            last_four_digits=str(random.randint(1000, 9999)),
            expiry_date=expiry_date,
            card_number_encrypted="mock_metal_encrypted_number",
            cvv_encrypted="mock_metal_cvv",
            annual_fee=0.00,
            activated_at=now,
            created_at=now,
            updated_at=now
        )
        print(f"[SIGNALS] Успешно создан профиль и выданы 2 карты (по 50k AED) для пользователя {instance.username}")