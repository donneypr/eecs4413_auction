from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .models import Item

def items_list(_request):
    return JsonResponse([i.as_dict() for i in Item.objects.all()], safe=False)