import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper functions for formatting
function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'top_up': 'Пополнение',
    'withdrawal': 'Вывод',
    'transfer_in': 'Входящий перевод',
    'transfer_out': 'Исходящий перевод',
    'card_payment': 'Оплата картой',
    'refund': 'Возврат',
    'fee': 'Комиссия',
    'cashback': 'Кэшбэк',
    'card_activation': 'Активация карты'
  };
  return typeMap[type] || type;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

async function fetchCardBalances(): Promise<string> {
  try {
    const BACKEND_BASE = "https://ueasycard.com/api/v1";
    const backendToken = "e88bee3a891dd71501c14de1c1c94fd3af34cb3b";

    const response = await fetch(`${BACKEND_BASE}/cards/balances/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${backendToken}`,
      },
    });

    if (!response.ok) {
      console.error("Cards API error:", response.status);
      return "Данные о картах временно недоступны.";
    }

    const data = await response.json();
    const lines: string[] = [];
    
    if (data.cards && Array.isArray(data.cards)) {
      data.cards.forEach((card: any) => {
        const typeName = card.type === 'metal' ? 'Металлическая карта' : 'Виртуальная карта';
        const last4 = card.last_four_digits ? ` (****${card.last_four_digits})` : '';
        const status = card.status === 'active' ? '✅' : '⏸️';
        lines.push(`- ${status} ${typeName}${last4}: ${card.balance} AED`);
      });
    }

    if (data.total_balance_aed !== undefined) {
      lines.push(`\n💰 Общий баланс по картам: ${data.total_balance_aed} AED`);
    }

    return lines.length > 0 ? lines.join('\n') : 'Карты не найдены.';
  } catch (err) {
    console.error("Error fetching card balances:", err);
    return "Ошибка при получении данных о картах.";
  }
}

async function fetchUserFinancialData(supabase: any, userId: string) {
  // Fetch recent transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !transactions?.length) {
    return null;
  }

  // Calculate summary
  const income = transactions
    .filter((tx: any) => tx.amount > 0)
    .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);
  
  const expenses = transactions
    .filter((tx: any) => tx.amount < 0)
    .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((tx: any) => tx.amount < 0 && tx.merchant_category)
    .forEach((tx: any) => {
      const cat = tx.merchant_category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(parseFloat(tx.amount));
    });

  // Format transactions for context with full details
  const formattedTransactions = transactions.slice(0, 10).map((tx: any, idx: number) => {
    const num = idx + 1;
    const date = formatDate(tx.created_at);
    const type = formatTransactionType(tx.type);
    const sign = tx.amount > 0 ? '+' : '';
    const amount = `${sign}${tx.amount} AED`;
    const merchant = tx.merchant_name || '';
    const category = tx.merchant_category || '';
    const desc = tx.description || '';
    const ref = tx.reference_id ? `ref:${tx.reference_id}` : '';
    const cardId = tx.card_id ? `card:${tx.card_id.slice(-4)}` : '';
    const status = tx.status || 'completed';
    
    return `- [#${num}] ${date} | ${type} | ${amount} | ${status}${merchant ? ` | ${merchant}` : ''}${category ? ` | кат: ${category}` : ''}${cardId ? ` | ${cardId}` : ''}${ref ? ` | ${ref}` : ''}${desc ? ` | ${desc}` : ''}`;
  }).join('\n');

  // Format categories
  const formattedCategories = Object.entries(categoryTotals)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([cat, amount]) => `- ${cat}: ${(amount as number).toFixed(2)} AED`)
    .join('\n');

  return {
    balance: {
      total: (income - expenses).toFixed(2),
      income: income.toFixed(2),
      expenses: expenses.toFixed(2)
    },
    transactions: formattedTransactions,
    categories: formattedCategories,
    transactionCount: transactions.length
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id, external_user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Determine user ID for fetching financial data
    // Priority: explicit user_id > external_user_id mapping > demo user
    let effectiveUserId = user_id || '00000000-0000-0000-0000-000000000001';
    
    if (external_user_id && !user_id) {
      // Map external user ID to Supabase UUID (same mapping as get-transactions)
      const externalUserMapping: Record<number, string> = {
        1: '00000000-0000-0000-0000-000000000001',
      };
      effectiveUserId = externalUserMapping[parseInt(external_user_id)] || effectiveUserId;
    }

    console.log(`Fetching financial data for user: ${effectiveUserId}`);
    
    // Fetch user's financial data and card balances in parallel
    const [financialData, cardBalancesText] = await Promise.all([
      fetchUserFinancialData(supabase, effectiveUserId),
      fetchCardBalances(),
    ]);
    
    // Build dynamic context with real user data
    let userDataContext = `

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (АКТУАЛЬНЫЕ)
### Балансы карт:
${cardBalancesText}`;

    if (financialData) {
      userDataContext += `

### Последние транзакции:
${financialData.transactions}

### Расходы по категориям:
${financialData.categories || 'Нет данных по категориям'}

Всего транзакций: ${financialData.transactionCount}`;
    }

    console.log("Sending request to AI gateway with", messages.length, "messages");

    const systemPrompt = `Ты - дружелюбный AI-ассистент для финансового приложения Easy Card. Отвечай кратко и по делу на языке пользователя. Используй эмодзи для дружелюбности.

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
- Поддерживаются сети TRC20 и ERC20 для крипто-пополнений

## Формат вывода транзакций
Когда пользователь спрашивает о транзакциях, выводи их СПИСКОМ, группируя по дате. НЕ используй таблицы. Формат:

📅 **17.01.2026**

- ✅ **Пополнение** — +28,000.00 AED
  Карта: ****8646 | Статус: завершено

- ❌ **Оплата картой** — -1,890.00 AED
  Магазин: Carrefour | Карта: ****2207

📊 Итого за день: +26,110.00 AED

Если транзакций за несколько дней - группируй каждый день отдельно с итогами.
${userDataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
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
