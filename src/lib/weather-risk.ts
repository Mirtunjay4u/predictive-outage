/**
 * Weather Risk Score per outage event.
 *
 * Combines three weather signals into a 0–100 composite score:
 *   1. NWS Alert Severity  — max severity of alerts whose polygon contains the event location
 *   2. Wind Speed           — nearest wind grid point speed
 *   3. Alert Density        — number of overlapping alerts (amplifier)
 *
 * Weights: Alert Severity 50%, Wind 35%, Alert Density 15%
 *
 * Note: Radar intensity is tile-based (raster) and cannot be queried per-pixel
 * client-side; it is excluded from scoring but visually represented on the map.
 */

import type { NWSAlertFeature, WindPoint } from '@/lib/weather';
import type { Scenario, ScenarioWithIntelligence } from '@/types/scenario';
import { getEffectiveLocation } from '@/lib/severity';

// ── Point-in-polygon (ray casting) ──────────────────────────

function pointInPolygon(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i][1], ring[i][0]]; // GeoJSON is [lng, lat]
    const [xj, yj] = [ring[j][1], ring[j][0]];
    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lat: number, lng: number, geometry: any): boolean {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    return pointInPolygon(lat, lng, geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly: number[][][]) =>
      pointInPolygon(lat, lng, poly[0])
    );
  }
  return false;
}

// ── Severity numeric mapping ────────────────────────────────

function alertSeverityScore(severity: string): number {
  switch (severity) {
    case 'Extreme': return 100;
    case 'Severe': return 75;
    case 'Moderate': return 50;
    case 'Minor': return 25;
    default: return 10;
  }
}

// ── Wind speed to 0-100 scale ───────────────────────────────

function windSpeedScore(mph: number): number {
  if (mph >= 60) return 100;
  if (mph >= 40) return 75;
  if (mph >= 25) return 50;
  if (mph >= 10) return 25;
  return Math.round((mph / 10) * 25);
}

// ── Nearest wind point ──────────────────────────────────────

function nearestWind(lat: number, lng: number, points: WindPoint[]): WindPoint | null {
  if (!points.length) return null;
  let best = points[0];
  let bestDist = Infinity;
  for (const p of points) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

// ── Public API ──────────────────────────────────────────────

export interface WeatherRiskResult {
  score: number;           // 0–100
  tier: 'Low' | 'Moderate' | 'High' | 'Severe';
  tierColor: string;       // hex
  alertCount: number;      // intersecting alerts
  maxAlertSeverity: string | null;
  windSpeed: number | null; // mph at nearest point
  windGusts: number | null;
  drivers: {
    alertScore: number;    // 0–100 contribution
    windScore: number;     // 0–100 contribution
    densityScore: number;  // 0–100 contribution
  };
}

const WEIGHTS = { alert: 0.50, wind: 0.35, density: 0.15 };

export function computeWeatherRisk(
  event: Scenario | ScenarioWithIntelligence,
  alerts: NWSAlertFeature[],
  windPoints: WindPoint[]
): WeatherRiskResult {
  const loc = getEffectiveLocation(event);

  // 1. Find intersecting alerts
  const intersecting = alerts.filter(a =>
    a.geometry && pointInGeometry(loc.lat, loc.lng, a.geometry)
  );
  const alertCount = intersecting.length;
  const maxSev = intersecting.length > 0
    ? intersecting.reduce((best, a) =>
        alertSeverityScore(a.severity) > alertSeverityScore(best.severity) ? a : best
      ).severity
    : null;
  const alertScore = maxSev ? alertSeverityScore(maxSev) : 0;

  // 2. Wind at nearest point
  const wind = nearestWind(loc.lat, loc.lng, windPoints);
  const wScore = wind ? windSpeedScore(wind.speed) : 0;

  // 3. Density amplifier (capped at 5 alerts = 100)
  const densityScore = Math.min(100, alertCount * 20);

  // Composite
  const raw = alertScore * WEIGHTS.alert + wScore * WEIGHTS.wind + densityScore * WEIGHTS.density;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  let tier: WeatherRiskResult['tier'];
  let tierColor: string;
  if (score >= 75) { tier = 'Severe'; tierColor = '#dc2626'; }
  else if (score >= 50) { tier = 'High'; tierColor = '#f97316'; }
  else if (score >= 25) { tier = 'Moderate'; tierColor = '#eab308'; }
  else { tier = 'Low'; tierColor = '#22c55e'; }

  return {
    score,
    tier,
    tierColor,
    alertCount,
    maxAlertSeverity: maxSev,
    windSpeed: wind?.speed ?? null,
    windGusts: wind?.gusts ?? null,
    drivers: {
      alertScore,
      windScore: wScore,
      densityScore,
    },
  };
}

/** Batch-compute for all events */
export function computeAllWeatherRisks(
  events: (Scenario | ScenarioWithIntelligence)[],
  alerts: NWSAlertFeature[],
  windPoints: WindPoint[]
): Map<string, WeatherRiskResult> {
  const map = new Map<string, WeatherRiskResult>();
  for (const event of events) {
    map.set(event.id, computeWeatherRisk(event, alerts, windPoints));
  }
  return map;
}
