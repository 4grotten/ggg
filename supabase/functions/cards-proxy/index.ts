const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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
    const contentType = req.headers.get("content-type") || "";

    const headers: Record<string, string> = {};

    // Set Content-Type: for multipart keep original, otherwise default to JSON for POST/PUT/PATCH
    if (contentType.includes("multipart")) {
      headers["Content-Type"] = contentType;
    } else if (["POST", "PUT", "PATCH"].includes(req.method)) {
      headers["Content-Type"] = "application/json";
    }

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
        if (contentType.includes("multipart")) {
          fetchOptions.body = await req.arrayBuffer();
        } else {
          const body = await req.text();
          if (body) {
            fetchOptions.body = body;
          }
        }
      } catch (_) {
        // no body
      }
    }

    // Retry logic for TLS connection errors
    let response: Response | null = null;
    let data = "";
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(backendUrl, fetchOptions);
        data = await response.text();
        break;
      } catch (fetchErr) {
        console.warn(`[cards-proxy] Attempt ${attempt + 1}/${maxRetries} failed:`, (fetchErr as Error).message);
        if (attempt === maxRetries - 1) throw fetchErr;
        // Small delay before retry
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }

    return new Response(data, {
      status: response!.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response!.headers.get("Content-Type") || "application/json",
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
