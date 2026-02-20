from django.contrib import admin
from .models import Profiles

@admin.register(Profiles)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone_number', 'verification_status', 'created_at')
    list_filter = ('verification_status', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone_number', 'id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Привязка к пользователю', {
            'fields': ('user', 'phone_number')
        }),
        ('Статус и KYC', {
            'fields': ('verification_status', 'country', 'address')
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
