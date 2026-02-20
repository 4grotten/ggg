from rest_framework import serializers
from django.contrib.auth.models import User
from apps.accounts_apps.models import Profiles

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