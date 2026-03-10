import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BACKEND_BASE = "https://ueasycard.com/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Data fetching ──

function formatTransactionType(type: string): string {
  const map: Record<string, string> = {
    top_up: "Пополнение", withdrawal: "Вывод", transfer_in: "Входящий перевод",
    transfer_out: "Исходящий перевод", card_payment: "Оплата картой", refund: "Возврат",
    fee: "Комиссия", cashback: "Кэшбэк", card_activation: "Активация карты",
  };
  return map[type] || type;
}

function formatDate(d: string): string {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`;
}

async function fetchAllBalances(token: string): Promise<string> {
  const headers = { "Content-Type": "application/json", Authorization: `Token ${token}` };
  const [walletRes, cryptoRes] = await Promise.allSettled([
    fetch(`${BACKEND_BASE}/cards/wallet/summary/`, { headers }),
    fetch(`${BACKEND_BASE}/transactions/crypto-wallets/`, { headers }),
  ]);
  const cardLines: string[] = [];
  const bankLines: string[] = [];
  const cryptoLines: string[] = [];
  let cardsTotal = 0;

  try {
    if (walletRes.status === "fulfilled" && walletRes.value.ok) {
      const raw = await walletRes.value.json();
      const data = raw.data || raw;
      if (data.cards && Array.isArray(data.cards)) {
        data.cards.forEach((c: any) => {
          const t = c.type === "metal" ? "Металлическая карта" : "Виртуальная карта";
          const l4 = c.card_number ? ` (****${c.card_number.slice(-4)})` : "";
          const balance = parseFloat(c.balance) || 0;
          cardsTotal += balance;
          cardLines.push(`💳 ${t}${l4}: ${c.balance} ${c.currency || "AED"}`);
        });
      }
      if (data.physical_account) {
        const pa = data.physical_account;
        bankLines.push(`🏦 Банковский счёт: ${pa.balance} ${pa.currency || "AED"}`);
      }
    } else {
      cardLines.push("💳 Данные о картах временно недоступны.");
    }
  } catch (e) { console.error("[telegram-ai] wallet parse error:", e); }

  try {
    if (cryptoRes.status === "fulfilled" && cryptoRes.value.ok) {
      const raw = await cryptoRes.value.json();
      const wallets = raw.data || raw;
      if (Array.isArray(wallets)) wallets.forEach((w: any) => {
        cryptoLines.push(`🪙 ${w.token || "USDT"} (${w.network || "TRC20"}): ${w.balance} ${w.token || "USDT"}`);
      });
    }
  } catch (e) { console.error("[telegram-ai] crypto parse error:", e); }

  const result: string[] = [];
  if (cardLines.length > 0) {
    cardLines.forEach(line => { result.push(line); result.push(""); });
    if (cardsTotal > 0) { result.push(`💰 Итого на картах: ${cardsTotal.toFixed(2)} AED`); result.push(""); }
  }
  if (bankLines.length > 0) { result.push(...bankLines); result.push(""); }
  if (cryptoLines.length > 0) { result.push(...cryptoLines); }

  return result.length > 0 ? result.join("\n") : "Балансы не найдены.";
}

async function fetchTransactions(token: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_BASE}/transactions/all/`, {
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    });
    if (!res.ok) return "Транзакции недоступны.";
    const raw = await res.json();
    const txs = Array.isArray(raw) ? raw : raw?.results || raw?.data || [];
    if (!txs.length) return "Транзакций пока нет.";
    const formatted = txs.slice(0, 20).map((tx: any, i: number) => {
      const date = tx.created_at ? formatDate(tx.created_at) : "";
      if (tx.display) {
        const d = tx.display;
        const title = d.title || tx.type || "";
        const subtitle = d.subtitle || "";
        const amt = d.primary_amount
          ? `${d.primary_amount.sign || ""}${d.primary_amount.amount} ${d.primary_amount.currency || "AED"}`
          : `${tx.amount} AED`;
        return `- [#${i + 1}] ${date} | ${title} | ${amt}${subtitle ? ` | ${subtitle}` : ""}`;
      }
      const type = formatTransactionType(tx.type || "");
      const amount = tx.amount !== undefined ? `${parseFloat(tx.amount) > 0 ? "+" : ""}${tx.amount} ${tx.currency || "AED"}` : "";
      const status = tx.status || "completed";
      const merchant = tx.merchant_name || "";
      return `- [#${i + 1}] ${date} | ${type} | ${amount} | ${status}${merchant ? ` | ${merchant}` : ""}`;
    }).join("\n");
    return `${formatted}\n\nВсего транзакций в истории: ${txs.length}`;
  } catch { return "Ошибка загрузки транзакций."; }
}

