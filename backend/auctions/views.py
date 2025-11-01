from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import AuctionItem, Bid
from .serializers import AuctionItemSerializer, CreateAuctionItemSerializer
from django.db.models import Q

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
    
    serializer = AuctionItemSerializer(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# create items
@api_view(['POST'])
@permission_classes([AllowAny]) # could set this to IsAuthenticated so only authenticated users can create items
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
        serializer.save(seller=seller)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # only users can get item details (will auto trigger after user selects an item on the Frontend UI)
def get_item_details(request, item_id):
    """
    Get detailed information about a specific auction item (UC2.3)
    Used when user selects an item to bid on using the selection radio button on the frotend UI
    Will be able to test using curl -X GET "http://localhost:8000/items/<id>/" --> using item ID
    dont forget to be logged in to a user account before being able to test this
    """
    try:
        item = AuctionItem.objects.get(id=item_id, is_active=True)
        serializer = AuctionItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except AuctionItem.DoesNotExist:
        return Response(
            {"error": "Item not found or inactive"}, 
            status=status.HTTP_404_NOT_FOUND
        )
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auction_ended_view(request, pk):
    """
    UC4: Handle auction ended state.
    - Marks the auction as ended if expired.
    - Returns winner info.
    - Only winner can proceed to payment.
    """
    try:
        item = AuctionItem.objects.get(pk=pk)
    except AuctionItem.DoesNotExist:
        return Response({'error': 'Auction item not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Ensure auction status is up to date
    item.end_auction_if_needed()

    if item.is_active:
        return Response({'message': 'Auction still ongoing.'}, status=status.HTTP_400_BAD_REQUEST)

    highest_bid = item.bids.order_by('-amount').first()

    if not highest_bid:
        return Response({
            'status': 'no_bids',
            'message': 'Auction ended with no bids.'
        }, status=status.HTTP_200_OK)

    if request.user == highest_bid.bidder:
        serializer = AuctionEndedSerializer(item)
        return Response({
            'status': 'won',
            'message': 'Congratulations! You won the auction.',
            'data': serializer.data
        })
    else:
        return Response({
            'status': 'lost',
            'message': 'The auction has ended. You did not win this item.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_now_view(request, pk):
    """
    UC4: 'Pay Now' action for the winner.
    """
    try:
        item = AuctionItem.objects.get(pk=pk)
    except AuctionItem.DoesNotExist:
        return Response({'error': 'Auction item not found.'}, status=status.HTTP_404_NOT_FOUND)

    if item.is_active:
        return Response({'error': 'Auction still active. Payment unavailable.'}, status=400)

    if request.user != item.winner:
        return Response({'error': 'You are not the winner of this auction.'}, status=403)

    expedited = request.data.get('expedited', False)
    total = item.current_price + item.shipping_cost
    if expedited:
        total += item.expedited_shipping_cost

    return Response({
        'message': 'Payment ready.',
        'expedited': expedited,
        'total_amount': float(total),
    })