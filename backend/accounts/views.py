import json
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerializer, UserSerializer
from .models import UserProfile
import os
from urllib.parse import urlencode

User = get_user_model()

# CSRF
@ensure_csrf_cookie
@require_GET
def csrf(_request):
    return JsonResponse({"detail": "ok"})

# Sign Up
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    s = SignupSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

# Sign In (Session)
# Optional: support 2FA code if we add it later enable it for a user
try:
    import pyotp
except Exception:
    pyotp = None

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    # Accept identifier as either username or email, keep backward-compatible keys
    identifier = (
        request.data.get("identifier")
        or request.data.get("username")
        or request.data.get("email")
        or ""
    ).strip()
    password = request.data.get("password","")
    otp_code = request.data.get("otp")  # optional

    # Resolve identifier to username if email was supplied
    username_for_auth = identifier
    if "@" in identifier:
        try:
            user_obj = User.objects.get(email__iexact=identifier)
            username_for_auth = user_obj.username
        except User.DoesNotExist:
            return Response({"detail":"invalid credentials"}, status=401)
        except User.MultipleObjectsReturned:
            # if legacy duplicates exist, require username
            return Response({"detail":"multiple accounts use this email; use username"}, status=400)

    user = authenticate(request, username=username_for_auth, password=password)
    if not user:
        return Response({"detail":"invalid credentials"}, status=401)

    # If user has 2FA enabled, verify OTP when library is available
    profile = getattr(user, "profile", None)
    if profile and profile.totp_secret:
        if not (pyotp and otp_code and pyotp.TOTP(profile.totp_secret).verify(otp_code, valid_window=1)):
            return Response({"detail":"otp_required_or_invalid"}, status=401)

    login(request, user)  # sets session cookie
    return Response({"ok": True, "user": UserSerializer(user).data})

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"ok": True})

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False})
    return Response({"authenticated": True, "user": UserSerializer(request.user).data})

# Forgot Password
def build_reset_url(request, uid, token):
    base = os.environ.get("FRONTEND_BASE_URL") 
    q = urlencode({"uid": uid, "token": token})
    if base:
        return f"{base.rstrip('/')}/reset-password?{q}"
    return request.build_absolute_uri(f"/reset-password?{q}")

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset(request):
    email = (request.data.get("email") or "").strip()
    username = (request.data.get("username") or "").strip()
    try:
        if email:
            user = User.objects.get(email__iexact=email)
        elif username:
            user = User.objects.get(username__iexact=username)
        else:
            return Response({"detail": "email or username required"}, status=400)
    except User.DoesNotExist:
        # Don't leak which emails exist
        return Response({"ok": True})

    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = build_reset_url(request, uid, token)   # use the helper

    # In dev we send via console email backend, also return link for convenience
    # In prod send an email and NOT return the link
    print("Password reset link:", reset_url)
    return Response({"ok": True, "reset_url": reset_url})

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uid   = request.data.get("uid")
    token = request.data.get("token")
    newpw = request.data.get("new_password")
    if not (uid and token and newpw):
        return Response({"detail":"missing fields"}, status=400)
    try:
        uid_int = int(urlsafe_base64_decode(uid).decode())
        user = User.objects.get(pk=uid_int)
    except Exception:
        return Response({"detail":"invalid uid"}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({"detail":"invalid token"}, status=400)
    user.set_password(newpw)
    user.save()
    return Response({"ok": True})