async function fetchAccountDetail(token: string, userId: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_BASE}/accounts/open/users/${userId}/detail/`, {
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    });
    if (!res.ok) return "Данные аккаунта недоступны.";
    const data = await res.json();
    const lines: string[] = [];
    if (data.first_name || data.last_name) lines.push(`👤 Имя: ${[data.first_name, data.last_name].filter(Boolean).join(" ")}`);
    if (data.email) lines.push(`📧 Email: ${data.email}`);
    if (data.phone) lines.push(`📱 Телефон: ${data.phone}`);
    if (data.balance !== undefined) lines.push(`💰 Баланс счёта: ${data.balance} AED`);
    if (data.status) lines.push(`📋 Статус аккаунта: ${data.status}`);
    if (data.is_verified !== undefined) lines.push(`✅ Верификация: ${data.is_verified ? "Пройдена" : "Не пройдена"}`);
    if (data.created_at) lines.push(`📅 Дата регистрации: ${formatDate(data.created_at)}`);
    if (data.iban) {
      const iban = String(data.iban);
      lines.push(`🏦 IBAN: ${iban.slice(0, 4)}••••${iban.slice(-4)}`);
    }
    return lines.length > 0 ? lines.join("\n") : "Нет данных аккаунта.";
  } catch { return "Ошибка загрузки аккаунта."; }
}

// ── Statement detection ──

function detectStatementRequest(text: string): { isStatement: boolean; months: number } {
  const lower = text.toLowerCase();
  const keywords = ["выписк", "выписку", "отчёт", "отчет", "statement", "report", "extract"];
  const isStatement = keywords.some(k => lower.includes(k));
  if (!isStatement) return { isStatement: false, months: 3 };

  // Check longer periods first to avoid false matches
  if (/12\s*(мес|month)/i.test(lower) || /год|year/i.test(lower) || lower.includes("1г")) return { isStatement: true, months: 12 };
  if (/9\s*(мес|month)/i.test(lower) || lower.includes("9м") || /девять/i.test(lower)) return { isStatement: true, months: 9 };
  if (/6\s*(мес|month)/i.test(lower) || lower.includes("6м") || /полгод|пол года|шесть/i.test(lower)) return { isStatement: true, months: 6 };
  if (/3\s*(мес|month)/i.test(lower) || lower.includes("3м") || /три месяц|три мес|за 3/i.test(lower)) return { isStatement: true, months: 3 };
  if (/2\s*(мес|month)/i.test(lower) || lower.includes("2м") || /два месяц|два мес/i.test(lower)) return { isStatement: true, months: 2 };
  if (/1\s*(мес|month)/i.test(lower) || lower.includes("1м") || /за месяц|один месяц/i.test(lower)) return { isStatement: true, months: 1 };

  return { isStatement: true, months: 3 };
}

async function generateStatement(token: string, months: number, userName: string): Promise<Uint8Array | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);

  const body = {
    backend_token: token,
    start_date: startDate.toISOString().slice(0, 10),
    end_date: now.toISOString().slice(0, 10),
    user_name: userName,
    lang: "ru",
  };

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[telegram-ai] Statement generation failed:", res.status);
      return null;
    }

    const htmlContent = await res.text();
    return new TextEncoder().encode(htmlContent);
  } catch (e) {
    console.error("[telegram-ai] Statement generation error:", e);
    return null;
  }
}

// ── Telegram helpers ──

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 4096) {
    let splitAt = remaining.lastIndexOf("\n", 4096);
    if (splitAt < 100) splitAt = 4096;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  chunks.push(remaining);

  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: "Markdown" }),
    });
  }
}

async function sendTelegramDocument(botToken: string, chatId: string, fileBytes: Uint8Array, fileName: string, caption: string) {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", new Blob([fileBytes], { type: "text/html" }), fileName);
  formData.append("caption", caption);

  await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: "POST",
    body: formData,
  });
}

async function sendTypingAction(botToken: string, chatId: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// ── System prompt ──

function buildSystemPrompt(firstName: string, accountText: string, balancesText: string, txText: string): string {
  return `Ты - дружелюбный AI-ассистент для финансового приложения Easy Card. Отвечай кратко и по делу на языке пользователя. Используй эмодзи для дружелюбности.

## О Easy Card
Easy Card - это финансовое приложение для управления виртуальными и металлическими картами в ОАЭ (валюта AED - дирхамы).

## Пользователь
Имя пользователя: ${firstName || "не указано"}

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

