from rest_framework import serializers
from django.contrib.auth.models import User
from apps.accounts_apps.models import AdminNotificationSettings, Profiles, Contacts, AdminSettings, UserNotificationSettings
from apps.accounts_apps.models import AdminActionHistory
from django.conf import settings


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='username')
    email = serializers.EmailField(allow_null=True, required=False)
    avatar = serializers.SerializerMethodField()
    has_empty_fields = serializers.SerializerMethodField()
    date_of_birth = serializers.CharField(source='profile.date_of_birth', allow_null=True, required=False)
    gender = serializers.CharField(source='profile.gender', allow_null=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'phone_number', 'email', 'avatar', 'username', 'date_of_birth', 'gender', 'has_empty_fields']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or getattr(obj, 'profile', None) and getattr(obj.profile, 'first_name', '') or ""

    def get_avatar(self, obj):
        return None 

    def get_has_empty_fields(self, obj):
        return not bool(obj.first_name and obj.last_name)


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacts
        fields = [
            'id', 'apofiz_id', 'full_name', 'phone', 'email', 
            'company', 'position', 'avatar_url', 'notes', 
            'payment_methods', 'social_links', 'created_at'
        ]

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = ['id', 'category', 'key', 'value', 'description', 'updated_at']


class UserLimitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profiles
        fields = [
            'custom_settings_enabled', 'transfer_min', 'transfer_max', 
            'daily_transfer_limit', 'monthly_transfer_limit', 'withdrawal_min', 
            'withdrawal_max', 'daily_withdrawal_limit', 'monthly_withdrawal_limit',
            'daily_top_up_limit', 'monthly_top_up_limit',
            'daily_usdt_send_limit', 'monthly_usdt_send_limit',
            'daily_usdt_receive_limit', 'monthly_usdt_receive_limit',
            'card_to_card_percent', 'bank_transfer_percent', 'network_fee_percent', 
            'currency_conversion_percent',
            'is_blocked', 'is_vip', 'subscription_type', 'referral_level',
            'first_name', 'last_name', 'gender', 'language', 'avatar_url', 'verification_status'
        ]


class UserNotificationSettingsSerializer(serializers.ModelSerializer):
    tg_bot = serializers.SerializerMethodField()

    class Meta:
        model = UserNotificationSettings
        fields = [
            'telegram_username', 'telegram_enabled', 
            'whatsapp_number', 'whatsapp_enabled', 
            'email_address', 'email_enabled',
            'tg_bot'
        ]

    def get_tg_bot(self, obj):
        return getattr(settings, 'USER_TELEGRAM_BOT_USERNAME', '@YourEasyCardUserBot')


class AdminActionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminActionHistory
        fields = '__all__'



class AdminNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotificationSettings
        fields = [
            'telegram_username', 'telegram_enabled', 
            'whatsapp_number', 'whatsapp_enabled', 
            'email_address', 'email_enabled'
        ]