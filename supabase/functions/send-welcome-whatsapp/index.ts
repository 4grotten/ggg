import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default welcome messages (used if not configured in admin_settings)
const DEFAULT_MESSAGES: Record<string, string> = {
  en: `Hello and welcome to uEasyCard! 🎉
We are very pleased that you chose our service. We will always stay in touch with you here in this chat.

If you have any questions, feel free to write here anytime — our support is available 24/7.

In your Settings, you can also connect your Email and Telegram to receive transaction reports, notifications, and communicate with us in the way that is most convenient for you.`,

  ru: `Здравствуйте и добро пожаловать в uEasyCard! 🎉
Нам очень приятно, что вы выбрали наш сервис. Мы всегда будем на связи с вами в этом чате.

Если у вас возникнут любые вопросы, вы можете написать сюда в любое время — поддержка работает 24/7.

Также в настройках вы можете подключить Email и Telegram, чтобы получать отчёты по транзакциям, уведомления и связываться с нами удобным для вас способом.`,
};

// Map device locale to supported language key
function resolveLanguage(locale: string): string {
  if (!locale) return "en";
  const lang = locale.split("-")[0].toLowerCase();
  // Extend this map when adding new languages
  const supported: Record<string, string> = {
    ru: "ru",
    en: "en",
    de: "en",
    tr: "en",
    zh: "en",
    ar: "en",
    es: "en",
  };
  return supported[lang] || "en";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, language } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wahaHost = Deno.env.get("WAHA_HOST");
    const wahaApiKey = Deno.env.get("WAHA_API_KEY");
    const wahaSession = Deno.env.get("WAHA_SESSION_NAME") || "default";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!wahaHost || !wahaApiKey) {
      console.error("[welcome-wa] WAHA not configured");
      return new Response(JSON.stringify({ error: "WAHA not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = resolveLanguage(language || "en");

    // Try to get custom welcome message from admin_settings
    const supabase = createClient(supabaseUrl, supabaseKey);
    let messageText = DEFAULT_MESSAGES[lang] || DEFAULT_MESSAGES["en"];

    const settingKey = `welcome_message_${lang}`;
    const { data: setting } = await supabase
      .from("admin_settings")
      .select("description")
      .eq("category", "notifications")
      .eq("key", settingKey)
      .single();

    if (setting?.description) {
      messageText = setting.description;
    }

    // Normalize phone: strip + and spaces
    const cleanPhone = phone.replace(/[\s+\-()]/g, "");
    const chatId = `${cleanPhone}@c.us`;

    // Send via WAHA
    const base = wahaHost.replace(/\/+$/, "");
    const waRes = await fetch(`${base}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": wahaApiKey,
      },
      body: JSON.stringify({
        session: wahaSession,
        chatId,
        text: messageText,
      }),
    });

    if (!waRes.ok) {
      const errText = await waRes.text();
      console.error("[welcome-wa] WAHA send failed:", waRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to messenger_chat_history
    await supabase.from("messenger_chat_history").insert({
      platform: "whatsapp",
      platform_chat_id: chatId,
      role: "assistant",
      content: messageText,
    });

    console.log(`[welcome-wa] Welcome sent to ${cleanPhone} in ${lang}`);

    return new Response(JSON.stringify({ ok: true, language: lang }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[welcome-wa] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
