from django.urls import path
from . import views

app_name = 'api.accounts_api'

urlpatterns = [
    # Аутентификация и Регистрация
    path('otp/send/', views.SendOtpView.as_view()),
    path('otp/verify/', views.VerifyOtpView.as_view()),
    path('register_auth/', views.RegisterAuthView.as_view()),
    path('verify_code/', views.VerifyCodeView.as_view()),
    path('resend_code/', views.ResendCodeView.as_view()),
    path('login/', views.LoginView.as_view()),
    path('logout/', views.LogoutView.as_view()),

    # Пароли и восстановление
    path('set_password/', views.SetPasswordView.as_view()),
    path('users/doChangePassword/', views.ChangePasswordView.as_view()),
    path('users/forgot_password/', views.ForgotPasswordView.as_view()),
    path('users/forgot_password_email/', views.ForgotPasswordEmailView.as_view()),

    # Профиль пользователя
    path('users/me/', views.CurrentUserView.as_view()),
    path('init_profile/', views.InitProfileView.as_view()),
    path('users/get_email/', views.GetEmailView.as_view()),
    path('users/deactivate/', views.DeactivateProfileView.as_view()),

    # Номера телефонов
    path('users/<int:user_id>/phone_numbers/', views.UserPhoneNumbersView.as_view()),
    path('users/phone_numbers/', views.UpdatePhoneNumbersView.as_view()),

    # Файлы и Соцсети
    path('files/', views.UploadAvatarView.as_view()),
    path('users/<int:user_id>/social_networks/', views.UserSocialNetworksView.as_view()),
    path('users/social_networks/', views.SetSocialNetworksView.as_view()),

    # Сессии и устройства
    path('users/get_active_devices/', views.ActiveDevicesView.as_view()),
    path('users/authorisation_history/', views.AuthHistoryView.as_view()),
    path('users/get_token_detail/<int:device_id>/', views.TokenDetailView.as_view()),

    path('contacts/', views.SyncContactsView.as_view(), name='sync_contacts'),
    path('contacts/<uuid:pk>/', views.ContactDetailView.as_view(), name='contact_detail'),
    path('contacts/<uuid:pk>/avatar/', views.ContactAvatarView.as_view(), name='contact_avatar'),

    path('admin/settings/', views.AdminSettingsListView.as_view(), name='admin_settings'),

    path('admin/users/limits/', views.AdminUserLimitsListView.as_view(), name='admin-users-limits'),
    path('admin/users/<str:user_id>/detail/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<str:user_id>/limits/', views.AdminUserLimitDetailView.as_view(), name='admin-user-limit-detail'),
]