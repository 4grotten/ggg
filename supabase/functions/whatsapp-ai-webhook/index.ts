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

function isStatementRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ["выписк", "выписку", "отчёт", "отчет", "statement", "report", "extract"];
  return keywords.some(k => lower.includes(k));
}

async function parseDateRange(text: string, lovableKey: string): Promise<{ start_date: string; end_date: string; period_text: string }> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Ты парсер дат. Сегодня ${today}. Из текста пользователя извлеки период для финансовой выписки. Верни ТОЛЬКО JSON без markdown: {"start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","period_text":"описание периода на русском"}. Примеры:
- "выписка за 3 месяца" → от 3 месяцев назад до сегодня
- "выписка за сегодня" → сегодняшняя дата в оба поля
- "выписка с 1 по 10 марта" → конкретные даты
- "выписка за последнюю неделю" → 7 дней назад до сегодня
- "выписка за январь" → с 1 по 31 января текущего года
- "выписка за год" → 12 месяцев назад до сегодня
Если период неясен, используй последние 3 месяца.`
          },
          { role: "user", content: text }
        ],
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Strip markdown code fences if present
    const clean = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log(`[whatsapp-ai] Parsed date range: ${parsed.start_date} to ${parsed.end_date} (${parsed.period_text})`);
    return parsed;
  } catch (e) {
    console.error("[whatsapp-ai] Date parse error:", e);
    // Fallback: 3 months
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - 3);
    return { start_date: fallbackStart.toISOString().slice(0, 10), end_date: today, period_text: "3 месяца" };
  }
}

async function generateStatement(token: string, startDate: string, endDate: string, userName: string): Promise<Uint8Array | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        backend_token: token,
        start_date: startDate,
        end_date: endDate,
        user_name: userName,
        lang: "ru",
      }),
    });

    if (!res.ok) {
      console.error("[whatsapp-ai] Statement generation failed:", res.status);
      return null;
    }

    const htmlContent = await res.text();
    return new TextEncoder().encode(htmlContent);
  } catch (e) {
    console.error("[whatsapp-ai] Statement generation error:", e);
    return null;
  }
}

// ── Voice transcription ──

async function transcribeVoice(fileUrl: string, mimeType: string, wahaApiKey?: string): Promise<string | null> {
  const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenLabsKey) {
    console.error("[whatsapp-ai] ELEVENLABS_API_KEY not configured");
    return null;
  }

  try {
    // Download audio, with WAHA auth if needed
    const fetchHeaders: Record<string, string> = {};
    if (wahaApiKey) {
      fetchHeaders["X-Api-Key"] = wahaApiKey;
    }
    const audioRes = await fetch(fileUrl, { headers: fetchHeaders });
    if (!audioRes.ok) {
      console.error("[whatsapp-ai] Failed to download voice file:", audioRes.status);
      return null;
    }
    const audioBlob = await audioRes.blob();
    console.log(`[whatsapp-ai] Voice file downloaded: ${audioBlob.size} bytes, type: ${mimeType}`);

    const formData = new FormData();
    formData.append("file", new File([audioBlob], "voice.ogg", { type: mimeType }));
    formData.append("model_id", "scribe_v2");

    const sttRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": elevenLabsKey },
      body: formData,
    });

    if (!sttRes.ok) {
      const errText = await sttRes.text();
      console.error("[whatsapp-ai] ElevenLabs STT error:", sttRes.status, errText);
      return null;
    }

    const result = await sttRes.json();
    console.log("[whatsapp-ai] Transcription:", result.text?.substring(0, 100));
    return result.text || null;
  } catch (e) {
    console.error("[whatsapp-ai] Voice transcription error:", e);
    return null;
  }
}

async function downloadWahaMedia(wahaHost: string, wahaApiKey: string, session: string, messageId: string): Promise<{ url: string; mimetype: string } | null> {
  try {
    const base = wahaHost.replace(/\/+$/, "");
    // WAHA API: get media URL from message
    const res = await fetch(`${base}/api/${session}/messages/${messageId}/download`, {
      headers: { "X-Api-Key": wahaApiKey },
    });
    if (!res.ok) {
      // Try alternative: direct media URL from payload
      console.error("[whatsapp-ai] WAHA media download failed:", res.status);
      return null;
    }
    const data = await res.json();
    return { url: data.url || data.mediaUrl, mimetype: data.mimetype || "audio/ogg" };
  } catch (e) {
    console.error("[whatsapp-ai] WAHA media download error:", e);
    return null;
  }
}

// ── WhatsApp WAHA helpers ──

async function sendWhatsAppMessage(wahaHost: string, wahaApiKey: string, session: string, chatId: string, text: string) {
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

async function sendWhatsAppFile(wahaHost: string, wahaApiKey: string, session: string, chatId: string, fileBytes: Uint8Array, fileName: string, caption: string) {
  const base = wahaHost.replace(/\/+$/, "");
  // Convert to base64 in chunks to avoid stack overflow
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < fileBytes.length; i += chunkSize) {
    const chunk = fileBytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  const base64 = btoa(binary);
  const mimeType = "text/html";

  const targetChatId = chatId.includes("@") ? chatId : `${chatId}@c.us`;
  console.log(`[whatsapp-ai] Sending file ${fileName} (${fileBytes.length} bytes) to ${targetChatId}`);

  const res = await fetch(`${base}/api/sendFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": wahaApiKey,
    },
    body: JSON.stringify({
      session,
      chatId: targetChatId,
      file: {
        mimetype: mimeType,
        filename: fileName,
        data: `data:${mimeType};base64,${base64}`,
      },
      caption,
    }),
  });

  const resText = await res.text();
  console.log(`[whatsapp-ai] sendFile response: ${res.status} ${resText.slice(0, 300)}`);
  if (!res.ok) {
    console.error(`[whatsapp-ai] sendFile FAILED: ${res.status} ${resText}`);
  }
}

