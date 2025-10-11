from django.db import models

class Item(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    starting_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "starting_price": str(self.starting_price),
            "created_at": self.created_at.isoformat(),
        }