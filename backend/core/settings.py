"""
Django settings for core project.
"""

from pathlib import Path
import os

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Env-driven core flags ---
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev_not_for_prod")
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
CSRF_TRUSTED_ORIGINS = [o for o in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o]

# --- Apps ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",  # <-- add this
    "auctions",
]

# --- Middleware (corsheaders should be early) ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # <-- add this near top
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# --- Database: MySQL in Docker Compose ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("MYSQL_DATABASE", "auctiondb"),
        "USER": os.getenv("MYSQL_USER", "auction"),
        "PASSWORD": os.getenv("MYSQL_PASSWORD", "auctionpass"),
        "HOST": os.getenv("MYSQL_HOST", "db"),
        "PORT": os.getenv("MYSQL_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

# --- Password validation ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N / TZ ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TZ", "UTC")
USE_I18N = True
USE_TZ = True

# --- Static files ---
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- CORS (dev: Next.js at http://localhost:3000) ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # optional for prod same-domain, harmless to keep:
    "https://donney.ddns.net",
]

# --- Security (prod-friendly, harmless in dev) ---
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"