from django.contrib import admin
from .models import (
    Transactions,
    BankDepositAccounts,
    CryptoWallets,
    TopupsBank,
    BankInboundPayments,
    TopupsCrypto,
    CryptoInboundTransactions,
    CardTransfers,
    CryptoWithdrawals,
    BankWithdrawals,
    BalanceMovements
)

@admin.register(Transactions)
class TransactionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'type', 'status', 'amount', 'currency', 'created_at')
    search_fields = ('id', 'user_id', 'type', 'status', 'sender_card', 'recipient_card', 'merchant_name')
    list_filter = ('type', 'status', 'currency', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(BankDepositAccounts)
class BankDepositAccountsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'iban', 'bank_name', 'balance', 'is_active')
    search_fields = ('id', 'user_id', 'iban', 'bank_name', 'beneficiary')
    list_filter = ('is_active', 'bank_name')
    ordering = ('-id',)

@admin.register(CryptoWallets)
class CryptoWalletsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'network', 'token', 'address', 'balance', 'is_active')
    search_fields = ('id', 'user_id', 'address')
    list_filter = ('network', 'token', 'is_active')
    ordering = ('-created_at',)

@admin.register(BalanceMovements)
class BalanceMovementsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'account_type', 'type', 'amount', 'created_at')
    search_fields = ('user_id', 'account_type')
    list_filter = ('type', 'account_type', 'created_at')

admin.site.register(TopupsBank)
admin.site.register(BankInboundPayments)
admin.site.register(TopupsCrypto)
admin.site.register(CryptoInboundTransactions)
admin.site.register(CardTransfers)
admin.site.register(CryptoWithdrawals)
admin.site.register(BankWithdrawals)