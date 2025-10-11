from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health(_): 
    return JsonResponse({"ok": True})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("", include("auctions.urls")),   # <-- routes /items/ here
]