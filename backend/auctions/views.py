from xml.dom import ValidationErr
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import AuctionItem
from .serializers import (
    AuctionItemSerializer,
    CreateAuctionItemSerializer,
    EditAuctionItemSerializer,
    PlaceBidSerializer
)
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth.models import User

@api_view(['GET'])
@permission_classes([AllowAny])
def list_items(request):
    _check_and_expire_auctions()
    """Display auctions with filtering and sorting"""
    qs = AuctionItem.objects.select_related('seller', 'current_bidder').all()

    # Optional filters
    q = (request.GET.get('q') or '').strip()
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))

    status_param = (request.GET.get('status') or '').lower()
    now = timezone.now()
    if status_param == 'active':
        qs = qs.filter(is_active=True, end_time__gt=now)
    elif status_param == 'ended':
        qs = qs.filter(Q(is_active=False) | Q(end_time__lte=now))

    auction_type = (request.GET.get('type') or '').upper()
    if auction_type in ('FORWARD', 'DUTCH'):
        qs = qs.filter(auction_type=auction_type)

    # Optional sort
    sort = request.GET.get('sort')
    sort_map = {
        'ending_soon': 'end_time',
        'newest': '-created_at',
        'price_asc': 'current_price',
        'price_desc': '-current_price',
    }
    qs = qs.order_by(sort_map.get(sort, '-end_time'))

    # Pagination
    try:
        page = max(int(request.GET.get('page', 1)), 1)
    except ValueError:
        page = 1
    try:
        page_size = min(max(int(request.GET.get('page_size', 20)), 1), 100)
    except ValueError:
        page_size = 20

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size

    data = AuctionItemSerializer(qs[start:end], many=True).data

    return Response({'count': total, 'page': page, 'page_size': page_size, 'results': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def search_items(request):
    _check_and_expire_auctions()
    """Search items using keywords"""
    keyword = request.GET.get('keyword', '').strip()
    if not keyword:
        return Response(
            {"error": "Keyword parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    items = AuctionItem.objects.filter(
        Q(name__icontains=keyword) | Q(description__icontains=keyword),
        is_active=True
    ).order_by('-created_at')

    # Update DUTCH auction prices
    for item in items:
        if item.auction_type == 'DUTCH':
            _update_dutch_price(item)

    serializer = AuctionItemSerializer(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_item_details(request, item_id):
    """Get full item details"""
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
def create_item(request):
    """
    Create Item with image uploads
    Accepts multipart/form-data with base64 images
    """
    serializer = CreateAuctionItemSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        seller = request.user
        item = serializer.save(seller=seller, last_price_update=timezone.now())
        return Response(
            AuctionItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_bid(request, item_id):
    """Place a bid on an auction item"""
    try:
        item = AuctionItem.objects.get(id=item_id)

        # Check if auction is active
        if not item.is_active or timezone.now() > item.end_time:
            item.is_active = False
            item.save()
            return Response(
                {"error": "Auction has ended"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is the seller
        if item.seller == request.user:
            return Response(
                {"error": "Cannot bid on your own item"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate bid
        serializer = PlaceBidSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        bid_amount = serializer.validated_data['bid_amount']

        # Update Dutch price if needed
        if item.auction_type == 'DUTCH':
            _update_dutch_price(item)

        # Validate bid amount based on auction type
        if item.auction_type == 'FORWARD':
            minimum_bid = item.current_price * Decimal('1.05')
            if bid_amount < minimum_bid:
                return Response(
                    {
                        "error": "Bid amount too low",
                        "current_price": float(item.current_price),
                        "minimum_bid": float(minimum_bid)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:  # DUTCH
            if bid_amount < item.current_price:
                return Response(
                    {
                        "error": "Bid must be at least equal to current price",
                        "current_price": float(item.current_price)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Place the bid
        now = timezone.now()
        item.current_price = bid_amount
        item.current_bidder = request.user
        item.bid_history.append({
            "username": request.user.username,
            "amount": float(bid_amount),
            "timestamp": now.isoformat()
        })

        # ending dutch auction after a bid has been placed on it
        if item.auction_type == 'DUTCH':
            item.is_active = False
            item.end_time = now        # set end_time to bid time so it ends the auction
            item.save()
        else:
            item.save()

        return Response(
            {
                "message": "Bid placed successfully",
                "item": AuctionItemSerializer(item).data
            },
            status=status.HTTP_200_OK
        )

    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_current_price(request, item_id):
    """Real-time price updates for frontend polling"""
    try:
        item = AuctionItem.objects.get(id=item_id)

        # Update Dutch auction price
        if item.auction_type == 'DUTCH' and item.is_active:
            _update_dutch_price(item)

        minimum_bid = None
        if item.auction_type == 'FORWARD' and item.is_active:
            minimum_bid = float(item.current_price * Decimal('1.05'))

        return Response(
            {
                "current_price": float(item.current_price),
                "current_bidder": item.current_bidder.username if item.current_bidder else None,
                "is_active": item.is_active,
                "minimum_bid": minimum_bid
            },
            status=status.HTTP_200_OK
        )
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_auction_status(request, item_id):
    """Check if auction is active or ended"""
    try:
        item = AuctionItem.objects.get(id=item_id)

        # Check if auction has ended
        if item.is_active and timezone.now() > item.end_time:
            item.is_active = False
            item.save()

        if item.is_active:
            time_left = item.end_time - timezone.now()
            hours, remainder = divmod(int(time_left.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)

            return Response(
                {
                    "is_active": True,
                    "auction_type": item.auction_type,
                    "status": "active",
                    "current_price": float(item.current_price),
                    "current_bidder": item.current_bidder.username if item.current_bidder else None,
                    "time_remaining": f"{hours}:{minutes:02d}:{seconds:02d}",
                    "end_time": item.end_time.isoformat()
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "is_active": False,
                    "auction_type": item.auction_type,
                    "status": "ended",
                    "winner": item.current_bidder.username if item.current_bidder else None,
                    "winning_bid": float(item.current_price) if item.current_bidder else None,
                    "message": f"Auction ended. Winner: {item.current_bidder.username}" if item.current_bidder else "Auction ended with no bids",
                    "end_time": item.end_time.isoformat()
                },
                status=status.HTTP_200_OK
            )

    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# PROFILE ENDPOINTS

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_items(request, username):
    """Get all items (active and ended) for a specific user"""
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only the user can see their own items with full details
    if request.user != user:
        return Response(
            {"error": "You can only view your own items"},
            status=status.HTTP_403_FORBIDDEN
        )

    items = AuctionItem.objects.filter(seller=user).select_related('seller', 'current_bidder').order_by('-created_at')

    # Update Dutch auction prices for active items
    for item in items:
        if item.auction_type == 'DUTCH' and item.is_active:
            _update_dutch_price(item)

    serializer = AuctionItemSerializer(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_bids(request, username):
    """Get all items user has placed bids on (chronologically ordered)"""
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only the user can see their own bids
    if request.user != user:
        return Response(
            {"error": "You can only view your own bids"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get items where user has placed a bid
    items = AuctionItem.objects.select_related('seller', 'current_bidder').all()
    user_bid_items = []

    for item in items:
        for bid in item.bid_history:
            if bid.get('username') == user.username:
                user_bid_items.append(item)
                break

    # Sort chronologically (newest first)
    user_bid_items.sort(key=lambda x: x.created_at, reverse=True)

    serializer = AuctionItemSerializer(user_bid_items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_item(request, item_id):
    """
    Edit an auction item (name, description, image order)
    PATCH /items/<id>/edit/
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if user is the seller
        if item.seller != request.user:
            return Response(
                {"error": "You can only edit your own items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if auction has ended or has bids
        if not item.is_active or item.bid_history:
            return Response(
                {"error": "Cannot edit items that have ended or have bids"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update name and description if provided
        if 'name' in request.data:
            item.name = request.data['name']
        if 'description' in request.data:
            item.description = request.data['description']
        
        # Update image order if provided
        if 'image_order' in request.data:
            new_order = request.data['image_order']
            if len(new_order) != len(item.images):
                raise ValidationErr("Invalid image order")
            images = list(item.images)
            item.images = [images[i] for i in new_order]
            item.save()
        
        item.save()
        
        serializer = AuctionItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_item(request, item_id):
    """
    Delete an auction item
    DELETE /items/<id>/delete/
    """
    try:
        item = AuctionItem.objects.get(id=item_id)
        
        # Check if user is the seller
        if item.seller != request.user:
            return Response(
                {"error": "You can only delete your own items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if auction has bids
        if item.bid_history:
            return Response(
                {"error": "Cannot delete items that have bids"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.delete()
        return Response(
            {"message": "Item deleted successfully"},
            status=status.HTTP_200_OK
        )
        
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND
        )

# ==================== HELPER FUNCTIONS ====================

def _update_dutch_price(item):
    """Update price for Dutch auctions based on time elapsed"""
    if item.auction_type != 'DUTCH' or not item.is_active:
        return

    if item.last_price_update is None:
        item.last_price_update = item.created_at

    now = timezone.now()
    time_elapsed = (now - item.last_price_update).total_seconds() # in seconds
    intervals_passed = int(time_elapsed / item.dutch_decrease_interval)

    if intervals_passed > 0:
        decrease_factor = Decimal(100 - item.dutch_decrease_percentage) / Decimal(100)
        new_price = item.current_price * (decrease_factor ** intervals_passed)

        item.current_price = max(new_price, Decimal('0.01'))
        item.last_price_update = now
        item.save()

def _check_and_expire_auctions():
    """Mark all expired auctions as inactive"""
    now = timezone.now()
    AuctionItem.objects.filter(
        is_active=True,
        end_time__lte=now
    ).update(is_active=False)
