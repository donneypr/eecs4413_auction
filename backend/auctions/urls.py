# backend/auctions/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("items/search/", views.search_items), #uc2.1 + 2.2 searching and displaying item information
    path("items/create/", views.create_item), # creating items so that we can test uc2.1 and uc2.2 with CURL commands
    path("items/<int:item_id>/", views.get_item_details), # uc2.3 getting item details, this will be combined with a frotend UI later to be fully implemented.
    path("items/<int:item_id>/bid/", views.place_bid), #uc3 placing bids
    path("items/<int:item_id>/current-price/", views.get_current_price), #uc2/3 polling endpoint for updating auction item price
    path("items/<int:item_id>/status/", views.get_auction_status), #uc3 
]