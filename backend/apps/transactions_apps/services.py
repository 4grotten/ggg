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
        if sender_card.card_number_encrypted == receiver_card_number:
            raise ValueError("Ошибка: Нельзя перевести средства на ту же самую карту.")
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
        card = Cards.objects.select_for_update().get(id=card_id, user_id=str(user_id))
        if card.balance < amount_crypto:
            raise ValueError("Недостаточно средств на выбранной карте")
        itog = amount_crypto * Decimal('3.67')
        card.balance -= itog
        card.save()
        txn = Transactions.objects.create(
            user_id=user_id, card=card, type='crypto_withdrawal', 
            status='processing', amount=amount_crypto, currency=token
        )
        withdrawal = CryptoWithdrawals.objects.create(
            transaction=txn, user_id=user_id, token=token, network=network,
            to_address=to_address, amount_crypto=amount_crypto, fee_amount=Decimal('1.00'),
            fee_type='network', total_debit=amount_crypto + Decimal('1.00')
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=card.type, amount=amount_crypto, type='debit')
        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_bank_withdrawal(user_id, card_id, iban, beneficiary_name, bank_name, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        card = Cards.objects.select_for_update().get(id=card_id, user_id=str(user_id))

        if card.balance < amount_aed:
            raise ValueError("Недостаточно средств на выбранной карте")
        card.balance -= amount_aed
        card.save()
        txn = Transactions.objects.create(
            user_id=user_id, card=card, type='bank_withdrawal', 
            status='processing', amount=amount_aed, currency='AED'
        )
        withdrawal = BankWithdrawals.objects.create(
            transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
            beneficiary_bank_name=bank_name, from_card_id=card.id, amount_aed=amount_aed,
            fee_amount=Decimal('0.00'), total_debit=amount_aed
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=card.type, amount=amount_aed, type='debit')
        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_internal_transfer(user_id, from_type, from_id, to_type, to_id, amount):
        amount = Decimal(str(amount))
        EXCHANGE_RATE_USDT_AED = Decimal('3.67')
        CRYPTO_FEE_USDT = Decimal('1.00')
        if from_type == 'card':
            source = Cards.objects.select_for_update().get(id=from_id, user_id=str(user_id))
            source_currency = 'AED'
        elif from_type == 'bank':
            source = BankDepositAccounts.objects.select_for_update().get(id=from_id, user_id=str(user_id))
            source_currency = 'AED'
        elif from_type == 'crypto':
            source = CryptoWallets.objects.select_for_update().get(id=from_id, user_id=str(user_id))
            source_currency = 'USDT'
        else:
            raise ValueError("Неверный тип счета отправителя. Доступно: card, bank, crypto")
        if to_type == 'card':
            dest = Cards.objects.select_for_update().get(id=to_id, user_id=str(user_id))
            dest_currency = 'AED'
        elif to_type == 'bank':
            dest = BankDepositAccounts.objects.select_for_update().get(id=to_id, user_id=str(user_id))
            dest_currency = 'AED'
        elif to_type == 'crypto':
            dest = CryptoWallets.objects.select_for_update().get(id=to_id, user_id=str(user_id))
            dest_currency = 'USDT'
        else:
            raise ValueError("Неверный тип счета получателя. Доступно: card, bank, crypto")
        if from_id == to_id:
            raise ValueError("Нельзя перевести деньги на тот же самый счет.")
        fee = Decimal('0.00')
        if source_currency == 'USDT':
            fee = CRYPTO_FEE_USDT
        total_deduction = amount + fee
        if source.balance < total_deduction:
            raise ValueError(f"Недостаточно средств. Нужно: {total_deduction} {source_currency} (включая комиссию {fee})")
        if source_currency == dest_currency:
            converted_amount = amount
            exchange_rate = Decimal('1.00')
        elif source_currency == 'USDT' and dest_currency == 'AED':
            converted_amount = amount * EXCHANGE_RATE_USDT_AED
            exchange_rate = EXCHANGE_RATE_USDT_AED
        elif source_currency == 'AED' and dest_currency == 'USDT':
            converted_amount = amount / EXCHANGE_RATE_USDT_AED
            exchange_rate = Decimal('1.00') / EXCHANGE_RATE_USDT_AED
            converted_amount = converted_amount.quantize(Decimal('0.000000'))
        source.balance -= total_deduction
        source.save()
        dest.balance += converted_amount
        dest.save()
        txn = Transactions.objects.create(
            user_id=user_id,
            type='internal_transfer',
            status='completed',
            amount=amount,
            currency=source_currency,
            fee=fee,
            exchange_rate=exchange_rate,
            description=f"Внутренний перевод: {from_type} -> {to_type}"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=from_type, amount=total_deduction, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=to_type, amount=converted_amount, type='credit')
        return txn, converted_amount, fee
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