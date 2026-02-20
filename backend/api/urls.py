from django.urls import include, path

app_name = 'api'

urlpatterns = [
    path('transactions/', include('api.transactions_api.urls')),
    path('cards/', include('api.cards_api.urls'))
]