import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  message?: string;
}

interface GeolocationResult {
  success: boolean;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  mapsUrl: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();

    if (!ip) {
      return new Response(
        JSON.stringify({ success: false, error: 'IP address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching geolocation for IP: ${ip}`);

    // Use ip-api.com - free service, no API key required
    // Note: For production, consider using the pro version or another paid service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    
    if (!response.ok) {
      throw new Error(`IP API request failed: ${response.status}`);
    }

    const data: IpApiResponse = await response.json();

    if (data.status === 'fail') {
      console.error(`IP API error: ${data.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || 'Failed to get geolocation',
          ip 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Google Maps URL using official Maps URLs API format
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`;

    const result: GeolocationResult = {
      success: true,
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.regionName,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      mapsUrl
    };

    console.log(`Geolocation result for ${ip}:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ip-geolocation function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
