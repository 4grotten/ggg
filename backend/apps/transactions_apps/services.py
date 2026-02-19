from django.db import transaction
from django.utils import timezone
from decimal import Decimal
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
                id=uuid.uuid4(), 
                user_id=user_id, 
                type='top_up',
                status='pending',
                amount=Decimal('0.00'), currency='AED', created_at=timezone.now(), updated_at=timezone.now()
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
        deposit_address = f"0x{uuid.uuid4().hex}"
        with transaction.atomic():
            txn = Transactions.objects.create(
                id=uuid.uuid4(), 
                user_id=user_id, 
                type='top_up',
                status='pending',
                amount=Decimal('0.00'), currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            topup = TopupsCrypto.objects.create(
                transaction=txn, user_id=user_id, card_id=card_id, token=token,
                network=network, deposit_address=deposit_address, address_provider='internal',
                qr_payload=f"{token}:{deposit_address}", min_amount=Decimal('10.00'), fee_percent=Decimal('1.50')
            )
        return topup

    #TASK 3
    @staticmethod
    def execute_card_transfer(sender_id: uuid.UUID, sender_card_id: uuid.UUID, receiver_card_number: str, amount: Decimal):
        fee_amount = Decimal('0.00')
        total_deduction = amount + fee_amount
        with transaction.atomic():
            try:
                sender_card = Cards.objects.select_for_update().get(id=sender_card_id)
            except Cards.DoesNotExist:
                raise ValueError("Карта отправителя не найдена в системе.")
            try:
                receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number, status='active')
            except Cards.DoesNotExist:
                raise ValueError("Активная карта получателя с таким номером не найдена.")
            if sender_card.balance < total_deduction:
                raise ValueError("Недостаточно средств на карте для перевода.")
            txn = Transactions.objects.create(
                id=uuid.uuid4(), 
                user_id=sender_id, 
                type='transfer_out',
                status='completed',
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
    def execute_crypto_withdrawal(user_id: uuid.UUID, card_id: uuid.UUID, token: str, network: str, to_address: str, amount_crypto: Decimal):
        network_fee_crypto = Decimal('1.50')
        total_crypto = amount_crypto + network_fee_crypto
        exchange_rate = Decimal('3.67')
        total_aed = total_crypto * exchange_rate
        with transaction.atomic():
            try:
                card = Cards.objects.select_for_update().get(id=card_id)
            except Cards.DoesNotExist:
                raise ValueError("Указанная карта для списания не найдена.")
            if card.balance < total_aed:
                raise ValueError(f"Недостаточно средств. Необходимо: {total_aed} AED (включая комиссию сети).")
            card.balance -= total_aed
            card.save(update_fields=['balance'])

            txn = Transactions.objects.create(
                id=uuid.uuid4(), 
                user_id=user_id, 
                type='withdrawal',
                status='pending',
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
    def execute_bank_withdrawal(user_id: uuid.UUID, card_id: uuid.UUID, iban: str, beneficiary_name: str, bank_name: str, amount_aed: Decimal):
        fee_percent = Decimal('2.00')
        fee_amount = amount_aed * (fee_percent / Decimal('100.00'))
        total_debit = amount_aed + fee_amount
        with transaction.atomic():
            try:
                card = Cards.objects.select_for_update().get(id=card_id)
            except Cards.DoesNotExist:
                raise ValueError("Указанная карта для списания не найдена.")
            if card.balance < total_debit:
                raise ValueError("Недостаточно средств для банковского перевода (с учетом комиссии 2%).")
            card.balance -= total_debit
            card.save(update_fields=['balance'])
            txn = Transactions.objects.create(
                id=uuid.uuid4(), 
                user_id=user_id, 
                type='withdrawal',
                status='pending',
                amount=amount_aed, currency='AED', created_at=timezone.now(), updated_at=timezone.now()
            )
            withdrawal = BankWithdrawals.objects.create(
                transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
                beneficiary_bank_name=bank_name, from_card_id=card_id, amount_aed=amount_aed,
                fee_percent=fee_percent, fee_amount=fee_amount, total_debit=total_debit
            )
            BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='sender', amount=total_debit, type='debit')
        return withdrawal
    

    @staticmethod
    def get_transaction_receipt(transaction_id: uuid.UUID) -> dict:
        try:
            txn = Transactions.objects.select_related(
                'bank_topup', 'crypto_topup', 'card_transfer', 
                'crypto_withdrawal', 'bank_withdrawal'
            ).get(id=transaction_id)
        except Transactions.DoesNotExist:
            raise ValueError("Транзакция не найдена")

        base_receipt = {
            "transaction_id": txn.id,
            "status": txn.status,
            "date_time": txn.created_at,
            "type": txn.type
        }
        if hasattr(txn, 'bank_topup'):
            topup = txn.bank_topup
            base_receipt.update({
                "operation": "Bank Topup",
                "amount": txn.amount,
                "sender_name": topup.sender_name,
                "sender_bank": topup.sender_bank,
                "sender_iban": topup.sender_iban,
                "credited_card_id": topup.credited_card_id
            })
            return base_receipt
        if hasattr(txn, 'crypto_topup'):
            topup = txn.crypto_topup
            base_receipt.update({
                "operation": "Crypto Topup",
                "credited_amount_aed": txn.amount,
                "network": topup.network,
                "token": topup.token,
                "sender_address": topup.from_address,
                "credited_card_id": topup.card_id,
                "exchange_rate": topup.exchange_rate,
                "fee_amount": topup.fee_amount
            })
            return base_receipt
        if hasattr(txn, 'card_transfer'):
            transfer = txn.card_transfer
            sender_mask = "Неизвестно"
            receiver_mask = "Неизвестно"
            try:
                s_card = Cards.objects.get(id=transfer.sender_card_id)
                sender_mask = f"**** {s_card.last_four_digits}" if s_card.last_four_digits else "****"
                
                r_card = Cards.objects.get(id=transfer.receiver_card_id)
                receiver_mask = f"**** {r_card.last_four_digits}" if r_card.last_four_digits else "****"
            except Cards.DoesNotExist:
                pass
            base_receipt.update({
                "operation": "Internal Card Transfer",
                "amount": transfer.amount,
                "fee": transfer.fee_amount,
                "sender_card_mask": sender_mask,
                "receiver_card_mask": receiver_mask,
                "recipient_name": "EasyCard User",
            })
            return base_receipt
        if hasattr(txn, 'crypto_withdrawal'):
            withdrawal = txn.crypto_withdrawal
            addr = withdrawal.to_address
            address_mask = f"{addr[:6]}...{addr[-4:]}" if addr and len(addr) > 10 else addr
            base_receipt.update({
                "operation": "Crypto Withdrawal",
                "to_address_mask": address_mask,
                "network_and_token": f"{withdrawal.token} ({withdrawal.network})",
                "amount_crypto": withdrawal.amount_crypto,
                "fee": withdrawal.fee_amount,
                "tx_hash": withdrawal.tx_hash
            })
            return base_receipt
        if hasattr(txn, 'bank_withdrawal'):
            withdrawal = txn.bank_withdrawal
            iban = withdrawal.beneficiary_iban
            iban_mask = f"{iban[:4]}...{iban[-4:]}" if iban and len(iban) > 8 else iban
            card_mask = "****"
            try:
                c = Cards.objects.get(id=withdrawal.from_card_id)
                card_mask = f"**** {c.last_four_digits}" if c.last_four_digits else "****"
            except Cards.DoesNotExist:
                pass
            base_receipt.update({
                "operation": "Bank Wire Withdrawal",
                "recipient_name": withdrawal.beneficiary_name,
                "iban_mask": iban_mask,
                "bank_name": withdrawal.beneficiary_bank_name,
                "from_card_mask": card_mask,
                "amount": withdrawal.amount_aed,
                "fee": withdrawal.fee_amount,
                "total_debit": withdrawal.total_debit
            })
            return base_receipt
        return base_receipt