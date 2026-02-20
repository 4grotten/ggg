from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.cards_apps.models import Cards
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


user_id_param = openapi.Parameter(
    'user_id', 
    openapi.IN_QUERY, 
    description="ХАК ДЛЯ ТЕСТОВ: Вставьте сюда UUID пользователя, если не используете JWT-токен авторизации", 
    type=openapi.TYPE_STRING,
    required=False
)

class UserBalancesView(APIView):
    @swagger_auto_schema(
        operation_summary="Получить балансы пользователя",
        operation_description="Возвращает общий баланс в AED и детализацию по всем картам.\n\n** У всех тестовых аккаунтов баланс искусственно установлен на 100,000 AED.",
        manual_parameters=[user_id_param],
        responses={
            200: openapi.Response(
                description="Успешно",
                examples={
                    "application/json": {
                        "total_balance_aed": "100000.00",
                        "cards": [
                            {
                                "card_id": "uuid",
                                "type": "virtual",
                                "name": "EasyCard Virtual",
                                "balance": "50000.00",
                                "last_four_digits": "1234",
                                "status": "active"
                            }
                        ]
                    }
                }
            )
        },
        tags=["Cards (Карты)"]
    )
    def get(self, request):
        user_id = request.user.id if request.user and request.user.is_authenticated else None
        if not user_id:
            user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"error": "Необходима авторизация или передача user_id"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        cards = Cards.objects.filter(user_id=user_id)
        cards_data = []
        total_balance = 0
        for card in cards:
            total_balance += card.balance
            cards_data.append({
                "card_id": card.id,
                "type": card.type,
                "name": card.name,
                "balance": card.balance,
                "last_four_digits": card.last_four_digits,
                "status": card.status
            })
        return Response({
            "user_id": user_id,
            "total_balance_aed": total_balance,
            "cards": cards_data
        }, status=status.HTTP_200_OK)