import json
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.mail import send_mail # for sending password reset emails
from django.views.decorators.http import require_GET, require_POST
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerializer, UserSerializer
from .models import UserProfile
from .authentication import CsrfExemptSessionAuthentication
import os
from urllib.parse import urlencode

try:
    import pyotp
except Exception:
    pyotp = None

User = get_user_model()


# CSRF
@ensure_csrf_cookie
@require_GET
def csrf(_request):
    token = get_token(_request)
    return JsonResponse({"csrfToken": token})


# Sign Up
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def signup(_request):
    s = SignupSerializer(data=_request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# Sign In (Session)
try:
    import pyotp
except Exception:
    pyotp = None

@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def login_view(_request):
    # Accept identifier as either username or email, keep backward-compatible keys
    identifier = (
        _request.data.get("identifier")
        or _request.data.get("username")
        or _request.data.get("email")
        or ""
    ).strip()
    password = _request.data.get("password","")
    otp_code = _request.data.get("otp")

    username_for_auth = identifier
    if "@" in identifier:
        try:
            user_obj = User.objects.get(email__iexact=identifier)
            username_for_auth = user_obj.username
        except User.DoesNotExist:
            return Response({"detail":"Invalid username/email or password"}, status=401)
        except User.MultipleObjectsReturned:
            return Response({"detail":"Multiple accounts use this email; use username"}, status=400)

    user = authenticate(_request, username=username_for_auth, password=password)
    if not user:
        return Response({"detail":"Invalid username/email or password"}, status=401)

    profile = getattr(user, "profile", None)
    if profile and profile.totp_secret:
        if not (pyotp and otp_code and pyotp.TOTP(profile.totp_secret).verify(otp_code, valid_window=1)):
            return Response({"detail":"OTP required or invalid"}, status=401)

    login(_request, user)
    return Response({"ok": True, "user": UserSerializer(user).data})


@api_view(["POST"])
def logout_view(_request):
    logout(_request)
    return Response({"ok": True})


@api_view(["GET"])
def me(_request):
    if not _request.user.is_authenticated:
        return Response({"authenticated": False})
    return Response({"authenticated": True, "user": UserSerializer(_request.user).data})


# Forgot Password
def build_reset_url(_request, uid, token):
    base = os.environ.get("FRONTEND_BASE_URL") 
    q = urlencode({"uid": uid, "token": token})
    if base:
        return f"{base.rstrip('/')}/reset-password?{q}"
    return _request.build_absolute_uri(f"/reset-password?{q}")

# Password Reset view
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def password_reset(_request):
    email = (_request.data.get("email") or "").strip()
    username = (_request.data.get("username") or "").strip()
    
    try:
        if email:
            user = User.objects.get(email__iexact=email)
        elif username:
            user = User.objects.get(username__iexact=username)
        else:
            return Response({"detail": "email or username required"}, status=400)
    except User.DoesNotExist:
        return Response({"ok": True})

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = build_reset_url(_request, uid, token)

    subject = "KickBay - Password Reset Request"
    message = f"""
Hello {user.first_name or user.username},

You requested to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
KickBay Website Team
"""
    
    html_message = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello {user.first_name or user.username},</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
            {reset_url}
        </p>
        <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 24 hours.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
            Best regards,<br>
            Auction Website Team
        </p>
    </div>
</body>
</html>
"""

    try:
        print("Attempting to send email...")
        send_mail(
            subject=subject,
            message=message,
            from_email=os.getenv("DEFAULT_FROM_EMAIL", "noreply@example.com"),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"✓ Password reset email sent to {user.email}")
        print(f"Reset link (for dev): {reset_url}")
    except Exception as e:
        print(f"✗ Failed to send email: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    return Response({"ok": True})

# Password Reset Token Confirmation 
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([AllowAny])
def password_reset_confirm(_request):
    uid = _request.data.get("uid")
    token = _request.data.get("token")
    newpw = _request.data.get("new_password")
    if not (uid and token and newpw):
        return Response({"detail": "missing fields"}, status=400)
    try:
        uid_int = int(urlsafe_base64_decode(uid).decode())
        user = User.objects.get(pk=uid_int)
    except Exception:
        return Response({"detail": "invalid uid"}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({"detail": "invalid token"}, status=400)
    user.set_password(newpw)
    user.save()
    return Response({"ok": True})