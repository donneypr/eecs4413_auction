from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from auctions.views import items_list

def health(_): return JsonResponse({"ok": True})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("items/", items_list),          # <-- changed from "api/items/" to "items/"
]