const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-backend-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BACKEND_BASE = "https://ueasycard.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "/cards/balances/";

    const backendToken = req.headers.get("x-backend-token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (backendToken) {
      headers["Authorization"] = `Token ${backendToken}`;
    }

    const backendUrl = `${BACKEND_BASE}${endpoint}`;
    console.log(`[cards-proxy] ${req.method} → ${backendUrl}`);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      try {
        const body = await req.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (_) {
        // no body
      }
    }

    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[cards-proxy] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
