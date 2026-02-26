from apps.transactions_apps.models import Transactions
from rest_framework import serializers

class BankTopupRequestSerializer(serializers.Serializer):
    transfer_rail = serializers.ChoiceField(
        choices=['UAE_LOCAL_AED', 'SWIFT_INTL'],
        help_text="Тип банковского перевода: локальный (ОАЭ) или международный (SWIFT)"
    )

class BankTopupResponseSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Сообщение об успехе", default="Topup initiated")
    transaction_id = serializers.UUIDField(help_text="ID созданной транзакции пополнения")
    instructions = serializers.JSONField(help_text="Банковские реквизиты, на которые клиент должен отправить деньги")

class CryptoTopupRequestSerializer(serializers.Serializer):
    card_id = serializers.UUIDField(help_text="ID карты, на которую зачислятся средства после конвертации")
    token = serializers.ChoiceField(choices=['USDT', 'USDC'], help_text="Стейблкоин для пополнения")
    network = serializers.ChoiceField(choices=['TRC20', 'ERC20', 'BEP20', 'SOL'], help_text="Блокчейн сеть")

class CryptoTopupResponseSerializer(serializers.Serializer):
    message = serializers.CharField(default="Crypto address generated")
    deposit_address = serializers.CharField(help_text="Сгенерированный крипто-адрес для депозита")
    qr_payload = serializers.CharField(help_text="Строка для генерации QR-кода на фронтенде")

class CardTransferRequestSerializer(serializers.Serializer):
    sender_card_id = serializers.UUIDField(help_text="ID карты отправителя (ваша карта)")
    receiver_card_number = serializers.CharField(max_length=16, help_text="16-значный номер карты получателя")
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00, help_text="Сумма перевода в AED")

class CardTransferResponseSerializer(serializers.Serializer):
    message = serializers.CharField(default="Transfer successful")
    transaction_id = serializers.UUIDField(help_text="ID выполненной транзакции")
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, help_text="Фактически переведенная сумма")

class CryptoWithdrawalRequestSerializer(serializers.Serializer):
    from_card_id = serializers.UUIDField(help_text="ID карты, с которой спишутся AED")
    token = serializers.ChoiceField(choices=['USDT', 'USDC'], help_text="Токен для вывода")
    network = serializers.ChoiceField(choices=['TRC20', 'ERC20', 'BEP20', 'SOL'], help_text="Сеть получателя")
    to_address = serializers.CharField(max_length=255, help_text="Крипто-адрес получателя")
    amount_crypto = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=1.00, help_text="Сумма к получению (в крипте)")

class CryptoWithdrawalResponseSerializer(serializers.Serializer):
    message = serializers.CharField(default="Withdrawal processing")
    transaction_id = serializers.UUIDField(help_text="ID транзакции списания")
    total_debit_crypto = serializers.DecimalField(max_digits=15, decimal_places=6, help_text="Общая сумма списания в крипте (включая network fee)")

class BankWithdrawalRequestSerializer(serializers.Serializer):
    from_card_id = serializers.UUIDField(required=False, allow_null=True, help_text="ID карты для списания средств (опционально)")
    from_bank_account_id = serializers.UUIDField(required=False, allow_null=True, help_text="ID банковского счёта для списания (опционально)")
    iban = serializers.CharField(max_length=34, help_text="IBAN номер счета в ОАЭ (начинается с AE)")
    beneficiary_name = serializers.CharField(max_length=255, help_text="Полное имя получателя")
    bank_name = serializers.CharField(max_length=255, help_text="Название банка получателя")
    amount_aed = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00, help_text="Сумма перевода в AED")

    def validate_iban(self, value):
        if not value.startswith('AE') or len(value) != 23:
            raise serializers.ValidationError("Неверный формат UAE IBAN.")
        return value

    def validate(self, data):
        if not data.get('from_card_id') and not data.get('from_bank_account_id'):
            raise serializers.ValidationError("Укажите from_card_id или from_bank_account_id")
        return data

class BankWithdrawalResponseSerializer(serializers.Serializer):
    message = serializers.CharField(default="Bank wire processing")
    transaction_id = serializers.UUIDField()
    fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Комиссия за перевод (2%)")
    total_debit_aed = serializers.DecimalField(max_digits=15, decimal_places=2, help_text="Общая сумма, списанная с карты (сумма + комиссия)")

