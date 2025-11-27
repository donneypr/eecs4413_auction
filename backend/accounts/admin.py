from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'country', 'postal_code', 'created_at']
    search_fields = ['user__username', 'user__email', 'city', 'country']