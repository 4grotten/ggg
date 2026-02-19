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
        operation_description="Создает заявку на пополнение в статусе pending и возвращает банковские реквизиты компании для перевода средств. Транзакция будет завершена после получения вебхука от банка.",
        request_body=BankTopupRequestSerializer,
        responses={
            201: openapi.Response("Успешная инициация", BankTopupResponseSerializer),
            400: openapi.Response("Ошибка валидации", ErrorResponseSerializer)
        },
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = BankTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4() # TODO: заменить на request.user.id
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
        operation_description="Генерирует уникальный крипто-адрес (USDT/USDC) в выбранной сети для пополнения баланса карты.",
        request_body=CryptoTopupRequestSerializer,
        responses={
            201: openapi.Response("Адрес успешно сгенерирован", CryptoTopupResponseSerializer),
            400: openapi.Response("Ошибка валидации", ErrorResponseSerializer)
        },
        tags=["Topups (Пополнения)"]
    )
    def post(self, request):
        serializer = CryptoTopupRequestSerializer(data=request.data)
        if serializer.is_valid():
            import uuid
            user_id = uuid.uuid4()
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
        operation_description="Моментальный перевод средств между картами внутри экосистемы EasyCard. Использует строгую блокировку БД (Atomic lock) для избежания двойных трат.",
        request_body=CardTransferRequestSerializer,
        responses={
            200: openapi.Response("Перевод успешно выполнен", CardTransferResponseSerializer),
            400: openapi.Response("Недостаточно средств или неверная карта", ErrorResponseSerializer)
        },
        tags=["Transfers (Переводы)"]
    )
    def post(self, request):
        serializer = CardTransferRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                sender_id = uuid.uuid4()
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
        operation_description="Списывает фиат с карты (AED), конвертирует и отправляет стейблкоины на внешний криптокошелек.",
        request_body=CryptoWithdrawalRequestSerializer,
        responses={
            200: openapi.Response("Заявка на вывод в обработке", CryptoWithdrawalResponseSerializer),
            400: openapi.Response("Недостаточно средств", ErrorResponseSerializer)
        },
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = CryptoWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4()
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
        operation_description="Списывает средства с карты с учетом комиссии 2% и формирует заявку на банковский перевод по реквизитам IBAN в ОАЭ.",
        request_body=BankWithdrawalRequestSerializer,
        responses={
            200: openapi.Response("Банковский перевод в обработке", BankWithdrawalResponseSerializer),
            400: openapi.Response("Недостаточно средств или неверный IBAN", ErrorResponseSerializer)
        },
        tags=["Withdrawals (Выводы)"]
    )
    def post(self, request):
        serializer = BankWithdrawalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                import uuid
                user_id = uuid.uuid4()
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