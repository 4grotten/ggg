import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional: verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("[transaction-webhook] Received:", JSON.stringify(body));

    const { event, user_id, transaction_id, type, amount, currency } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use Realtime REST API directly to broadcast — no subscribe/unsubscribe race
    const realtimeUrl = `${supabaseUrl}/realtime/v1/api/broadcast`;
    
    const broadcastPayload = {
      messages: [
        {
          topic: "realtime:transaction-updates",
          event: "broadcast",
          payload: {
            type: "broadcast",
            event: "new_transaction",
            event: event || "transaction_created",
            user_id,
            transaction_id,
            type,
            amount,
            currency,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };

    const broadcastRes = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(broadcastPayload),
    });

    const broadcastStatus = broadcastRes.status;
    const broadcastBody = await broadcastRes.text();
    console.log(`[transaction-webhook] Broadcast REST response: ${broadcastStatus} ${broadcastBody}`);

    if (!broadcastRes.ok) {
      console.error("[transaction-webhook] Broadcast failed:", broadcastBody);
      return new Response(
        JSON.stringify({ error: "Broadcast failed", detail: broadcastBody }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[transaction-webhook] Broadcast sent for user:", user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Broadcast sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[transaction-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
