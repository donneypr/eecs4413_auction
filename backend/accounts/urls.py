from django.urls import path
from . import views

urlpatterns = [
    path("auth/csrf/", views.csrf),
    path("auth/signup/", views.signup),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("auth/me/", views.me),
    path("auth/password-reset/", views.password_reset),
    path("auth/password-reset-confirm/", views.password_reset_confirm),
]