import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Available OpenAI models for vision/multimodal tasks
const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Новейшая мультимодальная модель" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Быстрая и экономичная" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Предыдущее поколение" },
  { id: "gpt-4-vision-preview", name: "GPT-4 Vision", description: "Специализирована для изображений" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user and check admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin"])
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, apiKey, model } = await req.json();
    console.log(`Admin OpenAI settings action: ${action}`);

    switch (action) {
      case "get-status": {
        // Check if API key is configured
        const currentKey = Deno.env.get("OPENAI_API_KEY");
        const hasKey = !!currentKey && currentKey.length > 0;
        const maskedKey = hasKey ? `sk-...${currentKey.slice(-4)}` : null;

        // Get current model from admin_settings
        const { data: modelSetting } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("category", "integrations")
          .eq("key", "openai_model")
          .single();

        return new Response(
          JSON.stringify({
            hasKey,
            maskedKey,
            currentModel: modelSetting?.value || "gpt-4o",
            availableModels: AVAILABLE_MODELS,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
              value: AVAILABLE_MODELS.findIndex(m => m.id === model),
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          // Insert new - store model index as numeric value
          await supabase
            .from("admin_settings")
            .insert({
              category: "integrations",
              key: "openai_model",
              value: AVAILABLE_MODELS.findIndex(m => m.id === model),
              description: "OpenAI model for contact extraction",
              updated_by: user.id,
            });
        }

        console.log(`OpenAI model updated to: ${model}`);

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