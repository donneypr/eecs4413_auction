from rest_framework import serializers
from .models import AuctionItem
from django.utils import timezone

class AuctionItemSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()
    class Meta:
        model = AuctionItem
        fields = ['id', 'name', 'description', 'current_price', 
                  'auction_type', 'remaining_time', 'is_active']
        
    # remaining time left for forward type auctions (careful of indentation, has to be in the same line as class Meta)
    def get_remaining_time(self, obj):
        if obj.auction_type == 'FORWARD' and obj.is_active:
            time_left = obj.end_time - timezone.now()
            if time_left.total_seconds() > 0:
                return str(time_left)
        return None
        
# for adding auction items from backend
class CreateAuctionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionItem
        fields = ['name', 'description', 'starting_price', 'current_price', 
                  'auction_type', 'end_time']
    
    ## removed! the views.py handles the seller assignment when theres no auth seller --> to test curl commands
    # def create(self, validated_data):
    #     #set seller to the auth user so users can't create items under other user names by sending "seller": <another_user_id> in a JSON
    #     validated_data['seller'] = self.context['request'].user
    #     return super().create(validated_data) 
    