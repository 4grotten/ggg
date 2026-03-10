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
  } catch (e) { console.error("[whatsapp-ai] wallet parse error:", e); }

  try {
    if (cryptoRes.status === "fulfilled" && cryptoRes.value.ok) {
      const raw = await cryptoRes.value.json();
      const wallets = raw.data || raw;
      if (Array.isArray(wallets)) wallets.forEach((w: any) => {
        cryptoLines.push(`🪙 ${w.token || "USDT"} (${w.network || "TRC20"}): ${w.balance} ${w.token || "USDT"}`);
      });
    }
  } catch (e) { console.error("[whatsapp-ai] crypto parse error:", e); }

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
    const d = await res.json();
    const lines: string[] = [];
    if (d.first_name || d.last_name) lines.push(`👤 ${[d.first_name, d.last_name].filter(Boolean).join(" ")}`);
    if (d.phone) lines.push(`📱 ${d.phone}`);
    if (d.balance !== undefined) lines.push(`💰 Баланс: ${d.balance} AED`);
    return lines.join("\n") || "Нет данных.";
  } catch { return "Ошибка загрузки аккаунта."; }
}

// ── WhatsApp WAHA helpers ──

async function sendWhatsAppMessage(wahaHost: string, wahaApiKey: string, session: string, chatId: string, text: string) {
  // WAHA API: POST /api/sendText
  const base = wahaHost.replace(/\/+$/, "");
  await fetch(`${base}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": wahaApiKey,
    },
    body: JSON.stringify({
      session,
      chatId: chatId.includes("@") ? chatId : `${chatId}@c.us`,
      text,
    }),
  });
}

// ── System prompt ──

function buildSystemPrompt(firstName: string, accountText: string, balancesText: string, txText: string): string {
  return `Ты - дружелюбный AI-ассистент для финансового приложения Easy Card. Отвечай кратко и по делу на языке пользователя. Используй эмодзи для дружелюбности.

## О Easy Card
Easy Card - финансовое приложение для управления виртуальными и металлическими картами в ОАЭ (AED).

## Пользователь
Имя пользователя: ${firstName || "не указано"}

## ВАЖНЫЕ ПРАВИЛА
- НЕ показывай балансы, транзакции и финансовые данные пока пользователь ЯВНО не спросит о них
- При приветствии просто поздоровайся и спроси чем помочь, НЕ выкладывай сразу все данные
- Показывай только ту информацию, которую пользователь запросил

## Формат
- Балансы: каждый на отдельной строке с эмодзи (💳, 🏦, 🪙, 💰)
- Транзакции: списком, группируя по дате
- НИКОГДА не показывай полный IBAN — маскируй: AE07••••2473
- Ты отвечаешь через WhatsApp, используй простое форматирование (*жирный*, _курсив_)

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (показывай ТОЛЬКО по запросу)
### Аккаунт:
${accountText}

### Балансы:
${balancesText}

### Транзакции:
${txText}`;
}

// ── Extract phone number from WAHA chatId ──

function extractPhone(chatId: string): string {
  // WAHA chatId format: "996555123456@c.us" or just "996555123456"
  return chatId.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("+", "");
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("[whatsapp-ai] payload:", JSON.stringify(payload).slice(0, 500));

    // WAHA webhook payload structure
    const event = payload.event;
    if (event !== "message") {
      return new Response(JSON.stringify({ ok: true }));
    }

    const msgBody = payload.payload;
    if (!msgBody?.body || msgBody.fromMe) {
      return new Response(JSON.stringify({ ok: true }));
    }

    const chatId = msgBody.from; // e.g. "996555123456@c.us"
    const userText = msgBody.body;
    const phone = extractPhone(chatId);

    const serviceToken = Deno.env.get("AI_SERVICE_TOKEN")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const wahaHost = Deno.env.get("WAHA_HOST")!;
    const wahaApiKey = Deno.env.get("WAHA_API_KEY")!;
    const wahaSession = Deno.env.get("WAHA_SESSION_NAME") || "default";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Identify user by phone number
    const identifyRes = await fetch(`${BACKEND_BASE}/accounts/messenger/identify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Token ${serviceToken}` },
      body: JSON.stringify({ platform: "whatsapp", identifier: phone }),
    });

    if (!identifyRes.ok) {
      await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
        "❌ Ваш WhatsApp не привязан к аккаунту Easy Card.\n\nПривяжите WhatsApp в настройках приложения (Настройки → Уведомления).");
      return new Response(JSON.stringify({ ok: true }));
    }

    const identity = await identifyRes.json();
    if (!identity.found) {
      await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
        "❌ Аккаунт не найден. Привяжите WhatsApp в настройках приложения.");
      return new Response(JSON.stringify({ ok: true }));
    }

    const { user_id, token: userToken, first_name } = identity;
    console.log(`[whatsapp-ai] Identified user: ${user_id} (${first_name})`);

    // 2. Init Supabase & load history
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: history } = await supabase
      .from("messenger_chat_history")
      .select("role, content")
      .eq("platform", "whatsapp")
      .eq("platform_chat_id", phone)
      .order("created_at", { ascending: true })
      .limit(20);

    // 3. Save user message
    await supabase.from("messenger_chat_history").insert({
      platform: "whatsapp",
      platform_chat_id: phone,
      user_id: String(user_id),
      role: "user",
      content: userText,
    });

    // 4. Fetch financial data
    const [accountText, balancesText, txText] = await Promise.all([
      fetchAccountDetail(userToken, user_id),
      fetchAllBalances(userToken),
      fetchTransactions(userToken),
    ]);

    // 5. Build messages with history
    const messages: { role: string; content: string }[] = [];
    if (history?.length) {
      history.forEach((m: any) => messages.push({ role: m.role, content: m.content }));
    }
    if (!messages.length || messages[messages.length - 1].content !== userText) {
      messages.push({ role: "user", content: userText });
    }

    // 6. Call AI
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
      console.error("[whatsapp-ai] AI error:", aiRes.status);
      await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
        "⚠️ AI временно недоступен. Попробуйте позже.");
      return new Response(JSON.stringify({ ok: true }));
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "Не удалось получить ответ.";

    // 7. Save assistant message
    await supabase.from("messenger_chat_history").insert({
      platform: "whatsapp",
      platform_chat_id: phone,
      user_id: String(user_id),
      role: "assistant",
      content: reply,
    });

    // 8. Send reply
    await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId, reply);

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[whatsapp-ai] Error:", error);
    return new Response(JSON.stringify({ ok: true }));
  }
});
