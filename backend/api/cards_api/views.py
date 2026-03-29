from api.transactions_api.serializers import AdminTransactionSerializerDirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.cards_apps.models import Cards
from apps.transactions_apps.models import Transactions, BankDepositAccounts # <-- Добавили импорт BankDepositAccounts
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from decimal import Decimal
from django.db.models import Q


class UserBalancesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Получить балансы пользователя по картам",
        operation_description="Возвращает общий баланс в AED и детализацию по картам.",
        tags=["Cards"]
    )
    def get(self, request):
        user_id = str(request.user.id)
        cards = Cards.objects.filter(user_id=user_id)
        cards_data = []
        total_balance = Decimal('0.00')
        
        for card in cards:
            total_balance += card.balance
            cards_data.append({
                "card_id": card.id,
                "type": card.type,
                "balance": f"{card.balance:.2f}",
                "last_four_digits": card.last_four_digits,
                "status": card.status
            })
            
        return Response({
            "user_id": user_id,
            "total_balance_aed": f"{total_balance:.2f}",
            "cards": cards_data
        }, status=status.HTTP_200_OK)


class UserIbanView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Получить банковский счёт (IBAN) и баланс",
        operation_description="Берет реальный IBAN из БД. Если счета еще нет, возвращает null.",
        tags=["Wallet & Cards"]
    )
    def get(self, request):
        user_id = str(request.user.id)
        account = BankDepositAccounts.objects.filter(user_id=user_id, is_active=True).first()
        
        if account:
            return Response({
                "iban": account.iban,
                "currency": "AED",
                "balance": f"{account.balance:.2f}"
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "iban": None,
                "currency": "AED",
                "balance": "0.00"
            }, status=status.HTTP_200_OK)


class UserCardsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Посмотреть карты и балансы",
        tags=["Wallet & Cards"]
    )
    def get(self, request):
        cards = Cards.objects.filter(user_id=str(request.user.id))
        cards_data = []
        for card in cards:
            cards_data.append({
                "type": card.type,
                "card_number": card.card_number_encrypted,
                "currency": "AED",
                "balance": f"{card.balance:.2f}"
            })
            
        return Response({"cards": cards_data}, status=status.HTTP_200_OK)


class WalletSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Сводка по кошельку (Счёт + Карты)",
        operation_description="Сводка с реальными данными из БД.",
        tags=["Wallet & Cards"]
    )
    def get(self, request):
        user_id = str(request.user.id)
        cards = Cards.objects.filter(user_id=user_id)
        cards_data = []
        for card in cards:
            cards_data.append({
                "id": card.id,
                "type": card.type,
                "card_number": card.card_number_encrypted,
                "currency": "AED",
                "balance": f"{card.balance:.2f}"
            })
        account = BankDepositAccounts.objects.filter(user_id=user_id, is_active=True).first()
        
        if account:
            physical_account = {
                "iban": account.iban,
                "balance": f"{account.balance:.2f}",
                "currency": "AED"
            }
        else:
            physical_account = {
                "iban": None,
                "balance": "0.00",
                "currency": "AED"
            }
            
        return Response({
            "physical_account": physical_account,
            "cards": cards_data
        }, status=status.HTTP_200_OK)
    

class CardTransactionsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="История транзакций по ID карты",
        tags=["Cards"]
    )
    def get(self, request, card_id):
        card = Cards.objects.filter(id=card_id, user_id=str(request.user.id)).first()
        if not card:
            return Response({"error": "Карта не найдена или доступ запрещен"}, status=status.HTTP_404_NOT_FOUND)
            
        transactions_qs = Transactions.objects.filter(
            Q(card_id=card.id) | 
            Q(sender_card=card.card_number_encrypted) | 
            Q(recipient_card=card.card_number_encrypted)
        ).order_by('-created_at')
        
        serializer = AdminTransactionSerializerDirect(
            transactions_qs, 
            many=True, 
            context={'target_user_id': str(request.user.id)}
        )

        return Response({
            "card_id": card_id, 
            "transactions": serializer.data
        }, status=status.HTTP_200_OK)