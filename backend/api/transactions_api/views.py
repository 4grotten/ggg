from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Q
from django.contrib.auth.models import User

from apps.cards_apps.models import Cards
from apps.transactions_apps.models import Transactions, BankDepositAccounts, CryptoWallets

from .serializers import (
    BankTopupRequestSerializer, BankTopupResponseSerializer,
    CryptoTopupRequestSerializer, CryptoTopupResponseSerializer,
    CardTransferRequestSerializer, CardTransferResponseSerializer,
    CryptoWithdrawalRequestSerializer, CryptoWithdrawalResponseSerializer,
    BankWithdrawalRequestSerializer, BankWithdrawalResponseSerializer,
    BankToCardTransferRequestSerializer, BankToCardTransferResponseSerializer,
    ErrorResponseSerializer
)
from apps.transactions_apps.services import TransactionService


class RecipientInfoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Получить ФИО и тип карты по номеру",
        operation_description="Вбиваешь номер карты, получаешь Имя Фамилию получателя и тип (metal/virtual).",
        manual_parameters=[
            openapi.Parameter('card_number', openapi.IN_QUERY, description="Номер карты получателя", type=openapi.TYPE_STRING, required=True)
        ],
        responses={200: openapi.Response("Данные получателя"), 404: "Карта не найдена"},
        tags=["Инфо (Получатели)"]
    )
    def get(self, request):
        card_number = request.query_params.get('card_number')
        if not card_number:
            return Response({"error": "card_number is required"}, status=status.HTTP_400_BAD_REQUEST)
        card = Cards.objects.filter(card_number_encrypted=card_number).first()
        if not card:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        user = User.objects.filter(id=card.user_id).first()
        recipient_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown User"
        return Response({
            "recipient_name": recipient_name,
            "card_type": card.type
        }, status=status.HTTP_200_OK)

class AllTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Все транзакции пользователя (Главная страница)",
        operation_description="Возвращает абсолютно все транзакции юзера (отправки, получения, карты, банк, крипта).",
        tags=["Транзакции (Списки)"]
    )
    def get(self, request):
        txs = Transactions.objects.filter(Q(user_id=str(request.user.id))).order_by('-created_at')
        data = [{
            "id": tx.id,
            "type": tx.type,
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "created_at": tx.created_at,
            "description": tx.description
        } for tx in txs]
        return Response(data, status=status.HTTP_200_OK)

class IBANTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Транзакции по IBAN (Банковский счет)",
        operation_description="Транзакции, относящиеся исключительно к банковским операциям пользователя.",
        tags=["Транзакции (Списки)"]
    )
    def get(self, request):
        txs = Transactions.objects.filter(
            user_id=str(request.user.id), 
            type__icontains='bank'
        ).order_by('-created_at')
        data = [{"id": tx.id, "type": tx.type, "amount": tx.amount, "status": tx.status, "created_at": tx.created_at} for tx in txs]
        return Response(data, status=status.HTTP_200_OK)

class CardTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Транзакции по Картам (Metal & Virtual)",
        operation_description="Фильтрует транзакции привязанные к Metal и Virtual картам.",
        tags=["Транзакции (Списки)"]
    )
    def get(self, request):
        txs = Transactions.objects.filter(
            user_id=str(request.user.id), 
            card__isnull=False
        ).order_by('-created_at')
        data = [{"id": tx.id, "card_id": tx.card_id, "type": tx.type, "amount": tx.amount, "status": tx.status, "created_at": tx.created_at} for tx in txs]
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
                withdrawal = TransactionService.execute_bank_withdrawal(user_id=request.user.id, card_id=serializer.validated_data['from_card_id'], iban=serializer.validated_data['iban'], beneficiary_name=serializer.validated_data['beneficiary_name'], bank_name=serializer.validated_data['bank_name'], amount_aed=serializer.validated_data['amount_aed'])
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


class InternalTransferView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Внутренний перевод (Своп между своими счетами)",
        operation_description="Позволяет гонять деньги между 4 счетами: card, bank, crypto. Автоматически конвертирует USDT <-> AED (Курс 3.67). Берет комиссию 1 USDT при отправке с крипты.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['from_type', 'from_id', 'to_type', 'to_id', 'amount'],
            properties={
                'from_type': openapi.Schema(type=openapi.TYPE_STRING, description="card | bank | crypto"),
                'from_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID счета-источника (UUID)"),
                'to_type': openapi.Schema(type=openapi.TYPE_STRING, description="card | bank | crypto"),
                'to_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID счета-получателя (UUID)"),
                'amount': openapi.Schema(type=openapi.TYPE_STRING, description="Сумма списания (в валюте источника)"),
            }
        ),
        tags=["Transfers (Переводы)"]
    )
    def post(self, request):
        data = request.data
        try:
            txn, converted_amount, fee = TransactionService.execute_internal_transfer(
                user_id=request.user.id,
                from_type=data.get('from_type'),
                from_id=data.get('from_id'),
                to_type=data.get('to_type'),
                to_id=data.get('to_id'),
                amount=data.get('amount')
            )
            return Response({
                "message": "Внутренний перевод успешно выполнен",
                "transaction_id": txn.id,
                "deducted_amount": str(data.get('amount')),
                "fee": str(fee),
                "credited_amount": str(converted_amount)
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Системная ошибка: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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