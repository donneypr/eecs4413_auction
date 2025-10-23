from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    street_name   = models.CharField(max_length=255)
    street_number = models.CharField(max_length=20)
    city          = models.CharField(max_length=100)
    country       = models.CharField(max_length=100)
    postal_code   = models.CharField(max_length=20)
    # Optional TOTP secret for 2FA (leave null if 2FA disabled for this user)
    totp_secret   = models.CharField(max_length=64, blank=True, null=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} profile"