## ВАЖНЫЕ ПРАВИЛА
- НЕ показывай балансы, транзакции и финансовые данные пока пользователь ЯВНО не спросит о них
- При приветствии просто поздоровайся и спроси чем помочь, НЕ выкладывай сразу все данные
- Показывай только ту информацию, которую пользователь запросил
- Если пользователь просит выписку/отчёт/statement — НЕ отвечай текстом. Система автоматически сформирует и отправит файл. Просто подтверди что формируешь отчёт.

## Формат вывода транзакций
Когда пользователь спрашивает о транзакциях, выводи их СПИСКОМ, группируя по дате. НЕ используй таблицы. Формат:

📅 *17.01.2026*

• ✅ *Пополнение* — +28,000.00 AED
  Карта: ****8646 | Статус: завершено

• ❌ *Оплата картой* — -1,890.00 AED
  Магазин: Carrefour | Карта: ****2207

📊 Итого за день: +26,110.00 AED

## Формат вывода балансов
КРИТИЧЕСКИ ВАЖНО: Когда показываешь балансы, ты ОБЯЗАН показать ВСЕ 4 секции. НЕЛЬЗЯ пропускать ни одну!

1. КАРТЫ (каждая карта отдельной строкой)
2. ИТОГО НА КАРТАХ
3. БАНКОВСКИЙ СЧЁТ
4. КРИПТО КОШЕЛЁК

Формат СТРОГО такой:

💳 *Виртуальная карта* (****XXXX): *XX,XXX.XX AED*

💳 *Металлическая карта* (****XXXX): *XX,XXX.XX AED*

💰 *Итого на картах: XX,XXX.XX AED*

🏦 *Банковский счёт*: *XX,XXX.XX AED*

🪙 *USDT* (TRC20): *XX,XXX.XX USDT*

ЗАПРЕЩЕНО:
- Пропускать карты или итого
- Дублировать банковские счета
- Использовать слово "Дополнительно"
- Показывать неполный список — ВСЕГДА показывай ВСЕ балансы
- Каждый баланс ОБЯЗАН начинаться с эмодзи (💳, 🏦, 🪙, 💰)
- НИКОГДА не показывай полный IBAN. Всегда маскируй: AE07••••2473

## Формат
- Ты отвечаешь через Telegram, форматируй текст с помощью Markdown (*жирный*, _курсив_)

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (показывай ТОЛЬКО по запросу)
### Информация об аккаунте:
${accountText}

### Все балансы (карты, счета, крипто):
${balancesText}

