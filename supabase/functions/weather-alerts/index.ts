/**
 * Weather Alerts Edge Function
 * Proxies and caches NWS (NOAA) active alerts for enterprise-safe usage.
 * Data source: https://api.weather.gov/alerts/active
 * Cache: 90-second in-memory TTL
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CachedResponse {
  data: unknown;
  fetchedAt: number;
}

let cache: CachedResponse | null = null;
const CACHE_TTL_MS = 90_000; // 90 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Return cached if fresh
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    // Fetch from NWS
    const response = await fetch("https://api.weather.gov/alerts/active", {
      headers: {
        "User-Agent": "OutageCommandMap/1.0 (operator-copilot)",
        Accept: "application/geo+json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("NWS API error:", response.status, text);
      return new Response(
        JSON.stringify({
          error: "NWS API unavailable",
          status: response.status,
          fetchedAt: new Date().toISOString(),
          features: [],
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const raw = await response.json();

    // Normalize to a slim payload
    const features = (raw.features || []).map((f: any) => ({
      id: f.id,
      severity: f.properties?.severity || "Unknown",
      certainty: f.properties?.certainty || "Unknown",
      urgency: f.properties?.urgency || "Unknown",
      event: f.properties?.event || "Unknown",
      headline: f.properties?.headline || "",
      areaDesc: f.properties?.areaDesc || "",
      effective: f.properties?.effective || null,
      expires: f.properties?.expires || null,
      description: f.properties?.description || "",
      instruction: f.properties?.instruction || "",
      geometry: f.geometry || null,
    }));

    const payload = {
      fetchedAt: new Date().toISOString(),
      totalCount: features.length,
      features,
    };

    // Update cache
    cache = { data: payload, fetchedAt: now };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=90",
      },
    });
  } catch (err) {
    console.error("Weather alerts fetch error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather alerts",
        fetchedAt: new Date().toISOString(),
        features: [],
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
