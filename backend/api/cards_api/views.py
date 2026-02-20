from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.cards_apps.models import Cards
from drf_yasg.utils import swagger_auto_schema

class UserBalancesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    @swagger_auto_schema(
        operation_summary="Получить балансы пользователя",
        operation_description="Возвращает общий баланс в AED и детализацию по картам. Требует передачи токена авторизации в заголовке.",
        tags=["Cards"]
    )
    def get(self, request):
        user_id = request.user.id
        cards = Cards.objects.filter(user_id=user_id)
        cards_data = []
        total_balance = 0
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