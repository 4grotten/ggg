from django.utils import timezone
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from .models import (
    Transactions, TopupsBank, TopupsCrypto, CardTransfers, 
    CryptoWithdrawals, BankWithdrawals, BalanceMovements,
    BankDepositAccounts, CryptoWallets, FeeRevenue
)
from apps.cards_apps.models import Cards
from django.contrib.auth.models import User
from apps.accounts_apps.models import AdminSettings, Profiles


class SettingsManager:
    @staticmethod
    def get_setting(category, key, default_value, user_id=None):
        if user_id:
            profile = Profiles.objects.filter(user_id=str(user_id)).first()
            if profile and profile.custom_settings_enabled:
                mapping = {
                    ('limits', 'transfer_min'): profile.transfer_min,
                    ('limits', 'transfer_max'): profile.transfer_max,
                    ('limits', 'daily_transfer_limit'): profile.daily_transfer_limit,
                    ('limits', 'monthly_transfer_limit'): profile.monthly_transfer_limit,
                    ('limits', 'withdrawal_min'): profile.withdrawal_min,
                    ('limits', 'withdrawal_max'): profile.withdrawal_max,
                    ('limits', 'daily_withdrawal_limit'): profile.daily_withdrawal_limit,
                    ('limits', 'monthly_withdrawal_limit'): profile.monthly_withdrawal_limit,
                    ('fees', 'card_to_card_percent'): profile.card_to_card_percent,
                    ('fees', 'bank_transfer_percent'): profile.bank_transfer_percent,
                    ('fees', 'network_fee_percent'): profile.network_fee_percent,
                    ('fees', 'currency_conversion_percent'): profile.currency_conversion_percent,
                }
                val = mapping.get((category, key))
                if val is not None:
                    return Decimal(str(val))
        setting = AdminSettings.objects.filter(category=category, key=key).first()
        return setting.value if setting else Decimal(str(default_value))

    @staticmethod
    def check_limits(user_id, amount, operation_type):
        amount = Decimal(str(amount))
        today = timezone.now().date()
        this_month = today.replace(day=1)
        min_limit = SettingsManager.get_setting('limits', f'{operation_type}_min', 0, user_id)
        max_limit = SettingsManager.get_setting('limits', f'{operation_type}_max', 9999999, user_id)
        daily_limit = SettingsManager.get_setting('limits', f'daily_{operation_type}_limit', 9999999, user_id)
        monthly_limit = SettingsManager.get_setting('limits', f'monthly_{operation_type}_limit', 9999999, user_id)

        if amount < min_limit:
            raise ValueError(f"Сумма ниже минимального лимита ({min_limit})")
        if amount > max_limit:
            raise ValueError(f"Сумма превышает максимальный лимит операции ({max_limit})")
            
        base_query = Transactions.objects.filter(status__in=['completed', 'processing', 'pending'])
        
        # Обновлено под строгие типы Рината
        if operation_type == 'transfer':
            base_query = base_query.filter(
                sender_id=str(user_id), 
                type__in=['card_transfer', 'internal_transfer', 'iban_to_card', 'crypto_to_card', 'crypto_to_crypto']
            )
        elif operation_type == 'withdrawal':
            base_query = base_query.filter(
                sender_id=str(user_id), 
                type__in=['crypto_withdrawal', 'bank_withdrawal', 'iban_to_iban', 'crypto_to_iban', 'transfer_out']
            )
        elif operation_type == 'top_up':
            base_query = base_query.filter(
                receiver_id=str(user_id),
                type__in=['top_up', 'crypto_deposit']
            )

        daily_sum = base_query.filter(created_at__date=today).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        if daily_sum + amount > daily_limit:
            raise ValueError(f"Превышен дневной лимит ({daily_limit}). Доступно: {daily_limit - daily_sum}")

        monthly_sum = base_query.filter(created_at__date__gte=this_month).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        if monthly_sum + amount > monthly_limit:
            raise ValueError(f"Превышен месячный лимит ({monthly_limit}). Доступно: {monthly_limit - monthly_sum}")


