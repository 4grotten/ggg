from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.cards_apps.models import Cards
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from decimal import Decimal

def get_user_tail(user_id):
    return str(user_id).zfill(6)[-6:]


class UserBalancesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Получить балансы пользователя (Legacy)",
        operation_description="Возвращает общий баланс в AED и детализацию по картам. Требует передачи токена авторизации в заголовке.",
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
                "balance": card.balance,
                "last_four_digits": card.last_four_digits,
                "status": card.status
            })
            
        return Response({
            "user_id": user_id,
            "total_balance_aed": total_balance,
            "cards": cards_data
        }, status=status.HTTP_200_OK)


class UserIbanView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Получить банковский счёт (IBAN) и баланс",
        operation_description="Возвращает уникальный IBAN пользователя (генерируется по шаблону ОАЭ) и общую сумму балансов всех карт в AED.",
        tags=["Wallet & Cards"]
    )
    def get(self, request):
        tail = get_user_tail(request.user.id)
        iban = f"AE070331234567890{tail}"
        
        cards = Cards.objects.filter(user_id=str(request.user.id))
        total_balance = sum((card.balance for card in cards), Decimal('0.00'))
        
        return Response({
            "iban": iban,
            "currency": "AED",
            "balance": f"{total_balance:.2f}"
        }, status=status.HTTP_200_OK)


class UserCardsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Посмотреть карты и балансы",
        operation_description="Возвращает список всех карт пользователя (Metal и Virtual). Номера карт состоят из 16 цифр.",
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
        operation_description="Возвращает объединенную информацию: общий банковский счет (IBAN) и детализацию по выпущенным картам одним запросом.",
        tags=["Wallet & Cards"]
    )
    def get(self, request):
        tail = get_user_tail(request.user.id)
        iban = f"AE070331234567890{tail}"
        
        cards = Cards.objects.filter(user_id=str(request.user.id))
        total_balance = sum((card.balance for card in cards), Decimal('0.00'))
        
        cards_data = []
        for card in cards:
            cards_data.append({
                "type": card.type,
                "card_number": card.card_number_encrypted,
                "currency": "AED",
                "balance": f"{card.balance:.2f}"
            })
            
        return Response({
            "physical_account": {
                "iban": iban,
                "balance": f"{total_balance:.2f}",
                "currency": "AED"
            },
            "cards": cards_data
        }, status=status.HTTP_200_OK)