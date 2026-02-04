import React, { useEffect, useRef } from 'react';
import { Polygon, useMap } from 'react-leaflet';
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

// Individual feeder polygon with native tooltip
function FeederPolygon({
  zone,
  isHighlighted,
  onFeederClick,
}: {
  zone: FeederZone;
  isHighlighted: boolean;
  onFeederClick: (zone: FeederZone) => void;
}) {
  const polygonRef = useRef<L.Polygon>(null);
  const latLngs = geoAreaToLatLngs(zone.geo_area);

  useEffect(() => {
    const polygon = polygonRef.current;
    if (!polygon) return;

    // Bind native Leaflet tooltip
    polygon.bindTooltip(
      `<div style="text-align: center;">
        <strong>Feeder ${zone.feeder_name}</strong><br/>
        <span style="font-size: 11px; opacity: 0.8;">${zone.feeder_id}</span>
      </div>`,
      {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        className: 'feeder-tooltip',
      }
    );

    return () => {
      polygon.unbindTooltip();
    };
  }, [zone.feeder_name, zone.feeder_id]);

  return (
    <Polygon
      ref={polygonRef}
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
    />
  );
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
      {feederZones.map(zone => (
        <FeederPolygon
          key={zone.id}
          zone={zone}
          isHighlighted={highlightedFeederId === zone.feeder_id}
          onFeederClick={onFeederClick}
        />
      ))}
    </>
  );
}
