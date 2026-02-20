from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
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
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Инициация банковского пополнения (Bank Wire)",
        operation_description=(
            "Создает заявку на пополнение в статусе pending и возвращает банковские реквизиты компании для осуществления перевода.\n\n"
            "Требует передачи валидного токена авторизации. Завершение транзакции и фактическое зачисление средств происходят асинхронно после получения подтверждения (Webhook) от банка-эмитента."
        ),
        request_body=BankTopupRequestSerializer,
        responses={201: BankTopupResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = BankTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                topup = TransactionService.initiate_bank_topup(
                    user_id=request.user.id,
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
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Инициация пополнения стейблкоинами (Crypto Topup)",
        operation_description=(
            "Генерирует уникальный криптографический адрес для пополнения баланса карты в выбранной сети.\n\n"
            "Требует передачи валидного токена авторизации. На текущем этапе архитектуры формирование адреса эмулируется. Интеграция с провайдерами ликвидности (Fireblocks/Tatum) для генерации реальных адресов находится в стадии внедрения."
        ),
        request_body=CryptoTopupRequestSerializer,
        responses={201: CryptoTopupResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = CryptoTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            topup = TransactionService.initiate_crypto_topup(
                user_id=request.user.id,
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
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Внутренний перевод средств (Card to Card)",
        operation_description=(
            "Осуществляет моментальный перевод средств между расчетными счетами внутри закрытого контура платформы.\n\n"
            "Требует передачи валидного токена авторизации. Применяется строгая транзакционная блокировка базы данных (select_for_update) для исключения состояния гонки (race condition)."
        ),
        request_body=CardTransferRequestSerializer,
        responses={200: CardTransferResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Transfers (Переводы)"]
    )
    def post(self, request):
        serializer = CardTransferRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = TransactionService.execute_card_transfer(
                    sender_id=request.user.id,
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
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Вывод средств на сторонний криптокошелек",
        operation_description=(
            "Регистрирует дебетовую операцию по фиатному счету (AED) и инициирует заявку на отправку эквивалента в цифровых активах.\n\n"
            "Требует передачи валидного токена авторизации. Фактическая передача подписанной транзакции в блокчейн-сеть делегируется асинхронным фоновым процессам."
        ),
        request_body=CryptoWithdrawalRequestSerializer,
        responses={200: CryptoWithdrawalResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = CryptoWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                withdrawal = TransactionService.execute_crypto_withdrawal(
                    user_id=request.user.id,
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
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Вывод средств на банковский счет (Bank Wire)",
        operation_description=(
            "Формирует поручение на классический банковский перевод (SWIFT или локальный клиринг) с удержанием средств с баланса карты.\n\n"
            "Требует передачи валидного токена авторизации. Автоматизированный шлюз маршрутизации платежных поручений находится в стадии интеграции."
        ),
        request_body=BankWithdrawalRequestSerializer,
        responses={200: BankWithdrawalResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = BankWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                withdrawal = TransactionService.execute_bank_withdrawal(
                    user_id=request.user.id,
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


class TransactionReceiptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Получить выписку (Квитанцию) по транзакции",
        operation_description=(
            "Возвращает структурированный отчет по конкретной финансовой операции. Метод осуществляет проверку прав доступа.\n\n"
            "Формат ответа динамически адаптируется под тип транзакции:\n"
            "- Входящий банковский перевод (Bank Topup).\n"
            "- Входящий криптовалютный перевод (Crypto Topup).\n"
            "- Внутренний перевод (Card Transfer).\n"
            "- Исходящий криптовалютный перевод (Crypto Withdrawal).\n"
            "- Исходящий банковский перевод (Bank Withdrawal)."
        ),
        responses={
            200: openapi.Response(
                description="Детали транзакции",
                examples={
                    "application/json": {
                        "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "completed",
                        "date_time": "2026-02-19T20:00:00Z",
                        "operation": "Internal Card Transfer",
                        "amount": "100.00",
                        "fee": "0.00",
                        "sender_card_mask": "**** 1234",
                        "receiver_card_mask": "**** 5678",
                        "recipient_name": "EasyCard User"
                    }
                }
            ),
            400: ErrorResponseSerializer,
            404: openapi.Response(description="Транзакция не найдена")
        },
        tags=["Receipts (Квитанции)"]
    )
    def get(self, request, transaction_id):
        try:
            receipt_data = TransactionService.get_transaction_receipt(transaction_id=transaction_id)
            return Response(receipt_data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Внутренняя ошибка: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)