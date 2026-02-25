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
    class Meta:
        model = Transactions
        fields = '__all__'


class AdminTransactionSerializerDirect(serializers.ModelSerializer):
    direction = serializers.SerializerMethodField()

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