class TransactionService:

    @staticmethod
    def _get_user_full_name(uid):
        if not uid or str(uid) == 'EXTERNAL':
            return "External"
        profile = Profiles.objects.filter(user_id=str(uid)).first()
        if profile and (profile.first_name or profile.last_name):
            return f"{profile.first_name or ''} {profile.last_name or ''}".strip()
        try:
            u = User.objects.get(id=int(uid) if str(uid).isdigit() else uid)
            name = f"{u.first_name or ''} {u.last_name or ''}".strip()
            return name if name else u.username
        except Exception:
            return "Unknown User"

    @staticmethod
    def _mask_card(num):
        if not num: return None
        return f"**** {num[-4:]}" if len(num) >= 4 else num

    @staticmethod
    def _mask_iban(iban):
        if not iban: return None
        return f"{iban[:4]} **** {iban[-4:]}" if len(iban) >= 8 else iban

    @staticmethod
    def _mask_address(addr):
        if not addr: return None
        return f"{addr[:5]}...{addr[-5:]}" if len(addr) > 12 else addr

    @staticmethod
    @transaction.atomic
    def execute_card_transfer(sender_id, sender_card_id, receiver_card_number, amount):
        amount = Decimal(str(amount))
        SettingsManager.check_limits(sender_id, amount, 'transfer')

        fee_percent = SettingsManager.get_setting('fees', 'card_to_card_percent', Decimal('1.0'))
        fee_amount = (amount * fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_debit = amount + fee_amount

        sender_card = Cards.objects.select_for_update().get(id=sender_card_id, user_id=sender_id)
        if sender_card.card_number_encrypted == receiver_card_number:
            raise ValueError("Ошибка: Нельзя перевести средства на ту же самую карту.")
        receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number)
        
        if sender_card.balance < total_debit:
            raise ValueError(f"Недостаточно средств. Необходимо: {total_debit} AED")
            
        sender_card.balance -= total_debit
        sender_card.save()
        receiver_card.balance += amount
        receiver_card.save()
        
        tx_type = 'internal_transfer' if str(sender_id) == str(receiver_card.user_id) else 'card_transfer'
        metadata = {
            "sender_card_mask": TransactionService._mask_card(sender_card.card_number_encrypted),
            "receiver_card_mask": TransactionService._mask_card(receiver_card_number)
        }

        txn = Transactions.objects.create(
            user_id=sender_id, 
            sender_id=str(sender_id),
            receiver_id=str(receiver_card.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id),
            receiver_name=TransactionService._get_user_full_name(receiver_card.user_id),
            card=sender_card, type=tx_type, 
            status='completed', amount=amount, currency='AED',
            fee=fee_amount, metadata=metadata,
            recipient_card=receiver_card_number, sender_card=sender_card.card_number_encrypted
        )
        CardTransfers.objects.create(
            transaction=txn, sender_user_id=sender_id, receiver_user_id=receiver_card.user_id,
            sender_card_id=sender_card.id, receiver_card_id=receiver_card.id, amount=amount, 
            fee_percent=fee_percent, fee_amount=fee_amount, total_amount=total_debit
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type=sender_card.type, amount=total_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=receiver_card.user_id, account_type=receiver_card.type, amount=amount, type='credit')

        if fee_amount > 0:
            FeeRevenue.objects.create(
                transaction=txn, user_id=str(sender_id), fee_type='card_transfer', 
                fee_amount=fee_amount, fee_percent=fee_percent, base_amount=amount, 
                base_currency='AED', card_id=sender_card.id, description=f"Комиссия {fee_percent}% за перевод"
            )
        return txn

    @staticmethod
    def initiate_bank_topup(user_id, transfer_rail):
        bank_account = BankDepositAccounts.objects.filter(user_id=str(user_id), is_active=True).first()
        if not bank_account:
            raise ValueError("У пользователя нет активного банковского счета")
            
        fee_percent = SettingsManager.get_setting('fees', 'top_up_bank_percent', Decimal('2.0'))
        min_amount = SettingsManager.get_setting('limits', 'top_up_bank_min', Decimal('100.0'))

        metadata = {
            "beneficiary_bank": bank_account.bank_name,
            "beneficiary_bank_name": bank_account.bank_name,
            "beneficiary_name": bank_account.beneficiary,
            "beneficiary_iban": bank_account.iban,
            "iban_mask": TransactionService._mask_iban(bank_account.iban)
        }

        txn = Transactions.objects.create(
            user_id=user_id, sender_id='EXTERNAL', receiver_id=str(user_id),
            sender_name="Bank Transfer", receiver_name=TransactionService._get_user_full_name(user_id),
            type='top_up', status='pending', amount=Decimal('0.00'), currency='AED', metadata=metadata
        )
        topup = TopupsBank.objects.create(
            transaction=txn, user_id=user_id, transfer_rail=transfer_rail,
            deposit_account=bank_account, reference_value=f"REF-{txn.id}",
            fee_percent=fee_percent, min_amount=min_amount,
            instructions_snapshot={
                "bank_name": bank_account.bank_name,
                "iban": bank_account.iban,
                "beneficiary": bank_account.beneficiary,
                "reference": f"REF-{txn.id}",
                "fee_percent": str(fee_percent)
            }
        )
        return topup

    @staticmethod
    def initiate_crypto_topup(user_id, card_id, token, network):
        crypto_wallet = CryptoWallets.objects.filter(user_id=str(user_id), token=token, network=network).first()
        if not crypto_wallet:
            raise ValueError(f"Криптокошелек не найден")
            
        min_amount = SettingsManager.get_setting('limits', 'top_up_crypto_min', Decimal('10.00'))

        metadata = {
            "crypto_token": token,
            "crypto_network": network,
            "crypto_address": crypto_wallet.address
        }

        txn = Transactions.objects.create(
            user_id=user_id, sender_id='EXTERNAL', receiver_id=str(user_id),
            sender_name="Crypto Network", receiver_name=TransactionService._get_user_full_name(user_id),
            card_id=card_id, type='crypto_deposit', status='pending', amount=Decimal('0.00'), currency=token, metadata=metadata
        )
        topup = TopupsCrypto.objects.create(
            transaction=txn, user_id=user_id, card_id=card_id, token=token, network=network,
            deposit_address=crypto_wallet.address, address_provider="easycard_internal",
            qr_payload=f"{token.lower()}:{crypto_wallet.address}", min_amount=min_amount
        )
        return topup

    @staticmethod
    @transaction.atomic
    def execute_crypto_withdrawal(user_id, card_id, token, network, to_address, amount_crypto):
        amount_crypto = Decimal(str(amount_crypto))
        SettingsManager.check_limits(user_id, amount_crypto, 'withdrawal')

        fee_percent = SettingsManager.get_setting('fees', 'network_fee_percent', Decimal('1.0'))
        crypto_fee = (amount_crypto * fee_percent / Decimal('100')).quantize(Decimal('0.000000'))
        total_crypto_debit = amount_crypto + crypto_fee

        rate = SettingsManager.get_setting('exchange_rates', 'usdt_to_aed_sell', Decimal('3.69'))
        total_aed_debit = (total_crypto_debit * rate).quantize(Decimal('0.01'))

        card = Cards.objects.select_for_update().get(id=card_id, user_id=str(user_id))
        if card.balance < total_aed_debit:
            raise ValueError(f"Недостаточно средств. Нужно: {total_aed_debit} AED")
            
        card.balance -= total_aed_debit
        card.save()
        
        metadata = {
            "crypto_token": token,
            "crypto_network": network,
            "crypto_address": to_address,
            "sender_card_mask": TransactionService._mask_card(card.card_number_encrypted)
        }

        txn = Transactions.objects.create(
            user_id=user_id, sender_id=str(user_id), receiver_id='EXTERNAL',
            sender_name=TransactionService._get_user_full_name(user_id), receiver_name="Внешний криптокошелек",
            card=card, type='crypto_withdrawal', status='processing', amount=amount_crypto, currency=token,
            fee=crypto_fee, metadata=metadata
        )
        withdrawal = CryptoWithdrawals.objects.create(
            transaction=txn, user_id=user_id, token=token, network=network,
            to_address=to_address, amount_crypto=amount_crypto, fee_amount=crypto_fee,
            fee_type='network', total_debit=total_crypto_debit
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=card.type, amount=total_aed_debit, type='debit')

        if crypto_fee > 0:
            fee_aed = (crypto_fee * rate).quantize(Decimal('0.01'))
            FeeRevenue.objects.create(
                transaction=txn, user_id=str(user_id), fee_type='crypto_withdrawal', 
                fee_amount=fee_aed, fee_percent=fee_percent, base_amount=amount_crypto, 
                base_currency=token, card_id=card.id, description="Сетевая комиссия"
            )
        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_bank_withdrawal(user_id, card_id=None, bank_account_id=None, iban='', beneficiary_name='', bank_name='', amount_aed=0):
        amount_aed = Decimal(str(amount_aed))
        SettingsManager.check_limits(user_id, amount_aed, 'withdrawal')

        fee_percent = SettingsManager.get_setting('fees', 'bank_transfer_percent', Decimal('2.0'))
        fee_amount = (amount_aed * fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_debit = amount_aed + fee_amount

        metadata = {
            "beneficiary_name": beneficiary_name,
            "beneficiary_bank": bank_name,
            "beneficiary_bank_name": bank_name,
            "beneficiary_iban": iban,
            "iban_mask": TransactionService._mask_iban(iban)
        }

        if card_id:
            source = Cards.objects.select_for_update().get(id=card_id, user_id=str(user_id))
            source_type = source.type
            tx_type = 'bank_withdrawal'
            metadata["sender_card_mask"] = TransactionService._mask_card(source.card_number_encrypted)
        elif bank_account_id:
            source = BankDepositAccounts.objects.select_for_update().get(id=bank_account_id, user_id=str(user_id))
            source_type = 'bank'
            tx_type = 'iban_to_iban'
            metadata["sender_iban"] = source.iban
            metadata["sender_iban_mask"] = TransactionService._mask_iban(source.iban)
            metadata["sender_bank"] = source.bank_name
            metadata["sender_bank_name"] = source.bank_name
        else:
            raise ValueError("Укажите from_card_id или from_bank_account_id")

        if source.balance < total_debit:
            raise ValueError(f"Недостаточно средств. Нужно: {total_debit} AED")
            
        source.balance -= total_debit
        source.save()
        
        internal_account = BankDepositAccounts.objects.filter(iban=iban).first()
        is_internal = internal_account is not None
        tx_status = 'completed' if is_internal else 'processing'
        receiver_id = str(internal_account.user_id) if is_internal else 'EXTERNAL'

        receiver_final_name = TransactionService._get_user_full_name(internal_account.user_id) if is_internal else beneficiary_name

        txn = Transactions.objects.create(
            user_id=user_id, sender_id=str(user_id), receiver_id=receiver_id,
            sender_name=TransactionService._get_user_full_name(user_id), receiver_name=receiver_final_name,
            card_id=card_id, type=tx_type, status=tx_status, amount=amount_aed, currency='AED',
            fee=fee_amount, metadata=metadata
        )
        withdrawal = BankWithdrawals.objects.create(
            transaction=txn, user_id=user_id, beneficiary_iban=iban, beneficiary_name=beneficiary_name,
            beneficiary_bank_name=bank_name, from_card_id=card_id, from_bank_account_id=bank_account_id,
            amount_aed=amount_aed, fee_percent=fee_percent, fee_amount=fee_amount, total_debit=total_debit
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type=source_type, amount=total_debit, type='debit')

        if is_internal:
            recipient_account = BankDepositAccounts.objects.select_for_update().get(id=internal_account.id)
            recipient_account.balance += amount_aed
            recipient_account.save()
            BalanceMovements.objects.create(transaction=txn, user_id=recipient_account.user_id, account_type='bank', amount=amount_aed, type='credit')

        if fee_amount > 0:
            FeeRevenue.objects.create(transaction=txn, user_id=str(user_id), fee_type='bank_withdrawal', fee_amount=fee_amount, fee_percent=fee_percent, base_amount=amount_aed, base_currency='AED', card_id=card_id)
        return withdrawal

    @staticmethod
    @transaction.atomic
    def execute_card_to_crypto(sender_id, from_card_id, to_address, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        SettingsManager.check_limits(sender_id, amount_aed, 'transfer')

        sell_rate = SettingsManager.get_setting('exchange_rates', 'usdt_to_aed_sell', Decimal('3.69'))
        conv_fee_pct = SettingsManager.get_setting('fees', 'currency_conversion_percent', Decimal('1.0'))
        
        conv_fee_aed = (amount_aed * conv_fee_pct / Decimal('100')).quantize(Decimal('0.01'))
        total_aed_debit = amount_aed + conv_fee_aed
        amount_usdt = (amount_aed / sell_rate).quantize(Decimal('0.000000'))
        
        source_card = Cards.objects.select_for_update().get(id=from_card_id, user_id=str(sender_id))
        dest_wallet = CryptoWallets.objects.select_for_update().filter(address=to_address).first()
        
        if not dest_wallet:
            raise ValueError("Кошелек получателя не найден в экосистеме EasyCard.")
            
        if source_card.balance < total_aed_debit:
            raise ValueError(f"Недостаточно средств. Нужно: {total_aed_debit} AED")

        source_card.balance -= total_aed_debit
        source_card.save()
        dest_wallet.balance += amount_usdt
        dest_wallet.save()

        metadata = {
            "sender_card_mask": TransactionService._mask_card(source_card.card_number_encrypted),
            "crypto_address": to_address,
            "crypto_token": dest_wallet.token,
            "crypto_network": dest_wallet.network
        }

        txn = Transactions.objects.create(
            user_id=sender_id, sender_id=str(sender_id), receiver_id=str(dest_wallet.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id), receiver_name=TransactionService._get_user_full_name(dest_wallet.user_id),
            type='crypto_withdrawal', status='completed', amount=amount_aed, currency='AED', fee=conv_fee_aed, 
            exchange_rate=(Decimal('1.00') / sell_rate), card_id=source_card.id, metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='card', amount=total_aed_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_wallet.user_id, account_type='crypto', amount=amount_usdt, type='credit')
        return txn, total_aed_debit, conv_fee_aed, amount_usdt

    @staticmethod
    @transaction.atomic
    def execute_crypto_to_card(sender_id, from_wallet_id, to_card_number, amount_usdt):
        amount_usdt = Decimal(str(amount_usdt))
        SettingsManager.check_limits(sender_id, amount_usdt, 'transfer')

        buy_rate = SettingsManager.get_setting('exchange_rates', 'usdt_to_aed_buy', Decimal('3.65'))
        network_fee_pct = SettingsManager.get_setting('fees', 'network_fee_percent', Decimal('1.0'))
        
        crypto_fee = (amount_usdt * network_fee_pct / Decimal('100')).quantize(Decimal('0.000000'))
        total_deduction = amount_usdt + crypto_fee
        amount_aed = (amount_usdt * buy_rate).quantize(Decimal('0.01'))
        
        source_wallet = CryptoWallets.objects.select_for_update().get(id=from_wallet_id, user_id=str(sender_id))
        dest_card = Cards.objects.select_for_update().filter(card_number_encrypted=to_card_number).first()
        
        if not dest_card:
            raise ValueError("Карта получателя не найдена в системе.")

        if source_wallet.balance < total_deduction:
            raise ValueError(f"Недостаточно средств. Необходимо: {total_deduction} USDT")

        source_wallet.balance -= total_deduction
        source_wallet.save()
        dest_card.balance += amount_aed
        dest_card.save()

        metadata = {
            "crypto_address": source_wallet.address,
            "crypto_token": source_wallet.token,
            "crypto_network": source_wallet.network,
            "receiver_card_mask": TransactionService._mask_card(to_card_number)
        }
        
        txn = Transactions.objects.create(
            user_id=sender_id, sender_id=str(sender_id), receiver_id=str(dest_card.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id), receiver_name=TransactionService._get_user_full_name(dest_card.user_id),
            type='crypto_to_card', status='completed', amount=amount_usdt, currency='USDT', fee=crypto_fee, 
            exchange_rate=buy_rate, recipient_card=to_card_number, card_id=dest_card.id, metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='crypto', amount=total_deduction, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_card.user_id, account_type='card', amount=amount_aed, type='credit')
        return txn, total_deduction, crypto_fee, amount_aed

    @staticmethod
    @transaction.atomic
    def execute_bank_to_crypto(sender_id, from_bank_id, to_address, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        SettingsManager.check_limits(sender_id, amount_aed, 'transfer')

        sell_rate = SettingsManager.get_setting('exchange_rates', 'usdt_to_aed_sell', Decimal('3.69'))
        conv_fee_pct = SettingsManager.get_setting('fees', 'currency_conversion_percent', Decimal('1.0'))
        
        conv_fee_aed = (amount_aed * conv_fee_pct / Decimal('100')).quantize(Decimal('0.01'))
        total_aed_debit = amount_aed + conv_fee_aed
        amount_usdt = (amount_aed / sell_rate).quantize(Decimal('0.000000'))
        
        source_bank = BankDepositAccounts.objects.select_for_update().get(id=from_bank_id, user_id=str(sender_id))
        dest_wallet = CryptoWallets.objects.select_for_update().filter(address=to_address).first()
        
        if not dest_wallet:
            raise ValueError("Кошелек получателя не найден.")
            
        if source_bank.balance < total_aed_debit:
            raise ValueError("Недостаточно средств на банковском счете.")
            
        source_bank.balance -= total_aed_debit
        source_bank.save()
        dest_wallet.balance += amount_usdt
        dest_wallet.save()

        metadata = {
            "sender_iban": source_bank.iban,
            "sender_iban_mask": TransactionService._mask_iban(source_bank.iban),
            "sender_bank": source_bank.bank_name,
            "sender_bank_name": source_bank.bank_name,
            "crypto_address": to_address,
            "crypto_token": dest_wallet.token,
            "crypto_network": dest_wallet.network
        }
        
        txn = Transactions.objects.create(
            user_id=sender_id, sender_id=str(sender_id), receiver_id=str(dest_wallet.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id), receiver_name=TransactionService._get_user_full_name(dest_wallet.user_id),
            type='crypto_to_iban', status='completed', amount=amount_aed, currency='AED', fee=conv_fee_aed, 
            exchange_rate=(Decimal('1.00') / sell_rate), metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='bank', amount=total_aed_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_wallet.user_id, account_type='crypto', amount=amount_usdt, type='credit')
        return txn, total_aed_debit, conv_fee_aed, amount_usdt

    @staticmethod
    @transaction.atomic
    def execute_crypto_to_bank(sender_id, from_wallet_id, to_iban, amount_usdt):
        amount_usdt = Decimal(str(amount_usdt))
        SettingsManager.check_limits(sender_id, amount_usdt, 'transfer')

        buy_rate = SettingsManager.get_setting('exchange_rates', 'usdt_to_aed_buy', Decimal('3.65'))
        network_fee_pct = SettingsManager.get_setting('fees', 'network_fee_percent', Decimal('1.0'))
        
        crypto_fee = (amount_usdt * network_fee_pct / Decimal('100')).quantize(Decimal('0.000000'))
        total_deduction = amount_usdt + crypto_fee
        amount_aed = (amount_usdt * buy_rate).quantize(Decimal('0.01'))
        
        source_wallet = CryptoWallets.objects.select_for_update().get(id=from_wallet_id, user_id=str(sender_id))
        dest_bank = BankDepositAccounts.objects.select_for_update().filter(iban=to_iban).first()
        
        if not dest_bank:
            raise ValueError("Банковский счет получателя не найден.")

        if source_wallet.balance < total_deduction:
            raise ValueError("Недостаточно средств.")
            
        source_wallet.balance -= total_deduction
        source_wallet.save()
        dest_bank.balance += amount_aed
        dest_bank.save()

        metadata = {
            "crypto_address": source_wallet.address,
            "crypto_token": source_wallet.token,
            "crypto_network": source_wallet.network,
            "beneficiary_iban": to_iban,
            "iban_mask": TransactionService._mask_iban(to_iban),
            "beneficiary_bank": dest_bank.bank_name,
            "beneficiary_bank_name": dest_bank.bank_name,
            "beneficiary_name": dest_bank.beneficiary
        }
        
        txn = Transactions.objects.create(
            user_id=sender_id, sender_id=str(sender_id), receiver_id=str(dest_bank.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id), receiver_name=TransactionService._get_user_full_name(dest_bank.user_id),
            type='crypto_to_iban', status='completed', amount=amount_usdt, currency='USDT', fee=crypto_fee, 
            exchange_rate=buy_rate, metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='crypto', amount=total_deduction, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_bank.user_id, account_type='bank', amount=amount_aed, type='credit')
        return txn, total_deduction, crypto_fee, amount_aed
        
    @staticmethod
    @transaction.atomic
    def execute_card_to_bank(sender_id, from_card_id, to_iban, amount_aed):
        amount_aed = Decimal(str(amount_aed))
        SettingsManager.check_limits(sender_id, amount_aed, 'transfer')

        fee_percent = SettingsManager.get_setting('fees', 'card_to_card_percent', Decimal('1.0'))
        fee_amount = (amount_aed * fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_debit = amount_aed + fee_amount

        source_card = Cards.objects.select_for_update().get(id=from_card_id, user_id=str(sender_id))
        dest_bank = BankDepositAccounts.objects.select_for_update().filter(iban=to_iban).first()
        
        if not dest_bank:
            raise ValueError("IBAN получателя не найден.")
            
        if source_card.balance < total_debit:
            raise ValueError("Недостаточно средств на карте.")
            
        source_card.balance -= total_debit
        source_card.save()
        dest_bank.balance += amount_aed
        dest_bank.save()

        metadata = {
            "sender_card_mask": TransactionService._mask_card(source_card.card_number_encrypted),
            "beneficiary_iban": to_iban,
            "iban_mask": TransactionService._mask_iban(to_iban),
            "beneficiary_bank": dest_bank.bank_name,
            "beneficiary_bank_name": dest_bank.bank_name,
            "beneficiary_name": dest_bank.beneficiary
        }
        
        txn = Transactions.objects.create(
            user_id=sender_id, sender_id=str(sender_id), receiver_id=str(dest_bank.user_id),
            sender_name=TransactionService._get_user_full_name(sender_id), receiver_name=TransactionService._get_user_full_name(dest_bank.user_id),
            type='bank_withdrawal', status='completed', amount=amount_aed, currency='AED',
            fee=fee_amount, metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=sender_id, account_type='card', amount=total_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=dest_bank.user_id, account_type='bank', amount=amount_aed, type='credit')
        return txn, total_debit, fee_amount, amount_aed

    @staticmethod
    @transaction.atomic
    def execute_bank_to_card_transfer(user_id, from_bank_account_id, receiver_card_number, amount):
        amount = Decimal(str(amount))
        SettingsManager.check_limits(user_id, amount, 'transfer')
        
        fee_percent = SettingsManager.get_setting('fees', 'bank_transfer_percent', Decimal('2.0'))
        fee_amount = (amount * fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_debit = amount + fee_amount

        bank_account = BankDepositAccounts.objects.select_for_update().get(id=from_bank_account_id, user_id=str(user_id))
        receiver_card = Cards.objects.select_for_update().get(card_number_encrypted=receiver_card_number)

        if bank_account.balance < total_debit:
            raise ValueError("Недостаточно средств.")

        bank_account.balance -= total_debit
        bank_account.save()
        receiver_card.balance += amount
        receiver_card.save()

        metadata = {
            "sender_iban": bank_account.iban,
            "sender_iban_mask": TransactionService._mask_iban(bank_account.iban),
            "sender_bank": bank_account.bank_name,
            "sender_bank_name": bank_account.bank_name,
            "receiver_card_mask": TransactionService._mask_card(receiver_card_number)
        }
        
        txn = Transactions.objects.create(
            user_id=user_id, sender_id=str(user_id), receiver_id=str(receiver_card.user_id),
            sender_name=TransactionService._get_user_full_name(user_id), receiver_name=TransactionService._get_user_full_name(receiver_card.user_id),
            type='iban_to_card', status='completed', amount=amount, currency='AED', fee=fee_amount,
            recipient_card=receiver_card_number, metadata=metadata
        )
        BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='bank', amount=total_debit, type='debit')
        BalanceMovements.objects.create(transaction=txn, user_id=receiver_card.user_id, account_type=receiver_card.type, amount=amount, type='credit')
        return txn, fee_amount, total_debit

    @staticmethod
    @transaction.atomic
    def execute_crypto_wallet_withdrawal(user_id, from_wallet_id, to_address, amount_usdt, token='USDT', network='TRC20'):
        amount_usdt = Decimal(str(amount_usdt))
        SettingsManager.check_limits(user_id, amount_usdt, 'withdrawal')
        
        fee_percent = SettingsManager.get_setting('fees', 'network_fee_percent', Decimal('1.0'))
        crypto_fee = (amount_usdt * fee_percent / Decimal('100')).quantize(Decimal('0.000000'))
        total_deduction = amount_usdt + crypto_fee

        source_wallet = CryptoWallets.objects.select_for_update().get(id=from_wallet_id, user_id=str(user_id))

        if source_wallet.address == to_address:
            raise ValueError("Нельзя отправить на свой же кошелёк.")

        if source_wallet.balance < total_deduction:
            raise ValueError("Недостаточно средств.")

        dest_wallet = CryptoWallets.objects.select_for_update().filter(address=to_address).first()
        is_internal = dest_wallet is not None

        metadata = {
            "crypto_token": token,
            "crypto_network": network,
            "crypto_address": to_address
        }

        if is_internal:
            source_wallet.balance -= total_deduction
            source_wallet.save()
            dest_wallet.balance += amount_usdt
            dest_wallet.save()

            txn = Transactions.objects.create(
                user_id=user_id, sender_id=str(user_id), receiver_id=str(dest_wallet.user_id),
                sender_name=TransactionService._get_user_full_name(user_id), receiver_name=TransactionService._get_user_full_name(dest_wallet.user_id),
                type='crypto_to_crypto', status='completed', amount=amount_usdt, currency=token, fee=crypto_fee, metadata=metadata
            )
            CryptoWithdrawals.objects.create(
                transaction=txn, user_id=user_id, token=token, network=network, to_address=to_address, 
                amount_crypto=amount_usdt, fee_amount=crypto_fee, fee_type='network', total_debit=total_deduction
            )
            BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='crypto', amount=total_deduction, type='debit')
            BalanceMovements.objects.create(transaction=txn, user_id=dest_wallet.user_id, account_type='crypto', amount=amount_usdt, type='credit')
        else:
            source_wallet.balance -= total_deduction
            source_wallet.save()

            txn = Transactions.objects.create(
                user_id=user_id, sender_id=str(user_id), receiver_id='EXTERNAL',
                sender_name=TransactionService._get_user_full_name(user_id), receiver_name="Внешний криптокошелек",
                type='crypto_to_crypto', status='pending', amount=amount_usdt, currency=token, fee=crypto_fee, metadata=metadata
            )
            CryptoWithdrawals.objects.create(
                transaction=txn, user_id=user_id, token=token, network=network, to_address=to_address, 
                amount_crypto=amount_usdt, fee_amount=crypto_fee, fee_type='network', total_debit=total_deduction
            )
            BalanceMovements.objects.create(transaction=txn, user_id=user_id, account_type='crypto', amount=total_deduction, type='debit')

        return {
            "message": "Перевод выполнен" if is_internal else "Перевод в обработке",
            "transaction_id": str(txn.id),
            "status": txn.status,
            "is_internal": is_internal,
            "deducted_amount": str(total_deduction),
            "fee": str(crypto_fee),
            "credited_amount": str(amount_usdt),
        }

    @staticmethod
    def get_transaction_receipt(transaction_id, user_id=None):
        txn = Transactions.objects.get(id=transaction_id)
        
        viewer_id = str(user_id) if user_id else str(txn.user_id)
        if txn.sender_id == viewer_id and txn.receiver_id == viewer_id:
            direction = 'internal'
        elif txn.receiver_id == viewer_id:
            direction = 'inbound'
        else:
            direction = 'outbound'

        receipt = {
            "transaction_id": str(txn.id),
            "type": txn.type,
            "direction": direction,
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
            "sender_id": txn.sender_id,
            "receiver_id": txn.receiver_id,
            "sender_name": txn.sender_name,
            "receiver_name": txn.receiver_name,
            "operation": txn.type.replace('_', ' ').title(),
            "receiver_card_mask": None,
            "recipient_name": txn.receiver_name,
            "sender_card_mask": None,
            "sender_iban": None,
            "sender_bank": None,
            "sender_iban_mask": None,
            "beneficiary_name": None,
            "beneficiary_iban": None,
            "beneficiary_bank": None,
            "beneficiary_bank_name": None, 
            "beneficiary_swift": None,
            "iban_mask": None,
            "amount_crypto": None,
            "crypto_network": None,
            "crypto_token": None,
            "crypto_address": None,
            "from_card_id": None,
            "to_card_id": None,
            "from_bank_account_id": None,
            "amount_aed": float(txn.amount) if txn.currency == 'AED' else None,
            "fee_amount": float(txn.fee) if txn.fee else 0,
            "total_debit_aed": None,
            "movements": None
        }

        if txn.metadata:
            for key, value in txn.metadata.items():
                if key in receipt:
                    receipt[key] = value

        tx_type = txn.type
        if tx_type in ['card_transfer', 'internal_transfer']:
            try:
                ct = txn.card_transfer
                receipt["fee_amount"] = float(ct.fee_amount)
                receipt["total_debit_aed"] = float(ct.total_amount)
                receipt["from_card_id"] = str(ct.sender_card_id)
                receipt["to_card_id"] = str(ct.receiver_card_id)
            except Exception: pass
                
        elif tx_type in ['bank_withdrawal', 'iban_to_iban', 'transfer_out']:
            try:
                bw = txn.bank_withdrawal
                receipt["amount_aed"] = float(bw.amount_aed)
                receipt["fee_amount"] = float(bw.fee_amount)
                receipt["total_debit_aed"] = float(bw.total_debit)
                receipt["from_card_id"] = str(bw.from_card_id) if bw.from_card_id else None
                receipt["from_bank_account_id"] = str(bw.from_bank_account_id) if bw.from_bank_account_id else None
            except Exception: pass
            
        elif tx_type in ['crypto_withdrawal', 'crypto_to_crypto']:
            try:
                cw = txn.crypto_withdrawal
                receipt["amount_crypto"] = float(cw.amount_crypto)
                receipt["fee_amount"] = float(cw.fee_amount)
                receipt["total_debit_aed"] = float(cw.total_debit)
            except Exception: pass

        elif tx_type in ['top_up', 'bank_topup']:
            try:
                bt = txn.bank_topup
                if bt.deposit_account:
                    receipt["from_bank_account_id"] = str(bt.deposit_account.id)
            except Exception: pass

        elif tx_type in ['crypto_deposit', 'crypto_topup']:
            try:
                ct = txn.crypto_topup
                receipt["amount_crypto"] = float(ct.amount_crypto) if ct.amount_crypto else None
            except Exception: pass

        movements = txn.movements.all()
        if movements.exists():
            receipt["movements"] = [{
                "account_type": m.account_type,
                "amount": float(m.amount),
                "type": m.type,
            } for m in movements]

        return receipt