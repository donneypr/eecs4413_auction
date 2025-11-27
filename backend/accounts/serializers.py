from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import UserProfile
import re


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
    password2     = serializers.CharField(write_only=True)  # Add password confirmation
    email         = serializers.EmailField(required=True)
    first_name    = serializers.CharField(max_length=150)
    last_name     = serializers.CharField(max_length=150)
    street_name   = serializers.CharField(max_length=255)
    street_number = serializers.CharField(max_length=20)
    city          = serializers.CharField(max_length=100)
    country       = serializers.CharField(max_length=100)
    postal_code   = serializers.CharField(max_length=20)


    def validate_username(self, v):
        if len(v) > 16:
            raise serializers.ValidationError("Username must be 16 characters or less")
        if User.objects.filter(username=v).exists():
            raise serializers.ValidationError("Username already taken")
        return v


    def validate_email(self, v):
        v_norm = v.strip().lower()
        if User.objects.filter(email__iexact=v_norm).exists():
           raise serializers.ValidationError("Email already in use")
        return v_norm
    
    
    def validate_password(self, v):
        # Check minimum length
        if len(v) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', v):
            raise serializers.ValidationError("Password must contain at least one uppercase letter")
        
        # Check for number
        if not re.search(r'[0-9]', v):
            raise serializers.ValidationError("Password must contain at least one number")
        
        # Check for special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise serializers.ValidationError("Password must contain at least one special character")
        
        return v
    
    
    def validate(self, data):
        # Check if passwords match
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError({"password2": "Passwords do not match"})
        return data


    def create(self, data):
        # Remove password2 before creating user
        data.pop('password2', None)
        
        user = User.objects.create_user(
            username   = data["username"],
            password   = data["password"],  # This will hash the password correctly
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