// ── System prompt ──

function buildSystemPrompt(firstName: string, accountText: string, balancesText: string, txText: string): string {
  return `Ты - дружелюбный AI-ассистент для финансового приложения Easy Card. Отвечай кратко и по делу на языке пользователя. Используй эмодзи для дружелюбности.

## О Easy Card
Easy Card - это финансовое приложение для управления виртуальными и металлическими картами в ОАЭ (валюта AED - дирхамы).

## Пользователь
Имя пользователя: ${firstName || "не указано"}

## Типы карт
1. *Виртуальная карта* - мгновенный выпуск, идеально для онлайн-покупок
2. *Металлическая карта* - премиум карта с доставкой, статусная и долговечная

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
- Ты отвечаешь через WhatsApp, используй простое форматирование (*жирный*, _курсив_)

## ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (показывай ТОЛЬКО по запросу)
### Информация об аккаунте:
${accountText}

### Все балансы (карты, счета, крипто):
${balancesText}

### История транзакций:
${txText}`;
}

// ── Extract phone number from WAHA chatId ──

function extractPhone(chatId: string): string {
  return chatId.replace("@c.us", "").replace("@s.whatsapp.net", "").replace("+", "");
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("[whatsapp-ai] payload:", JSON.stringify(payload).slice(0, 500));

    const event = payload.event;

    // ── Detect outgoing transaction notifications and broadcast to Realtime ──
    if ((event === "message.any" || event === "message.ack") && msgBody.fromMe) {
      const body = msgBody.body || "";
      const isTransactionNotification = 
        body.includes("Поступление средств") || 
        body.includes("Успешное списание") ||
        body.includes("Перевод выполнен") ||
        body.includes("Пополнение") ||
        body.includes("incoming") ||
        body.includes("outgoing");
      
      if (isTransactionNotification && event === "message.any") {
        // Broadcast only once per transaction (on message.any, not ack)
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(supabaseUrl, supabaseKey);
          
          const channel = sb.channel("transaction-updates");
          await new Promise<void>((resolve, reject) => {
            channel.subscribe((status) => {
              if (status === "SUBSCRIBED") resolve();
              else if (status === "CHANNEL_ERROR") reject(new Error("Channel error"));
            });
          });
          
          await channel.send({
            type: "broadcast",
            event: "new_transaction",
            payload: {
              event: "transaction_notification",
              body: body.substring(0, 200),
              timestamp: new Date().toISOString(),
            },
          });
          
          await sb.removeChannel(channel);
          console.log("[whatsapp-ai] Transaction broadcast sent");
        } catch (e) {
          console.error("[whatsapp-ai] Broadcast error:", e);
        }
      }
      
      return new Response(JSON.stringify({ ok: true }));
    }

    if (event !== "message") {
      return new Response(JSON.stringify({ ok: true }));
    }

    if (msgBody.fromMe) {
      return new Response(JSON.stringify({ ok: true }));
    }

    const chatId = msgBody.from;
    const phone = extractPhone(chatId);

    const serviceToken = Deno.env.get("AI_SERVICE_TOKEN")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const wahaHost = Deno.env.get("WAHA_HOST")!;
    const wahaApiKey = Deno.env.get("WAHA_API_KEY")!;
    const wahaSession = Deno.env.get("WAHA_SESSION_NAME") || "default";

    // Handle voice/audio messages
    let userText = msgBody.body || "";
    const hasMediaAudio = msgBody.hasMedia && msgBody.media?.mimetype?.startsWith("audio");
    
    if (hasMediaAudio && !userText) {
      console.log("[whatsapp-ai] Voice message detected, media:", JSON.stringify(msgBody.media));
      
      // Get media URL from WAHA payload and fix localhost URL
      let mediaUrl = msgBody.media?.url || "";
      const mimetype = msgBody.media?.mimetype || "audio/ogg";
      
      if (mediaUrl) {
        // WAHA returns localhost URL — replace with actual WAHA host
        if (mediaUrl.includes("localhost") || mediaUrl.includes("127.0.0.1")) {
          const wahaBase = wahaHost.replace(/\/+$/, "");
          const urlPath = new URL(mediaUrl).pathname;
          mediaUrl = `${wahaBase}${urlPath}`;
          console.log(`[whatsapp-ai] Rewritten media URL: ${mediaUrl}`);
        }
        
        const transcript = await transcribeVoice(mediaUrl, mimetype, wahaApiKey);
        if (transcript) {
          userText = transcript;
          console.log(`[whatsapp-ai] Voice transcribed: ${transcript.substring(0, 100)}`);
        } else {
          await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
            "⚠️ Не удалось распознать голосовое сообщение. Попробуйте ещё раз или напишите текстом.");
          return new Response(JSON.stringify({ ok: true }));
        }
      } else {
        console.error("[whatsapp-ai] No media URL in payload");
        await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
          "⚠️ Не удалось загрузить голосовое сообщение.");
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    if (!userText) {
      return new Response(JSON.stringify({ ok: true }));
    }

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

    // 2. Check if this is a statement request
    if (isStatementRequest(userText)) {
      console.log(`[whatsapp-ai] Statement request detected`);

      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("messenger_chat_history").insert({
        platform: "whatsapp",
        platform_chat_id: phone,
        user_id: String(user_id),
        role: "user",
        content: userText,
      });

      await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
        `📊 Формирую выписку...`);

      const dateRange = await parseDateRange(userText, lovableKey);
      const periodText = dateRange.period_text;

      const fileBytes = await generateStatement(userToken, dateRange.start_date, dateRange.end_date, first_name);

      if (fileBytes) {
        const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const fileName = `wa_${phone}_${fileDate}_${Date.now()}.html`;

        // Upload to storage and send link (WAHA free doesn't support sendFile)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("statements")
          .upload(fileName, fileBytes, {
            contentType: "text/html",
            upsert: true,
          });

        if (uploadError) {
          console.error("[whatsapp-ai] Storage upload error:", uploadError);
          await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
            "⚠️ Не удалось загрузить выписку. Попробуйте позже.");
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("statements")
            .getPublicUrl(fileName);

          const publicUrl = publicUrlData?.publicUrl;
          console.log(`[whatsapp-ai] Statement uploaded, URL: ${publicUrl}`);

          await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
            `📄 *Выписка за ${periodText}*\n\n📅 Период: ${dateRange.start_date} — ${dateRange.end_date}\n\nСкачайте файл по ссылке:\n${publicUrl}`);
        }

        await supabase.from("messenger_chat_history").insert({
          platform: "whatsapp",
          platform_chat_id: phone,
          user_id: String(user_id),
          role: "assistant",
          content: `📊 Выписка за ${periodText} (${dateRange.start_date} — ${dateRange.end_date}) сформирована.`,
        });
      } else {
        await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
          "⚠️ Не удалось сформировать выписку. Попробуйте позже.");
        await supabase.from("messenger_chat_history").insert({
          platform: "whatsapp",
          platform_chat_id: phone,
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
      .eq("platform", "whatsapp")
      .eq("platform_chat_id", phone)
      .order("created_at", { ascending: true })
      .limit(20);

    await supabase.from("messenger_chat_history").insert({
      platform: "whatsapp",
      platform_chat_id: phone,
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
      console.error("[whatsapp-ai] AI error:", aiRes.status);
      await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId,
        "⚠️ AI временно недоступен. Попробуйте позже.");
      return new Response(JSON.stringify({ ok: true }));
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "Не удалось получить ответ.";

    await supabase.from("messenger_chat_history").insert({
      platform: "whatsapp",
      platform_chat_id: phone,
      user_id: String(user_id),
      role: "assistant",
      content: reply,
    });

    await sendWhatsAppMessage(wahaHost, wahaApiKey, wahaSession, chatId, reply);

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("[whatsapp-ai] Error:", error);
    return new Response(JSON.stringify({ ok: true }));
  }
});
