from django.urls import path
from . import views

app_name = 'api.transactions_api'

urlpatterns = [
    path('topup/bank/', views.BankTopupView.as_view(), name='bank_topup'),
    path('topup/crypto/', views.CryptoTopupView.as_view(), name='crypto_topup'),
    path('transfer/card/', views.CardTransferView.as_view(), name='card_transfer'),
    path('withdrawal/crypto/', views.CryptoWithdrawalView.as_view(), name='crypto_withdrawal'),
    path('withdrawal/bank/', views.BankWithdrawalView.as_view(), name='bank_withdrawal'),
    path('<uuid:transaction_id>/receipt/', views.TransactionReceiptView.as_view(), name='transaction_receipt'),

    path('all/', views.AllTransactionsListView.as_view(), name='all_transactions'),
    path('iban/', views.IBANTransactionsListView.as_view(), name='iban_transactions'),
    path('card-transactions/', views.CardTransactionsListView.as_view(), name='card_transactions'),
    path('crypto/', views.CryptoTransactionsListView.as_view(), name='crypto_transactions'),

    path('recipient-info/', views.RecipientInfoView.as_view(), name='recipient_info'),
    path('bank-accounts/', views.UserBankAccountsView.as_view(), name='user_bank_accounts'),
    path('crypto-wallets/', views.UserCryptoWalletsView.as_view(), name='user_crypto_wallets'),

    path('transfer/card-to-crypto/', views.CardToCryptoView.as_view(), name='card_to_crypto'),
    path('transfer/crypto-to-card/', views.CryptoToCardView.as_view(), name='crypto_to_card'),
    path('transfer/bank-to-crypto/', views.BankToCryptoView.as_view(), name='bank_to_crypto'),
    path('transfer/crypto-to-bank/', views.CryptoToBankView.as_view(), name='crypto_to_bank'),
    path('transfer/card-to-bank/', views.CardToBankView.as_view(), name='card_to_bank'),
    path('transfer/bank-to-card/', views.BankToCardTransferView.as_view(), name='bank_to_card_transfer'),
    path('withdrawal/crypto-wallet/', views.CryptoWalletWithdrawalView.as_view(), name='crypto_wallet_withdrawal'),

    path('admin/revenue/summary/', views.AdminRevenueSummaryView.as_view(), name='admin_revenue_summary'),
    path('admin/revenue/transactions/', views.AdminRevenueTransactionsView.as_view(), name='admin_revenue_transactions'),
]