from django.urls import path
from api.cards_api.views import (
    UserBalancesView,
    UserIbanView, 
    UserCardsView, 
    WalletSummaryView
)

app_name = 'api.cards_api'

urlpatterns = [
    path('balances/', UserBalancesView.as_view(), name='user_balances'),
    

    path('accounts/IBAN_AED/', UserIbanView.as_view(), name='user_iban'),
    path('cards/', UserCardsView.as_view(), name='user_cards'),
    path('wallet/summary/', WalletSummaryView.as_view(), name='wallet_summary'),
]