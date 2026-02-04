import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Scenario, GeoArea } from '@/types/scenario';
import { HeatmapLayer } from './HeatmapLayer';

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
function MapController({ selectedEventId, scenarios }: { selectedEventId: string | null; scenarios: Scenario[] }) {
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

export function OutageMapView({ scenarios, selectedEventId, onMarkerClick, showHeatmap = false }: OutageMapViewProps) {
  // Calculate center from scenarios or default to Houston
  const mapCenter = useMemo(() => {
    if (scenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const validScenarios = scenarios.filter(s => s.geo_center);
    if (validScenarios.length === 0) return [29.7604, -95.3698] as [number, number];
    
    const avgLat = validScenarios.reduce((sum, s) => sum + s.geo_center!.lat, 0) / validScenarios.length;
    const avgLng = validScenarios.reduce((sum, s) => sum + s.geo_center!.lng, 0) / validScenarios.length;
    
    return [avgLat, avgLng] as [number, number];
  }, [scenarios]);

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
      
      <MapController selectedEventId={selectedEventId} scenarios={scenarios} />
      
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
      
      {/* Render markers - always visible but smaller when heatmap active */}
      {scenarios.map(scenario => {
        if (!scenario.geo_center) return null;
        
        const isSelected = scenario.id === selectedEventId;
        const color = getMarkerColor(scenario);
        const icon = createColoredIcon(color, isSelected);
        
        return (
          <Marker
            key={`marker-${scenario.id}`}
            position={[scenario.geo_center.lat, scenario.geo_center.lng]}
            icon={icon}
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
      })}
    </MapContainer>
  );
}
