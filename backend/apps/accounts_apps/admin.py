from django.contrib import admin
from .models import Profiles

@admin.register(Profiles)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'phone', 'first_name', 'last_name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user_id', 'phone', 'first_name', 'last_name', 'id')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user_id', 'phone', 'first_name', 'last_name', 'gender', 'language')
        }),
        ('Медиа', {
            'fields': ('avatar_url',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )