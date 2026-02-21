from decimal import Decimal
from django.db import transaction
from .models import (
    Transactions, TopupsBank, TopupsCrypto, CardTransfers, 
    CryptoWithdrawals, BankWithdrawals, BalanceMovements,
    BankDepositAccounts, CryptoWallets
)
from apps.cards_apps.models import Cards

class TransactionService:
    @staticmethod
    @transaction.atomic
    def execute_card_transfer(sender_id, sender_card_id, receiver_card_number, amount):
        amount = Decimal(str(amount))
        sender_card = Cards.objects.select_for_update().get(id=sender_card_id, user_id=sender_id)
        receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number)
        if sender_card.balance < amount:
            raise ValueError("Недостаточно средств на карте")
        sender_card.balance -= amount
        sender_card.save()
        receiver_card.balance += amount
        receiver_card.save()
        txn = Transactions.objects.create(
            user_id=sender_id, card=sender_card, type='card_transfer', 
            status='completed', amount=amount, currency='AED',
            recipient_card=receiver_card_number, sender_card=sender_card.card_number_encrypted
        )
        CardTransfers.objects.create(
            transaction=txn, sender_user_id=sender_id, receiver_user_id=receiver_card.user_id,
            sender_card_id=sender_card.id, receiver_card_id=receiver_card.id, amount=amount, total_amount=amount
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type=sender_card.type, amount=amount, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=receiver_card.user_id, account_type=receiver_card.type, amount=amount, type='credit')
        return txn

    @staticmethod
    def initiate_bank_topup(user_id, transfer_rail):
        bank_account = BankDepositAccounts.objects.filter(user_id=str(user_id), is_active=True).first()
        if not bank_account:
            raise ValueError("У пользователя нет активного банковского счета")
        txn = Transactions.objects.create(user_id=user_id, type='bank_topup', status='pending', amount=Decimal('0.00'), currency='AED')
        topup = TopupsBank.objects.create(
            transaction=txn, user_id=user_id, transfer_rail=transfer_rail,
            deposit_account=bank_account, reference_value=f"REF-{txn.id}",
            instructions_snapshot={
                "bank_name": bank_account.bank_name,
                "iban": bank_account.iban,
                "beneficiary": bank_account.beneficiary,
                "reference": f"REF-{txn.id}"
            }
        )
        return topup

    @staticmethod
    def initiate_crypto_topup(user_id, card_id, token, network):
        crypto_wallet = CryptoWallets.objects.filter(user_id=str(user_id), token=token, network=network).first()
        if not crypto_wallet:
            raise ValueError(f"Криптокошелек для {token} {network} не найден")
        txn = Transactions.objects.create(user_id=user_id, card_id=card_id, type='crypto_topup', status='pending', amount=Decimal('0.00'), currency=token)
        topup = TopupsCrypto.objects.create(
            transaction=txn, user_id=user_id, card_id=card_id, token=token, network=network,
            deposit_address=crypto_wallet.address,
            address_provider="easycard_internal",
            qr_payload=f"{token.lower()}:{crypto_wallet.address}",
            min_amount=Decimal('10.00')
        )
        return topup

    @staticmethod
    @transaction.atomic
    def execute_crypto_withdrawal(user_id, card_id, token, network, to_address, amount_crypto):
        amount_crypto = Decimal(str(amount_crypto))
        wallet = CryptoWallets.objects.select_for_update().get(user_id=str(user_id), token=token, network=network)
        if wallet.balance < amount_crypto:
            raise ValueError("Недостаточно средств на USDT кошельке")
        wallet.balance -= amount_crypto
        wallet.save()
        txn = Transactions.objects.create(user_id=user_id, type='crypto_withdrawal', status='processing', amount=amount_crypto, currency=token)
        withdrawal = CryptoWithdrawals.objects.create(
            transaction=txn, user_id=user_id, token=token, network=network,
            to_address=to_address, amount_crypto=amount_crypto, fee_amount=Decimal('1.00'),
            fee_type='network', total_debit=amount_crypto + Decimal('1.00')
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='crypto', amount=amount_crypto, type='debit')
        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_bank_withdrawal(user_id, card_id, iban, beneficiary_name, bank_name, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        bank_acc = BankDepositAccounts.objects.select_for_update().get(user_id=str(user_id))
        if bank_acc.balance < amount_aed:
            raise ValueError("Недостаточно средств на банковском счете")
        bank_acc.balance -= amount_aed
        bank_acc.save()
        txn = Transactions.objects.create(user_id=user_id, type='bank_withdrawal', status='processing', amount=amount_aed, currency='AED')
        withdrawal = BankWithdrawals.objects.create(
            transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
            beneficiary_bank_name=bank_name, from_card_id=card_id, amount_aed=amount_aed,
            fee_amount=Decimal('0.00'), total_debit=amount_aed
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='bank', amount=amount_aed, type='debit')
        return withdrawal
    @staticmethod
    def get_transaction_receipt(transaction_id):
        txn = Transactions.objects.get(id=transaction_id)
        return {
            "transaction_id": txn.id,
            "type": txn.type,
            "amount": txn.amount,
            "status": txn.status,
            "created_at": txn.created_at
        }