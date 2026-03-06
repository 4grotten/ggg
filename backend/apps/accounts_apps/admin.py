from django.contrib import admin
from django.apps import apps
from .models import AdminSettings, Profiles

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

@admin.register(AdminSettings)
class AdminSettingsAdmin(admin.ModelAdmin):
    list_display = ('category', 'key', 'value', 'updated_at')
    list_filter = ('category',)
    search_fields = ('key', 'category')

app = apps.get_app_config('accounts_apps')
for model_name, model in app.models.items():
    try:
        @admin.register(model)
        class GenericAdmin(admin.ModelAdmin):
            list_display = [field.name for field in model._meta.fields if field.name not in ['details', 'password']]
    except admin.sites.AlreadyRegistered:
        pass