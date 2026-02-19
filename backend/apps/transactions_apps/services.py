from django.db import transaction
from django.utils import timezone
import uuid
from apps.transactions_apps.models import (
    Transactions, TopupsBank, BankDepositAccounts, 
    TopupsCrypto, CardTransfers, BalanceMovements, 
    CryptoWithdrawals, BankWithdrawals
)
from apps.cards_apps.models import Cards

class TransactionService:
    #TASK 1
    @staticmethod
    def initiate_bank_topup(user_id: uuid.UUID, transfer_rail: str):
        deposit_account = BankDepositAccounts.objects.filter(is_active=True).first()
        if not deposit_account:
            raise ValueError("Нет активных банковских реквизитов для пополнения.")
        reference = f"REF-{user_id.hex[:6]}-{uuid.uuid4().hex[:4]}".upper()
        with transaction.atomic():
            txn = Transactions.objects.create(
                id=uuid.uuid4(), user_id=user_id, type='bank_topup', status='pending',
                amount=0, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            topup = TopupsBank.objects.create(
                transaction=txn, user_id=user_id, transfer_rail=transfer_rail,
                deposit_account=deposit_account, reference_value=reference,
                instructions_snapshot={
                    "iban": deposit_account.iban,
                    "bank_name": deposit_account.bank_name,
                    "beneficiary": deposit_account.beneficiary,
                    "reference": reference
                }
            )
        return topup

    #TASK 2
    @staticmethod
    def initiate_crypto_topup(user_id: uuid.UUID, card_id: uuid.UUID, token: str, network: str):
        deposit_address = f"0x{uuid.uuid4().hex}" # Заглушка, тут вызов провайдера (Tatum/Fireblocks)
        with transaction.atomic():
            txn = Transactions.objects.create(
                id=uuid.uuid4(), user_id=user_id, type='crypto_topup', status='pending',
                amount=0, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            topup = TopupsCrypto.objects.create(
                transaction=txn, user_id=user_id, card_id=card_id, token=token,
                network=network, deposit_address=deposit_address, address_provider='internal',
                qr_payload=f"{token}:{deposit_address}", min_amount=10.00, fee_percent=1.50
            )
        return topup

    #TASK 3
    @staticmethod
    def execute_card_transfer(sender_id: uuid.UUID, sender_card_id: uuid.UUID, receiver_card_number: str, amount: float):
        fee_amount = 0.00
        total_deduction = amount + fee_amount
        with transaction.atomic():
            sender_card = Cards.objects.select_for_update().get(id=sender_card_id)
            receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number, status='active')
            if sender_card.balance < total_deduction:
                raise ValueError("Недостаточно средств на карте")
            txn = Transactions.objects.create(
                id=uuid.uuid4(), user_id=sender_id, type='card_transfer', status='completed',
                amount=amount, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            CardTransfers.objects.create(
                transaction=txn, sender_user_id=sender_id, receiver_user_id=receiver_card.user_id,
                sender_card_id=sender_card.id, receiver_card_id=receiver_card.id,
                amount=amount, fee_amount=fee_amount, total_amount=total_deduction
            )
            BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='sender', amount=total_deduction, type='debit')
            BalanceMovements.objects.create(transaction=txn, user_id=receiver_card.user_id, account_type='receiver', amount=amount, type='credit')
            sender_card.balance -= total_deduction
            receiver_card.balance += amount
            sender_card.save(update_fields=['balance'])
            receiver_card.save(update_fields=['balance'])
        return txn

    #TASK 4
    @staticmethod
    def execute_crypto_withdrawal(user_id: uuid.UUID, card_id: uuid.UUID, token: str, network: str, to_address: str, amount_crypto: float):
        network_fee_crypto = 1.5 
        total_crypto = amount_crypto + network_fee_crypto
        exchange_rate = 3.67
        total_aed = total_crypto * exchange_rate

        with transaction.atomic():
            card = Cards.objects.select_for_update().get(id=card_id)
            if card.balance < total_aed:
                raise ValueError("Недостаточно средств")
            card.balance -= total_aed
            card.save(update_fields=['balance'])
            txn = Transactions.objects.create(
                id=uuid.uuid4(), user_id=user_id, type='crypto_withdrawal', status='processing',
                amount=total_aed, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            withdrawal = CryptoWithdrawals.objects.create(
                transaction=txn, user_id=user_id, token=token, network=network, to_address=to_address,
                amount_crypto=amount_crypto, fee_amount=network_fee_crypto, total_debit=total_crypto
            )
            BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='sender', amount=total_aed, type='debit')
        return withdrawal

    #TASK 5
    @staticmethod
    def execute_bank_withdrawal(user_id: uuid.UUID, card_id: uuid.UUID, iban: str, beneficiary_name: str, bank_name: str, amount_aed: float):
        fee_percent = 2.00
        fee_amount = amount_aed * (fee_percent / 100)
        total_debit = amount_aed + fee_amount
        with transaction.atomic():
            card = Cards.objects.select_for_update().get(id=card_id)
            if card.balance < total_debit:
                raise ValueError("Недостаточно средств")
            card.balance -= total_debit
            card.save(update_fields=['balance'])
            txn = Transactions.objects.create(
                id=uuid.uuid4(), user_id=user_id, type='bank_withdrawal', status='processing',
                amount=amount_aed, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            withdrawal = BankWithdrawals.objects.create(
                transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
                beneficiary_bank_name=bank_name, from_card_id=card_id, amount_aed=amount_aed,
                fee_percent=fee_percent, fee_amount=fee_amount, total_debit=total_debit
            )
            BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='sender', amount=total_debit, type='debit')
        return withdrawal