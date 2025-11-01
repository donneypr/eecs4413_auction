from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class AuctionItem(models.Model):
    AUCTION_TYPES = [
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
    
    def has_ended(self):
        return timezone.now() >= self.end_time

    def end_auction_if_needed(self):
        """Mark auction as ended and determine winner if time expired."""
        if self.is_active and self.has_ended():
            highest_bid = self.bids.order_by('-amount').first()
            if highest_bid:
                self.winner = highest_bid.bidder
                self.current_price = highest_bid.amount
            self.is_active = False
            self.save()

class Bid(models.Model):
    item = models.ForeignKey(AuctionItem, on_delete=models.CASCADE, related_name='bids')
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bidder.username} - {self.item.name} (${self.amount})"
    