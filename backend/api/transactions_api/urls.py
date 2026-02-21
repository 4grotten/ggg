from django.urls import path
from . import views

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


    path('recipient-info/', views.RecipientInfoView.as_view(), name='recipient_info'),
    path('bank-accounts/', views.UserBankAccountsView.as_view(), name='user_bank_accounts'),
    path('crypto-wallets/', views.UserCryptoWalletsView.as_view(), name='user_crypto_wallets'),
]