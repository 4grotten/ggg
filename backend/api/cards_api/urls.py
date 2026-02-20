from django.urls import path
from api.cards_api.views import UserBalancesView




app_name = 'api.transactions_api'


urlpatterns = [
    path('balances/', UserBalancesView.as_view(), name='user_balances'),
]