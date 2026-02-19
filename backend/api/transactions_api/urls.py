from django.urls import path
from .views import (
    BankTopupView, CryptoTopupView, 
    CardTransferView, CryptoWithdrawalView, 
    BankWithdrawalView
)


app_name = 'api.transactions_api'


urlpatterns = [
    path('topup/bank/', BankTopupView.as_view(), name='bank_topup'),
    path('topup/crypto/', CryptoTopupView.as_view(), name='crypto_topup'),
    
    path('transfer/card/', CardTransferView.as_view(), name='card_transfer'),
    
    path('withdrawal/crypto/', CryptoWithdrawalView.as_view(), name='crypto_withdrawal'),
    path('withdrawal/bank/', BankWithdrawalView.as_view(), name='bank_withdrawal'),
]