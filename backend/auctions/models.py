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

    # additional fields to store the current bidder and the previous bid history of the auction
    current_bidder = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items_bidding_on'
    )

    bid_history = models.JSONField(default=list, blank=True)  # Stores [{username, amount, timestamp}, ...]

    # DUTCH auction rules, decreasing price by a set percentage every set amount of minutes
    dutch_decrease_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Percentage to decrease price (e.g., type 5.00 for 5%, 10.00 for 10%)"
    )

    dutch_decrease_interval = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Minutes between price decreases"
    )

    last_price_update = models.DateTimeField(null=True, blank=True)  # Track the last auto-decrease
    
    standard_shipping_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=15.00,
        help_text="Standard shipping cost"
    )
    expedited_shipping_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=20.00,
        help_text="Additional cost for expedited shipping cost"
    )

    def __str__(self):
        return self.name
    