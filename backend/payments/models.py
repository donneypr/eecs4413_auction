from django.db import models
from django.contrib.auth.models import User
from auctions.models import AuctionItem

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    auction_item = models.ForeignKey(
        AuctionItem, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    buyer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    winning_bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    standard_shipping_cost = models.DecimalField(max_digits=10, decimal_places=2)
    expedited_shipping_selected = models.BooleanField(default=False)
    expedited_shipping_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, 
        choices=PAYMENT_STATUS_CHOICES, 
        default='PENDING'
    )
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    confirmation_number = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.confirmation_number} - {self.buyer.username}"
