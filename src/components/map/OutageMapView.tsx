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
import { getEventSeverity, severityColor, severityLabel, getEffectiveLocation, outageToHazard, hazardOverlayColor, type HazardOverlay } from '@/lib/severity';

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
  showCriticalLoads?: boolean;
  activeHazardOverlays?: HazardOverlay[];
  severityFilter?: number | null;
  criticalLoadOnly?: boolean;
  onCriticalLoadClick?: (loadType: string, event: Scenario | ScenarioWithIntelligence) => void;
  // Weather radar + NWS alerts overlays
  showRadar?: boolean;
  radarOpacity?: number;
  radarTileUrl?: string | null;
  showNWSAlerts?: boolean;
  nwsAlertFeatures?: import('@/lib/weather').NWSAlertFeature[];
  onNWSAlertClick?: (alert: import('@/lib/weather').NWSAlertFeature) => void;
  // Wind overlay
  showWind?: boolean;
  windPoints?: import('@/lib/weather').WindPoint[];
}

// Helper: severity-colored marker icon
const createSeverityIcon = (severity: number, isSelected: boolean, isApprox: boolean) => {
  const color = severityColor(severity);
  const size = isSelected ? 32 : 24;
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="${isSelected ? '#ffffff' : '#374151'}" stroke-width="${isSelected ? '2' : '1'}" 
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      ${isApprox ? `<text x="12" y="22" text-anchor="middle" fill="${color}" font-size="5" font-weight="bold">≈</text>` : ''}
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

// Critical load marker icon
const createCriticalLoadIcon = (loadType: string) => {
  const size = 28;
  let glyph = '🏥';
  if (loadType.toLowerCase().includes('water')) glyph = '💧';
  else if (loadType.toLowerCase().includes('shelter') || loadType.toLowerCase().includes('emergency')) glyph = '🏠';
  else if (loadType.toLowerCase().includes('telecom') || loadType.toLowerCase().includes('data')) glyph = '📡';

  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,0.15);border:2px solid #dc2626;border-radius:6px;font-size:16px;backdrop-filter:blur(2px);cursor:pointer;pointer-events:auto">${glyph}</div>`,
    className: 'critical-load-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
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
  showCriticalLoads = false,
  activeHazardOverlays = [],
  severityFilter = null,
  criticalLoadOnly = false,
  onCriticalLoadClick,
  // Weather overlays
  showRadar = false,
  radarOpacity = 0.5,
  radarTileUrl: radarUrl = null,
  showNWSAlerts = false,
  nwsAlertFeatures = [],
  onNWSAlertClick,
  showWind = false,
  windPoints = [],
}: OutageMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const nwsLayerRef = useRef<L.LayerGroup | null>(null);
  const windLayerRef = useRef<L.LayerGroup | null>(null);
  const layersRef = useRef<{
    scenarios: L.LayerGroup;
    polygons: L.LayerGroup;
    assets: L.LayerGroup;
    feeders: L.LayerGroup;
    crews: L.LayerGroup;
    weather: L.LayerGroup;
    criticalLoads: L.LayerGroup;
    hazardOverlays: L.LayerGroup;
    heatmap: L.Layer | null;
  } | null>(null);

  // Filter scenarios by severity and critical-load-only
  const displayScenarios = useMemo(() => {
    return scenarios.filter(s => {
      if (severityFilter && getEventSeverity(s) < severityFilter) return false;
      if (criticalLoadOnly && !s.has_critical_load) return false;
      return true;
    });
  }, [scenarios, severityFilter, criticalLoadOnly]);

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
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Satellite imagery base layer — earth-view with visible terrain
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      className: 'map-base-tiles',
    }).addTo(map);

    // Labels overlay on top of satellite imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      className: 'map-label-tiles',
      pane: 'overlayPane',
    }).addTo(map);

    layersRef.current = {
      polygons: L.layerGroup().addTo(map),
      feeders: L.layerGroup().addTo(map),
      weather: L.layerGroup().addTo(map),
      hazardOverlays: L.layerGroup().addTo(map),
      assets: L.layerGroup().addTo(map),
      criticalLoads: L.layerGroup().addTo(map),
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

  // Update scenario markers — severity-colored
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.scenarios;
    layer.clearLayers();

    displayScenarios.forEach(scenario => {
      const loc = getEffectiveLocation(scenario);
      const severity = getEventSeverity(scenario);
      const isSelected = scenario.id === selectedEventId;
      const icon = createSeverityIcon(severity, isSelected, loc.isApprox);

      const popupContent = `
        <div style="padding: 4px;">
          <h3 style="font-weight: 600; font-size: 14px; color: #fff; margin: 0 0 4px 0;">${scenario.name}</h3>
          <p style="font-size: 12px; color: #888; margin: 0;">
            ${scenario.outage_type || 'Unknown'} • ${scenario.lifecycle_stage} • Severity ${severity}/5
          </p>
          ${scenario.customers_impacted && scenario.customers_impacted > 0 ? `
            <p style="font-size: 12px; color: #888; margin: 2px 0 0 0;">
              ${scenario.customers_impacted.toLocaleString()} customers
            </p>
          ` : ''}
          ${loc.isApprox ? '<p style="font-size: 11px; color: #f59e0b; margin: 4px 0 0 0;">≈ Approx. location</p>' : ''}
        </div>
      `;

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .bindPopup(popupContent, { className: 'custom-popup' })
        .on('click', () => onMarkerClick(scenario));

      layer.addLayer(marker);
    });
  }, [displayScenarios, selectedEventId, onMarkerClick]);

  // Update scenario polygons
  useEffect(() => {
    if (!mapRef.current || !layersRef.current || showHeatmap) return;
    
    const layer = layersRef.current.polygons;
    layer.clearLayers();

    displayScenarios.forEach(scenario => {
      if (!scenario.geo_area) return;
      
      const severity = getEventSeverity(scenario);
      const color = severityColor(severity);
      const isSelected = scenario.id === selectedEventId;

      const latLngs = geoAreaToLatLngs(scenario.geo_area);
      const polygon = L.polygon(latLngs, {
        fillColor: color,
        fillOpacity: isSelected ? 0.4 : 0.2,
        color,
        weight: isSelected ? 3 : 2,
      }).on('click', () => onMarkerClick(scenario));

      layer.addLayer(polygon);
    });
  }, [displayScenarios, selectedEventId, showHeatmap, onMarkerClick]);

  // Critical load markers
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;

    const layer = layersRef.current.criticalLoads;
    layer.clearLayers();

    if (!showCriticalLoads || !selectedEventId) return;

    const selected = displayScenarios.find(s => s.id === selectedEventId);
    if (!selected?.has_critical_load || !selected.critical_load_types?.length) return;

    const loc = getEffectiveLocation(selected);
    
    selected.critical_load_types.forEach((loadType, idx) => {
      const icon = createCriticalLoadIcon(loadType);
      // Offset slightly so they don't stack
      const offsetLat = loc.lat + (idx - (selected.critical_load_types!.length - 1) / 2) * 0.003;
      const offsetLng = loc.lng + 0.005;

      const marker = L.marker([offsetLat, offsetLng], { icon })
        .bindTooltip(`<strong>Critical Load</strong><br/>${loadType}`, { direction: 'top', offset: [0, -14] })
        .on('click', () => onCriticalLoadClick?.(loadType, selected));

      layer.addLayer(marker);
    });
  }, [showCriticalLoads, selectedEventId, displayScenarios, onCriticalLoadClick]);

  // Hazard overlay polygons
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;

    const layer = layersRef.current.hazardOverlays;
    layer.clearLayers();

    if (activeHazardOverlays.length === 0) return;

    displayScenarios.forEach(scenario => {
      const hazard = outageToHazard(scenario.outage_type);
      if (!hazard || !activeHazardOverlays.includes(hazard)) return;

      const loc = getEffectiveLocation(scenario);
      const colors = hazardOverlayColor(hazard);

      if (scenario.geo_area) {
        const latLngs = geoAreaToLatLngs(scenario.geo_area);
        const polygon = L.polygon(latLngs, {
          fillColor: colors.fill,
          fillOpacity: 0.25,
          color: colors.stroke,
          weight: 2,
          dashArray: '6 4',
        }).bindTooltip(`${hazard} zone: ${scenario.name}`, { direction: 'top' });
        layer.addLayer(polygon);
      } else {
        // Synthetic circle for events without geo_area
        const circle = L.circle([loc.lat, loc.lng], {
          radius: 2000,
          fillColor: colors.fill,
          fillOpacity: 0.2,
          color: colors.stroke,
          weight: 2,
          dashArray: '6 4',
        }).bindTooltip(`${hazard} zone: ${scenario.name}`, { direction: 'top' });
        layer.addLayer(circle);
      }
    });
  }, [activeHazardOverlays, displayScenarios]);

  // Update heatmap
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;

    if (layersRef.current.heatmap) {
      mapRef.current.removeLayer(layersRef.current.heatmap);
      layersRef.current.heatmap = null;
    }

    if (!showHeatmap) return;

    const maxImpact = Math.max(...displayScenarios.map(s => s.customers_impacted || 0), 1);
    const heatData: [number, number, number][] = displayScenarios
      .filter(s => (s.customers_impacted || 0) > 0)
      .map(s => {
        const loc = getEffectiveLocation(s);
        return [loc.lat, loc.lng, (s.customers_impacted || 0) / maxImpact];
      });

    const heatLayer = L.heatLayer(heatData, {
      radius: 35, blur: 25, maxZoom: 12, max: 1.0, minOpacity: 0.4,
      gradient: { 0.0: '#1e3a5f', 0.25: '#3b82f6', 0.5: '#f59e0b', 0.75: '#ef4444', 1.0: '#dc2626' },
    });

    heatLayer.addTo(mapRef.current);
    layersRef.current.heatmap = heatLayer;
  }, [showHeatmap, displayScenarios]);

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
          direction: 'top', offset: [0, -10], opacity: 0.95,
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
      
      // When an event is selected, only show linked assets
      if (hasSelectedEvent && !isLinked && !isHighlighted) return;

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

  // Update crews — event-scoped when an event is selected
  useEffect(() => {
    if (!mapRef.current || !layersRef.current) return;
    
    const layer = layersRef.current.crews;
    layer.clearLayers();

    if (!showCrews) return;

    // When an event is selected, only show crews assigned to that event
    const filteredCrews = selectedEventId
      ? crews.filter(c => c.assigned_event_id === selectedEventId)
      : crews;

    filteredCrews.forEach(crew => {
      const hasAssignment = !!crew.assigned_event_id;
      const icon = createCrewIcon(crew.status, hasAssignment);

      const tooltipContent = `
        <div style="padding: 2px; min-width: 140px;">
          <strong>${crew.crew_name}</strong><br/>
          <span style="font-size: 11px; color: #aaa;">
            ${crew.specialization || crew.vehicle_type} · ${crew.status.replace('_', ' ')}
            ${crew.eta_minutes ? ` · ETA ${crew.eta_minutes}m` : ''}
          </span>
        </div>
      `;

      const marker = L.marker([crew.current_lat, crew.current_lng], { icon })
        .bindTooltip(tooltipContent, { direction: 'top', offset: [0, -18], opacity: 0.95 })
        .on('click', () => onCrewClick?.(crew));

      layer.addLayer(marker);

      if (hasAssignment && (crew.status === 'dispatched' || crew.status === 'en_route')) {
        const targetScenario = scenarios.find(s => s.id === crew.assigned_event_id);
        if (targetScenario?.geo_center) {
          const polyline = L.polyline([
            [crew.current_lat, crew.current_lng],
            [targetScenario.geo_center.lat, targetScenario.geo_center.lng],
          ], {
            color: crew.status === 'en_route' ? '#3b82f6' : '#f59e0b',
            weight: 2, opacity: 0.5, dashArray: '8, 12',
          });
          layer.addLayer(polyline);
        }
      }
    });
  }, [showCrews, crews, scenarios, selectedEventId, onCrewClick]);

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
        radius: 35, fillColor: color, fillOpacity: opacity, color, weight: 1, opacity: 0.6,
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
    if (scenario) {
      const loc = getEffectiveLocation(scenario);
      mapRef.current.flyTo([loc.lat, loc.lng], 12, { duration: 0.8 });
    }
  }, [selectedEventId, scenarios]);

  // Handle zoom target
  useEffect(() => {
    if (!mapRef.current || !zoomTarget) return;
    mapRef.current.flyTo([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom || 13, { duration: 0.8 });
  }, [zoomTarget]);

  // ── Radar tile overlay ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing radar layer
    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (!showRadar || !radarUrl) return;

    const tileLayer = L.tileLayer(radarUrl, {
      opacity: radarOpacity,
      zIndex: 200,
      attribution: '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
    });
    tileLayer.addTo(mapRef.current);
    radarLayerRef.current = tileLayer;
  }, [showRadar, radarUrl]);

  // Update radar opacity without recreating layer
  useEffect(() => {
    if (radarLayerRef.current) {
      radarLayerRef.current.setOpacity(radarOpacity);
    }
  }, [radarOpacity]);

  // ── NWS Alert polygons ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Lazy-create the layer group
    if (!nwsLayerRef.current) {
      nwsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const layer = nwsLayerRef.current;
    layer.clearLayers();

    if (!showNWSAlerts || nwsAlertFeatures.length === 0) return;

    nwsAlertFeatures.forEach((alert) => {
      if (!alert.geometry) return;

      const { fill, stroke } = (() => {
        switch (alert.severity) {
          case 'Extreme': return { fill: 'rgba(220,38,38,0.15)', stroke: '#dc2626' };
          case 'Severe': return { fill: 'rgba(249,115,22,0.15)', stroke: '#f97316' };
          case 'Moderate': return { fill: 'rgba(234,179,8,0.15)', stroke: '#eab308' };
          case 'Minor': return { fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6' };
          default: return { fill: 'rgba(107,114,128,0.15)', stroke: '#6b7280' };
        }
      })();

      const geoLayer = L.geoJSON(alert.geometry as any, {
        style: {
          fillColor: fill,
          fillOpacity: 0.15,
          color: stroke,
          weight: 2,
        },
      });

      geoLayer.bindPopup(`
        <div style="padding:6px;min-width:200px;">
          <h4 style="font-weight:700;font-size:13px;color:#fff;margin:0 0 4px">${alert.event}</h4>
          <p style="font-size:11px;color:#aaa;margin:0 0 4px">${alert.severity} · ${alert.areaDesc}</p>
          <p style="font-size:11px;color:#888;margin:0">${alert.headline}</p>
          ${alert.expires ? `<p style="font-size:10px;color:#666;margin:4px 0 0">Expires: ${new Date(alert.expires).toLocaleString()}</p>` : ''}
        </div>
      `, { className: 'custom-popup', maxWidth: 320 });

      geoLayer.on('click', () => onNWSAlertClick?.(alert));
      layer.addLayer(geoLayer);
    });
  }, [showNWSAlerts, nwsAlertFeatures, onNWSAlertClick]);

  // ── Wind arrows overlay ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    if (!windLayerRef.current) {
      windLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const layer = windLayerRef.current;
    layer.clearLayers();

    if (!showWind || windPoints.length === 0) return;

    windPoints.forEach((pt) => {
      const speed = pt.speed;
      const dir = pt.direction; // meteorological degrees
      // Color by speed
      let color: string;
      if (speed >= 50) color = '#dc2626';
      else if (speed >= 30) color = '#f97316';
      else if (speed >= 15) color = '#eab308';
      else if (speed >= 5) color = '#3b82f6';
      else color = '#6b7280';

      // Arrow SVG rotated by wind direction
      // Meteorological convention: direction wind comes FROM, arrow points in direction wind goes TO
      const arrowRotation = dir; // CSS rotation: 0=up(N), 90=right(E)
      const arrowSize = Math.min(36, Math.max(20, 16 + speed * 0.3));
      const opacity = Math.min(1, Math.max(0.4, 0.3 + speed * 0.015));

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${arrowSize}" height="${arrowSize}" 
             style="transform: rotate(${arrowRotation}deg); opacity: ${opacity}; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
          <path d="M12 2 L16 10 L13 9 L13 20 L11 20 L11 9 L8 10 Z" fill="${color}" stroke="${color}" stroke-width="0.5"/>
        </svg>
      `;

      const icon = L.divIcon({
        html: svg,
        className: 'wind-arrow-icon',
        iconSize: [arrowSize, arrowSize],
        iconAnchor: [arrowSize / 2, arrowSize / 2],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon, interactive: true })
        .bindTooltip(
          `<div style="padding:2px;"><strong>${Math.round(speed)} mph</strong><br/><span style="font-size:11px;color:#aaa;">Gusts: ${Math.round(pt.gusts)} mph<br/>Dir: ${Math.round(dir)}°</span></div>`,
          { direction: 'top', offset: [0, -(arrowSize / 2)], opacity: 0.95 }
        );

      layer.addLayer(marker);
    });
  }, [showWind, windPoints]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full"
      style={{ background: '#1a1a2e' }}
    />
  );
}
