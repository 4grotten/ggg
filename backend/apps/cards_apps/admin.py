from django.contrib import admin
from django.utils.html import format_html
from .models import Cards

@admin.register(Cards)
class CardsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'card_type', 'last_four_digits', 'balance', 'status_colored')
    list_filter = ('card_type', 'status', 'currency', 'created_at')
    search_fields = ('user__username', 'user__email', 'last_four_digits', 'id')
    readonly_fields = ('card_number', 'cvv', 'expiry_date', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Владелец и Баланс', {
            'fields': ('user', 'balance', 'currency')
        }),
        ('Детали карты (Только чтение)', {
            'fields': ('card_type', 'card_number', 'last_four_digits', 'expiry_date', 'cvv')
        }),
        ('Управление', {
            'fields': ('status', 'is_virtual', 'pin_code') 
        }),
    )
    def status_colored(self, obj):
        colors = {
            'active': 'green',
            'blocked': 'red',
            'frozen': 'orange',
            'pending': 'gray'
        }
        color = colors.get(str(obj.status).lower(), 'black')
        return format_html('<b style="color: {};">{}</b>', color, str(obj.status).upper())
    status_colored.short_description = 'Статус'