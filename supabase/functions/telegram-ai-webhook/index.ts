import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BACKEND_BASE = "https://ueasycard.com/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Data fetching (same logic as ai-chat) ──

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
  const lines: string[] = [];
  try {
    if (walletRes.status === "fulfilled" && walletRes.value.ok) {
      const data = (await walletRes.value.json()).data || await walletRes.value.json();
      if (data.cards && Array.isArray(data.cards)) {
        data.cards.forEach((c: any) => {
          const t = c.type === "metal" ? "Металлическая карта" : "Виртуальная карта";
          const l4 = c.card_number ? ` (****${c.card_number.slice(-4)})` : "";
          lines.push(`💳 ${t}${l4}: ${c.balance} ${c.currency || "AED"}`);
        });
      }
      if (data.physical_account) lines.push(`🏦 Банковский счёт: ${data.physical_account.balance} ${data.physical_account.currency || "AED"}`);
    }
  } catch {}
  try {
    if (cryptoRes.status === "fulfilled" && cryptoRes.value.ok) {
      const wallets = (await cryptoRes.value.json()).data || [];
      if (Array.isArray(wallets)) wallets.forEach((w: any) => lines.push(`🪙 ${w.token || "USDT"} (${w.network || "TRC20"}): ${w.balance} ${w.token || "USDT"}`));
    }
  } catch {}
  return lines.length ? lines.join("\n") : "Балансы не найдены.";
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
    return txs.slice(0, 15).map((tx: any, i: number) => {
      const date = tx.created_at ? formatDate(tx.created_at) : "";
      if (tx.display) {
        const d = tx.display;
        const amt = d.primary_amount ? `${d.primary_amount.sign || ""}${d.primary_amount.amount} ${d.primary_amount.currency || "AED"}` : `${tx.amount} AED`;
        return `[#${i + 1}] ${date} | ${d.title || tx.type} | ${amt}`;
      }
      return `[#${i + 1}] ${date} | ${formatTransactionType(tx.type || "")} | ${tx.amount} ${tx.currency || "AED"}`;
    }).join("\n");
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

// ── Telegram helpers ──

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  // Split long messages (Telegram limit 4096)
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

async function sendTypingAction(botToken: string, chatId: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// ── System prompt (same as ai-chat) ──

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

## Формат вывода
- Балансы: каждый на отдельной строке с эмодзи (💳, 🏦, 🪙, 💰)
- Транзакции: списком, группируя по дате
- НИКОГДА не показывай полный IBAN — маскируй: AE07••••2473
- Ты отвечаешь через Telegram, форматируй текст с помощью Markdown

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (показывай ТОЛЬКО по запросу)
### Аккаунт:
${accountText}

### Балансы:
${balancesText}

### Транзакции:
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

    // Helper: identify user — try Supabase links table first, then backend API
    async function identifyUser(): Promise<any | null> {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Try Supabase table by chat_id
      const { data: byChatId } = await supabase
        .from("telegram_user_links")
        .select("*")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (byChatId) {
        console.log(`[telegram-ai] Found in links by chat_id: user ${byChatId.backend_user_id}`);
        return { found: true, user_id: byChatId.backend_user_id, token: byChatId.backend_token, first_name: byChatId.first_name, language: "ru" };
      }

      // 2. Try Supabase table by username
      if (username) {
        const { data: byUsername } = await supabase
          .from("telegram_user_links")
          .select("*")
          .eq("telegram_username", `@${username}`)
          .maybeSingle();

        if (byUsername) {
          console.log(`[telegram-ai] Found in links by username @${username}, updating chat_id`);
          // Save chat_id for next time
          await supabase.from("telegram_user_links").update({ telegram_chat_id: chatId }).eq("id", byUsername.id);
          return { found: true, user_id: byUsername.backend_user_id, token: byUsername.backend_token, first_name: byUsername.first_name, language: "ru" };
        }
      }

      // 3. Fallback: try backend API by chat_id
      console.log(`[telegram-ai] Not in links table, trying backend API`);
      const res1 = await fetch(`${BACKEND_BASE}/accounts/messenger/identify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${serviceToken}` },
        body: JSON.stringify({ platform: "telegram", identifier: chatId }),
      });
      if (res1.ok) {
        const data = await res1.json();
        if (data.found) {
          // Cache in links table
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
        await sendTelegramMessage(botToken, chatId, `👋 Привет, ${identity.first_name || ""}! Я AI-ассистент Easy Card.\n\nЯ могу показать ваши балансы, транзакции и ответить на вопросы о приложении.\n\nНапишите мне что-нибудь! 😊`);
      } else {
        await sendTelegramMessage(botToken, chatId, "👋 Привет! Я AI-ассистент Easy Card.\n\nЯ могу показать ваши балансы, транзакции и ответить на вопросы о приложении.\n\n⚠️ Убедитесь, что ваш Telegram привязан в настройках приложения Easy Card.");
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

    const { user_id, token: userToken, first_name, language } = identity;
    console.log(`[telegram-ai] Identified user: ${user_id} (${first_name})`);

    // 2. Init Supabase & load history
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: history } = await supabase
      .from("messenger_chat_history")
      .select("role, content")
      .eq("platform", "telegram")
      .eq("platform_chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(20);

    // 3. Save user message
    await supabase.from("messenger_chat_history").insert({
      platform: "telegram",
      platform_chat_id: chatId,
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

    // 5. Build messages array with history
    const messages: { role: string; content: string }[] = [];
    if (history?.length) {
      history.forEach((m: any) => messages.push({ role: m.role, content: m.content }));
    }
    // Latest user message is already in history, but ensure it's in the array
    if (!messages.length || messages[messages.length - 1].content !== userText) {
      messages.push({ role: "user", content: userText });
    }

    // 6. Call AI (non-streaming)
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

    // 7. Save assistant message
    await supabase.from("messenger_chat_history").insert({
      platform: "telegram",
      platform_chat_id: chatId,
      user_id: String(user_id),
      role: "assistant",
      content: reply,
    });

    // 8. Send reply
    await sendTelegramMessage(botToken, chatId, reply);

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[telegram-ai] Error:", error);
    return new Response(JSON.stringify({ ok: true }));
  }
});
