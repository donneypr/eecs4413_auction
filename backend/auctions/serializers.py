from rest_framework import serializers
from .models import AuctionItem
from django.utils import timezone
from decimal import Decimal

class AuctionItemSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()
    current_bidder_username = serializers.SerializerMethodField()
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    minimum_bid = serializers.SerializerMethodField()
    auction_status = serializers.SerializerMethodField()
    winner_info = serializers.SerializerMethodField()
    class Meta:
        model = AuctionItem
        fields = [
            'id', 'name', 'description', 'starting_price', 'current_price', 
            'auction_type', 'remaining_time', 'is_active', 'seller_username',
            'current_bidder_username', 'bid_history', 'minimum_bid', 'end_time',
            'auction_status', 'winner_info'
        ]
        
    # remaining time left for auctions, returns time in hours, minutes, seconds format 
    def get_remaining_time(self, obj):
        if obj.is_active:
            time_left = obj.end_time - timezone.now()
            if time_left.total_seconds() > 0:
                hours, remainder = divmod(int(time_left.total_seconds()), 3600)
                minutes, seconds = divmod(remainder, 60)
                return f"{hours}h {minutes}m {seconds}s"
            else:
                return "Ended"
        return "Ended"
    
    # get current bidder's username
    def get_current_bidder_username(self, obj):
        if obj.current_bidder:
            return obj.current_bidder.username
        return None
    
    # minimum bid price users can bid on a FORWARD auction
    def get_minimum_bid(self, obj):
        """Calculate minimum bid (current_price + 5%)"""
        if obj.auction_type == 'FORWARD' and obj.is_active:
            return float(obj.current_price * Decimal('1.05'))
        return None
    
    def get_auction_status(self, obj):
        """Return status"""
        if not obj.is_active:
            return "Ended"
        if timezone.now() > obj.end_time:
            return "Ended"
        return "Active"
    
    def get_winner_info(self, obj):
        """Return winne info if auction ended"""
        if not obj.is_active or timezone.now() > obj.end_time:
            if obj.current_bidder:
                return {
                    "winner": obj.current_bidder.username,
                    "winning_bid": float(obj.current_price),
                    "message": f"Auction ended. Winner: {obj.current_bidder.username}"
                }
            return {
                "winner": None,
                "winning_bid": None,
                "message": "Auction ended with no bids"
            }
        return None
        
# for adding auction items from backend
class CreateAuctionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionItem
        fields = ['name', 'description', 'starting_price', 'current_price', 
                  'auction_type', 'end_time', 'dutch_decrease_percentage',
                  'dutch_decrease_interval']
        
    def validate(self, data):
        # if DUTCH auction, require the price decrease fields
        if data.get('auction_type') == 'DUTCH':
            if not data.get('dutch_decrease_percentage') or not data.get('dutch_decrease_interval'):
                raise serializers.ValidationError(
                    "Dutch auctions require a decrease percentage and a time interval for the decreasing"
                )
        return data
    
class PlaceBidSerializer(serializers.Serializer):
    """Serializer for bid placing"""
    bid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)