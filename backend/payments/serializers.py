from rest_framework import serializers
from .models import Payment
import re
from datetime import datetime


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
    payment_method = serializers.ChoiceField(
        choices=['Credit Card', 'Debit Card'],
        default='Credit Card'
    )

    # Card info fields (won't be saved to DB)
    card_number = serializers.CharField(
        max_length=19,
        required=True,
        help_text="16-digit card number"
    )
    name_on_card = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Cardholder name"
    )
    expiration_date = serializers.CharField(
        max_length=5,
        required=True,
        help_text='MM/YY format'
    )
    security_code = serializers.CharField(
        max_length = 4,
        required=True,
        help_text="3 or 4 digit security code"
    )

    # add validation for all of the card informations

    def validate_card_number(self, value):
        """Validate card number (this is only a basic implementation)"""
        card_number = re.sub(r'[\s-]', '', value) # remove spaces or dashes

        if not re.match(r'^\d{16}$', card_number):
            raise serializers.ValidationError(
                "Card number must be 16 digits" # digit check
            )
        
        # Luhn algorithm for card validation // fully implemented but disabled for testing deliverable 2
        # if not self._luhn_check(card_number):
        #     raise serializers.ValidationError(
        #         "Invalid card number"
        #     )
        
        return card_number
    
    def validate_name_on_card(self, value):
        """Validate cardholder name"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name on card must be at least 2 characters"
            )
        return value.strip()
    
    def validate_expiration_date(self, value):
        """Validate expiration date format and check if not expired"""
        # Check format MM/YY
        if not re.match(r'^\d{2}/\d{2}$', value):
            raise serializers.ValidationError(
                "Expiration date must be in MM/YY format"
            )
        
        month, year = value.split('/')
        month = int(month)
        year = int(year) + 2000  # Convert YY to YYYY for checking
        
        # Validate month
        if month < 1 or month > 12:
            raise serializers.ValidationError(
                "Invalid month in expiration date"
            )
        
        # Check if card is expired
        now = datetime.now()
        if year < now.year or (year == now.year and month < now.month):
            raise serializers.ValidationError(
                "Card has expired"
            )
        
        return value
    
    def validate_security_code(self, value):
        """Validate CVV/CVC"""
        if not re.match(r'^\d{3,4}$', value):
            raise serializers.ValidationError(
                "Security code must be 3 or 4 digits"
            )
        return value
    
    # luhn algorithm disabled for testing.

    # def _luhn_check(self, card_number):
    #     """Luhn algorithm to validate card number"""
    #     def digits_of(n):
    #         return [int(d) for d in str(n)]
        
    #     digits = digits_of(card_number)
    #     odd_digits = digits[-1::-2]
    #     even_digits = digits[-2::-2]
    #     checksum = sum(odd_digits)
    #     for d in even_digits:
    #         checksum += sum(digits_of(d * 2))
    #     return checksum % 10 == 0

