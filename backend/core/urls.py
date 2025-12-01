from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def health(_): 
    return JsonResponse({"ok": True})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("", include("accounts.urls")), # <-- routes accounts/
    path("", include("auctions.urls")), # <-- routes auctions/ 
    path('payments/', include('payments.urls')), # routes payments/
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)