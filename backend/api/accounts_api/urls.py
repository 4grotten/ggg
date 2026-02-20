from django.urls import path
from . import views

app_name = 'api.accounts_api'

urlpatterns = [
    path('register_auth/', views.RegisterAuthView.as_view()),
    path('otp/send/', views.SendOtpView.as_view()),
    path('otp/verify/', views.VerifyOtpView.as_view()),
    path('verify_code/', views.VerifyOtpView.as_view()),
    
    path('login/', views.LoginView.as_view()),
    path('init_profile/', views.InitProfileView.as_view()),
    path('set_password/', views.SetPasswordView.as_view()),
    path('users/me/', views.CurrentUserView.as_view()),
]