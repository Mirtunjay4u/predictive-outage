import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Scenario, GeoArea } from '@/types/scenario';
import type { Asset } from '@/types/asset';
import type { FeederZone } from '@/types/feederZone';
import type { Crew } from '@/types/crew';
import { HeatmapLayer } from './HeatmapLayer';
import { WeatherOverlay } from './WeatherOverlay';
import { AssetMarkers } from './AssetMarkers';
import { FeederZoneLayer } from './FeederZoneLayer';
import { AnimatedCrewMarkers } from './AnimatedCrewMarkers';
import type { WeatherPoint } from '@/hooks/useWeatherData';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface OutageMapViewProps {
  scenarios: Scenario[];
  selectedEventId: string | null;
  onMarkerClick: (scenario: Scenario) => void;
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
  // Crew dispatch props
  showCrews?: boolean;
  crews?: Crew[];
  onCrewClick?: (crew: Crew) => void;
  onSimulateCrewMovement?: (crewId: string, targetLat: number, targetLng: number) => void;
}

// Custom colored marker icons
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

// Custom cluster icon with count and severity-based styling
const createClusterCustomIcon = (cluster: any) => {
  const childCount = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();
  
  // Determine cluster color based on most severe lifecycle stage in cluster
  let hasEvent = false;
  let hasPreEvent = false;
  let totalCustomers = 0;
  
  markers.forEach((marker: any) => {
    const scenario = marker.options.scenario as Scenario | undefined;
    if (scenario) {
      if (scenario.lifecycle_stage === 'Event') hasEvent = true;
      if (scenario.lifecycle_stage === 'Pre-Event') hasPreEvent = true;
      totalCustomers += scenario.customers_impacted || 0;
    }
  });
  
  // Color priority: Event (red) > Pre-Event (amber) > Post-Event (gray)
  let bgColor = '#6b7280'; // Default gray
  let borderColor = '#4b5563';
  if (hasEvent) {
    bgColor = '#ef4444';
    borderColor = '#dc2626';
  } else if (hasPreEvent) {
    bgColor = '#f59e0b';
    borderColor = '#d97706';
  }
  
  // Size based on count
  let size = 40;
  if (childCount >= 10) size = 50;
  if (childCount >= 20) size = 60;
  
  return L.divIcon({
    html: `
      <div class="cluster-marker" style="
        background: ${bgColor};
        border: 3px solid ${borderColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 40 ? '14px' : '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <span>${childCount}</span>
        ${totalCustomers > 0 ? `<span style="font-size: 8px; opacity: 0.9;">${(totalCustomers / 1000).toFixed(0)}k</span>` : ''}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
};

const getMarkerColor = (scenario: Scenario) => {
  switch (scenario.lifecycle_stage) {
    case 'Event': return '#ef4444'; // destructive red
    case 'Pre-Event': return '#f59e0b'; // warning amber
    case 'Post-Event': return '#6b7280'; // muted gray
    default: return '#6b7280';
  }
};

const getPolygonColor = (scenario: Scenario) => {
  switch (scenario.lifecycle_stage) {
    case 'Event': return { fill: '#ef444430', stroke: '#ef4444' };
    case 'Pre-Event': return { fill: '#f59e0b30', stroke: '#f59e0b' };
    case 'Post-Event': return { fill: '#6b728030', stroke: '#6b7280' };
    default: return { fill: '#6b728030', stroke: '#6b7280' };
  }
};

// Component to handle map updates when selection changes
function MapController({ 
  selectedEventId, 
  scenarios,
  zoomToAssetType,
  assets,
  linkedAssetIds,
  zoomTarget,
}: { 
  selectedEventId: string | null; 
  scenarios: Scenario[];
  zoomToAssetType: Asset['asset_type'] | null;
  assets: Asset[];
  linkedAssetIds: string[];
  zoomTarget?: { lat: number; lng: number; zoom?: number } | null;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedEventId) {
      const scenario = scenarios.find(s => s.id === selectedEventId);
      if (scenario?.geo_center) {
        map.flyTo([scenario.geo_center.lat, scenario.geo_center.lng], 12, {
          duration: 0.8,
        });
      }
    }
  }, [selectedEventId, scenarios, map]);

  // Zoom to assets of a specific type
  useEffect(() => {
    if (zoomToAssetType && linkedAssetIds.length > 0) {
      const targetAssets = assets.filter(
        a => a.asset_type === zoomToAssetType && linkedAssetIds.includes(a.id)
      );
      
      if (targetAssets.length > 0) {
        const bounds = L.latLngBounds(
          targetAssets.map(a => [a.lat, a.lng] as L.LatLngExpression)
        );
        map.flyToBounds(bounds.pad(0.3), { duration: 0.8, maxZoom: 14 });
      }
    }
  }, [zoomToAssetType, assets, linkedAssetIds, map]);

  // Zoom to search target
  useEffect(() => {
    if (zoomTarget) {
      map.flyTo([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom || 13, {
        duration: 0.8,
      });
    }
  }, [zoomTarget, map]);
  
  return null;
}

// Convert GeoJSON coordinates to Leaflet LatLng format
function geoAreaToLatLngs(geoArea: GeoArea): L.LatLngExpression[][] {
  if (geoArea.type === 'Polygon') {
    // Polygon coordinates are [[[lng, lat], ...]]
    return (geoArea.coordinates as number[][][]).map(ring =>
      ring.map(coord => [coord[1], coord[0]] as L.LatLngExpression)
    );
  } else {
    // MultiPolygon coordinates are [[[[lng, lat], ...]]]
    // For simplicity, flatten to first polygon
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
  enableClustering = true,
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
  onSimulateCrewMovement,
}: OutageMapViewProps) {
  const [zoomToAssetType, setZoomToAssetType] = useState<Asset['asset_type'] | null>(null);

  // Listen for zoom requests from EventDetailDrawer
  useEffect(() => {
    const handler = (e: CustomEvent<Asset['asset_type']>) => {
      setZoomToAssetType(e.detail);
      // Reset after animation
      setTimeout(() => setZoomToAssetType(null), 1000);
    };
    window.addEventListener('zoom-to-assets' as any, handler);
    return () => window.removeEventListener('zoom-to-assets' as any, handler);
  }, []);
  // Calculate center from scenarios or default to Houston
  const mapCenter = useMemo(() => {
    if (scenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const validScenarios = scenarios.filter(s => s.geo_center);
    if (validScenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const avgLat = validScenarios.reduce((sum, s) => sum + s.geo_center!.lat, 0) / validScenarios.length;
    const avgLng = validScenarios.reduce((sum, s) => sum + s.geo_center!.lng, 0) / validScenarios.length;
    
    return [avgLat, avgLng] as [number, number];
  }, [scenarios]);

  // Render markers (used both inside and outside cluster)
  const renderMarkers = () => {
    return scenarios.map(scenario => {
      if (!scenario.geo_center) return null;
      
      const isSelected = scenario.id === selectedEventId;
      const color = getMarkerColor(scenario);
      const icon = createColoredIcon(color, isSelected);
      
      return (
        <Marker
          key={`marker-${scenario.id}`}
          position={[scenario.geo_center.lat, scenario.geo_center.lng]}
          icon={icon}
          // @ts-ignore - attach scenario for cluster icon calculation
          scenario={scenario}
          eventHandlers={{
            click: () => onMarkerClick(scenario),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-1">
              <h3 className="font-semibold text-sm text-foreground">{scenario.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {scenario.outage_type || 'Unknown'} • {scenario.lifecycle_stage}
              </p>
              {scenario.customers_impacted && scenario.customers_impacted > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scenario.customers_impacted.toLocaleString()} customers
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={9}
      className="h-full w-full"
      style={{ background: '#1a1a2e' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapController 
        selectedEventId={selectedEventId} 
        scenarios={scenarios} 
        zoomToAssetType={zoomToAssetType}
        assets={assets}
        linkedAssetIds={linkedAssetIds}
        zoomTarget={zoomTarget}
      />
      
      {/* Feeder Zones Layer - rendered first (below other layers) */}
      {onFeederClick && (
        <FeederZoneLayer
          feederZones={feederZones}
          visible={showFeederZones}
          highlightedFeederId={highlightedFeederId}
          onFeederClick={onFeederClick}
        />
      )}
      
      {/* Weather Overlay - rendered first (below other layers) */}
      <WeatherOverlay weatherPoints={weatherPoints} visible={showWeather} />
      
      {/* Heatmap Layer */}
      <HeatmapLayer scenarios={scenarios} visible={showHeatmap} />
      
      {/* Render outage areas first (below markers) - hide when heatmap is active */}
      {!showHeatmap && scenarios.map(scenario => {
        if (!scenario.geo_area) return null;
        
        const colors = getPolygonColor(scenario);
        const latLngs = geoAreaToLatLngs(scenario.geo_area);
        const isSelected = scenario.id === selectedEventId;
        
        return (
          <Polygon
            key={`area-${scenario.id}`}
            positions={latLngs}
            pathOptions={{
              fillColor: colors.fill,
              fillOpacity: isSelected ? 0.4 : 0.25,
              color: colors.stroke,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onMarkerClick(scenario),
            }}
          />
        );
      })}
      
      {/* Asset Markers Layer */}
      {showAssets && onAssetClick && (
        <AssetMarkers
          assets={assets}
          linkedAssetIds={linkedAssetIds}
          selectedEventId={selectedEventId}
          visible={showAssets}
          onAssetClick={onAssetClick}
          highlightedAssetId={highlightedAssetId}
        />
      )}
      
      {/* Animated Crew Markers Layer */}
      {showCrews && onCrewClick && (
        <AnimatedCrewMarkers
          crews={crews}
          scenarios={scenarios}
          visible={showCrews}
          onCrewClick={onCrewClick}
          onSimulateMovement={onSimulateCrewMovement}
          showRouteTrails={true}
        />
      )}
      
      {/* Render markers - with or without clustering */}
      {enableClustering && !showHeatmap ? (
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={13}
        >
          {renderMarkers()}
        </MarkerClusterGroup>
      ) : (
        renderMarkers()
      )}
    </MapContainer>
  );
}
