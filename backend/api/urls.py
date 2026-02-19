from django.urls import include, path

app_name = 'api'

urlpatterns = [
    path('transactions/', include('api.transactions_api.urls')),
]