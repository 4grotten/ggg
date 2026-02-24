from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Q
from django.contrib.auth.models import User
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from apps.cards_apps.models import Cards
from apps.accounts_apps.models import Profiles
from apps.transactions_apps.models import FeeRevenue, Transactions, BankDepositAccounts, CryptoWallets
from decimal import Decimal
from .serializers import (
    BankToCryptoTransferSerializer, BankTopupRequestSerializer, BankTopupResponseSerializer, CardToBankTransferSerializer, CardToCryptoTransferSerializer, CryptoToBankTransferSerializer, CryptoToCardTransferSerializer,
    CryptoTopupRequestSerializer, CryptoTopupResponseSerializer,
    CardTransferRequestSerializer, CardTransferResponseSerializer,
    CryptoWithdrawalRequestSerializer, CryptoWithdrawalResponseSerializer,
    BankWithdrawalRequestSerializer, BankWithdrawalResponseSerializer,
    BankToCardTransferRequestSerializer, BankToCardTransferResponseSerializer,
    ErrorResponseSerializer, TransferResponseSerializer,
    CryptoWalletWithdrawalRequestSerializer, CryptoWalletWithdrawalResponseSerializer
)
from apps.transactions_apps.services import TransactionService


class RecipientInfoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Получить ФИО и тип карты по номеру",
        operation_description="Вбиваешь номер карты, IBAN, или крипто-адрес — получаешь имя и аватар получателя.",
        manual_parameters=[
            openapi.Parameter('card_number', openapi.IN_QUERY, description="Номер карты получателя", type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('iban', openapi.IN_QUERY, description="IBAN получателя", type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('crypto_address', openapi.IN_QUERY, description="Крипто-адрес получателя", type=openapi.TYPE_STRING, required=False),
        ],
        responses={200: openapi.Response("Данные получателя"), 404: "Не найдено"},
        tags=["Инфо (Получатели)"]
    )
    def get(self, request):
        card_number = request.query_params.get('card_number')
        iban = request.query_params.get('iban')
        crypto_address = request.query_params.get('crypto_address')

        if card_number:
            card = Cards.objects.filter(card_number_encrypted=card_number).first()
            if not card:
                return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
            user = User.objects.filter(id=card.user_id).first()
            recipient_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown User"
            avatar_url = None
            if user:
                profile = Profiles.objects.filter(user_id=str(user.id)).first()
                if profile:
                    avatar_url = profile.avatar_url
            return Response({
                "recipient_name": recipient_name,
                "card_type": card.type,
                "avatar_url": avatar_url
            }, status=status.HTTP_200_OK)

        elif iban:
            account = BankDepositAccounts.objects.filter(iban=iban).first()
            if not account:
                return Response({"error": "IBAN not found"}, status=status.HTTP_404_NOT_FOUND)
            user = User.objects.filter(id=account.user_id).first()
            recipient_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown User"
            avatar_url = None
            if user:
                profile = Profiles.objects.filter(user_id=str(user.id)).first()
                if profile:
                    avatar_url = profile.avatar_url
            return Response({
                "recipient_name": recipient_name,
                "bank_name": account.bank_name,
                "iban": account.iban,
                "avatar_url": avatar_url
            }, status=status.HTTP_200_OK)

        elif crypto_address:
            wallet = CryptoWallets.objects.filter(address=crypto_address).first()
            if not wallet:
                return Response({
                    "is_internal": False,
                    "recipient_name": None,
                    "avatar_url": None,
                    "message": "Внешний кошелёк — перевод будет в статусе pending"
                }, status=status.HTTP_200_OK)
            user = User.objects.filter(id=wallet.user_id).first()
            recipient_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown User"
            avatar_url = None
            if user:
                profile = Profiles.objects.filter(user_id=str(user.id)).first()
                if profile:
                    avatar_url = profile.avatar_url
            return Response({
                "is_internal": True,
                "recipient_name": recipient_name,
                "avatar_url": avatar_url,
                "token": wallet.token,
                "network": wallet.network
            }, status=status.HTTP_200_OK)

        else:
            return Response({"error": "card_number, iban, or crypto_address is required"}, status=status.HTTP_400_BAD_REQUEST)


def get_transaction_direction(tx, user_id):
    user_id_str = str(user_id)
    if tx.sender_id == user_id_str and tx.receiver_id == user_id_str:
        return 'internal'
    elif tx.receiver_id == user_id_str:
        return 'inbound'
    return 'outbound'


class AllTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Все транзакции пользователя", tags=["Транзакции (Списки)"])
    def get(self, request):
        user_id = str(request.user.id)
        txs = Transactions.objects.filter(
            Q(sender_id=user_id) | Q(receiver_id=user_id)
        ).order_by('-created_at')
        
        data = [{
            "id": tx.id,
            "type": tx.type,
            "direction": get_transaction_direction(tx, user_id),
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "fee": tx.fee,
            "exchange_rate": str(tx.exchange_rate) if tx.exchange_rate else None,
            "original_amount": tx.original_amount,
            "original_currency": tx.original_currency,
            "merchant_name": tx.merchant_name,
            "merchant_category": tx.merchant_category,
            "recipient_card": tx.recipient_card,
            "sender_name": tx.sender_name,
            "sender_card": tx.sender_card,
            "reference_id": tx.reference_id,
            "description": tx.description,
            "card_id": str(tx.card_id) if tx.card_id else None,
            "metadata": tx.metadata,
            "created_at": tx.created_at,
            "updated_at": tx.updated_at,
        } for tx in txs]
        return Response(data, status=status.HTTP_200_OK)


class IBANTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Транзакции по IBAN (Банк)", tags=["Транзакции (Списки)"])
    def get(self, request):
        user_id = str(request.user.id)
        txs = Transactions.objects.filter(
            Q(sender_id=user_id) | Q(receiver_id=user_id),
            movements__user_id=user_id, movements__account_type='bank'
        ).distinct().order_by('-created_at')
        
        data = [{
            "id": tx.id,
            "type": tx.type,
            "direction": get_transaction_direction(tx, user_id),
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "fee": tx.fee,
            "exchange_rate": str(tx.exchange_rate) if tx.exchange_rate else None,
            "original_amount": tx.original_amount,
            "original_currency": tx.original_currency,
            "merchant_name": tx.merchant_name,
            "merchant_category": tx.merchant_category,
            "recipient_card": tx.recipient_card,
            "sender_name": tx.sender_name,
            "sender_card": tx.sender_card,
            "reference_id": tx.reference_id,
            "description": tx.description,
            "card_id": str(tx.card_id) if tx.card_id else None,
            "metadata": tx.metadata,
            "created_at": tx.created_at,
            "updated_at": tx.updated_at,
        } for tx in txs]
        return Response(data, status=status.HTTP_200_OK)

class CardTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Транзакции по Картам", tags=["Транзакции (Списки)"])
    def get(self, request):
        user_id = str(request.user.id)
        txs = Transactions.objects.filter(
            Q(sender_id=user_id) | Q(receiver_id=user_id),
            movements__user_id=user_id, movements__account_type='card'
        ).distinct().order_by('-created_at')
        
        data = [{
            "id": tx.id,
            "type": tx.type,
            "direction": get_transaction_direction(tx, user_id),
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "fee": tx.fee,
            "exchange_rate": str(tx.exchange_rate) if tx.exchange_rate else None,
            "original_amount": tx.original_amount,
            "original_currency": tx.original_currency,
            "merchant_name": tx.merchant_name,
            "merchant_category": tx.merchant_category,
            "recipient_card": tx.recipient_card,
            "sender_name": tx.sender_name,
            "sender_card": tx.sender_card,
            "reference_id": tx.reference_id,
            "description": tx.description,
            "card_id": str(tx.card_id) if tx.card_id else None,
            "metadata": tx.metadata,
            "created_at": tx.created_at,
            "updated_at": tx.updated_at,
        } for tx in txs]
        return Response(data, status=status.HTTP_200_OK)
    
class CryptoTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(operation_summary="Транзакции по Крипте", tags=["Транзакции (Списки)"])
    def get(self, request):
        user_id = str(request.user.id)
        txs = Transactions.objects.filter(
            Q(sender_id=user_id) | Q(receiver_id=user_id),
            movements__user_id=user_id, movements__account_type='crypto'
        ).distinct().order_by('-created_at')
        
        data = [{
            "id": tx.id,
            "type": tx.type,
            "direction": get_transaction_direction(tx, user_id),
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "fee": tx.fee,
            "exchange_rate": str(tx.exchange_rate) if tx.exchange_rate else None,
            "original_amount": tx.original_amount,
            "original_currency": tx.original_currency,
            "merchant_name": tx.merchant_name,
            "merchant_category": tx.merchant_category,
            "recipient_card": tx.recipient_card,
            "sender_name": tx.sender_name,
            "sender_card": tx.sender_card,
            "reference_id": tx.reference_id,
            "description": tx.description,
            "card_id": str(tx.card_id) if tx.card_id else None,
            "metadata": tx.metadata,
            "created_at": tx.created_at,
            "updated_at": tx.updated_at,
        } for tx in txs]
        return Response(data, status=status.HTTP_200_OK)

class UserBankAccountsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить банковские счета (IBAN)",
        tags=["Счета и Кошельки"]
    )
    def get(self, request):
        accounts = BankDepositAccounts.objects.filter(user_id=str(request.user.id))
        data = [{
            "id": acc.id,
            "iban": acc.iban,
            "bank_name": acc.bank_name,
            "beneficiary": acc.beneficiary,
            "balance": acc.balance,
            "is_active": acc.is_active
        } for acc in accounts]
        return Response(data, status=status.HTTP_200_OK)

class UserCryptoWalletsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить криптокошельки (USDT TRC20)",
        tags=["Счета и Кошельки"]
    )
    def get(self, request):
        wallets = CryptoWallets.objects.filter(user_id=str(request.user.id))
        data = [{
            "id": w.id,
            "network": w.network,
            "token": w.token,
            "address": w.address,
            "balance": w.balance,
            "is_active": w.is_active
        } for w in wallets]
        return Response(data, status=status.HTTP_200_OK)

class BankTopupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Инициация банковского пополнения (Bank Wire)", request_body=BankTopupRequestSerializer, responses={201: BankTopupResponseSerializer, 400: ErrorResponseSerializer}, tags=["Topups (Пополнения)"])
    def post(self, request):
        serializer = BankTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                topup = TransactionService.initiate_bank_topup(user_id=request.user.id, transfer_rail=serializer.validated_data['transfer_rail'])
                return Response({"message": "Topup initiated", "transaction_id": topup.transaction.id, "instructions": topup.instructions_snapshot}, status=status.HTTP_201_CREATED)
            except ValueError as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CryptoTopupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Инициация пополнения стейблкоинами (Crypto Topup)", request_body=CryptoTopupRequestSerializer, responses={201: CryptoTopupResponseSerializer, 400: ErrorResponseSerializer}, tags=["Topups (Пополнения)"])
    def post(self, request):
        serializer = CryptoTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            topup = TransactionService.initiate_crypto_topup(user_id=request.user.id, card_id=serializer.validated_data['card_id'], token=serializer.validated_data['token'], network=serializer.validated_data['network'])
            return Response({"message": "Crypto address generated", "deposit_address": topup.deposit_address, "qr_payload": topup.qr_payload}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CardTransferView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Внутренний перевод средств (Card to Card)", request_body=CardTransferRequestSerializer, responses={200: CardTransferResponseSerializer, 400: ErrorResponseSerializer}, tags=["Transfers (Переводы)"])
    def post(self, request):
        serializer = CardTransferRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = TransactionService.execute_card_transfer(sender_id=request.user.id, sender_card_id=serializer.validated_data['sender_card_id'], receiver_card_number=serializer.validated_data['receiver_card_number'], amount=serializer.validated_data['amount'])
                return Response({"message": "Transfer successful", "transaction_id": txn.id, "amount": txn.amount}, status=status.HTTP_200_OK)
            except ValueError as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CryptoWithdrawalView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Вывод средств на сторонний криптокошелек", request_body=CryptoWithdrawalRequestSerializer, responses={200: CryptoWithdrawalResponseSerializer, 400: ErrorResponseSerializer}, tags=["Withdrawals (Выводы)"])
    def post(self, request):
        serializer = CryptoWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                withdrawal = TransactionService.execute_crypto_withdrawal(user_id=request.user.id, card_id=serializer.validated_data['from_card_id'], token=serializer.validated_data['token'], network=serializer.validated_data['network'], to_address=serializer.validated_data['to_address'], amount_crypto=serializer.validated_data['amount_crypto'])
                return Response({"message": "Withdrawal processing", "transaction_id": withdrawal.transaction.id, "total_debit_crypto": withdrawal.total_debit}, status=status.HTTP_200_OK)
            except ValueError as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BankWithdrawalView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Вывод средств на банковский счет (Bank Wire)", request_body=BankWithdrawalRequestSerializer, responses={200: BankWithdrawalResponseSerializer, 400: ErrorResponseSerializer}, tags=["Withdrawals (Выводы)"])
    def post(self, request):
        serializer = BankWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                withdrawal = TransactionService.execute_bank_withdrawal(
                    user_id=request.user.id,
                    card_id=serializer.validated_data.get('from_card_id'),
                    bank_account_id=serializer.validated_data.get('from_bank_account_id'),
                    iban=serializer.validated_data['iban'],
                    beneficiary_name=serializer.validated_data['beneficiary_name'],
                    bank_name=serializer.validated_data['bank_name'],
                    amount_aed=serializer.validated_data['amount_aed']
                )
                return Response({"message": "Bank wire processing", "transaction_id": withdrawal.transaction.id, "fee_amount": withdrawal.fee_amount, "total_debit_aed": withdrawal.total_debit}, status=status.HTTP_200_OK)
            except ValueError as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TransactionReceiptView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Получить выписку (Квитанцию) по транзакции", responses={200: openapi.Response(description="Детали транзакции"), 400: ErrorResponseSerializer, 404: openapi.Response(description="Транзакция не найдена")}, tags=["Receipts (Квитанции)"])
    def get(self, request, transaction_id):
        try:
            receipt_data = TransactionService.get_transaction_receipt(transaction_id=transaction_id)
            return Response(receipt_data, status=status.HTTP_200_OK)
        except ValueError as e: return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e: return Response({"error": f"Внутренняя ошибка: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class CardToCryptoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Перевод с Карты на Криптокошелек (Свой/Чужой)", request_body=CardToCryptoTransferSerializer, responses={200: TransferResponseSerializer}, tags=["Transfers (Переводы)"])
    def post(self, request):
        ser = CardToCryptoTransferSerializer(data=request.data)
        if ser.is_valid():
            try:
                txn, debit, fee, credit = TransactionService.execute_card_to_crypto(
                    request.user.id, ser.validated_data['from_card_id'], 
                    ser.validated_data['to_crypto_address'], ser.validated_data['amount_aed']
                )
                return Response({"message": "Успешно", "transaction_id": txn.id, "deducted_amount": str(debit), "fee": str(fee), "credited_amount": str(credit)}, status=200)
            except ValueError as e: return Response({"error": str(e)}, status=400)
        return Response(ser.errors, status=400)

class CryptoToCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Перевод с Крипты на Карту (Свою/Чужую) - Комиссия 1 USDT", request_body=CryptoToCardTransferSerializer, responses={200: TransferResponseSerializer}, tags=["Transfers (Переводы)"])
    def post(self, request):
        ser = CryptoToCardTransferSerializer(data=request.data)
        if ser.is_valid():
            try:
                txn, debit, fee, credit = TransactionService.execute_crypto_to_card(
                    request.user.id, ser.validated_data['from_wallet_id'], 
                    ser.validated_data['to_card_number'], ser.validated_data['amount_usdt']
                )
                return Response({"message": "Успешно", "transaction_id": txn.id, "deducted_amount": str(debit), "fee": str(fee), "credited_amount": str(credit)}, status=200)
            except ValueError as e: return Response({"error": str(e)}, status=400)
        return Response(ser.errors, status=400)

class BankToCryptoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Перевод с Банка на Криптокошелек", request_body=BankToCryptoTransferSerializer, tags=["Transfers (Переводы)"])
    def post(self, request):
        ser = BankToCryptoTransferSerializer(data=request.data)
        if ser.is_valid():
            try:
                txn, debit, fee, credit = TransactionService.execute_bank_to_crypto(request.user.id, ser.validated_data['from_bank_account_id'], ser.validated_data['to_crypto_address'], ser.validated_data['amount_aed'])
                return Response({"message": "Успешно", "transaction_id": txn.id, "deducted_amount": str(debit), "fee": str(fee), "credited_amount": str(credit)}, status=200)
            except ValueError as e: return Response({"error": str(e)}, status=400)
        return Response(ser.errors, status=400)

class CryptoToBankView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Перевод с Крипты на Банк (Комиссия 1 USDT)", request_body=CryptoToBankTransferSerializer, tags=["Transfers (Переводы)"])
    def post(self, request):
        ser = CryptoToBankTransferSerializer(data=request.data)
        if ser.is_valid():
            try:
                txn, debit, fee, credit = TransactionService.execute_crypto_to_bank(request.user.id, ser.validated_data['from_wallet_id'], ser.validated_data['to_iban'], ser.validated_data['amount_usdt'])
                return Response({"message": "Успешно", "transaction_id": txn.id, "deducted_amount": str(debit), "fee": str(fee), "credited_amount": str(credit)}, status=200)
            except ValueError as e: return Response({"error": str(e)}, status=400)
        return Response(ser.errors, status=400)

class CardToBankView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(operation_summary="Перевод с Карты на Банк (IBAN)", request_body=CardToBankTransferSerializer, tags=["Transfers (Переводы)"])
    def post(self, request):
        ser = CardToBankTransferSerializer(data=request.data)
        if ser.is_valid():
            try:
                txn, debit, fee, credit = TransactionService.execute_card_to_bank(request.user.id, ser.validated_data['from_card_id'], ser.validated_data['to_iban'], ser.validated_data['amount_aed'])
                return Response({"message": "Успешно", "transaction_id": txn.id, "deducted_amount": str(debit), "fee": str(fee), "credited_amount": str(credit)}, status=200)
            except ValueError as e: return Response({"error": str(e)}, status=400)
        return Response(ser.errors, status=400)


class CryptoWalletWithdrawalView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Перевод с крипто-кошелька на крипто-адрес (Wallet to Wallet)",
        operation_description="Списывает USDT с вашего кошелька. Если адрес получателя найден в системе — перевод мгновенный (completed) с именем и аватаром. Если внешний — ставится в pending.",
        request_body=CryptoWalletWithdrawalRequestSerializer,
        responses={200: CryptoWalletWithdrawalResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = CryptoWalletWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = TransactionService.execute_crypto_wallet_withdrawal(
                    user_id=request.user.id,
                    from_wallet_id=serializer.validated_data['from_wallet_id'],
                    to_address=serializer.validated_data['to_address'],
                    amount_usdt=serializer.validated_data['amount_usdt'],
                    token=serializer.validated_data.get('token', 'USDT'),
                    network=serializer.validated_data.get('network', 'TRC20'),
                )
                return Response(result, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BankToCardTransferView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Перевод с IBAN на карту (включая внешние)",
        operation_description="Списывает средства с банковского счета (IBAN) пользователя и зачисляет на любую карту по номеру. Комиссия 2%.",
        request_body=BankToCardTransferRequestSerializer,
        responses={200: BankToCardTransferResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Transfers (Переводы)"]
    )
    def post(self, request):
        serializer = BankToCardTransferRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn, fee, total_debit = TransactionService.execute_bank_to_card_transfer(
                    user_id=request.user.id,
                    from_bank_account_id=serializer.validated_data['from_bank_account_id'],
                    receiver_card_number=serializer.validated_data['receiver_card_number'],
                    amount=serializer.validated_data['amount']
                )
                return Response({
                    "message": "Transfer successful",
                    "transaction_id": txn.id,
                    "amount": str(txn.amount),
                    "fee": str(fee),
                    "total_debit": str(total_debit)
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class AdminRevenueSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated] 

    @swagger_auto_schema(
        operation_summary="Отчет по заработанным комиссиям (Админ)",
        tags=["Аналитика Доходов"]
    )
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        query = FeeRevenue.objects.all()
        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)

        total_revenue = query.aggregate(total=Sum('fee_amount'))['total'] or Decimal('0.00')

        by_type_qs = query.values('fee_type').annotate(
            count=Count('id'),
            total=Sum('fee_amount')
        )
        by_type = {item['fee_type']: {"count": item['count'], "total": str(item['total'])} for item in by_type_qs}

        by_day_qs = query.annotate(date=TruncDate('created_at')).values('date').annotate(
            total=Sum('fee_amount')
        ).order_by('-date')
        
        by_day = [{"date": item['date'].isoformat(), "total": str(item['total'])} for item in by_day_qs]

        return Response({
            "total_revenue": str(total_revenue),
            "by_type": by_type,
            "by_day": by_day
        }, status=status.HTTP_200_OK)
    

class AdminRevenueTransactionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Детальный реестр комиссий (Админ)",
        tags=["Аналитика Доходов"]
    )
    def get(self, request):
        fee_type = request.query_params.get('fee_type')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        query = FeeRevenue.objects.all().order_by('-created_at')
        if fee_type:
            query = query.filter(fee_type=fee_type)

        total_count = query.count()
        records = query[offset:offset+limit]

        data = [{
            "id": r.id,
            "transaction_id": r.transaction_id,
            "user_id": r.user_id,
            "fee_type": r.fee_type,
            "fee_amount": str(r.fee_amount),
            "fee_currency": r.fee_currency,
            "fee_percent": str(r.fee_percent) if r.fee_percent else None,
            "base_amount": str(r.base_amount),
            "base_currency": r.base_currency,
            "created_at": r.created_at
        } for r in records]

        return Response({
            "count": total_count,
            "results": data
        }, status=status.HTTP_200_OK)