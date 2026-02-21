from django.db import models
import uuid

class Cards(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50, db_index=True)
    type = models.TextField()
    name = models.TextField()
    status = models.TextField()
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_four_digits = models.CharField(max_length=4, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    card_number_encrypted = models.TextField(blank=True, null=True)
    cvv_encrypted = models.TextField(blank=True, null=True)
    annual_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cards'