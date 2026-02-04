import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { Scenario, ScenarioWithIntelligence, GeoArea } from '@/types/scenario';
import type { Asset } from '@/types/asset';
import type { FeederZone } from '@/types/feederZone';
import type { Crew } from '@/types/crew';
import type { WeatherPoint } from '@/hooks/useWeatherData';
import { weatherCodeToDescription } from '@/hooks/useWeatherData';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface OutageMapViewProps {
  scenarios: (Scenario | ScenarioWithIntelligence)[];
  selectedEventId: string | null;
  onMarkerClick: (scenario: Scenario | ScenarioWithIntelligence) => void;
  showHeatmap?: boolean;
  enableClustering?: boolean;
  showWeather?: boolean;
  weatherPoints?: WeatherPoint[];
  showAssets?: boolean;
  assets?: Asset[];
  linkedAssetIds?: string[];
  onAssetClick?: (asset: Asset) => void;
  showFeederZones?: boolean;
  feederZones?: FeederZone[];
  highlightedFeederId?: string | null;
  onFeederClick?: (zone: FeederZone) => void;
  zoomTarget?: { lat: number; lng: number; zoom?: number } | null;
  highlightedAssetId?: string | null;
  showCrews?: boolean;
  crews?: Crew[];
  onCrewClick?: (crew: Crew) => void;
  onSimulateCrewMovement?: (crewId: string, targetLat: number, targetLng: number) => void;
}

// Helper functions
const getMarkerColor = (scenario: Scenario | ScenarioWithIntelligence) => {
  switch (scenario.lifecycle_stage) {
    case 'Event': return '#ef4444';
    case 'Pre-Event': return '#f59e0b';
    case 'Post-Event': return '#6b7280';
    default: return '#6b7280';
  }
};

const getPolygonColor = (scenario: Scenario | ScenarioWithIntelligence) => {
  switch (scenario.lifecycle_stage) {
    case 'Event': return { fill: '#ef444430', stroke: '#ef4444' };
    case 'Pre-Event': return { fill: '#f59e0b30', stroke: '#f59e0b' };
    case 'Post-Event': return { fill: '#6b728030', stroke: '#6b7280' };
    default: return { fill: '#6b728030', stroke: '#6b7280' };
  }
};

const createColoredIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 32 : 24;
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="${isSelected ? '#ffffff' : '#374151'}" stroke-width="${isSelected ? '2' : '1'}" 
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const createAssetIcon = (assetType: string, isLinked: boolean, hasSelectedEvent: boolean, isHighlighted: boolean) => {
  const opacity = isHighlighted ? 1 : (hasSelectedEvent ? (isLinked ? 1 : 0.3) : 1);
  const size = isHighlighted ? 28 : 20;
  
  let color: string;
  let strokeColor: string;
  
  switch (assetType) {
    case 'Fault':
      color = isLinked || isHighlighted ? '#ef4444' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#dc2626' : '#4b5563';
      break;
    case 'Feeder':
      color = isLinked || isHighlighted ? '#3b82f6' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#2563eb' : '#4b5563';
      break;
    default:
      color = isLinked || isHighlighted ? '#f59e0b' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#d97706' : '#4b5563';
  }
  
  let shape: string;
  switch (assetType) {
    case 'Fault':
      shape = `<polygon fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}" points="13,2 3,14 12,14 11,22 21,10 12,10"/>`;
      break;
    case 'Feeder':
      shape = `
        <rect x="4" y="8" width="16" height="8" rx="2" fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}"/>
        <line x1="8" y1="4" x2="8" y2="8" stroke="${strokeColor}" stroke-width="2"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="${strokeColor}" stroke-width="2"/>
      `;
      break;
    default:
      shape = `
        <rect x="4" y="4" width="16" height="16" rx="2" fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      `;
  }
  
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity: ${opacity}">${shape}</svg>`,
    className: `asset-marker-icon ${isHighlighted ? 'highlighted' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

const createCrewIcon = (status: Crew['status'], hasAssignment: boolean) => {
  const size = 36;
  
  let bgColor: string;
  let borderColor: string;
  
  switch (status) {
    case 'available':
      bgColor = '#22c55e';
      borderColor = '#16a34a';
      break;
    case 'dispatched':
      bgColor = '#f59e0b';
      borderColor = '#d97706';
      break;
    case 'en_route':
      bgColor = '#3b82f6';
      borderColor = '#2563eb';
      break;
    case 'on_site':
      bgColor = '#8b5cf6';
      borderColor = '#7c3aed';
      break;
    default:
      bgColor = '#6b7280';
      borderColor = '#4b5563';
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="${size}" height="${size}">
      <circle cx="18" cy="18" r="14" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
      <g transform="translate(9, 11)" fill="white">
        <rect x="0" y="3" width="10" height="8" rx="1"/>
        <path d="M10 5h4l2 4v2h-6z"/>
        <circle cx="4" cy="12" r="2" fill="${borderColor}"/>
        <circle cx="13" cy="12" r="2" fill="${borderColor}"/>
      </g>
      ${hasAssignment ? `
        <circle cx="28" cy="8" r="5" fill="#ef4444" stroke="white" stroke-width="1"/>
        <text x="28" y="11" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'crew-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

// Convert GeoJSON coordinates to Leaflet LatLng format
function geoAreaToLatLngs(geoArea: GeoArea): L.LatLngExpression[][] {
  if (geoArea.type === 'Polygon') {
    return (geoArea.coordinates as number[][][]).map(ring =>
      ring.map(coord => [coord[1], coord[0]] as L.LatLngExpression)
    );
  } else {
    const firstPolygon = (geoArea.coordinates as number[][][][])[0];
    return firstPolygon.map(ring =>
      ring.map(coord => [coord[1], coord[0]] as L.LatLngExpression)
    );
  }
}

export function OutageMapView({
  scenarios,
  selectedEventId,
  onMarkerClick,
  showHeatmap = false,
  showWeather = false,
  weatherPoints = [],
  showAssets = false,
  assets = [],
  linkedAssetIds = [],
  onAssetClick,
  showFeederZones = false,
  feederZones = [],
  highlightedFeederId = null,
  onFeederClick,
  zoomTarget = null,
  highlightedAssetId = null,
  showCrews = false,
  crews = [],
  onCrewClick,
}: OutageMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    scenarios: L.LayerGroup;
    polygons: L.LayerGroup;
    assets: L.LayerGroup;
    feeders: L.LayerGroup;
    crews: L.LayerGroup;
    weather: L.LayerGroup;
    heatmap: L.Layer | null;
  } | null>(null);

  // Calculate center from scenarios or default to Houston
  const mapCenter = useMemo(() => {
    if (scenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const validScenarios = scenarios.filter(s => s.geo_center);
    if (validScenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const avgLat = validScenarios.reduce((sum, s) => sum + s.geo_center!.lat, 0) / validScenarios.length;
    const avgLng = validScenarios.reduce((sum, s) => sum + s.geo_center!.lng, 0) / validScenarios.length;
    
    return [avgLat, avgLng] as [number, number];
  }, [scenarios]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 9,
      zoomControl: false, // Disable default zoom control
    });

    // Add zoom control to top-left with proper positioning
    L.control.zoom({
      position: 'topleft',
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    // Create layer groups
    layersRef.current = {
      polygons: L.layerGroup().addTo(map),
      feeders: L.layerGroup().addTo(map),
      weather: L.layerGroup().addTo(map),
      assets: L.layerGroup().addTo(map),
      crews: L.layerGroup().addTo(map),
      scenarios: L.layerGroup().addTo(map),
      heatmap: null,
    };

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // Update scenario markers
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.scenarios;
    layer.clearLayers();

    scenarios.forEach(scenario => {
      if (!scenario.geo_center) return;
      
      const isSelected = scenario.id === selectedEventId;
      const color = getMarkerColor(scenario);
      const icon = createColoredIcon(color, isSelected);

      const marker = L.marker([scenario.geo_center.lat, scenario.geo_center.lng], { icon })
        .bindPopup(`
          <div style="padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; color: #fff; margin: 0 0 4px 0;">${scenario.name}</h3>
            <p style="font-size: 12px; color: #888; margin: 0;">
              ${scenario.outage_type || 'Unknown'} • ${scenario.lifecycle_stage}
            </p>
            ${scenario.customers_impacted && scenario.customers_impacted > 0 ? `
              <p style="font-size: 12px; color: #888; margin: 2px 0 0 0;">
                ${scenario.customers_impacted.toLocaleString()} customers
              </p>
            ` : ''}
          </div>
        `, { className: 'custom-popup' })
        .on('click', () => onMarkerClick(scenario));

      layer.addLayer(marker);
    });
  }, [scenarios, selectedEventId, onMarkerClick]);

  // Update scenario polygons
  useEffect(() => {
    if (!mapRef.current || !layersRef.current || showHeatmap) return;
    
    const layer = layersRef.current.polygons;
    layer.clearLayers();

    scenarios.forEach(scenario => {
      if (!scenario.geo_area) return;
      
      const colors = getPolygonColor(scenario);
      const latLngs = geoAreaToLatLngs(scenario.geo_area);
      const isSelected = scenario.id === selectedEventId;

      const polygon = L.polygon(latLngs, {
        fillColor: colors.fill,
        fillOpacity: isSelected ? 0.4 : 0.25,
        color: colors.stroke,
        weight: isSelected ? 3 : 2,
      }).on('click', () => onMarkerClick(scenario));

      layer.addLayer(polygon);
    });
  }, [scenarios, selectedEventId, showHeatmap, onMarkerClick]);

  // Update heatmap
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;

    // Remove existing heatmap
    if (layersRef.current.heatmap) {
      mapRef.current.removeLayer(layersRef.current.heatmap);
      layersRef.current.heatmap = null;
    }

    if (!showHeatmap) return;

    const maxImpact = Math.max(...scenarios.map(s => s.customers_impacted || 0), 1);
    const heatData: [number, number, number][] = scenarios
      .filter(s => s.geo_center && (s.customers_impacted || 0) > 0)
      .map(s => [s.geo_center!.lat, s.geo_center!.lng, (s.customers_impacted || 0) / maxImpact]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: '#1e3a5f',
        0.25: '#3b82f6',
        0.5: '#f59e0b',
        0.75: '#ef4444',
        1.0: '#dc2626',
      },
    });

    heatLayer.addTo(mapRef.current);
    layersRef.current.heatmap = heatLayer;
  }, [showHeatmap, scenarios]);

  // Update feeder zones
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.feeders;
    layer.clearLayers();

    if (!showFeederZones) return;

    feederZones.forEach(zone => {
      const isHighlighted = highlightedFeederId === zone.feeder_id;
      const latLngs = geoAreaToLatLngs(zone.geo_area);

      const polygon = L.polygon(latLngs, {
        fillColor: 'hsl(217, 91%, 60%)',
        fillOpacity: isHighlighted ? 0.35 : 0.12,
        color: isHighlighted ? 'hsl(217, 91%, 50%)' : 'hsl(217, 91%, 60%)',
        weight: isHighlighted ? 3 : 1.5,
        dashArray: isHighlighted ? undefined : '4 4',
      })
        .bindTooltip(`<strong>Feeder ${zone.feeder_name}</strong><br/><span style="font-size: 11px;">${zone.feeder_id}</span>`, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95,
        })
        .on('click', () => onFeederClick?.(zone));

      layer.addLayer(polygon);
    });
  }, [showFeederZones, feederZones, highlightedFeederId, onFeederClick]);

  // Update assets
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.assets;
    layer.clearLayers();

    if (!showAssets) return;

    const hasSelectedEvent = !!selectedEventId;

    assets.forEach(asset => {
      const isLinked = linkedAssetIds.includes(asset.id);
      const isHighlighted = highlightedAssetId === asset.id;
      const icon = createAssetIcon(asset.asset_type, isLinked, hasSelectedEvent, isHighlighted);

      const marker = L.marker([asset.lat, asset.lng], { icon })
        .bindPopup(`
          <div style="padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; color: #fff; margin: 0 0 4px 0;">${asset.name}</h3>
            <p style="font-size: 12px; color: #888; margin: 0;">
              ${asset.asset_type}${asset.feeder_id ? ` • ${asset.feeder_id}` : ''}
            </p>
            ${isLinked && hasSelectedEvent ? `<p style="font-size: 12px; color: hsl(217, 91%, 60%); margin: 4px 0 0 0; font-weight: 500;">Linked to selected event</p>` : ''}
          </div>
        `, { className: 'custom-popup' })
        .on('click', () => onAssetClick?.(asset));

      layer.addLayer(marker);
    });
  }, [showAssets, assets, linkedAssetIds, selectedEventId, highlightedAssetId, onAssetClick]);

  // Update crews
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.crews;
    layer.clearLayers();

    if (!showCrews) return;

    crews.forEach(crew => {
      const hasAssignment = !!crew.assigned_event_id;
      const icon = createCrewIcon(crew.status, hasAssignment);

      const marker = L.marker([crew.current_lat, crew.current_lng], { icon })
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: 600; font-size: 14px; color: #fff; margin: 0 0 4px 0;">${crew.crew_name}</h3>
            <p style="font-size: 12px; color: #888; margin: 0;">${crew.crew_id}</p>
            <p style="font-size: 12px; color: #888; margin: 4px 0;">Status: ${crew.status}</p>
            <p style="font-size: 12px; color: #888; margin: 0;">${crew.vehicle_type} • ${crew.team_size} members</p>
          </div>
        `, { className: 'custom-popup crew-popup', maxWidth: 280 })
        .on('click', () => onCrewClick?.(crew));

      layer.addLayer(marker);

      // Draw route line if dispatched
      if (hasAssignment && (crew.status === 'dispatched' || crew.status === 'en_route')) {
        const targetScenario = scenarios.find(s => s.id === crew.assigned_event_id);
        if (targetScenario?.geo_center) {
          const polyline = L.polyline([
            [crew.current_lat, crew.current_lng],
            [targetScenario.geo_center.lat, targetScenario.geo_center.lng],
          ], {
            color: crew.status === 'en_route' ? '#3b82f6' : '#f59e0b',
            weight: 2,
            opacity: 0.5,
            dashArray: '8, 12',
          });
          layer.addLayer(polyline);
        }
      }
    });
  }, [showCrews, crews, scenarios, onCrewClick]);

  // Update weather
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.weather;
    layer.clearLayers();

    if (!showWeather || !weatherPoints.length) return;

    weatherPoints.forEach(point => {
      const weather = weatherCodeToDescription[point.weatherCode] || { label: 'Unknown', icon: '❓' };
      const color = point.weatherCode >= 95 ? '#dc2626' : point.weatherCode >= 61 ? '#0ea5e9' : '#22c55e';
      const opacity = point.weatherCode >= 95 ? 0.7 : point.weatherCode >= 61 ? 0.5 : 0.3;

      const circle = L.circleMarker([point.lat, point.lng], {
        radius: 35,
        fillColor: color,
        fillOpacity: opacity,
        color: color,
        weight: 1,
        opacity: 0.6,
      }).bindPopup(`
        <div style="padding: 8px; min-width: 160px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px;">${weather.icon}</span>
            <span style="font-weight: 600; font-size: 14px;">${weather.label}</span>
          </div>
          <div style="font-size: 12px; color: #888;">
            <div>Temperature: ${Math.round(point.temperature)}°F</div>
            <div>Wind: ${Math.round(point.windSpeed)} mph</div>
            <div>Humidity: ${point.humidity}%</div>
          </div>
        </div>
      `, { className: 'weather-popup' });

      layer.addLayer(circle);
    });
  }, [showWeather, weatherPoints]);

  // Handle zoom to selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEventId) return;
    
    const scenario = scenarios.find(s => s.id === selectedEventId);
    if (scenario?.geo_center) {
      mapRef.current.flyTo([scenario.geo_center.lat, scenario.geo_center.lng], 12, { duration: 0.8 });
    }
  }, [selectedEventId, scenarios]);

  // Handle zoom target
  useEffect(() => {
    if (!mapRef.current || !zoomTarget) return;
    mapRef.current.flyTo([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom || 13, { duration: 0.8 });
  }, [zoomTarget]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full"
      style={{ background: '#1a1a2e' }}
    />
  );
}
