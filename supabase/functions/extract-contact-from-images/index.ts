import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Crypto wallet regex patterns for network detection
const WALLET_PATTERNS = {
  // Bitcoin (starts with 1, 3, or bc1)
  btc: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
  // Ethereum/ERC20 (0x + 40 hex)
  erc20: /^0x[a-fA-F0-9]{40}$/,
  // TRON/TRC20 (starts with T)
  trc20: /^T[a-zA-Z0-9]{33}$/,
  // Solana (base58, 32-44 chars)
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  // Litecoin (starts with L, M, or ltc1)
  ltc: /^(L[a-km-zA-HJ-NP-Z1-9]{26,33}|M[a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-z0-9]{39,59})$/,
  // TON
  ton: /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/,
};

function detectCryptoNetwork(address: string): string | null {
  const trimmed = address.trim();
  
  // Check specific patterns first
  if (WALLET_PATTERNS.btc.test(trimmed)) return "btc";
  if (WALLET_PATTERNS.trc20.test(trimmed)) return "trc20";
  if (WALLET_PATTERNS.erc20.test(trimmed)) return "erc20";
  if (WALLET_PATTERNS.ltc.test(trimmed)) return "ltc";
  if (WALLET_PATTERNS.ton.test(trimmed)) return "ton";
  if (WALLET_PATTERNS.solana.test(trimmed)) return "solana";
  
  // Additional heuristics for BSC/Polygon (same format as ERC20)
  // These would need context from the image to differentiate
  
  return null;
}

interface ExtractedContact {
  full_name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  avatar_url?: string;
  payment_methods?: Array<{
    id: string;
    type: string;
    label: string;
    value: string;
    network?: string;
  }>;
  social_links?: Array<{
    id: string;
    networkId: string;
    networkName: string;
    url: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get model from admin_settings
    let modelToUse = "gpt-4o"; // default
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: modelSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("category", "integrations")
        .eq("key", "openai_model")
        .single();
      
      if (modelSetting?.value !== undefined) {
        const AVAILABLE_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4-vision-preview"];
        const modelIndex = typeof modelSetting.value === 'number' ? modelSetting.value : 0;
        modelToUse = AVAILABLE_MODELS[modelIndex] || "gpt-4o";
      }
      console.log(`Using OpenAI model: ${modelToUse}`);
    } catch (err) {
      console.log("Failed to fetch model setting, using default:", err);
    }

    console.log(`Processing ${images.length} images for contact extraction`);

    // Build content array with all images
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
      },
    }));

    const systemPrompt = `You are an expert at extracting contact information from images. 
Analyze the provided images which may be business cards, screenshots of contact profiles, messenger screenshots, or any other source containing contact data.

Extract ALL available information and return a JSON object with these fields:
- full_name: Person's full name
- phone: Phone number(s) - include country code if visible
- email: Email address(es)
- company: Company/organization name
- position: Job title/position
- notes: Any additional relevant info
- avatar_url: If there's a profile photo, describe it (we'll handle separately)
- payment_methods: Array of payment methods found. Each should have:
  - type: "card" | "iban" | "crypto" | "paypal" | "wallet" | "other"
  - label: A descriptive label (e.g., "USDT TRC20", "Visa Card", "IBAN")
  - value: The actual number/address
  - network: For crypto, the network (e.g., "trc20", "erc20", "bep20", "btc", "ton", "solana")
- social_links: Array of social media links. Each should have:
  - networkId: lowercase identifier (telegram, instagram, twitter, linkedin, whatsapp, facebook, tiktok, youtube, github, website)
  - networkName: Display name
  - url: Full URL or username

For crypto wallets, detect the network based on address format:
- TRC20 (TRON): starts with 'T', 34 chars
- ERC20/BEP20/Polygon: starts with '0x', 42 chars total
- Bitcoin: starts with '1', '3', or 'bc1'
- Litecoin: starts with 'L', 'M', or 'ltc1'
- Solana: 32-44 base58 characters
- TON: starts with 'EQ' or 'UQ'

If the same address appears with explicit network info (like "USDT TRC20"), use that info.
If an address format matches ERC20 but context says BSC or Polygon, use that context.

For card numbers, mask middle digits for security: 4*** **** **** 1234

Return ONLY valid JSON, no markdown code blocks.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all contact information from these ${images.length} image(s). Combine data from all images into a single contact profile.`,
              },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to process images" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No data extracted from images" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Raw AI response:", content);

    // Parse JSON from response (handle markdown code blocks)
    let extractedData: ExtractedContact;
    try {
      let jsonStr = content.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse extracted data", raw: content }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Post-process: add IDs and validate crypto networks
    if (extractedData.payment_methods) {
      extractedData.payment_methods = extractedData.payment_methods.map((pm, index) => {
        const processed = {
          ...pm,
          id: `pm-${Date.now()}-${index}`,
        };
        
        // If it's crypto, verify/detect network
        if (pm.type === "crypto" && pm.value) {
          const detectedNetwork = detectCryptoNetwork(pm.value);
          if (detectedNetwork && !pm.network) {
            processed.network = detectedNetwork;
          }
        }
        
        return processed;
      });
    }

    if (extractedData.social_links) {
      extractedData.social_links = extractedData.social_links.map((sl, index) => ({
        ...sl,
        id: `sl-${Date.now()}-${index}`,
      }));
    }

    console.log("Extracted contact data:", JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({ success: true, contact: extractedData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-contact-from-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
