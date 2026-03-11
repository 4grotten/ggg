import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Extract relevant info from webhook payload
    const { event, user_id, transaction_id, type, amount, currency } = body;

    // Broadcast to all connected clients via Supabase Realtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Broadcast on a channel that all clients listen to
    const channel = supabase.channel("transaction-updates");
    
    // We need to subscribe first, then send
    await new Promise<void>((resolve, reject) => {
      channel
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            resolve();
          } else if (status === "CHANNEL_ERROR") {
            reject(new Error("Channel error"));
          }
        });
    });

    await channel.send({
      type: "broadcast",
      event: "new_transaction",
      payload: {
        event: event || "transaction_created",
        user_id,
        transaction_id,
        type,
        amount,
        currency,
        timestamp: new Date().toISOString(),
      },
    });

    // Cleanup
    await supabase.removeChannel(channel);

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
