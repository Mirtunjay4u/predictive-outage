import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Scenario } from '@/types/scenario';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

interface HeatmapLayerProps {
  scenarios: Scenario[];
  visible: boolean;
}

export function HeatmapLayer({ scenarios, visible }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    // Create heatmap data points: [lat, lng, intensity]
    // Intensity is based on customers_impacted, normalized
    const maxImpact = Math.max(
      ...scenarios.map(s => s.customers_impacted || 0),
      1 // Prevent division by zero
    );

    const heatData: [number, number, number][] = scenarios
      .filter(s => s.geo_center && (s.customers_impacted || 0) > 0)
      .map(s => [
        s.geo_center!.lat,
        s.geo_center!.lng,
        (s.customers_impacted || 0) / maxImpact, // Normalized intensity 0-1
      ]);

    // Create the heat layer with custom gradient
    const heatLayer = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: '#1e3a5f', // Dark blue (low impact)
        0.25: '#3b82f6', // Blue
        0.5: '#f59e0b', // Amber/warning
        0.75: '#ef4444', // Red/destructive
        1.0: '#dc2626', // Bright red (high impact)
      },
    });

    heatLayer.addTo(map);

    // Cleanup on unmount or when visibility changes
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, scenarios, visible]);

  return null;
}
