from django.urls import path
from . import views

urlpatterns = [
    path("items/", views.list_items),  # UC2.2
    path("items/search/", views.search_items),  # UC2.1 + 2.2
    path("items/create/", views.create_item),  # Create items with images
    path("items/<int:item_id>/", views.get_item_details),  # UC2.3
    path("items/<int:item_id>/bid/", views.place_bid),  # UC3
    path("items/<int:item_id>/current-price/", views.get_current_price),  # UC2/3 polling
    path("items/<int:item_id>/status/", views.get_auction_status),  # UC3
    # PROFILE EXCLUSIVE ENDPOINTS
    path("users/<str:username>/items/", views.get_user_items),  # Get user's items
    path("users/<str:username>/bids/", views.get_user_bids),  # Get user's bids
    path("items/<int:item_id>/edit/", views.edit_item),  # PATCH - Edit item
    path("items/<int:item_id>/delete/", views.delete_item),  # DELETE - Delete item
]