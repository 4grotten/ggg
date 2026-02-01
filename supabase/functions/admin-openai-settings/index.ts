import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Available AI models for vision/multimodal tasks with pricing tiers
const AVAILABLE_MODELS = [
  // OpenAI Models
  { id: "openai/gpt-5", name: "GPT-5", description: "Мощный универсал. Отличное рассуждение, длинный контекст, мультимодальность. $15/1M input, $60/1M output" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Золотая середина: низкая стоимость при высокой производительности. $3/1M input, $12/1M output" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", description: "Скорость и экономия. Для простых задач большого объёма. $0.50/1M input, $2/1M output" },
  { id: "openai/gpt-5.2", name: "GPT-5.2", description: "Новейшая модель OpenAI с улучшенным рассуждением. $20/1M input, $80/1M output" },
  // Google Gemini Models
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Топ Gemini: изображения + текст + большой контекст + сложные рассуждения. $7/1M input, $21/1M output" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", description: "Следующее поколение Gemini Pro. $10/1M input, $30/1M output" },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", description: "Быстрый превью нового поколения. Баланс скорости и качества. $0.15/1M input, $0.60/1M output" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Баланс: меньше затрат, хорошая мультимодальность. $0.15/1M input, $0.60/1M output" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", description: "Самый быстрый и дешёвый Gemini. Для классификации и суммаризации. $0.075/1M input, $0.30/1M output" },
  { id: "google/gemini-3-pro-image-preview", name: "Gemini 3 Pro Image", description: "Модель нового поколения для генерации изображений. $5/1M input, $15/1M output" },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const { action, apiKey, model } = await req.json();
    console.log(`Admin OpenAI settings action: ${action}`);

    // For get-status, we don't need auth - just return public info
    if (action === "get-status") {
      const currentKey = Deno.env.get("OPENAI_API_KEY");
      const hasKey = !!currentKey && currentKey.length > 0;
      const maskedKey = hasKey ? `sk-...${currentKey.slice(-4)}` : null;

      // Get current model from admin_settings using service role
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: modelSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("category", "integrations")
        .eq("key", "openai_model")
        .single();

      // Convert model index to model ID
      let currentModelId = "gpt-4o"; // default
      if (modelSetting?.value !== undefined) {
        const modelIndex = Number(modelSetting.value);
        if (modelIndex >= 0 && modelIndex < AVAILABLE_MODELS.length) {
          currentModelId = AVAILABLE_MODELS[modelIndex].id;
        }
      }

      return new Response(
        JSON.stringify({
          hasKey,
          maskedKey,
          currentModel: currentModelId,
          availableModels: AVAILABLE_MODELS,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other actions, verify admin role
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader === `Bearer ${supabaseAnonKey}`) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "verify-key": {
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "API key required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Test the API key with a simple request
        const testResponse = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!testResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Invalid API key", valid: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ valid: true, message: "API key is valid" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-model": {
        if (!model) {
          return new Response(
            JSON.stringify({ error: "Model ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const modelIndex = AVAILABLE_MODELS.findIndex(m => m.id === model);
        if (modelIndex === -1) {
          return new Response(
            JSON.stringify({ error: "Invalid model" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if setting exists
        const { data: existing } = await supabase
          .from("admin_settings")
          .select("id")
          .eq("category", "integrations")
          .eq("key", "openai_model")
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from("admin_settings")
            .update({ 
              value: modelIndex,
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase
            .from("admin_settings")
            .insert({
              category: "integrations",
              key: "openai_model",
              value: modelIndex,
              description: "OpenAI model for contact extraction",
              updated_by: user.id,
            });
        }

        console.log(`OpenAI model updated to: ${model} (index: ${modelIndex})`);

        return new Response(
          JSON.stringify({ success: true, model }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in admin-openai-settings:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});