from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Transactions, TopupsBank, BankDepositAccounts, BankInboundPayments,
    TopupsCrypto, CryptoInboundTransactions, CardTransfers,
    CryptoWithdrawals, BankWithdrawals, BalanceMovements
)

class BalanceMovementsInline(admin.TabularInline):
    model = BalanceMovements
    extra = 0
    readonly_fields = ('id', 'user_id', 'account_type', 'amount', 'type', 'created_at')
    can_delete = False

class TopupsBankInline(admin.StackedInline):
    model = TopupsBank
    extra = 0
    can_delete = False

class TopupsCryptoInline(admin.StackedInline):
    model = TopupsCrypto
    extra = 0
    can_delete = False

class CardTransfersInline(admin.StackedInline):
    model = CardTransfers
    extra = 0
    can_delete = False

class CryptoWithdrawalsInline(admin.StackedInline):
    model = CryptoWithdrawals
    extra = 0
    can_delete = False

class BankWithdrawalsInline(admin.StackedInline):
    model = BankWithdrawals
    extra = 0
    can_delete = False


@admin.register(Transactions)
class TransactionsAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'type', 'status_colored', 'amount', 'currency', 'created_at')
    list_filter = ('status', 'type', 'currency', 'created_at')
    search_fields = ('id', 'user_id')
    readonly_fields = ('id', 'user_id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    inlines = [
        BalanceMovementsInline, 
        TopupsBankInline, 
        TopupsCryptoInline, 
        CardTransfersInline, 
        CryptoWithdrawalsInline, 
        BankWithdrawalsInline
    ]

    def status_colored(self, obj):
        colors = {
            'completed': 'green',
            'pending': 'orange',
            'processing': 'blue',
            'failed': 'red',
            'draft': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html('<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{}</span>', color, obj.status.upper())
    status_colored.short_description = 'Status'

    def id_short(self, obj):
        return str(obj.id)[:8] + "..."
    id_short.short_description = 'ID'


@admin.register(BankDepositAccounts)
class BankDepositAccountsAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'iban', 'beneficiary', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('iban', 'bank_name', 'beneficiary')


@admin.register(BankInboundPayments)
class BankInboundPaymentsAdmin(admin.ModelAdmin):
    list_display = ('provider_id', 'amount', 'currency', 'sender', 'matched', 'created_at')
    list_filter = ('matched', 'currency', 'created_at')
    search_fields = ('provider_id', 'sender', 'iban', 'reference')
    readonly_fields = ('created_at',)


@admin.register(CryptoInboundTransactions)
class CryptoInboundTransactionsAdmin(admin.ModelAdmin):
    list_display = ('tx_hash_short', 'network', 'token', 'amount', 'received_at')
    list_filter = ('network', 'token', 'received_at')
    search_fields = ('tx_hash', 'from_address', 'to_address')
    
    def tx_hash_short(self, obj):
        return f"{obj.tx_hash[:6]}...{obj.tx_hash[-4:]}"
    tx_hash_short.short_description = 'TX Hash'
    

@admin.register(BalanceMovements)
class BalanceMovementsAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'transaction_link', 'account_type', 'type_colored', 'amount', 'created_at')
    list_filter = ('type', 'account_type', 'created_at')
    search_fields = ('user_id', 'transaction__id')
    readonly_fields = ('id', 'transaction', 'user_id', 'account_type', 'amount', 'type', 'created_at')

    def type_colored(self, obj):
        color = 'green' if obj.type == 'credit' else 'red'
        sign = '+' if obj.type == 'credit' else '-'
        return format_html('<b style="color: {};">{} {}</b>', color, sign, obj.type.upper())
    type_colored.short_description = 'Type'

    def transaction_link(self, obj):
        return format_html('<a href="/admin/transactions_apps/transactions/{}/change/">{}</a>', obj.transaction.id, str(obj.transaction.id)[:8])
    transaction_link.short_description = 'Transaction'

    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'

@admin.register(TopupsBank)
class TopupsBankAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'transfer_rail', 'amount_display')
    search_fields = ('reference_value', 'sender_iban')

    def amount_display(self, obj):
        return obj.transaction.amount
    amount_display.short_description = 'Amount'


@admin.register(TopupsCrypto)
class TopupsCryptoAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'network', 'token', 'amount_crypto')
    search_fields = ('tx_hash', 'deposit_address')


@admin.register(CryptoWithdrawals)
class CryptoWithdrawalsAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'network', 'token', 'to_address', 'amount_crypto')
    search_fields = ('tx_hash', 'to_address')