import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

async function fetchUserAccountDetail(userToken: string, userId: string | number): Promise<string> {
  try {
    const url = `https://ueasycard.com/api/v1/accounts/open/users/${userId}/detail/`;
    console.log("Fetching user account detail from:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${userToken}`,
      },
    });

    if (!response.ok) {
      console.error("User detail API error:", response.status);
      return "Данные аккаунта временно недоступны.";
    }

    const data = await response.json();
    console.log("User account detail keys:", Object.keys(data));

    const lines: string[] = [];

    if (data.first_name || data.last_name) {
      lines.push(`👤 Имя: ${[data.first_name, data.last_name].filter(Boolean).join(' ')}`);
    }
    if (data.email) lines.push(`📧 Email: ${data.email}`);
    if (data.phone) lines.push(`📱 Телефон: ${data.phone}`);
    if (data.balance !== undefined) lines.push(`💰 Баланс счёта: ${data.balance} AED`);
    if (data.status) lines.push(`📋 Статус аккаунта: ${data.status}`);
    if (data.is_verified !== undefined) lines.push(`✅ Верификация: ${data.is_verified ? 'Пройдена' : 'Не пройдена'}`);
    if (data.created_at) lines.push(`📅 Дата регистрации: ${formatDate(data.created_at)}`);

    // Include any IBAN/bank details
    if (data.iban) lines.push(`🏦 IBAN: ${data.iban}`);
    if (data.bank_name) lines.push(`🏦 Банк: ${data.bank_name}`);
    if (data.account_number) lines.push(`🔢 Номер счёта: ${data.account_number}`);

    // Include any additional fields dynamically
    const knownKeys = new Set(['first_name', 'last_name', 'email', 'phone', 'balance', 'status', 'is_verified', 'created_at', 'iban', 'bank_name', 'account_number', 'id', 'avatar', 'avatar_url', 'password', 'token']);
    for (const [key, value] of Object.entries(data)) {
      if (!knownKeys.has(key) && value !== null && value !== undefined && typeof value !== 'object') {
        lines.push(`ℹ️ ${key}: ${value}`);
      }
    }

    return lines.length > 0 ? lines.join('\n') : 'Нет данных аккаунта.';
  } catch (err) {
    console.error("Error fetching user account detail:", err);
    return "Ошибка при получении данных аккаунта.";
  }
}

