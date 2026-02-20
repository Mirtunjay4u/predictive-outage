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

// ── Wind Data (Open-Meteo) ──────────────────────────────────

export interface WindPoint {
  lat: number;
  lng: number;
  speed: number;        // mph
  direction: number;    // degrees (meteorological: 0=N, 90=E, 180=S, 270=W)
  gusts: number;        // mph
}

/**
 * Fetch current wind data from Open-Meteo for a grid of points.
 * Open-Meteo is free and requires no API key.
 * We sample a grid around the provided center to show wind arrows across the map.
 */
export async function fetchWindGrid(
  centerLat: number,
  centerLng: number,
  gridSize = 4,
  spacing = 0.35
): Promise<WindPoint[]> {
  const points: { lat: number; lng: number }[] = [];
  const halfGrid = (gridSize - 1) / 2;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      points.push({
        lat: centerLat + (row - halfGrid) * spacing,
        lng: centerLng + (col - halfGrid) * spacing,
      });
    }
  }

  // Open-Meteo supports multiple locations via comma-separated lat/lng
  const lats = points.map(p => p.lat.toFixed(4)).join(',');
  const lngs = points.map(p => p.lng.toFixed(4)).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=mph&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo wind API unavailable');

  const data = await res.json();

  // Open-Meteo returns an array when multiple coords are passed
  const results: any[] = Array.isArray(data) ? data : [data];

  return results.map((r, i) => ({
    lat: points[i].lat,
    lng: points[i].lng,
    speed: r.current?.wind_speed_10m ?? 0,
    direction: r.current?.wind_direction_10m ?? 0,
    gusts: r.current?.wind_gusts_10m ?? 0,
  }));
}

/** Color for wind speed (mph) */
export function windSpeedColor(speed: number): string {
  if (speed >= 50) return '#dc2626';  // red - dangerous
  if (speed >= 30) return '#f97316';  // orange - high
  if (speed >= 15) return '#eab308';  // yellow - moderate
  if (speed >= 5)  return '#3b82f6';  // blue - light
  return '#6b7280';                   // gray - calm
}

/** Wind speed label */
export function windSpeedLabel(speed: number): string {
  if (speed >= 50) return 'Dangerous';
  if (speed >= 30) return 'High';
  if (speed >= 15) return 'Moderate';
  if (speed >= 5)  return 'Light';
  return 'Calm';
}
