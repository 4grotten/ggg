const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-backend-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BACKEND_URL = "https://ueasycard.com/api/v1/transactions/transfer/bank-to-card/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const backendToken = req.headers.get("x-backend-token");
    if (!backendToken) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { from_bank_account_id, receiver_card_number, amount } = body;

    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!from_bank_account_id) errors.from_bank_account_id = ["Обязательное поле."];
    if (!receiver_card_number) errors.receiver_card_number = ["Обязательное поле."];
    if (!amount) errors.amount = ["Обязательное поле."];

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify(errors),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bank-to-card] Transferring ${amount} AED from bank ${from_bank_account_id} to card ${receiver_card_number.slice(-4)}`);

    // Forward to Django backend
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Token ${backendToken}`,
    };

    const payload = JSON.stringify({
      from_bank_account_id,
      receiver_card_number,
      amount,
    });

    // Retry logic for transient errors
    let response: Response | null = null;
    let data = "";
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(BACKEND_URL, {
          method: "POST",
          headers,
          body: payload,
        });
        data = await response.text();

        if (response.status >= 502 && response.status <= 504 && attempt < maxRetries - 1) {
          console.warn(`[bank-to-card] Attempt ${attempt + 1}/${maxRetries} got ${response.status}, retrying...`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        break;
      } catch (fetchErr) {
        console.warn(`[bank-to-card] Attempt ${attempt + 1}/${maxRetries} failed:`, (fetchErr as Error).message);
        if (attempt === maxRetries - 1) throw fetchErr;
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: "Backend unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle 5xx as clean JSON
    if (response.status >= 502 && response.status <= 504) {
      return new Response(
        JSON.stringify({ error: "Backend temporarily unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[bank-to-card] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
