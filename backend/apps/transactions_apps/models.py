from django.db import models
import uuid

class Transactions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50, db_index=True)
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'

class BankDepositAccounts(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50, db_index=True, null=True, blank=True) # Добавлено для привязки к юзеру
    iban = models.CharField(max_length=34, unique=True)
    bank_name = models.CharField(max_length=255)
    beneficiary = models.CharField(max_length=255)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0) # Добавлен баланс
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'bank_deposit_accounts'

class CryptoWallets(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=50, db_index=True)
    network = models.CharField(max_length=20, default='TRC20')
    token = models.CharField(max_length=20, default='USDT')
    address = models.CharField(max_length=255, unique=True)
    balance = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crypto_wallets'

class TopupsBank(models.Model):
    TRANSFER_RAILS = (('UAE_LOCAL_AED', 'UAE Local AED'), ('SWIFT_INTL', 'SWIFT International'),)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transactions', on_delete=models.CASCADE, related_name='bank_topup')
    user_id = models.CharField(max_length=50)
    channel = models.CharField(max_length=50, default='bank_wire')
    transfer_rail = models.CharField(max_length=50, choices=TRANSFER_RAILS)
    deposit_account = models.ForeignKey(BankDepositAccounts, on_delete=models.SET_NULL, null=True)
    reference_value = models.CharField(max_length=100) 
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    instructions_snapshot = models.JSONField() 
    sender_name = models.CharField(max_length=255, null=True, blank=True)
    sender_bank = models.CharField(max_length=255, null=True, blank=True)
    sender_iban = models.CharField(max_length=34, null=True, blank=True)
    credited_card_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = 'topups_bank'

class BankInboundPayments(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3)
    sender = models.CharField(max_length=255)
    iban = models.CharField(max_length=34)
    reference = models.CharField(max_length=255)
    provider_id = models.CharField(max_length=255, unique=True)
    matched = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bank_inbound_payments'

class TopupsCrypto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transactions', on_delete=models.CASCADE, related_name='crypto_topup')
    user_id = models.CharField(max_length=50)
    card_id = models.UUIDField()
    token = models.CharField(max_length=20)
    network = models.CharField(max_length=20)
    deposit_address = models.CharField(max_length=255)
    address_provider = models.CharField(max_length=100)
    qr_payload = models.TextField()
    min_amount = models.DecimalField(max_digits=15, decimal_places=6)
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    rate_snapshot = models.DecimalField(max_digits=10, decimal_places=6, null=True)
    tx_hash = models.CharField(max_length=255, null=True, blank=True)
    from_address = models.CharField(max_length=255, null=True, blank=True)
    amount_crypto = models.DecimalField(max_digits=15, decimal_places=6, null=True, blank=True)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    fee_amount = models.DecimalField(max_digits=15, decimal_places=6, null=True, blank=True)
    credited_amount_aed = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'topups_crypto'

class CryptoInboundTransactions(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tx_hash = models.CharField(max_length=255, unique=True)
    network = models.CharField(max_length=50)
    token = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    from_address = models.CharField(max_length=255)
    to_address = models.CharField(max_length=255)
    confirmations = models.IntegerField(default=0)
    received_at = models.DateTimeField()
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'crypto_inbound_transactions'

class CardTransfers(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transactions', on_delete=models.CASCADE, related_name='card_transfer')
    sender_user_id = models.CharField(max_length=50)
    receiver_user_id = models.CharField(max_length=50)
    sender_card_id = models.UUIDField()
    receiver_card_id = models.UUIDField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = 'card_transfers'

class CryptoWithdrawals(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transactions', on_delete=models.CASCADE, related_name='crypto_withdrawal')
    user_id = models.CharField(max_length=50)
    token = models.CharField(max_length=20)
    network = models.CharField(max_length=20)
    to_address = models.CharField(max_length=255)
    address_validated = models.BooleanField(default=False)
    amount_crypto = models.DecimalField(max_digits=15, decimal_places=6)
    fee_amount = models.DecimalField(max_digits=15, decimal_places=6)
    fee_type = models.CharField(max_length=50)
    total_debit = models.DecimalField(max_digits=15, decimal_places=6)
    provider = models.CharField(max_length=100, null=True, blank=True)
    provider_reference = models.CharField(max_length=255, null=True, blank=True)
    tx_hash = models.CharField(max_length=255, null=True, blank=True)
    confirmations = models.IntegerField(default=0)
    failed_reason = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'crypto_withdrawals'

class BankWithdrawals(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transactions', on_delete=models.CASCADE, related_name='bank_withdrawal')
    user_id = models.CharField(max_length=50)
    beneficiary_iban = models.CharField(max_length=34)
    iban_validated = models.BooleanField(default=False)
    beneficiary_name = models.CharField(max_length=255)
    beneficiary_bank_name = models.CharField(max_length=255)
    from_card_id = models.UUIDField(null=True, blank=True)
    from_bank_account_id = models.UUIDField(null=True, blank=True)
    amount_aed = models.DecimalField(max_digits=15, decimal_places=2)
    fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_debit = models.DecimalField(max_digits=15, decimal_places=2)
    provider_reference = models.CharField(max_length=255, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    failed_reason = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'bank_withdrawals'

class BalanceMovements(models.Model):
    MOVEMENT_TYPES = (('debit', 'Debit (-)',), ('credit', 'Credit (+)',))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey('Transactions', on_delete=models.CASCADE, related_name='movements')
    user_id = models.CharField(max_length=50)
    account_type = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'balance_movements'