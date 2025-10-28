from django.db import models
from django.contrib.auth.models import User

class AuctionItem(models.Model):
    AUCTION_TYPES = [ # types of auctions we will have, google definitions if don't know
        ('FORWARD', 'Forward'),
        ('DUTCH', 'Dutch'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(max_length=255)
    starting_price = models.DecimalField(max_digits=10, decimal_places=2)
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    auction_type = models.CharField(max_length=10, choices=AUCTION_TYPES)
    end_time = models.DateTimeField()  # only for forward auctions
    is_active = models.BooleanField(default=True)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items_selling')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    