from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import AuctionItem
from .serializers import AuctionItemSerializer, CreateAuctionItemSerializer, PlaceBidSerializer
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal

# search items
@api_view(['GET'])
@permission_classes([IsAuthenticated]) # only authenticated (logged-in) users can search for items
def search_items(request):
    """
    Search items using keywords (UC 2.1)
    The <keyword> only scans title and description fields
    """
    keyword = request.GET.get('keyword', '').strip()
    
    if not keyword:
        return Response(
            {"error": "Keyword parameter is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filter active items matching keyword in name or description
    items = AuctionItem.objects.filter(
        Q(name__icontains=keyword) | Q(description__icontains=keyword),
        is_active=True
    ).order_by('-created_at')
    
    # Update the DUTCH auction prices before returning
    for item in items:
        if item.auction_type == 'DUTCH':
            _update_dutch_price(item)

    serializer = AuctionItemSerializer(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# create items
@api_view(['POST'])
@permission_classes([IsAuthenticated]) # could set this to IsAuthenticated so only authenticated users can create items
def create_item(request):
    """
    Create Item (UC 2)
    Used when user selects an item to bid on using the selection radio button on the frotend UI
    Will be able to test using curl -X GET "http://localhost:8000/items/<id>/" --> using item ID
    """
    serializer = CreateAuctionItemSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        if request.user.is_authenticated:
            seller = request.user
        else:
            # Create a test user for unauthenticated requests (so we can test adding items in the backend without making a user account)
            from django.contrib.auth.models import User
            seller, _ = User.objects.get_or_create(
                username='test_seller',
                defaults={'email': 'test@example.com'}
            )
        item = serializer.save(seller=seller, last_price_update=timezone.now())
        return Response(
            AuctionItemSerializer(item).data, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_item_details(request, item_id):
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if auction has ended
        if item.is_active and timezone.now() > item.end_time:
            item.is_active = False
            item.save()
        
        # Update Dutch auction price
        if item.auction_type == 'DUTCH' and item.is_active:
            _update_dutch_price(item)
        
        serializer = AuctionItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_bid(request, item_id):
    """
    Place a bid on an auction item (UC3)
    POST /items/<item_id>/bid/
    Body: {"bid_amount": 150.00}
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if auction has ended
        if timezone.now() > item.end_time:
            item.is_active = False
            item.save()
            return Response({
                "error": "Auction has ended",
                "winner": item.current_bidder_username if item.current_bidder else None,
                "final_price": float(item.current_price)
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if auction is active
        if not item.is_active:
            return Response(
                {"error": "Auction is not active"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is the seller
        if item.seller == request.user:
            return Response(
                {"error": "You cannot bid on your own item"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate bid amount
        serializer = PlaceBidSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        bid_amount = serializer.validated_data['bid_amount']
        
        # For FORWARD auctions -->   check minimum bid (5% increment)
        if item.auction_type == 'FORWARD':
            minimum_bid = item.current_price * Decimal('1.05')
            if bid_amount < minimum_bid:
                return Response(
                    {
                        "error": f"Bid must be at least 5% higher than current price",
                        "minimum_bid": float(minimum_bid),
                        "current_price": float(item.current_price)
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # For DUTCH auctions: bid must be >= current price
        elif item.auction_type == 'DUTCH':
            _update_dutch_price(item)  # Update price first
            if bid_amount < item.current_price:
                return Response(
                    {
                        "error": f"Bid must be at least the current price",
                        "current_price": float(item.current_price)
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update bid history
        bid_entry = {
            "username": request.user.username,
            "amount": float(bid_amount),
            "timestamp": timezone.now().isoformat()
        }
        item.bid_history.append(bid_entry)
        
        # Update current price and bidder
        item.current_price = bid_amount
        item.current_bidder = request.user
        item.save()
        
        serializer = AuctionItemSerializer(item)
        return Response({
            "message": "Bid placed successfully",
            "item": serializer.data
        }, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_price(request, item_id):
    """
    Get current price for auto-updating frontend (polling endpoint)
    GET /items/<item_id>/current-price/
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if ended
        if item.is_active and timezone.now() > item.end_time:
            item.is_active = False
            item.save()
        
        # Update Dutch price
        if item.auction_type == 'DUTCH' and item.is_active:
            _update_dutch_price(item)
        
        return Response({
            "current_price": float(item.current_price),
            "current_bidder": item.current_bidder.username if item.current_bidder else None,
            "is_active": item.is_active,
            "minimum_bid": float(item.current_price * Decimal('1.05')) if item.auction_type == 'FORWARD' else None
        }, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )


# Helper function to update Dutch auction prices
def _update_dutch_price(item):
    """
    Automatically decrease price for Dutch auctions based on time elapsed
    """
    if item.auction_type != 'DUTCH' or not item.is_active:
        return
    
    if not item.dutch_decrease_percentage or not item.dutch_decrease_interval:
        return
    
    now = timezone.now()
    time_since_last_update = now - item.last_price_update
    minutes_elapsed = time_since_last_update.total_seconds() / 60
    
    # Calculate how many intervals have passed
    intervals_passed = int(minutes_elapsed // item.dutch_decrease_interval)
    
    if intervals_passed > 0:
        # Decrease price by percentage for each interval
        decrease_factor = (Decimal('1') - (item.dutch_decrease_percentage / Decimal('100'))) ** intervals_passed
        new_price = item.current_price * decrease_factor
        
        # Don't go below starting price * 0.1 (10% floor)
        floor_price = item.starting_price * Decimal('0.1')
        if new_price < floor_price:
            new_price = floor_price
        
        item.current_price = new_price
        item.last_price_update = now
        item.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_auction_status(request, item_id):
    """
    Get auction status (active or ended) and the winner info if ended
    /items/<item_id>/status/
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if ended
        if item.is_active and timezone.now() > item.end_time:
            item.is_active = False
            item.save()
        
        response_data = {
            "is_active": item.is_active,
            "auction_type": item.auction_type,
            "end_time": item.end_time.isoformat(),
        }
        
        if not item.is_active:
            response_data.update({
                "status": "ended",
                "winner": item.current_bidder.username if item.current_bidder else None,
                "winning_bid": float(item.current_price) if item.current_bidder else None,
                "message": f"Auction ended. Winner: {item.current_bidder.username if item.current_bidder else 'No bids'}"
            })
        else:
            response_data.update({
                "status": "active",
                "current_price": float(item.current_price),
                "current_bidder": item.current_bidder.username if item.current_bidder else None,
                "time_remaining": str(item.end_time - timezone.now())
            })
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )