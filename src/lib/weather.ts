/**
 * Weather data helpers for Outage Command Map
 *
 * Data sources:
 *  - Radar tiles: RainViewer (free, no key) — refreshes every 5 min
 *    API: https://api.rainviewer.com/public/weather-maps.json
 *    Tiles: https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png
 *
 *  - Weather Alerts: NOAA/NWS active alerts, proxied via edge function
 *    Proxied to avoid CORS + add caching (90 s TTL)
 */

// ── Radar (RainViewer) ──────────────────────────────────────

export interface RainViewerMaps {
  radar: { past: { time: number; path: string }[]; nowcast: { time: number; path: string }[] };
}

export interface RadarFrame {
  time: number;
  label: string; // e.g. "12:30" for display
}

export async function fetchRadarTimestamp(): Promise<number> {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  if (!res.ok) throw new Error('RainViewer API unavailable');
  const data: RainViewerMaps = await res.json();
  const nowcast = data.radar.nowcast;
  const past = data.radar.past;
  return nowcast.length > 0 ? nowcast[0].time : past[past.length - 1].time;
}

/** Fetch the last N radar frames (past + nowcast) for animation playback */
export async function fetchRadarFrames(count = 6): Promise<RadarFrame[]> {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  if (!res.ok) throw new Error('RainViewer API unavailable');
  const data: RainViewerMaps = await res.json();
  const past = data.radar.past ?? [];
  const nowcast = data.radar.nowcast ?? [];
  const all = [...past, ...nowcast];
  const frames = all.slice(-count);
  return frames.map(f => ({
    time: f.time,
    label: new Date(f.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
}

export function radarTileUrl(time: number): string {
  return `https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/2/1_1.png`;
}

// ── NWS Alerts ──────────────────────────────────────────────

export interface NWSAlertFeature {
  id: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: string;
  urgency: string;
  event: string;
  headline: string;
  areaDesc: string;
  effective: string | null;
  expires: string | null;
  description: string;
  instruction: string;
  geometry: GeoJSON.Geometry | null;
}

export interface NWSAlertsPayload {
  fetchedAt: string;
  totalCount: number;
  features: NWSAlertFeature[];
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchNWSAlerts(): Promise<NWSAlertsPayload> {
  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/weather-alerts`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn('NWS alerts proxy error:', res.status, body);
    return { fetchedAt: new Date().toISOString(), totalCount: 0, features: [] };
  }
  return res.json();
}

// ── Severity styling ────────────────────────────────────────

export function alertSeverityColor(severity: string): { fill: string; stroke: string } {
  switch (severity) {
    case 'Extreme':
      return { fill: 'rgba(220,38,38,0.15)', stroke: '#dc2626' };
    case 'Severe':
      return { fill: 'rgba(249,115,22,0.15)', stroke: '#f97316' };
    case 'Moderate':
      return { fill: 'rgba(234,179,8,0.15)', stroke: '#eab308' };
    case 'Minor':
      return { fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6' };
    default:
      return { fill: 'rgba(107,114,128,0.15)', stroke: '#6b7280' };
  }
}

export function alertSeverityRank(severity: string): number {
  switch (severity) {
    case 'Extreme': return 4;
    case 'Severe': return 3;
    case 'Moderate': return 2;
    case 'Minor': return 1;
    default: return 0;
  }
}