class BankToCardTransferRequestSerializer(serializers.Serializer):
    from_bank_account_id = serializers.UUIDField(help_text="ID банковского счета отправителя (IBAN)")
    receiver_card_number = serializers.CharField(max_length=16, help_text="16-значный номер карты получателя")
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00, help_text="Сумма перевода в AED")

class BankToCardTransferResponseSerializer(serializers.Serializer):
    message = serializers.CharField(default="Transfer successful")
    transaction_id = serializers.UUIDField(help_text="ID выполненной транзакции")
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, help_text="Переведенная сумма")
    fee = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Комиссия за перевод (2%)")
    total_debit = serializers.DecimalField(max_digits=15, decimal_places=2, help_text="Общая сумма списания")

class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField(help_text="Текст ошибки (например, 'Недостаточно средств')")

class CardToCryptoTransferSerializer(serializers.Serializer):
    from_card_id = serializers.UUIDField(help_text="ID карты отправителя")
    to_crypto_address = serializers.CharField(max_length=255, help_text="USDT TRC20 адрес получателя (свой или чужой)")
    amount_aed = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00)

class CryptoToCardTransferSerializer(serializers.Serializer):
    from_wallet_id = serializers.UUIDField(help_text="ID криптокошелька отправителя")
    to_card_number = serializers.CharField(max_length=16, help_text="Номер карты получателя (своей или чужой)")
    amount_usdt = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=1.00)

class CardToBankTransferSerializer(serializers.Serializer):
    from_card_id = serializers.UUIDField(help_text="ID карты отправителя")
    to_iban = serializers.CharField(max_length=34, help_text="IBAN получателя (свой или чужой)")
    amount_aed = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00)

class BankToCryptoTransferSerializer(serializers.Serializer):
    from_bank_account_id = serializers.UUIDField(help_text="ID банковского счета отправителя")
    to_crypto_address = serializers.CharField(max_length=255, help_text="USDT TRC20 адрес получателя")
    amount_aed = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1.00)

class CryptoToBankTransferSerializer(serializers.Serializer):
    from_wallet_id = serializers.UUIDField(help_text="ID криптокошелька отправителя")
    to_iban = serializers.CharField(max_length=34, help_text="IBAN получателя")
    amount_usdt = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=1.00)

class TransferResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    transaction_id = serializers.UUIDField()
    deducted_amount = serializers.DecimalField(max_digits=15, decimal_places=6)
    fee = serializers.DecimalField(max_digits=15, decimal_places=6)
    credited_amount = serializers.DecimalField(max_digits=15, decimal_places=6)

class CryptoWalletWithdrawalRequestSerializer(serializers.Serializer):
    from_wallet_id = serializers.UUIDField(help_text="ID крипто-кошелька отправителя (вашего)")
    to_address = serializers.CharField(max_length=255, help_text="Крипто-адрес получателя")
    amount_usdt = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=1.00, help_text="Сумма перевода в USDT")
    token = serializers.ChoiceField(choices=['USDT', 'USDC'], default='USDT', help_text="Токен")
    network = serializers.ChoiceField(choices=['TRC20', 'ERC20', 'BEP20', 'SOL'], default='TRC20', help_text="Сеть")

class CryptoWalletWithdrawalResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    transaction_id = serializers.UUIDField()
    status = serializers.CharField(help_text="completed (внутренний) или pending (внешний)")
    is_internal = serializers.BooleanField(help_text="True если получатель в системе")
    recipient_name = serializers.CharField(allow_null=True, help_text="Имя получателя (если внутренний)")
    avatar_url = serializers.CharField(allow_null=True, help_text="Аватар получателя (если внутренний)")
    deducted_amount = serializers.DecimalField(max_digits=15, decimal_places=6)
    fee = serializers.DecimalField(max_digits=15, decimal_places=6)
    credited_amount = serializers.DecimalField(max_digits=15, decimal_places=6)


