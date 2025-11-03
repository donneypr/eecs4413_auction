from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from decimal import Decimal
import uuid

from auctions.models import AuctionItem
from .models import Payment
from .serializers import (
    PaymentDetailSerializer,
    PaymentOptionsSerializer,
    ProcessPaymentSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_details(request, item_id):
    """
    Get payment details for a won auction item (UC4)
    GET /payments/<item_id>/details/
    
    Only the winner can access this endpoint.
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if auction has ended
        if item.is_active or timezone.now() < item.end_time:
            return Response(
                {"error": "Auction is still active"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's a winner
        if not item.current_bidder:
            return Response(
                {"error": "No winner for this auction"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is the winner
        if item.current_bidder != request.user:
            return Response(
                {
                    "error": "You are not the winner of this auction",
                    "winner": item.current_bidder.username
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already paid
        existing_payment = Payment.objects.filter(
            auction_item=item,
            payment_status='COMPLETED'
        ).first()
        
        if existing_payment:
            return Response(
                {
                    "error": "This item has already been paid for",
                    "payment_id": existing_payment.id,
                    "confirmation_number": existing_payment.confirmation_number
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate totals
        standard_total = item.current_price + item.standard_shipping_cost
        expedited_total = item.current_price + item.standard_shipping_cost + item.expedited_shipping_cost
        
        # Prepare payment data
        payment_data = {
            'item_id': item.id,
            'item_name': item.name,
            'winning_bid': item.current_price,
            'winner': item.current_bidder.username,
            'standard_shipping_cost': item.standard_shipping_cost,
            'expedited_shipping_cost': item.expedited_shipping_cost,
            'total_if_standard': standard_total,
            'total_if_expedited': expedited_total
        }
        
        serializer = PaymentOptionsSerializer(payment_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request, item_id):
    """
    Process payment for a won auction item (UC4)
    POST /payments/<item_id>/pay/
    Body: {
        "expedited_shipping": true/false,
        "payment_method": "Credit Card",
        "card_number": "4532015112830366",
        "name_on_card": "Franky Nakama",
        "expiration_date": "12/27",
        "security_code": "647"
    }
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if auction has ended
        if item.is_active or timezone.now() < item.end_time:
            return Response(
                {"error": "Auction is still active"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's a winner
        if not item.current_bidder:
            return Response(
                {"error": "No winner for this auction"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is the winner
        if item.current_bidder != request.user:
            return Response(
                {
                    "error": "You are not the winner of this auction",
                    "winner": item.current_bidder.username
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already paid
        existing_payment = Payment.objects.filter(
            auction_item=item,
            payment_status='COMPLETED'
        ).first()
        
        if existing_payment:
            return Response(
                {
                    "error": "This item has already been paid for",
                    "payment_id": existing_payment.id,
                    "confirmation_number": existing_payment.confirmation_number
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expedited_shipping = serializer.validated_data["expedited_shipping"]
        payment_method     = serializer.validated_data.get("payment_method", "Credit Card")

        # pull (write_only) card fields from validated_data — not stored in DB
        card_number     = serializer.validated_data["card_number"]
        name_on_card    = serializer.validated_data["name_on_card"]
        expiration_date = serializer.validated_data["expiration_date"]
        security_code   = serializer.validated_data["security_code"]

        last_4 = card_number[-4:]  # for receipts/logs if needed (avoid logging full PAN)
        
        # Calculate total cost
        winning_bid_amount = item.current_price
        standard_shipping_cost = item.standard_shipping_cost
        expedited_shipping_cost = item.expedited_shipping_cost if expedited_shipping else Decimal('0.00')
        total_amount = winning_bid_amount + standard_shipping_cost + expedited_shipping_cost
        
        # Generate confirmation number
        confirmation_number = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        
        # Create payment record
        payment = Payment.objects.create(
            auction_item=item,
            buyer=request.user,
            winning_bid_amount=winning_bid_amount,
            standard_shipping_cost=standard_shipping_cost,
            expedited_shipping_selected=expedited_shipping,
            expedited_shipping_cost=expedited_shipping_cost,
            total_amount=total_amount,
            payment_status='COMPLETED',  # For now, simulate instant success
            payment_method=payment_method,
            confirmation_number=confirmation_number,
            paid_at=timezone.now()
        )
        
        # get user details
        user = request.user
        profile = getattr(user, "profile", None)

        buyer_block = {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }

        address_block = (
            {
                "street_name": profile.street_name,
                "street_number": profile.street_number,
                "city": profile.city,
                "country": profile.country,
                "postal_code": profile.postal_code,
            }
            if profile else None  # or {} if you prefer empty object
        )
        # Return receipt
        return Response({
            "success": True,
            "message": "Payment processed successfully",
            "payment_id": payment.id,
            "receipt": {
                "item_name": item.name,
                "winning_bid": float(winning_bid_amount),
                "shipping_cost": float(standard_shipping_cost + expedited_shipping_cost),
                "expedited": expedited_shipping,
                "total_paid": float(total_amount),
                "paid_at": payment.paid_at.isoformat(),
                "confirmation_number": confirmation_number,
                "payment_method": payment_method,
                "card_ending_in": last_4,
                "cardholder": name_on_card,
                "buyer": buyer_block,
                "shipping_address": address_block
            }
        }, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_won_items(request):
    """
    Get all items won by the current user (extra functionality, not included in UC4)
    GET /payments/my-won-items/
    """
    # Get all items won by user
    won_items = AuctionItem.objects.filter(
        current_bidder=request.user,
        is_active=False
    ).order_by('-end_time')
    
    unpaid_items = []
    paid_items = []
    
    for item in won_items:
        # Check if paid
        payment = Payment.objects.filter(
            auction_item=item,
            payment_status='COMPLETED'
        ).first()
        
        item_data = {
            "item_id": item.id,
            "item_name": item.name,
            "winning_bid": float(item.current_price),
            "won_at": item.end_time.isoformat(),
        }
        
        if payment:
            item_data.update({
                "payment_status": "paid",
                "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
                "total_paid": float(payment.total_amount),
                "confirmation_number": payment.confirmation_number
            })
            paid_items.append(item_data)
        else:
            item_data["payment_status"] = "unpaid"
            unpaid_items.append(item_data)
    
    return Response({
        "unpaid_items": unpaid_items,
        "paid_items": paid_items
    }, status=status.HTTP_200_OK)
