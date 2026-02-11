import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const NVAPI_KEY = Deno.env.get("NVAPI_KEY");
  const detected = !!NVAPI_KEY;

  console.log("NVAPI_KEY detected:", detected);

  if (!detected) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "NVAPI_KEY is missing. Configure environment variables.",
        nvapi_key_detected: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      message: "NVIDIA NIM integration is properly configured.",
      nvapi_key_detected: true,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
