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
    path('users/me/', views.CurrentUserView.as_view()),
    path('users/doChangePassword/', views.ChangePasswordView.as_view()),
    path('users/<str:user_id>/phone_numbers/', views.UserPhoneNumbersView.as_view()),
    path('users/social_networks/', views.SocialNetworksView.as_view()),
    path('files/', views.UploadAvatarView.as_view()),
    path('users/authorisation_history/', views.AuthHistoryView.as_view()),
    path('users/change_token_expired_time/<int:token_id>/', views.ChangeTokenExpirationView.as_view()),
    path('users/get_or_deactivate_token/<int:token_id>/', views.TerminateSessionView.as_view()),
]