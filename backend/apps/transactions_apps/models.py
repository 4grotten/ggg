from django.db import models

class Transactions(models.Model):
    id = models.UUIDField(primary_key=True)
    user_id = models.UUIDField()
    card = models.ForeignKey('cards_apps.Cards', models.DO_NOTHING, blank=True, null=True)
    type = models.TextField()
    status = models.TextField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3)
    fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    original_amount = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    original_currency = models.CharField(max_length=3, blank=True, null=True)
    merchant_name = models.TextField(blank=True, null=True)
    merchant_category = models.TextField(blank=True, null=True)
    recipient_card = models.CharField(max_length=19, blank=True, null=True)
    sender_name = models.TextField(blank=True, null=True)
    sender_card = models.CharField(max_length=19, blank=True, null=True)
    reference_id = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'transactions'
