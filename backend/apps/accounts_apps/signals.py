from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profiles
import uuid

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profiles.objects.create(
            id=uuid.uuid4(),
            user_id=instance.id,
            phone="",
            first_name=instance.first_name,
            last_name=instance.last_name
        )