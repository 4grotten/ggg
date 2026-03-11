const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-backend-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BACKEND_BASE = "https://ueasycard.com/api/v1";

const GROUPED_FEE_TYPES: Record<string, string[]> = {
  cards: ["card_transfer", "card_to_card", "card_activation"],
  banks: ["bank_withdrawal", "bank_transfer", "top_up_bank"],
  crypto: ["crypto_withdrawal", "crypto_to_card", "crypto_to_iban", "top_up_crypto"],
  network: ["network_fee"],
  conversion: ["currency_conversion", "exchange_spread"],
};

function parseEndpointUrl(endpoint: string): URL {
  return new URL(`https://cards-proxy.local${endpoint}`);
}

function mapStatusForClient(status: number): number {
  return status >= 400 && status < 500 ? 200 : status;
}

function getTimestamp(value: unknown): number {
  if (typeof value !== "string") return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

async function fetchWithRetries(url: string, options: RequestInit): Promise<{ response: Response; data: string }> {
  let response: Response | null = null;
  let data = "";
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      response = await fetch(url, options);
      data = await response.text();

      if (response.status >= 502 && response.status <= 504 && attempt < maxRetries - 1) {
        console.warn(`[cards-proxy] Attempt ${attempt + 1}/${maxRetries} got ${response.status}, retrying...`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      break;
    } catch (fetchErr) {
      console.warn(`[cards-proxy] Attempt ${attempt + 1}/${maxRetries} failed:`, (fetchErr as Error).message);
      if (attempt === maxRetries - 1) throw fetchErr;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  return { response: response!, data };
}

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGroupedFeeTypeRequest(endpoint: string, headers: Record<string, string>): Promise<Response | null> {
  const endpointUrl = parseEndpointUrl(endpoint);
  const pathname = endpointUrl.pathname;
  const feeGroup = endpointUrl.searchParams.get("fee_type") || "";

  if (pathname !== "/transactions/admin/revenue/transactions/" || !GROUPED_FEE_TYPES[feeGroup]) {
    return null;
  }

  const selectedTypes = new Set(GROUPED_FEE_TYPES[feeGroup]);
  const clientLimit = Math.max(1, Number(endpointUrl.searchParams.get("limit") || "50") || 50);
  const clientOffset = Math.max(0, Number(endpointUrl.searchParams.get("offset") || "0") || 0);

  const baseParams = new URLSearchParams(endpointUrl.searchParams);
  baseParams.delete("fee_type");
  baseParams.delete("limit");
  baseParams.delete("offset");

  const pageSize = 200;
  let backendOffset = 0;
  let backendTotalCount = Number.POSITIVE_INFINITY;
  let pageGuard = 0;
  const matchedRows: Array<Record<string, unknown>> = [];

  console.log(`[cards-proxy] grouped fee_type="${feeGroup}" → [${[...selectedTypes].join(", ")}]`);

  while (backendOffset < backendTotalCount && pageGuard < 100) {
    const pageParams = new URLSearchParams(baseParams);
    pageParams.set("limit", String(pageSize));
    pageParams.set("offset", String(backendOffset));

    const backendUrl = `${BACKEND_BASE}${pathname}?${pageParams.toString()}`;
    console.log(`[cards-proxy] GET → ${backendUrl}`);

    const { response, data } = await fetchWithRetries(backendUrl, { method: "GET", headers });
    const status = mapStatusForClient(response.status);

    if (response.status >= 502 && response.status <= 504) {
      return jsonOk({ error: "Backend temporarily unavailable", status: response.status });
    }

    let parsed: unknown = null;
    try {
      parsed = data ? JSON.parse(data) : null;
    } catch {
      return new Response(data, {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
      });
    }

    if (!response.ok) {
      return new Response(data, {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
      });
    }

    const isArrayPayload = Array.isArray(parsed);
    const rows: Array<Record<string, unknown>> = isArrayPayload
      ? (parsed as Array<Record<string, unknown>>)
      : Array.isArray((parsed as { results?: unknown[] })?.results)
        ? ((parsed as { results: Array<Record<string, unknown>> }).results)
        : [];

    const total = isArrayPayload
      ? rows.length
      : Number((parsed as { count?: number })?.count ?? rows.length);

    if (Number.isFinite(total)) {
      backendTotalCount = total;
    }

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      if (selectedTypes.has(String(row.fee_type || ""))) {
        matchedRows.push(row);
      }
    }

    backendOffset += rows.length;
    pageGuard += 1;

    if (backendOffset >= backendTotalCount) {
      break;
    }
  }

  matchedRows.sort((a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at));

  const paged = matchedRows.slice(clientOffset, clientOffset + clientLimit);
  return jsonOk({ count: matchedRows.length, results: paged });
}

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

    if (contentType.includes("multipart")) {
      headers["Content-Type"] = contentType;
    } else if (["POST", "PUT", "PATCH"].includes(req.method)) {
      headers["Content-Type"] = "application/json";
    }

    if (backendToken) {
      headers["Authorization"] = `Token ${backendToken}`;
    }

    if (req.method === "GET") {
      const groupedResponse = await handleGroupedFeeTypeRequest(endpoint, headers);
      if (groupedResponse) return groupedResponse;
    }

    const backendUrl = `${BACKEND_BASE}${endpoint}`;
    console.log(`[cards-proxy] ${req.method} → ${backendUrl}`);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      try {
        if (contentType.includes("multipart")) {
          fetchOptions.body = await req.arrayBuffer();
        } else {
          const body = await req.text();
          if (body) fetchOptions.body = body;
        }
      } catch {
        // no body
      }
    }

    const { response, data } = await fetchWithRetries(backendUrl, fetchOptions);
    let status = mapStatusForClient(response.status);

    if (response.status >= 502 && response.status <= 504) {
      return jsonOk({ error: "Backend temporarily unavailable", status: response.status });
    }

    return new Response(data, {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
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
