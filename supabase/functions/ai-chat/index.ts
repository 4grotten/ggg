import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Sending request to AI gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { 
            role: "system", 
            content: `Ты - дружелюбный AI-ассистент для финансового приложения Easy Card. Отвечай кратко и по делу на языке пользователя. Используй эмодзи для дружелюбности.

## О Easy Card
Easy Card - это финансовое приложение для управления виртуальными и металлическими картами в ОАЭ (валюта AED - дирхамы).

## Типы карт
1. **Виртуальная карта** - мгновенный выпуск, идеально для онлайн-покупок
2. **Металлическая карта** - премиум карта с доставкой, статусная и долговечная

## Комиссии (в AED)
### Единоразовые комиссии:
- Годовое обслуживание виртуальной карты: 183 AED
- Перевыпуск виртуальной карты: 183 AED  
- Годовое обслуживание металлической карты: 183 AED
- Перевыпуск металлической карты: 183 AED
- Открытие виртуального счета: 183 AED

### Пополнение баланса:
- Криптовалютой (USDT): фиксированная комиссия 5.90 USDT
- Банковским переводом: 1.5%
- Минимальная сумма пополнения криптой: 15 USDT
- Минимальная сумма пополнения банком: 50 AED

### Переводы:
- С карты на карту: 1%
- Банковский перевод: 2%
- Сетевая комиссия: 1%

### Транзакции:
- Конвертация валюты: 1.5%

## Курсы обмена
- Пополнение: 1 USDT = 3.65 AED
- Вывод: 1 USDT = 3.69 AED

## Функции приложения
- 💳 Управление картами (виртуальные и металлические)
- 💰 Пополнение баланса (криптой USDT или банковским переводом)
- 📤 Переводы (на карту, на банк, криптой)
- 📊 История транзакций
- ⚙️ Настройка лимитов
- 🔐 Верификация личности (KYC)
- 🌐 Мультиязычность (EN, RU, AR, DE, ES, TR, ZH)

## Важно
- Все карты работают в валюте AED (дирхамы ОАЭ)
- Для использования карт нужно пройти верификацию
- Поддерживаются сети TRC20 и ERC20 для крипто-пополнений` 
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Требуется пополнение баланса AI." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully received streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Неизвестная ошибка" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
