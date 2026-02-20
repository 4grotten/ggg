from django.contrib import admin
from django.utils.html import format_html
from .models import Cards

@admin.register(Cards)
class CardsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'type', 'name', 'balance', 'last_four_digits', 'status_colored')
    list_filter = ('type', 'status', 'created_at')
    search_fields = ('user_id', 'name', 'last_four_digits', 'id')
    readonly_fields = ('card_number_encrypted', 'cvv_encrypted', 'created_at', 'updated_at')
    fieldsets = (
        ('Владелец и Баланс', {
            'fields': ('user_id', 'balance')
        }),
        ('Детали карты (Только чтение)', {
            'fields': ('type', 'name', 'last_four_digits', 'expiry_date', 'card_number_encrypted', 'cvv_encrypted')
        }),
        ('Управление и Статус', {
            'fields': ('status', 'annual_fee', 'activated_at')
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