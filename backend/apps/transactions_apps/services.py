from decimal import Decimal
from django.db import transaction
from .models import (
    Transactions, TopupsBank, TopupsCrypto, CardTransfers, 
    CryptoWithdrawals, BankWithdrawals, BalanceMovements,
    BankDepositAccounts, CryptoWallets
)
from apps.cards_apps.models import Cards
from django.contrib.auth.models import User
from apps.accounts_apps.models import Profiles


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
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(receiver_card.user_id),
            card=sender_card, type='card_transfer', 
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
        txn = Transactions.objects.create(
            user_id=user_id, 
            sender_id='EXTERNAL', 
            receiver_id=str(user_id),
            type='bank_topup', status='pending', amount=Decimal('0.00'), currency='AED'
        )
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
        txn = Transactions.objects.create(
            user_id=user_id, 
            sender_id='EXTERNAL',
            receiver_id=str(user_id),
            card_id=card_id, type='crypto_topup', status='pending', amount=Decimal('0.00'), currency=token
        )
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
            user_id=user_id, 
            sender_id=str(user_id),
            receiver_id='EXTERNAL',
            card=card, type='crypto_withdrawal', 
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
    def execute_bank_withdrawal(user_id, card_id=None, bank_account_id=None, iban='', beneficiary_name='', bank_name='', amount_aed=0):
        amount_aed = Decimal(str(amount_aed))

        if card_id:
            source = Cards.objects.select_for_update().get(id=card_id, user_id=str(user_id))
            source_type = source.type
        elif bank_account_id:
            source = BankDepositAccounts.objects.select_for_update().get(id=bank_account_id, user_id=str(user_id))
            source_type = 'bank'
        else:
            raise ValueError("Укажите from_card_id или from_bank_account_id")

        if source.balance < amount_aed:
            raise ValueError("Недостаточно средств")
        source.balance -= amount_aed
        source.save()
        internal_account = BankDepositAccounts.objects.filter(iban=iban).first()
        is_internal = internal_account is not None
        tx_status = 'completed' if is_internal else 'processing'
        receiver_id = str(internal_account.user_id) if is_internal else 'EXTERNAL'

        txn = Transactions.objects.create(
            user_id=user_id,
            sender_id=str(user_id),
            receiver_id=receiver_id,
            card_id=card_id,
            type='bank_withdrawal',
            status=tx_status,
            amount=amount_aed,
            currency='AED'
        )
        withdrawal = BankWithdrawals.objects.create(
            transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
            beneficiary_bank_name=bank_name, from_card_id=card_id, from_bank_account_id=bank_account_id,
            amount_aed=amount_aed, fee_amount=Decimal('0.00'), total_debit=amount_aed
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=source_type, amount=amount_aed, type='debit')

        if is_internal:
            recipient_account = BankDepositAccounts.objects.select_for_update().get(id=internal_account.id)
            recipient_account.balance += amount_aed
            recipient_account.save()
            BalanceMovements.objects.create(
                transaction=txn, user_id=recipient_account.user_id,
                account_type='bank', amount=amount_aed, type='credit'
            )

        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_card_to_crypto(sender_id, from_card_id, to_address, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        EXCHANGE_RATE = Decimal('3.67')
        
        source_card = Cards.objects.select_for_update().get(id=from_card_id, user_id=str(sender_id))
        dest_wallet = CryptoWallets.objects.select_for_update().filter(address=to_address).first()
        
        if not dest_wallet:
            raise ValueError("Кошелек получателя не найден в экосистеме EasyCard.")
            
        if source_card.balance < amount_aed:
            raise ValueError("Недостаточно средств на карте.")

        amount_usdt = (amount_aed / EXCHANGE_RATE).quantize(Decimal('0.000000'))
        
        source_card.balance -= amount_aed
        source_card.save()
        dest_wallet.balance += amount_usdt
        dest_wallet.save()

        is_internal = str(sender_id) == str(dest_wallet.user_id)
        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(dest_wallet.user_id),
            type='card_to_crypto', status='completed',
            amount=amount_aed, currency='AED', fee=Decimal('0.00'), exchange_rate=(Decimal('1.00') / EXCHANGE_RATE),
            description=f"{'Внутренний своп' if is_internal else 'Перевод пользователю'}: Карта -> Крипто"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='card', amount=amount_aed, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_wallet.user_id, account_type='crypto', amount=amount_usdt, type='credit')
        return txn, amount_aed, Decimal('0.00'), amount_usdt

    @staticmethod
    @transaction.atomic
    def execute_crypto_to_card(sender_id, from_wallet_id, to_card_number, amount_usdt):
        amount_usdt = Decimal(str(amount_usdt))
        EXCHANGE_RATE = Decimal('3.67')
        CRYPTO_FEE = Decimal('1.00') 
        
        source_wallet = CryptoWallets.objects.select_for_update().get(id=from_wallet_id, user_id=str(sender_id))
        dest_card = Cards.objects.select_for_update().filter(card_number_encrypted=to_card_number).first()
        
        if not dest_card:
            raise ValueError("Карта получателя не найдена в системе.")

        total_deduction = amount_usdt + CRYPTO_FEE
        if source_wallet.balance < total_deduction:
            raise ValueError(f"Недостаточно средств. Необходимо: {total_deduction} USDT")

        amount_aed = (amount_usdt * EXCHANGE_RATE).quantize(Decimal('0.00'))
        source_wallet.balance -= total_deduction
        source_wallet.save()
        dest_card.balance += amount_aed
        dest_card.save()
        is_internal = str(sender_id) == str(dest_card.user_id)
        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(dest_card.user_id),
            type='crypto_to_card', status='completed',
            amount=amount_usdt, currency='USDT', fee=CRYPTO_FEE, exchange_rate=EXCHANGE_RATE,
            recipient_card=to_card_number,
            description=f"{'Внутренний своп' if is_internal else 'Перевод пользователю'}: Крипто -> Карта"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='crypto', amount=total_deduction, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_card.user_id, account_type='card', amount=amount_aed, type='credit')
        return txn, total_deduction, CRYPTO_FEE, amount_aed

    @staticmethod
    @transaction.atomic
    def execute_bank_to_crypto(sender_id, from_bank_id, to_address, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        EXCHANGE_RATE = Decimal('3.67')
        
        source_bank = BankDepositAccounts.objects.select_for_update().get(id=from_bank_id, user_id=str(sender_id))
        dest_wallet = CryptoWallets.objects.select_for_update().filter(address=to_address).first()
        
        if not dest_wallet:
            raise ValueError("Кошелек получателя не найден.")
            
        if source_bank.balance < amount_aed:
            raise ValueError("Недостаточно средств на банковском счете.")
        amount_usdt = (amount_aed / EXCHANGE_RATE).quantize(Decimal('0.000000'))
        source_bank.balance -= amount_aed
        source_bank.save()
        dest_wallet.balance += amount_usdt
        dest_wallet.save()
        is_internal = str(sender_id) == str(dest_wallet.user_id)
        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(dest_wallet.user_id),
            type='bank_to_crypto', status='completed',
            amount=amount_aed, currency='AED', fee=Decimal('0.00'), exchange_rate=(Decimal('1.00') / EXCHANGE_RATE),
            description=f"{'Внутренний своп' if is_internal else 'Перевод пользователю'}: Банк -> Крипто"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='bank', amount=amount_aed, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_wallet.user_id, account_type='crypto', amount=amount_usdt, type='credit')
        return txn, amount_aed, Decimal('0.00'), amount_usdt

    @staticmethod
    @transaction.atomic
    def execute_crypto_to_bank(sender_id, from_wallet_id, to_iban, amount_usdt):
        amount_usdt = Decimal(str(amount_usdt))
        EXCHANGE_RATE = Decimal('3.67')
        CRYPTO_FEE = Decimal('1.00') 
        
        source_wallet = CryptoWallets.objects.select_for_update().get(id=from_wallet_id, user_id=str(sender_id))
        dest_bank = BankDepositAccounts.objects.select_for_update().filter(iban=to_iban).first()
        
        if not dest_bank:
            raise ValueError("Банковский счет получателя не найден.")

        total_deduction = amount_usdt + CRYPTO_FEE
        if source_wallet.balance < total_deduction:
            raise ValueError(f"Недостаточно средств. Необходимо: {total_deduction} USDT")
        amount_aed = (amount_usdt * EXCHANGE_RATE).quantize(Decimal('0.00'))  
        source_wallet.balance -= total_deduction
        source_wallet.save()
        dest_bank.balance += amount_aed
        dest_bank.save()
        is_internal = str(sender_id) == str(dest_bank.user_id)
        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(dest_bank.user_id),
            type='crypto_to_bank', status='completed',
            amount=amount_usdt, currency='USDT', fee=CRYPTO_FEE, exchange_rate=EXCHANGE_RATE,
            description=f"{'Внутренний своп' if is_internal else 'Перевод пользователю'}: Крипто -> Банк"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='crypto', amount=total_deduction, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_bank.user_id, account_type='bank', amount=amount_aed, type='credit')
        return txn, total_deduction, CRYPTO_FEE, amount_aed
        
    @staticmethod
    @transaction.atomic
    def execute_card_to_bank(sender_id, from_card_id, to_iban, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        source_card = Cards.objects.select_for_update().get(id=from_card_id, user_id=str(sender_id))
        dest_bank = BankDepositAccounts.objects.select_for_update().filter(iban=to_iban).first()
        if not dest_bank:
            raise ValueError("IBAN получателя не найден в системе.")
        if source_card.balance < amount_aed:
            raise ValueError("Недостаточно средств на карте.")
        source_card.balance -= amount_aed
        source_card.save()
        dest_bank.balance += amount_aed
        dest_bank.save()
        is_internal = str(sender_id) == str(dest_bank.user_id)
        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(dest_bank.user_id),
            type='card_to_bank', status='completed', amount=amount_aed, currency='AED',
            description=f"{'Внутренний своп' if is_internal else 'Перевод пользователю'}: Карта -> Банк"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='card', amount=amount_aed, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_bank.user_id, account_type='bank', amount=amount_aed, type='credit')
        return txn, amount_aed, Decimal('0.00'), amount_aed

    @staticmethod
    @transaction.atomic
    def execute_bank_to_card_transfer(user_id, from_bank_account_id, receiver_card_number, amount):
        amount = Decimal(str(amount))
        FEE_PERCENT = Decimal('0.02')

        bank_account = BankDepositAccounts.objects.select_for_update().get(id=from_bank_account_id, user_id=str(user_id))
        receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number)

        fee = (amount * FEE_PERCENT).quantize(Decimal('0.01'))
        total_debit = amount + fee

        if bank_account.balance < total_debit:
            raise ValueError(f"Недостаточно средств. Нужно: {total_debit} AED")

        bank_account.balance -= total_debit
        bank_account.save()
        receiver_card.balance += amount
        receiver_card.save()
        txn = Transactions.objects.create(
            user_id=user_id,
            sender_id=str(user_id),
            receiver_id=str(receiver_card.user_id),
            type='transfer_out', status='completed', amount=amount, currency='AED', fee=fee,
            recipient_card=receiver_card_number,
            description=f"Перевод с IBAN на карту {receiver_card_number[-4:]}"
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='bank', amount=total_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=receiver_card.user_id, account_type=receiver_card.type, amount=amount, type='credit')
        return txn, fee, total_debit

    @staticmethod
    def get_transaction_receipt(transaction_id):
        txn = Transactions.objects.get(id=transaction_id)
        receipt = {
            "transaction_id": str(txn.id),
            "type": txn.type,
            "status": txn.status,
            "date_time": txn.created_at.isoformat() if txn.created_at else None,
            "amount": float(txn.amount),
            "currency": txn.currency,
            "fee": float(txn.fee) if txn.fee else 0,
            "exchange_rate": float(txn.exchange_rate) if txn.exchange_rate else None,
            "original_amount": float(txn.original_amount) if txn.original_amount else None,
            "original_currency": txn.original_currency,
            "description": txn.description,
            "merchant_name": txn.merchant_name,
            "merchant_category": txn.merchant_category,
            "reference_id": txn.reference_id,
            "card_id": str(txn.card_id) if txn.card_id else None,
            "user_id": txn.user_id,
        }
        def mask_card(num):
            if not num:
                return None
            return f"**** {num[-4:]}" if len(num) >= 4 else num
        def mask_iban(iban):
            if not iban:
                return None
            return f"{iban[:4]} **** {iban[-4:]}" if len(iban) >= 8 else iban
        def mask_address(addr):
            if not addr:
                return None
            return f"{addr[:5]}...{addr[-5:]}" if len(addr) > 12 else addr
        def get_user_name(uid):
            try:
                u = User.objects.get(id=int(uid) if str(uid).isdigit() else uid)
                return f"{u.first_name or ''} {u.last_name or ''}".strip() or "Unknown"
            except Exception:
                return None
        tx_type = txn.type
        if tx_type == 'card_transfer':
            receipt["operation"] = "Card Transfer"
            receipt["sender_card_mask"] = mask_card(txn.sender_card)
            receipt["receiver_card_mask"] = mask_card(txn.recipient_card)
            try:
                ct = txn.card_transfer
                receipt["sender_name"] = get_user_name(ct.sender_user_id)
                receipt["recipient_name"] = get_user_name(ct.receiver_user_id)
                receipt["fee_amount"] = float(ct.fee_amount)
                receipt["total_amount"] = float(ct.total_amount)
            except Exception:
                receipt["sender_name"] = txn.sender_name
                receipt["recipient_name"] = None
        elif tx_type == 'bank_topup':
            receipt["operation"] = "Bank Top Up"
            try:
                bt = txn.bank_topup
                receipt["transfer_rail"] = bt.transfer_rail
                receipt["reference_value"] = bt.reference_value
                receipt["sender_name"] = bt.sender_name
                receipt["sender_bank"] = bt.sender_bank
                receipt["sender_iban_mask"] = mask_iban(bt.sender_iban)
                receipt["instructions"] = bt.instructions_snapshot
                if bt.deposit_account:
                    receipt["deposit_iban_mask"] = mask_iban(bt.deposit_account.iban)
                    receipt["deposit_bank_name"] = bt.deposit_account.bank_name
                    receipt["deposit_beneficiary"] = bt.deposit_account.beneficiary
            except Exception:
                pass
        elif tx_type == 'crypto_topup':
            receipt["operation"] = "Crypto Top Up"
            try:
                ct = txn.crypto_topup
                receipt["token"] = ct.token
                receipt["network"] = ct.network
                receipt["network_and_token"] = f"{ct.network} / {ct.token}"
                receipt["deposit_address_mask"] = mask_address(ct.deposit_address)
                receipt["from_address_mask"] = mask_address(ct.from_address)
                receipt["amount_crypto"] = float(ct.amount_crypto) if ct.amount_crypto else None
                receipt["tx_hash"] = ct.tx_hash
                receipt["credited_amount_aed"] = float(ct.credited_amount_aed) if ct.credited_amount_aed else None
            except Exception:
                pass
        elif tx_type == 'bank_withdrawal':
            receipt["operation"] = "Bank Transfer"
            try:
                bw = txn.bank_withdrawal
                receipt["beneficiary_name"] = bw.beneficiary_name
                receipt["beneficiary_bank_name"] = bw.beneficiary_bank_name
                receipt["iban_mask"] = mask_iban(bw.beneficiary_iban)
                receipt["beneficiary_iban"] = bw.beneficiary_iban
                receipt["amount_aed"] = float(bw.amount_aed)
                receipt["fee_amount"] = float(bw.fee_amount)
                receipt["total_debit_aed"] = float(bw.total_debit)
                receipt["from_card_id"] = str(bw.from_card_id) if bw.from_card_id else None
                receipt["from_bank_account_id"] = str(bw.from_bank_account_id) if bw.from_bank_account_id else None
            except Exception:
                pass
        elif tx_type == 'crypto_withdrawal':
            receipt["operation"] = "Crypto Withdrawal"
            try:
                cw = txn.crypto_withdrawal
                receipt["token"] = cw.token
                receipt["network"] = cw.network
                receipt["network_and_token"] = f"{cw.network} / {cw.token}"
                receipt["to_address_mask"] = mask_address(cw.to_address)
                receipt["to_address"] = cw.to_address
                receipt["amount_crypto"] = float(cw.amount_crypto)
                receipt["fee_amount"] = float(cw.fee_amount)
                receipt["fee_type"] = cw.fee_type
                receipt["total_debit"] = float(cw.total_debit)
                receipt["tx_hash"] = cw.tx_hash
            except Exception:
                pass
        elif tx_type in ['card_to_crypto', 'crypto_to_card', 'bank_to_crypto', 'crypto_to_bank', 'card_to_bank']:
            receipt["operation"] = "Internal/System Transfer"
        elif tx_type == 'transfer_out':
            receipt["operation"] = "IBAN to Card Transfer"
            receipt["receiver_card_mask"] = mask_card(txn.recipient_card)
        elif tx_type == 'card_activation':
            receipt["operation"] = "Card Activation"
        elif tx_type == 'card_payment':
            receipt["operation"] = "Card Payment"
        else:
            receipt["operation"] = txn.type.replace('_', ' ').title()
        movements = txn.movements.all()
        if movements.exists():
            receipt["movements"] = [{
                "account_type": m.account_type,
                "amount": float(m.amount),
                "type": m.type,
            } for m in movements]

        return receipt