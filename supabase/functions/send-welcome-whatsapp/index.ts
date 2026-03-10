import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default welcome messages for all supported languages
const DEFAULT_MESSAGES: Record<string, string> = {
  en: `Hello and welcome to uEasyCard! 🎉\nWe are very pleased that you chose our service. We will always stay in touch with you here in this chat.\n\nIf you have any questions, feel free to write here anytime — our support is available 24/7.\n\nIn your Settings, you can also connect your Email and Telegram to receive transaction reports, notifications, and communicate with us in the way that is most convenient for you.`,
  ru: `Здравствуйте и добро пожаловать в uEasyCard! 🎉\nНам очень приятно, что вы выбрали наш сервис. Мы всегда будем на связи с вами в этом чате.\n\nЕсли у вас возникнут любые вопросы, вы можете написать сюда в любое время — поддержка работает 24/7.\n\nТакже в настройках вы можете подключить Email и Telegram, чтобы получать отчёты по транзакциям, уведомления и связываться с нами удобным для вас способом.`,
  de: `Hallo und willkommen bei uEasyCard! 🎉\nWir freuen uns sehr, dass Sie sich für unseren Service entschieden haben.\n\nWenn Sie Fragen haben, schreiben Sie uns jederzeit — unser Support ist rund um die Uhr für Sie da.\n\nIn Ihren Einstellungen können Sie auch Ihre E-Mail und Telegram verbinden.`,
  tr: `Merhaba ve uEasyCard'a hoş geldiniz! 🎉\nHizmetimizi seçtiğiniz için çok memnunuz.\n\nHerhangi bir sorunuz olursa, istediğiniz zaman buraya yazabilirsiniz — destek ekibimiz 7/24 hizmetinizdedir.\n\nAyarlarınızda E-posta ve Telegram bağlayarak bildirimler alabilirsiniz.`,
  zh: `您好，欢迎使用 uEasyCard！🎉\n我们非常高兴您选择了我们的服务。\n\n如果您有任何问题，请随时在这里留言 — 我们的客服全天候为您服务。\n\n您还可以在设置中连接电子邮件和 Telegram。`,
  ar: `مرحباً وأهلاً بك في uEasyCard! 🎉\nيسعدنا جداً أنك اخترت خدمتنا.\n\nإذا كان لديك أي أسئلة، لا تتردد في الكتابة هنا في أي وقت — فريق الدعم متاح على مدار الساعة.\n\nيمكنك أيضاً في الإعدادات ربط بريدك الإلكتروني وتيليجرام.`,
  es: `¡Hola y bienvenido a uEasyCard! 🎉\nEstamos muy contentos de que hayas elegido nuestro servicio.\n\nSi tienes alguna pregunta, no dudes en escribir aquí en cualquier momento — nuestro soporte está disponible 24/7.\n\nEn tu configuración, también puedes conectar tu correo electrónico y Telegram.`,
};

// Map device locale to supported language key
function resolveLanguage(locale: string): string {
  if (!locale) return "en";
  const lang = locale.split("-")[0].toLowerCase();
  const supported = ["en", "ru", "de", "tr", "zh", "ar", "es"];
  return supported.includes(lang) ? lang : "en";
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
