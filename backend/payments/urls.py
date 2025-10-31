from django.urls import path
from . import views

urlpatterns = [
    path("<int:item_id>/details/", views.get_payment_details), # payment details endpoint
    path("<int:item_id>/pay/", views.process_payment), # paying endpoint
    path("my-won-items/", views.get_my_won_items), # show all auction items won (paid and not yet paid)
]
