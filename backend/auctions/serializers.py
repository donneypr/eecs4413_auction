from rest_framework import serializers
from .models import AuctionItem
from django.utils import timezone
from decimal import Decimal
import base64
import imghdr

class AuctionItemSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()
    current_bidder_username = serializers.SerializerMethodField()
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    minimum_bid = serializers.SerializerMethodField()
    auction_status = serializers.SerializerMethodField()
    winner_info = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = AuctionItem
        fields = [
            'id', 'name', 'description', 'starting_price', 'current_price',
            'auction_type', 'remaining_time', 'is_active', 'seller_username',
            'current_bidder_username', 'bid_history', 'minimum_bid', 'end_time',
            'auction_status', 'winner_info', 'thumbnail', 'images', 'created_at'
        ]

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

    def get_current_bidder_username(self, obj):
        if obj.current_bidder:
            return obj.current_bidder.username
        return None

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
        """Return winner info if auction ended"""
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

    def get_thumbnail(self, obj):
        """Return the first image as thumbnail (base64 data URI)"""
        return obj.get_thumbnail_url()


class CreateAuctionItemSerializer(serializers.ModelSerializer):
    # Accept images as list of base64 strings from frontend
    images_data = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        help_text="List of base64-encoded image strings"
    )

    class Meta:
        model = AuctionItem
        fields = [
            'name', 'description', 'starting_price', 'current_price',
            'auction_type', 'end_time', 'dutch_decrease_percentage',
            'dutch_decrease_interval', 'images_data'
        ]
        extra_kwargs = {
            'current_price': {'read_only': True},
        }

    def validate_images_data(self, value):
        """Validate image uploads"""
        if not value:
            return value

        # Max 5 images
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 images allowed per item.")

        # Allowed formats
        allowed_formats = {'jpeg', 'jpg', 'png'}
        max_size_bytes = 25 * 1024 * 1024  # 25MB

        processed_images = []

        for idx, base64_str in enumerate(value):
            try:
                # Decode base64
                if ',' in base64_str:
                    # Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
                    base64_str = base64_str.split(',')[1]

                image_data = base64.b64decode(base64_str)

                # Check file size
                if len(image_data) > max_size_bytes:
                    raise serializers.ValidationError(
                        f"Image {idx + 1} exceeds 25MB limit."
                    )

                # Detect image format
                img_format = imghdr.what(None, h=image_data)

                if img_format not in allowed_formats:
                    raise serializers.ValidationError(
                        f"Image {idx + 1} has unsupported format. Allowed: JPG, JPEG, PNG."
                    )

                # Store with format and order
                processed_images.append({
                    "data": base64_str,
                    "format": img_format,
                    "order": idx
                })

            except Exception as e:
                raise serializers.ValidationError(
                    f"Image {idx + 1} validation failed: {str(e)}"
                )

        return processed_images

    def validate(self, data):
        """Validate Dutch auction requirements"""
        if data.get('auction_type') == 'DUTCH':
            if not data.get('dutch_decrease_percentage') or not data.get('dutch_decrease_interval'):
                raise serializers.ValidationError(
                    "Dutch auctions require a decrease percentage and a time interval for the decreasing"
                )

        # Ensure starting_price is valid
        sp = data.get('starting_price')
        if sp is not None and sp <= 0:
            raise serializers.ValidationError({"starting_price": "Must be greater than 0"})

        return data

    def create(self, validated_data):
        """Create item with processed images"""
        # Always start the auction at starting_price
        validated_data['current_price'] = validated_data['starting_price']

        # Extract and process images
        images_data = validated_data.pop('images_data', [])
        validated_data['images'] = images_data

        return super().create(validated_data)


class EditAuctionItemSerializer(serializers.ModelSerializer):
    """For editing item details (name, description only)"""
    
    class Meta:
        model = AuctionItem
        fields = ['name', 'description']

    def validate(self, data):
        """Basic validation"""
        if 'name' in data and not data['name'].strip():
            raise serializers.ValidationError({"name": "Item name cannot be empty"})
        if 'description' in data and not data['description'].strip():
            raise serializers.ValidationError({"description": "Description cannot be empty"})
        return data


class PlaceBidSerializer(serializers.Serializer):
    """Serializer for bid placing"""
    bid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)