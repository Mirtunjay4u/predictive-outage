/**
 * Deterministic event severity scoring (1–5).
 * 
 * Severity = priority_score + impact_score
 *   priority_score: High=3, Medium=2, Low=1
 *   impact_score: customers_impacted / 500, clamped 0–2
 */
import type { Scenario, ScenarioWithIntelligence } from '@/types/scenario';

export function getEventSeverity(event: Scenario | ScenarioWithIntelligence): number {
  let priorityScore = 1;
  switch (event.priority) {
    case 'high': priorityScore = 3; break;
    case 'medium': priorityScore = 2; break;
    case 'low': priorityScore = 1; break;
  }

  const impactScore = Math.min(2, Math.round((event.customers_impacted || 0) / 500));
  return Math.min(5, Math.max(1, priorityScore + impactScore));
}

/** Map severity 1–5 to hex color */
export function severityColor(severity: number): string {
  switch (severity) {
    case 5: return '#dc2626'; // red-600
    case 4: return '#ef4444'; // red-500
    case 3: return '#f59e0b'; // amber-500
    case 2: return '#3b82f6'; // blue-500
    case 1: return '#22c55e'; // green-500
    default: return '#6b7280';
  }
}

export function severityLabel(severity: number): string {
  switch (severity) {
    case 5: return 'Critical';
    case 4: return 'High';
    case 3: return 'Moderate';
    case 2: return 'Low';
    case 1: return 'Minimal';
    default: return 'Unknown';
  }
}

/** Hazard types for overlay filtering */
export type HazardOverlay = 'Storm' | 'Wildfire' | 'Flood';

export const HAZARD_OVERLAYS: HazardOverlay[] = ['Storm', 'Wildfire', 'Flood'];

/** Map outage_type to hazard overlay category */
export function outageToHazard(outageType: string | null): HazardOverlay | null {
  if (!outageType) return null;
  switch (outageType) {
    case 'Storm':
    case 'High Wind':
    case 'Lightning':
    case 'Snow Storm':
      return 'Storm';
    case 'Wildfire':
    case 'Vegetation':
      return 'Wildfire';
    case 'Flood':
    case 'Heavy Rain':
      return 'Flood';
    default:
      return null;
  }
}

/** Hazard overlay colors */
export function hazardOverlayColor(hazard: HazardOverlay): { fill: string; stroke: string } {
  switch (hazard) {
    case 'Storm': return { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3b82f6' };
    case 'Wildfire': return { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' };
    case 'Flood': return { fill: 'rgba(6, 182, 212, 0.15)', stroke: '#06b6d4' };
  }
}

/** Service-area centroid fallback (Houston metro grid) */
const SERVICE_AREA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Fort Bend County': { lat: 29.55, lng: -95.75 },
  'Harris County': { lat: 29.76, lng: -95.37 },
  'Galveston County': { lat: 29.30, lng: -94.80 },
  'Montgomery County': { lat: 30.30, lng: -95.50 },
  'Brazoria County': { lat: 29.20, lng: -95.45 },
};

/** Default Houston metro center */
const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };

export function getEffectiveLocation(event: Scenario | ScenarioWithIntelligence): {
  lat: number;
  lng: number;
  isApprox: boolean;
} {
  if (event.geo_center) {
    return { ...event.geo_center, isApprox: false };
  }
  if (event.service_area && SERVICE_AREA_CENTROIDS[event.service_area]) {
    return { ...SERVICE_AREA_CENTROIDS[event.service_area], isApprox: true };
  }
  // Final fallback with slight random offset to avoid stacking
  const hash = event.id.charCodeAt(0) + event.id.charCodeAt(1);
  return {
    lat: HOUSTON_CENTER.lat + (hash % 10 - 5) * 0.01,
    lng: HOUSTON_CENTER.lng + (hash % 7 - 3) * 0.01,
    isApprox: true,
  };
}