class TransactionFullSerializer(serializers.ModelSerializer):
    fee_details = serializers.SerializerMethodField(help_text="Умная структура комиссий (поддерживает составные списания)")

    class Meta:
        model = Transactions
        fields = '__all__'

    def get_fee_details(self, obj):
        total_fee = float(obj.fee) if obj.fee is not None else 0.0
        currency = obj.currency
        components = []
        fee_revenues = obj.fee_revenues.all()
        if fee_revenues.exists():
            for fr in fee_revenues:
                components.append({
                    "name": fr.fee_type,
                    "type": "percent" if fr.fee_percent and fr.fee_percent > 0 else "flat",
                    "percent": float(fr.fee_percent) if fr.fee_percent else 0.0,
                    "amount": float(fr.fee_amount),
                    "currency": fr.fee_currency
                })
            return {
                "total_fee_sum": total_fee,
                "total_fee_currency": currency,
                "components": components
            }
        tx_type = obj.type
        base_component = {
            "name": "processing_fee",
            "type": "flat",
            "percent": 0.0,
            "amount": total_fee,
            "currency": currency
        }

        try:
            if tx_type in ['card_transfer', 'internal_transfer'] and hasattr(obj, 'card_transfer'):
                ct = obj.card_transfer
                if ct.fee_percent and ct.fee_percent > 0:
                    base_component.update({"type": "percent", "percent": float(ct.fee_percent), "amount": float(ct.fee_amount)})

            elif tx_type in ['bank_withdrawal', 'iban_to_iban', 'transfer_out'] and hasattr(obj, 'bank_withdrawal'):
                bw = obj.bank_withdrawal
                if bw.fee_percent and bw.fee_percent > 0:
                    base_component.update({"type": "percent", "percent": float(bw.fee_percent), "amount": float(bw.fee_amount)})

            elif tx_type in ['crypto_withdrawal', 'crypto_to_crypto'] and hasattr(obj, 'crypto_withdrawal'):
                cw = obj.crypto_withdrawal
                if cw.fee_type != 'flat' and obj.amount and float(obj.amount) > 0 and cw.fee_amount:
                    calc_pct = round(float(cw.fee_amount / obj.amount) * 100, 2)
                    base_component.update({"name": "network_fee", "type": "percent", "percent": calc_pct, "amount": float(cw.fee_amount)})

            elif tx_type == 'top_up' and hasattr(obj, 'bank_topup'):
                bt = obj.bank_topup
                if bt.fee_percent and bt.fee_percent > 0:
                    base_component.update({"type": "percent", "percent": float(bt.fee_percent)})

            elif tx_type == 'crypto_deposit' and hasattr(obj, 'crypto_topup'):
                ct = obj.crypto_topup
                if ct.fee_percent and ct.fee_percent > 0:
                    base_component.update({"type": "percent", "percent": float(ct.fee_percent)})

            elif tx_type in ['card_to_crypto', 'bank_to_crypto']:
                if obj.amount and float(obj.amount) > 0 and total_fee > 0:
                    calc_pct = round((total_fee / float(obj.amount)) * 100, 2)
                    base_component.update({"name": "currency_conversion", "type": "percent", "percent": calc_pct})

            elif tx_type in ['crypto_to_card', 'crypto_to_iban']:
                base_component.update({"name": "crypto_flat_fee", "type": "flat", "currency": "USDT", "amount": total_fee})

        except Exception:
            pass
        if total_fee > 0:
            components.append(base_component)

        return {
            "total_fee_sum": total_fee,
            "total_fee_currency": currency,
            "components": components
        }


