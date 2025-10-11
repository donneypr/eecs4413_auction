# backend/auctions/urls.py
from django.urls import path, re_path
from . import views

urlpatterns = [
    path("items/", views.items_list, name="items_list"),
    # also accept /items (no trailing slash)
    re_path(r"^items/?$", views.items_list, name="items_list_no_slash"),
]