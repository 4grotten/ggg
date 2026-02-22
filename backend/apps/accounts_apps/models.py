from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
from django.contrib.auth.models import User


class AdminActionHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_id = models.CharField(max_length=50)
    admin_name = models.TextField(blank=True, null=True)
    action = models.TextField()
    target_user_id = models.CharField(max_length=50, blank=True, null=True)
    target_user_name = models.TextField(blank=True, null=True)
    details = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_action_history'

class AdminSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.TextField()
    key = models.TextField()
    value = models.DecimalField(max_digits=20, decimal_places=6)
    description = models.TextField(blank=True, null=True)
    updated_by = models.CharField(max_length=50, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_settings'
        unique_together = (('category', 'key'),)

class Profiles(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50, unique=True, db_index=True)
    phone = models.TextField(blank=True, null=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    gender = models.TextField(blank=True, null=True)
    language = models.TextField(blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

class UserRoles(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50)
    role = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_roles'
        unique_together = (('user_id', 'role'),)

class OTPRecord(models.Model):
    phone_number = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.created_at + timedelta(minutes=5)
    

class Contacts(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    apofiz_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID контакта в системе Apofiz")
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    avatar_url = models.URLField(max_length=1024, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    payment_methods = models.JSONField(default=list, blank=True, null=True)
    social_links = models.JSONField(default=list, blank=True, null=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'
        unique_together = ('user', 'apofiz_id')