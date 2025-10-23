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

User = get_user_model()

# ---------- CSRF ----------
@ensure_csrf_cookie
@require_GET
def csrf(_request):
    return JsonResponse({"detail": "ok"})

# ---------- Sign Up ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    s = SignupSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

# ---------- Sign In (Session) ----------
# Optional: support 2FA code if you later enable it for a user
try:
    import pyotp
except Exception:
    pyotp = None

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username","").strip()
    password = request.data.get("password","")
    otp_code = request.data.get("otp")  # optional

    user = authenticate(request, username=username, password=password)
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

# ---------- Forgot Password ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset(request):
    email_or_username = (request.data.get("email") or request.data.get("username") or "").strip()
    try:
        user = User.objects.get(email=email_or_username) if "@" in email_or_username \
               else User.objects.get(username=email_or_username)
    except User.DoesNotExist:
        # Don't leak which emails exist
        return Response({"ok": True})

    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{request.scheme}://{request.get_host()}/reset-password?uid={uid}&token={token}"

    # In dev we "send" via console email backend; also return link for convenience
    # In prod you'd send an email and NOT return the link
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