### История транзакций:
${txText}`;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const update = await req.json();
    console.log("[telegram-ai] update:", JSON.stringify(update).slice(0, 500));

    const message = update.message;
    if (!message?.text) return new Response(JSON.stringify({ ok: true }));

    const chatId = String(message.chat.id);
    const username = message.from?.username || "";
    const userText = message.text;
    const botToken = Deno.env.get("TELEGRAM_AI_BOT_TOKEN")!;
    const serviceToken = Deno.env.get("AI_SERVICE_TOKEN")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Helper: identify user
    async function identifyUser(): Promise<any | null> {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: byChatId } = await supabase
        .from("telegram_user_links")
        .select("*")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (byChatId) {
        return { found: true, user_id: byChatId.backend_user_id, token: byChatId.backend_token, first_name: byChatId.first_name, language: "ru" };
      }

      if (username) {
        const { data: byUsername } = await supabase
          .from("telegram_user_links")
          .select("*")
          .eq("telegram_username", `@${username}`)
          .maybeSingle();

        if (byUsername) {
          await supabase.from("telegram_user_links").update({ telegram_chat_id: chatId }).eq("id", byUsername.id);
          return { found: true, user_id: byUsername.backend_user_id, token: byUsername.backend_token, first_name: byUsername.first_name, language: "ru" };
        }
      }

      const res1 = await fetch(`${BACKEND_BASE}/accounts/messenger/identify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${serviceToken}` },
        body: JSON.stringify({ platform: "telegram", identifier: chatId }),
      });
      if (res1.ok) {
        const data = await res1.json();
        if (data.found) {
          await supabase.from("telegram_user_links").upsert({
            telegram_chat_id: chatId,
            telegram_username: username ? `@${username}` : null,
            backend_user_id: data.user_id,
            backend_token: data.token,
            first_name: data.first_name,
          }, { onConflict: "telegram_chat_id" });
          return data;
        }
      }

      return null;
    }

    // Handle /start
    if (userText === "/start") {
      await sendTypingAction(botToken, chatId);
      const identity = await identifyUser();
      if (identity) {
        await sendTelegramMessage(botToken, chatId, `👋 Привет, ${identity.first_name || ""}! Я AI-ассистент Easy Card.\n\nЯ могу показать ваши балансы, транзакции, сформировать выписку и ответить на вопросы о приложении.\n\nНапишите мне что-нибудь! 😊`);
      } else {
        await sendTelegramMessage(botToken, chatId, "👋 Привет! Я AI-ассистент Easy Card.\n\nЯ могу показать ваши балансы, транзакции, сформировать выписку и ответить на вопросы о приложении.\n\n⚠️ Убедитесь, что ваш Telegram привязан в настройках приложения Easy Card.");
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    // Show typing
    await sendTypingAction(botToken, chatId);

    // 1. Identify user
    const identity = await identifyUser();

    if (!identity) {
      await sendTelegramMessage(botToken, chatId, "❌ Ваш Telegram не привязан к аккаунту Easy Card.\n\nПривяжите Telegram в настройках приложения (Настройки → Уведомления).");
      return new Response(JSON.stringify({ ok: true }));
    }

    const { user_id, token: userToken, language } = identity;
    const first_name = identity.first_name || message.from?.first_name || "";
    console.log(`[telegram-ai] Identified user: ${user_id} (${first_name})`);

    // 2. Check if this is a statement request
    const statementCheck = detectStatementRequest(userText);
    if (statementCheck.isStatement) {
      console.log(`[telegram-ai] Statement request detected, period: ${statementCheck.months} months`);

      // Save user message
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("messenger_chat_history").insert({
        platform: "telegram",
        platform_chat_id: chatId,
        user_id: String(user_id),
        role: "user",
        content: userText,
      });

      // Send "generating" message
      const periodText = statementCheck.months === 1 ? "месяц" :
        statementCheck.months === 3 ? "3 месяца" :
        statementCheck.months === 6 ? "6 месяцев" :
        statementCheck.months === 9 ? "9 месяцев" :
        statementCheck.months === 12 ? "год" : `${statementCheck.months} мес.`;

      await sendTelegramMessage(botToken, chatId, `📊 Формирую выписку за последние ${periodText}...`);
      await sendTypingAction(botToken, chatId);

      // Generate statement
      const fileBytes = await generateStatement(userToken, statementCheck.months, first_name);

      if (fileBytes) {
        const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const fileName = `uEasyCard_Statement_${fileDate}.html`;

        await sendTelegramDocument(botToken, chatId, fileBytes, fileName, `📄 Выписка за последние ${periodText}`);

        // Save assistant message
        await supabase.from("messenger_chat_history").insert({
          platform: "telegram",
          platform_chat_id: chatId,
          user_id: String(user_id),
          role: "assistant",
          content: `📊 Выписка за последние ${periodText} сформирована и отправлена файлом.`,
        });
      } else {
        await sendTelegramMessage(botToken, chatId, "⚠️ Не удалось сформировать выписку. Попробуйте позже.");
        await supabase.from("messenger_chat_history").insert({
          platform: "telegram",
          platform_chat_id: chatId,
          user_id: String(user_id),
          role: "assistant",
          content: "⚠️ Не удалось сформировать выписку.",
        });
      }

      return new Response(JSON.stringify({ ok: true }));
    }

    // 3. Regular AI chat flow
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: history } = await supabase
      .from("messenger_chat_history")
      .select("role, content")
      .eq("platform", "telegram")
      .eq("platform_chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(20);

    await supabase.from("messenger_chat_history").insert({
      platform: "telegram",
      platform_chat_id: chatId,
      user_id: String(user_id),
      role: "user",
      content: userText,
    });

    const [accountText, balancesText, txText] = await Promise.all([
      fetchAccountDetail(userToken, user_id),
      fetchAllBalances(userToken),
      fetchTransactions(userToken),
    ]);

    const messages: { role: string; content: string }[] = [];
    if (history?.length) {
      history.forEach((m: any) => messages.push({ role: m.role, content: m.content }));
    }
    if (!messages.length || messages[messages.length - 1].content !== userText) {
      messages.push({ role: "user", content: userText });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(first_name, accountText, balancesText, txText) },
          ...messages.slice(-20),
        ],
        stream: false,
      }),
    });

    if (!aiRes.ok) {
      console.error("[telegram-ai] AI error:", aiRes.status);
      await sendTelegramMessage(botToken, chatId, "⚠️ AI временно недоступен. Попробуйте позже.");
      return new Response(JSON.stringify({ ok: true }));
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "Не удалось получить ответ.";

    await supabase.from("messenger_chat_history").insert({
      platform: "telegram",
      platform_chat_id: chatId,
      user_id: String(user_id),
      role: "assistant",
      content: reply,
    });

    await sendTelegramMessage(botToken, chatId, reply);

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[telegram-ai] Error:", error);
    return new Response(JSON.stringify({ ok: true }));
  }
});
