from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import (
    BankTopupRequestSerializer, BankTopupResponseSerializer,
    CryptoTopupRequestSerializer, CryptoTopupResponseSerializer,
    CardTransferRequestSerializer, CardTransferResponseSerializer,
    CryptoWithdrawalRequestSerializer, CryptoWithdrawalResponseSerializer,
    BankWithdrawalRequestSerializer, BankWithdrawalResponseSerializer,
    ErrorResponseSerializer
)
from apps.transactions_apps.services import TransactionService

class BankTopupView(APIView):
    @swagger_auto_schema(
        operation_summary="Инициация банковского пополнения (Bank Wire)",
        operation_description=(
            "Создает заявку на пополнение в статусе pending и возвращает банковские реквизиты компании.\n\n"
            " **АКТИВНЫЕ ЗАГЛУШКИ (STUBS):**\n"
            "* **Auth**: `user_id` генерируется случайно. В будущем будет браться из JWT `request.user.id`.\n"
            "* **Matching**: Завершение транзакции будет реализовано позже через прием Webhook от банка."
        ),
        request_body=BankTopupRequestSerializer,
        responses={201: BankTopupResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = BankTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4() # ЗАГЛУШКА
                topup = TransactionService.initiate_bank_topup(
                    user_id=user_id,
                    transfer_rail=serializer.validated_data['transfer_rail']
                )
                return Response({
                    "message": "Topup initiated",
                    "transaction_id": topup.transaction.id,
                    "instructions": topup.instructions_snapshot
                }, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CryptoTopupView(APIView):
    @swagger_auto_schema(
        operation_summary="Инициация пополнения стейблкоинами (Crypto Topup)",
        operation_description=(
            "Генерирует уникальный крипто-адрес для пополнения баланса карты.\n\n"
            " **АКТИВНЫЕ ЗАГЛУШКИ (STUBS):**\n"
            "* **Auth**: `user_id` генерируется случайно (будет заменен на JWT).\n"
            "* **Крипто-адрес**: Сейчас `deposit_address` генерируется как случайная строка. В будущем метод будет делать API-вызов к провайдеру (Tatum/Fireblocks) для генерации реального адреса кошелька в сети TRC20/ERC20.\n"
            "* **Комиссии**: Минимальная сумма (10.00) и комиссия (1.5%) захардкожены в сервисе."
        ),
        request_body=CryptoTopupRequestSerializer,
        responses={201: CryptoTopupResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = CryptoTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            import uuid
            user_id = uuid.uuid4() # ЗАГЛУШКА
            topup = TransactionService.initiate_crypto_topup(
                user_id=user_id,
                card_id=serializer.validated_data['card_id'],
                token=serializer.validated_data['token'],
                network=serializer.validated_data['network']
            )
            return Response({
                "message": "Crypto address generated",
                "deposit_address": topup.deposit_address,
                "qr_payload": topup.qr_payload
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CardTransferView(APIView):
    @swagger_auto_schema(
        operation_summary="Перевод с карты на карту (Внутренний)",
        operation_description=(
            "Моментальный перевод средств между картами внутри системы.\n\n"
            " **АКТИВНЫЕ ЗАГЛУШКИ (STUBS):**\n"
            "* **Auth**: `sender_id` генерируется случайно. Будет заменен на JWT.\n"
            "* Логика блокировки балансов (`select_for_update`) уже РЕАЛЬНАЯ и готова к проду."
        ),
        request_body=CardTransferRequestSerializer,
        responses={200: CardTransferResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Transfers (Переводы)"]
    )
    def post(self, request):
        serializer = CardTransferRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                sender_id = uuid.uuid4() # ЗАГЛУШКА
                txn = TransactionService.execute_card_transfer(
                    sender_id=sender_id,
                    sender_card_id=serializer.validated_data['sender_card_id'],
                    receiver_card_number=serializer.validated_data['receiver_card_number'],
                    amount=serializer.validated_data['amount']
                )
                return Response({
                    "message": "Transfer successful",
                    "transaction_id": txn.id,
                    "amount": txn.amount
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CryptoWithdrawalView(APIView):
    @swagger_auto_schema(
        operation_summary="Вывод средств на криптокошелек",
        operation_description=(
            "Списывает фиат с карты (AED) и создает заявку на вывод в стейблкоинах.\n\n"
            " **АКТИВНЫЕ ЗАГЛУШКИ (STUBS):**\n"
            "* **Auth**: `user_id` генерируется случайно.\n"
            "* **Market Data**: Курс обмена (`3.67`) и комиссия сети (`1.50 USDT`) захардкожены в `TransactionService`. Позже будут подтягиваться через API Binance или Redis-кэш.\n"
            "* **Отправка провайдеру**: Сейчас транзакция просто сохраняется в БД со статусом `pending`. Фактическая отправка транзакции в блокчейн будет реализована позже через брокер задач (Celery)."
        ),
        request_body=CryptoWithdrawalRequestSerializer,
        responses={200: CryptoWithdrawalResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = CryptoWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4() # ЗАГЛУШКА
                withdrawal = TransactionService.execute_crypto_withdrawal(
                    user_id=user_id,
                    card_id=serializer.validated_data['from_card_id'],
                    token=serializer.validated_data['token'],
                    network=serializer.validated_data['network'],
                    to_address=serializer.validated_data['to_address'],
                    amount_crypto=serializer.validated_data['amount_crypto']
                )
                return Response({
                    "message": "Withdrawal processing",
                    "transaction_id": withdrawal.transaction.id,
                    "total_debit_crypto": withdrawal.total_debit
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BankWithdrawalView(APIView):
    @swagger_auto_schema(
        operation_summary="Вывод на банковский счет (Bank Wire AED)",
        operation_description=(
            "Списывает средства с карты и формирует заявку на банковский перевод (SWIFT/Local).\n\n"
            " **АКТИВНЫЕ ЗАГЛУШКИ (STUBS):**\n"
            "* **Auth**: `user_id` генерируется случайно.\n"
            "* **Интеграция с банком**: Транзакция сохраняется в БД, но автоматическая отправка платежного поручения по API в банк пока не реализована. Будет добавлена позже через фоновую задачу."
        ),
        request_body=BankWithdrawalRequestSerializer,
        responses={200: BankWithdrawalResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = BankWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4() # ЗАГЛУШКА
                withdrawal = TransactionService.execute_bank_withdrawal(
                    user_id=user_id,
                    card_id=serializer.validated_data['from_card_id'],
                    iban=serializer.validated_data['iban'],
                    beneficiary_name=serializer.validated_data['beneficiary_name'],
                    bank_name=serializer.validated_data['bank_name'],
                    amount_aed=serializer.validated_data['amount_aed']
                )
                return Response({
                    "message": "Bank wire processing",
                    "transaction_id": withdrawal.transaction.id,
                    "fee_amount": withdrawal.fee_amount,
                    "total_debit_aed": withdrawal.total_debit
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)