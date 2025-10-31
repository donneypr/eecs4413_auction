from rest_framework import serializers
from .models import Payment


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    item_name = serializers.CharField(source='auction_item.name', read_only=True)
    winner = serializers.CharField(source='buyer.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'item_name', 'winner', 'winning_bid_amount',
            'standard_shipping_cost', 'expedited_shipping_selected',
            'expedited_shipping_cost', 'total_amount', 'payment_status',
            'confirmation_number', 'created_at', 'paid_at'
        ]


class PaymentOptionsSerializer(serializers.Serializer):
    """Serializer showing payment options to user"""
    item_id = serializers.IntegerField()
    item_name = serializers.CharField()
    winning_bid = serializers.DecimalField(max_digits=10, decimal_places=2)
    winner = serializers.CharField()
    shipping_options = serializers.SerializerMethodField()
    total_if_standard = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_if_expedited = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def get_shipping_options(self, obj):
        return {
            "standard": {
                "cost": float(obj['standard_shipping_cost']),
                "description": "Standard shipping (5-7 business days)"
            },
            "expedited": {
                "additional_cost": float(obj['expedited_shipping_cost']),
                "total_cost": float(obj['standard_shipping_cost'] + obj['expedited_shipping_cost']),
                "description": "Expedited shipping (1-2 business days)"
            }
        }


class ProcessPaymentSerializer(serializers.Serializer):
    """Serializer for payment processing input"""
    expedited_shipping = serializers.BooleanField(default=False)
    payment_method = serializers.CharField(max_length=50, required=False, default="Credit Card")
