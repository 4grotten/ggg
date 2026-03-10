const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BACKEND_BASE = "https://ueasycard.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log("[telegram-logs-webhook] Received update:", JSON.stringify(update));

    const message = update.message;
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const chatId = String(message.chat.id);
    const username = message.chat.username || message.from?.username;
    const text = message.text || "";

    console.log(`[telegram-logs-webhook] chat_id=${chatId}, username=${username}, text=${text}`);

    if (text === "/start" && username) {
      // Call Django backend to save chat_id by username
      const resp = await fetch(`${BACKEND_BASE}/accounts/telegram-webhook/save-chat-id/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.toLowerCase().replace("@", ""),
          chat_id: chatId,
        }),
      });

      const result = await resp.text();
      console.log(`[telegram-logs-webhook] Backend response: ${resp.status} ${result}`);

      // Send confirmation to user
      const botToken = Deno.env.get("TELEGRAM_LOGS_BOT_TOKEN");
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Вы успешно подключены к системе уведомлений uEasyCard!\n\nТеперь вы будете получать логи действий администраторов в этот чат.",
            parse_mode: "HTML",
          }),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    console.error("[telegram-logs-webhook] Error:", error);
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }
});
