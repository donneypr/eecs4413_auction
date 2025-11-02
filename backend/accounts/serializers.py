from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ["street_name","street_number","city","country","postal_code"]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()
    class Meta:
        model  = User
        fields = ["id","username","email","first_name","last_name","profile"]

class SignupSerializer(serializers.Serializer):
    username      = serializers.CharField(max_length=150)
    password      = serializers.CharField(write_only=True, min_length=8)
    email         = serializers.EmailField(required=True)
    first_name    = serializers.CharField(max_length=150)
    last_name     = serializers.CharField(max_length=150)
    street_name   = serializers.CharField(max_length=255)
    street_number = serializers.CharField(max_length=20)
    city          = serializers.CharField(max_length=100)
    country       = serializers.CharField(max_length=100)
    postal_code   = serializers.CharField(max_length=20)

    def validate_username(self, v):
        if User.objects.filter(username=v).exists():
            raise serializers.ValidationError("Username already taken")
        return v

    def validate_email(self, v):
        v_norm = v.strip().lower()
        if User.objects.filter(email__iexact=v_norm).exists():
           raise serializers.ValidationError("Email already in use")
        return v_norm

    def create(self, data):
        user = User.objects.create_user(
            username   = data["username"],
            password   = data["password"],
            email      = data["email"],
            first_name = data["first_name"],
            last_name  = data["last_name"],
        )
        UserProfile.objects.create(
            user=user,
            street_name   = data["street_name"],
            street_number = data["street_number"],
            city          = data["city"],
            country       = data["country"],
            postal_code   = data["postal_code"],
        )
        return user