class AdminTransactionSerializerDirect(serializers.ModelSerializer):
    direction = serializers.SerializerMethodField()
    display = serializers.SerializerMethodField()

    class Meta:
        model = Transactions
        fields = '__all__'

    def get_direction(self, obj):
        user_id = self.context.get('target_user_id')
        if not user_id:
            return 'unknown'
        user_id_str = str(user_id)
        if obj.sender_id == user_id_str and obj.receiver_id == user_id_str:
            return 'internal'
        elif obj.receiver_id == user_id_str:
            return 'inbound'
        return 'outbound'

    # ---------- DISPLAY BLOCK (receipt-consistent, role-aware) ----------

    TITLE_MAP = {
        'card_to_crypto': 'Stablecoin Top-Up',
        'bank_to_crypto': 'Bank → Crypto',
        'crypto_to_card': 'Crypto → Card',
        'crypto_to_iban': 'Crypto → Bank',
        'card_transfer': 'Card Transfer',
        'internal_transfer': 'Internal Transfer',
        'bank_withdrawal': 'Bank Withdrawal',
        'iban_to_iban': 'IBAN Transfer',
        'crypto_withdrawal': 'Crypto Withdrawal',
        'crypto_to_crypto': 'Crypto Transfer',
        'top_up': 'Bank Top-Up',
        'crypto_deposit': 'Crypto Deposit',
        'card_payment': 'Card Payment',
        'refund': 'Refund',
        'fee': 'Fee',
        'cashback': 'Cashback',
        'card_activation': 'Card Activation',
    }

    SUBTITLE_MAP = {
        'card_to_crypto': 'Card → USDT (TRC20)',
        'bank_to_crypto': 'Bank → USDT (TRC20)',
        'crypto_to_card': 'USDT → Card',
        'crypto_to_iban': 'USDT → Bank (IBAN)',
        'card_transfer': 'Card → Card',
        'internal_transfer': 'Internal',
        'bank_withdrawal': 'Card → Bank',
        'iban_to_iban': 'IBAN → IBAN',
        'crypto_withdrawal': 'Card → USDT',
        'crypto_to_crypto': 'Wallet → Wallet',
        'top_up': 'Bank Wire',
        'crypto_deposit': 'Crypto Deposit',
    }

    def get_display(self, obj):
        user_id = self.context.get('target_user_id')
        direction = self.get_direction(obj)
        meta = obj.metadata or {}
        tx_type = obj.type

        title = self.TITLE_MAP.get(tx_type, tx_type.replace('_', ' ').title())
        subtitle = self._build_subtitle(obj, meta, tx_type)

        # --- Determine primary and secondary amounts from stored metadata ---
        primary, secondary = self._resolve_amounts(obj, meta, tx_type, direction)

        return {
            "title": title,
            "subtitle": subtitle,
            "primary_amount": primary,
            "secondary_amount": secondary,
        }

    def _build_subtitle(self, obj, meta, tx_type):
        base = self.SUBTITLE_MAP.get(tx_type, '')
        network = meta.get('crypto_network')
        token = meta.get('crypto_token')
        if network and token and not base:
            base = f"{token} ({network})"
        return base

    def _resolve_amounts(self, obj, meta, tx_type, direction):
        """Return (primary_amount, secondary_amount) dicts using stored metadata."""

        # ---- Crypto conversion types with v2 pricing stored in metadata ----
        if tx_type in ('card_to_crypto', 'bank_to_crypto'):
            return self._amounts_fiat_to_crypto(obj, meta, direction)

        if tx_type in ('crypto_to_card', 'crypto_to_iban'):
            return self._amounts_crypto_to_fiat(obj, meta, direction)

        if tx_type in ('crypto_withdrawal', 'crypto_to_crypto'):
            return self._amounts_crypto_withdrawal(obj, meta, direction)

        # ---- Fiat-only types (card_transfer, bank_withdrawal, iban_to_iban, top_up, etc.) ----
        return self._amounts_fiat_default(obj, direction)

    # --- card_to_crypto / bank_to_crypto ---
    def _amounts_fiat_to_crypto(self, obj, meta, direction):
        crypto_receive = meta.get('crypto_send_usdt') or meta.get('crypto_to_receive_usdt')
        total_debited_usdt = meta.get('total_debited_usdt')
        fiat_amount = meta.get('fiat_amount_aed')
        token = meta.get('crypto_token', 'USDT')

        # Fallback: calculate from raw transaction fields when v2 metadata is missing
        if not crypto_receive and not total_debited_usdt:
            amount = float(obj.amount) if obj.amount else 0
            fee = float(obj.fee) if obj.fee else 0
            rate = float(obj.exchange_rate) if obj.exchange_rate else 0
            if rate > 1:
                # amount is in AED, rate is AED/USDT (e.g. 3.69)
                crypto_receive = round(amount / rate, 2)
                total_debited_usdt = round((amount + fee) / rate, 2)
            else:
                crypto_receive = amount
                total_debited_usdt = amount + fee
            if not fiat_amount:
                fiat_amount = amount

        if direction == 'inbound':
            primary = {"sign": "+", "amount": self._fmt(crypto_receive), "currency": token}
        else:
            primary = {"sign": "-", "amount": self._fmt(total_debited_usdt or crypto_receive), "currency": token}

        secondary = {"amount": self._fmt(fiat_amount), "currency": "AED"} if fiat_amount else None
        return primary, secondary

    # --- crypto_to_card / crypto_to_iban ---
    def _amounts_crypto_to_fiat(self, obj, meta, direction):
        credited_aed = meta.get('credited_amount_aed') or meta.get('fiat_amount_aed')
        usdt_amount = meta.get('usdt_amount') or meta.get('amount_usdt')
        total_debited_usdt = meta.get('total_debited_usdt')
        token = meta.get('crypto_token', 'USDT')

        # Fallback: calculate from raw fields when v2 metadata is missing
        if not credited_aed and not usdt_amount and not total_debited_usdt:
            amount = float(obj.amount) if obj.amount else 0
            fee = float(obj.fee) if obj.fee else 0
            rate = float(obj.exchange_rate) if obj.exchange_rate else 0
            currency = obj.currency or 'AED'
            if currency == 'AED':
                credited_aed = amount
                if rate > 1:
                    # rate is AED/USDT
                    usdt_amount = round(amount / rate, 2)
                    total_debited_usdt = round((amount / rate) + fee, 2)
                elif rate > 0:
                    # rate < 1 means USDT/AED (e.g. 0.271)
                    usdt_amount = round(amount * rate, 2)
                    total_debited_usdt = round(usdt_amount + fee, 2)
                else:
                    usdt_amount = amount
                    total_debited_usdt = amount + fee
            else:
                # currency is USDT
                usdt_amount = amount
                total_debited_usdt = amount + fee
                if rate > 1:
                    credited_aed = round(amount * rate, 2)
                elif rate > 0:
                    credited_aed = round(amount / rate, 2)

        if direction == 'inbound':
            primary = {"sign": "+", "amount": self._fmt(credited_aed), "currency": "AED"}
            secondary = {"amount": self._fmt(usdt_amount), "currency": token} if usdt_amount else None
        else:
            primary = {"sign": "-", "amount": self._fmt(total_debited_usdt or usdt_amount), "currency": token}
            secondary = {"amount": self._fmt(credited_aed), "currency": "AED"} if credited_aed else None
        return primary, secondary

    # --- crypto_withdrawal / crypto_to_crypto ---
    def _amounts_crypto_withdrawal(self, obj, meta, direction):
        token = meta.get('crypto_token', obj.currency or 'USDT')
        amount = float(obj.amount) if obj.amount else 0
        fee = float(obj.fee) if obj.fee else 0

        if direction == 'inbound':
            primary = {"sign": "+", "amount": self._fmt(amount), "currency": token}
        else:
            primary = {"sign": "-", "amount": self._fmt(amount + fee), "currency": token}

        # Show AED equivalent if available
        aed_eq = meta.get('total_debited_aed_equivalent') or meta.get('fiat_amount_aed')
        secondary = {"amount": self._fmt(aed_eq), "currency": "AED"} if aed_eq else None
        return primary, secondary

    # --- Fiat default (card_transfer, bank_withdrawal, top_up, etc.) ---
    def _amounts_fiat_default(self, obj, direction):
        amount = float(obj.amount) if obj.amount else 0
        fee = float(obj.fee) if obj.fee else 0
        currency = obj.currency or 'AED'

        if direction == 'inbound':
            primary = {"sign": "+", "amount": self._fmt(amount), "currency": currency}
        elif direction == 'internal':
            primary = {"sign": "", "amount": self._fmt(amount), "currency": currency}
        else:
            total = amount + fee
            primary = {"sign": "-", "amount": self._fmt(total), "currency": currency}

        secondary = None
        return primary, secondary

    @staticmethod
    def _fmt(value):
        """Format a numeric value to 2 decimal places string, or return '0.00'."""
        if value is None:
            return '0.00'
        try:
            return f"{float(value):,.2f}"
        except (ValueError, TypeError):
            return '0.00'