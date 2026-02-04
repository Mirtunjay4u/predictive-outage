import React from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { FeederZone } from '@/types/feederZone';
import type { GeoArea } from '@/types/scenario';

interface FeederZoneLayerProps {
  feederZones: FeederZone[];
  visible: boolean;
  highlightedFeederId: string | null;
  onFeederClick: (zone: FeederZone) => void;
}

// Convert GeoJSON coordinates to Leaflet LatLng format
function geoAreaToLatLngs(geoArea: GeoArea): L.LatLngExpression[][] {
  if (geoArea.type === 'Polygon') {
    return (geoArea.coordinates as number[][][]).map(ring =>
      ring.map(coord => [coord[1], coord[0]] as L.LatLngExpression)
    );
  } else {
    // MultiPolygon - take first polygon
    const firstPolygon = (geoArea.coordinates as number[][][][])[0];
    return firstPolygon.map(ring =>
      ring.map(coord => [coord[1], coord[0]] as L.LatLngExpression)
    );
  }
}

export function FeederZoneLayer({ 
  feederZones, 
  visible, 
  highlightedFeederId,
  onFeederClick,
}: FeederZoneLayerProps) {
  if (!visible) return null;

  return (
    <>
      {feederZones.map(zone => {
        const latLngs = geoAreaToLatLngs(zone.geo_area);
        const isHighlighted = highlightedFeederId === zone.feeder_id;
        
        return (
          <Polygon
            key={zone.id}
            positions={latLngs}
            pathOptions={{
              fillColor: isHighlighted ? 'hsl(217, 91%, 60%)' : 'hsl(217, 91%, 60%)',
              fillOpacity: isHighlighted ? 0.35 : 0.12,
              color: isHighlighted ? 'hsl(217, 91%, 50%)' : 'hsl(217, 91%, 60%)',
              weight: isHighlighted ? 3 : 1.5,
              dashArray: isHighlighted ? undefined : '4 4',
            }}
            eventHandlers={{
              click: () => onFeederClick(zone),
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={0.95}
              className="feeder-tooltip"
            >
              <div className="text-sm font-medium">
                Feeder {zone.feeder_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {zone.feeder_id}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
