
from django.db import models
from django.utils import timezone
from datetime import timedelta

class AdminActionHistory(models.Model):
    id = models.UUIDField(primary_key=True)
    admin_id = models.UUIDField()
    admin_name = models.TextField(blank=True, null=True)
    action = models.TextField()
    target_user_id = models.UUIDField(blank=True, null=True)
    target_user_name = models.TextField(blank=True, null=True)
    details = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'admin_action_history'


class AdminSettings(models.Model):
    id = models.UUIDField(primary_key=True)
    category = models.TextField()
    key = models.TextField()
    value = models.DecimalField(max_digits=65535, decimal_places=65535)
    description = models.TextField(blank=True, null=True)
    updated_by = models.UUIDField(blank=True, null=True)
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'admin_settings'
        unique_together = (('category', 'key'),)


class Profiles(models.Model):
    id = models.UUIDField(primary_key=True)
    user_id = models.UUIDField(unique=True)
    phone = models.TextField(blank=True, null=True)
    first_name = models.TextField(blank=True, null=True)
    last_name = models.TextField(blank=True, null=True)
    gender = models.TextField(blank=True, null=True)
    language = models.TextField(blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'profiles'


class UserRoles(models.Model):
    id = models.UUIDField(primary_key=True)
    user_id = models.UUIDField()
    role = models.TextField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'user_roles'
        unique_together = (('user_id', 'role'),)


class OTPRecord(models.Model):
    phone_number = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.created_at + timedelta(minutes=5)
