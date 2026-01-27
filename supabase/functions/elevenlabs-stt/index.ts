import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Decode base64 audio
    const audioBytes = base64Decode(audio);
    // Create a new Uint8Array with its own ArrayBuffer (not SharedArrayBuffer)
    const audioArray = new Uint8Array(audioBytes.length);
    audioArray.set(audioBytes);
    const file = new File([audioArray], 'audio.webm', { type: mimeType || 'audio/webm' });
    
    // Create form data for ElevenLabs API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', 'scribe_v2');
    // Auto-detect language for multilingual support
    
    console.log('Sending audio to ElevenLabs STT, size:', audioBytes.length);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Transcription result:', result.text?.substring(0, 100));

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('STT error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
