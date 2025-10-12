from rest_framework import viewsets, permissions, serializers
from .models import Item

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "title", "description", "starting_price", "created_at"]

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.order_by("-created_at")
    serializer_class = ItemSerializer
    permission_classes = [permissions.AllowAny]  # dev: open; later tighten