async function fetchAllBalances(userToken?: string): Promise<string> {
  if (!userToken) return "Данные о балансах недоступны (нет токена).";

  const BACKEND_BASE = "https://ueasycard.com/api/v1";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Token ${userToken}`,
  };

  const [walletRes, cryptoRes] = await Promise.allSettled([
    fetch(`${BACKEND_BASE}/cards/wallet/summary/`, { method: "GET", headers }),
    fetch(`${BACKEND_BASE}/transactions/crypto-wallets/`, { method: "GET", headers }),
  ]);

  const cardLines: string[] = [];
  const bankLines: string[] = [];
  const cryptoLines: string[] = [];
  let cardsTotal = 0;

  // 1. Cards and bank account from wallet summary
  try {
    if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
      const wallet = await walletRes.value.json();
      const data = wallet.data || wallet;

      // Cards first
      if (data.cards && Array.isArray(data.cards)) {
        data.cards.forEach((card: any) => {
          const typeName = card.type === 'metal' ? 'Металлическая карта' : 'Виртуальная карта';
          const last4 = card.card_number ? ` (****${card.card_number.slice(-4)})` : '';
          const balance = parseFloat(card.balance) || 0;
          cardsTotal += balance;
          cardLines.push(`💳 ${typeName}${last4}: ${card.balance} ${card.currency || 'AED'}`);
        });
      }

      // Bank account (IBAN)
      if (data.physical_account) {
        const pa = data.physical_account;
        bankLines.push(`🏦 Банковский счёт: ${pa.balance} ${pa.currency || 'AED'}`);
      }
    } else {
      cardLines.push('💳 Данные о картах временно недоступны.');
    }
  } catch (e) {
    console.error("Error parsing wallet summary:", e);
    cardLines.push('💳 Ошибка при получении данных о картах.');
  }

  // 2. Crypto wallets
  try {
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
      const cryptoData = await cryptoRes.value.json();
      const wallets = cryptoData.data || cryptoData;
      if (Array.isArray(wallets) && wallets.length > 0) {
        wallets.forEach((w: any) => {
          const network = w.network || 'TRC20';
          const token = w.token || 'USDT';
          cryptoLines.push(`🪙 ${token} (${network}): ${w.balance} ${token}`);
        });
      }
    }
  } catch (e) {
    console.error("Error parsing crypto wallets:", e);
  }

  // Compose structured output - each card on separate line
  const result: string[] = [];
  
  if (cardLines.length > 0) {
    cardLines.forEach(line => {
      result.push(line);
      result.push(''); // empty line between cards
    });
    if (cardsTotal > 0) {
      result.push(`💰 Итого на картах: ${cardsTotal.toFixed(2)} AED`);
      result.push('');
    }
  }
  
  if (bankLines.length > 0) {
    result.push(...bankLines);
    result.push('');
  }
  
  if (cryptoLines.length > 0) {
    result.push(...cryptoLines);
  }

  return result.length > 0 ? result.join('\n') : 'Балансы не найдены.';
}

async function fetchTransactionsFromApi(userToken?: string): Promise<string> {
  if (!userToken) return "Данные о транзакциях недоступны (нет токена).";

  try {
    const BACKEND_BASE = "https://ueasycard.com/api/v1";
    const response = await fetch(`${BACKEND_BASE}/transactions/all/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${userToken}`,
      },
    });

    if (!response.ok) {
      console.error("Transactions API error:", response.status);
      return "Данные о транзакциях временно недоступны.";
    }

    const rawData = await response.json();
    const transactions = Array.isArray(rawData) ? rawData : (rawData?.results || rawData?.data || []);

    if (!transactions.length) {
      return "Транзакций пока нет.";
    }

    // Format last 20 transactions
    const formatted = transactions.slice(0, 20).map((tx: any, idx: number) => {
      const num = idx + 1;
      const date = tx.created_at ? formatDate(tx.created_at) : '';
      
      // Use display block if available (backend pre-formatted)
      if (tx.display) {
        const d = tx.display;
        const title = d.title || tx.type || '';
        const subtitle = d.subtitle || '';
        const amount = d.primary_amount 
          ? `${d.primary_amount.sign || ''}${d.primary_amount.amount} ${d.primary_amount.currency || 'AED'}`
          : `${tx.amount} AED`;
        return `- [#${num}] ${date} | ${title} | ${amount}${subtitle ? ` | ${subtitle}` : ''}`;
      }

      // Fallback: raw fields
      const type = formatTransactionType(tx.type || '');
      const amount = tx.amount !== undefined ? `${parseFloat(tx.amount) > 0 ? '+' : ''}${tx.amount} ${tx.currency || 'AED'}` : '';
      const status = tx.status || 'completed';
      const merchant = tx.merchant_name || '';
      const senderMask = tx.sender_card_mask ? `от ****${tx.sender_card_mask.slice(-4)}` : '';
      const receiverMask = tx.receiver_card_mask ? `на ****${tx.receiver_card_mask.slice(-4)}` : '';
      const participants = [senderMask, receiverMask].filter(Boolean).join(' → ');

      return `- [#${num}] ${date} | ${type} | ${amount} | ${status}${merchant ? ` | ${merchant}` : ''}${participants ? ` | ${participants}` : ''}`;
    }).join('\n');

    return `${formatted}\n\nВсего транзакций в истории: ${transactions.length}`;
  } catch (err) {
    console.error("Error fetching transactions from API:", err);
    return "Ошибка при получении транзакций.";
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id, external_user_id, backend_token } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log(`Fetching data for external_user_id: ${external_user_id}`);
    
    // Fetch all data from backend API in parallel
    const [transactionsText, allBalancesText, accountDetailText] = await Promise.all([
      fetchTransactionsFromApi(backend_token),
      fetchAllBalances(backend_token),
      backend_token && external_user_id 
        ? fetchUserAccountDetail(backend_token, external_user_id)
        : Promise.resolve("Данные аккаунта недоступны (нет токена)."),
    ]);
    
    // Build dynamic context with real user data
    let userDataContext = `

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (АКТУАЛЬНЫЕ)
### Информация об аккаунте:
${accountDetailText}

### Все балансы (карты, счета, крипто):
${allBalancesText}

### История транзакций:
${transactionsText}`;

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

## Формат вывода балансов
КРИТИЧЕСКИ ВАЖНО: Когда показываешь балансы, ты ОБЯЗАН показать ВСЕ 4 секции. НЕЛЬЗЯ пропускать ни одну!

1. КАРТЫ (каждая карта отдельной строкой)
2. ИТОГО НА КАРТАХ
3. БАНКОВСКИЙ СЧЁТ
4. КРИПТО КОШЕЛЁК

Формат СТРОГО такой:

💳 **Виртуальная карта** (****XXXX): **XX,XXX.XX AED**

💳 **Металлическая карта** (****XXXX): **XX,XXX.XX AED**

💰 **Итого на картах: XX,XXX.XX AED**

🏦 **Банковский счёт**: **XX,XXX.XX AED** | IBAN: AEXX...XXXX

🪙 **USDT** (TRC20): **XX,XXX.XX USDT**

ЗАПРЕЩЕНО:
- Пропускать карты или итого
- Дублировать банковские счета
- Использовать слово "Дополнительно"
- Показывать неполный список — ВСЕГДА показывай ВСЕ балансы
- Каждый баланс ОБЯЗАН начинаться с эмодзи (💳, 🏦, 🪙, 💰)

## Скачивание отчёта
Когда пользователь просит скачать/выгрузить/экспортировать отчёт за определённый период, ты ДОЛЖЕН включить в свой ответ специальную команду в формате:
[DOWNLOAD_REPORT:YYYY-MM-DD:YYYY-MM-DD]

Пример: если просят отчёт за январь 2026, напиши:
"Формирую отчёт за январь 2026... 📊
[DOWNLOAD_REPORT:2026-01-01:2026-01-31]"

Если период не указан чётко, спроси за какой период нужен отчёт. Если просят за "всё время", используй:
[DOWNLOAD_REPORT:ALL]

Важно: команда [DOWNLOAD_REPORT:...] должна быть на отдельной строке.
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
