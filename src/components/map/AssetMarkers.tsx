import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Asset } from '@/types/asset';

interface AssetMarkersProps {
  assets: Asset[];
  linkedAssetIds: string[];
  selectedEventId: string | null;
  visible: boolean;
  onAssetClick: (asset: Asset) => void;
  highlightedAssetId?: string | null;
}

// Create distinct icons for each asset type
const createAssetIcon = (assetType: string, isLinked: boolean, hasSelectedEvent: boolean, isHighlighted: boolean) => {
  const opacity = isHighlighted ? 1 : (hasSelectedEvent ? (isLinked ? 1 : 0.3) : 1);
  const size = isHighlighted ? 28 : 20;
  
  let shape: string;
  let color: string;
  let strokeColor: string;
  
  switch (assetType) {
    case 'Fault':
      // Lightning bolt shape - red
      color = isLinked || isHighlighted ? '#ef4444' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#dc2626' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity: ${opacity}">
          <polygon fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}" points="13,2 3,14 12,14 11,22 21,10 12,10"/>
        </svg>
      `;
      break;
    case 'Feeder':
      // Cable/line shape - blue
      color = isLinked || isHighlighted ? '#3b82f6' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#2563eb' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity: ${opacity}">
          <rect x="4" y="8" width="16" height="8" rx="2" fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}"/>
          <line x1="8" y1="4" x2="8" y2="8" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="16" y1="4" x2="16" y2="8" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="8" y1="16" x2="8" y2="20" stroke="${strokeColor}" stroke-width="2"/>
          <line x1="16" y1="16" x2="16" y2="20" stroke="${strokeColor}" stroke-width="2"/>
        </svg>
      `;
      break;
    case 'Transformer':
    default:
      // Box/transformer shape - amber
      color = isLinked || isHighlighted ? '#f59e0b' : '#6b7280';
      strokeColor = isLinked || isHighlighted ? '#d97706' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity: ${opacity}">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="${color}" stroke="${isHighlighted ? '#ffffff' : strokeColor}" stroke-width="${isHighlighted ? '2' : '1.5'}"/>
          <circle cx="12" cy="12" r="4" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
          <line x1="12" y1="4" x2="12" y2="8" stroke="${strokeColor}" stroke-width="1.5"/>
          <line x1="12" y1="16" x2="12" y2="20" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      `;
      break;
  }
  
  return L.divIcon({
    html: shape,
    className: `asset-marker-icon ${isHighlighted ? 'highlighted' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

// Individual asset marker with native popup binding
function AssetMarker({
  asset,
  isLinked,
  hasSelectedEvent,
  isHighlighted,
  onAssetClick,
}: {
  asset: Asset;
  isLinked: boolean;
  hasSelectedEvent: boolean;
  isHighlighted: boolean;
  onAssetClick: (asset: Asset) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const icon = createAssetIcon(asset.asset_type, isLinked, hasSelectedEvent, isHighlighted);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    // Bind native Leaflet popup
    marker.bindPopup(
      `<div style="padding: 4px;">
        <h3 style="font-weight: 600; font-size: 14px; color: #fff; margin: 0 0 4px 0;">${asset.name}</h3>
        <p style="font-size: 12px; color: #888; margin: 0;">
          ${asset.asset_type}${asset.feeder_id ? ` • ${asset.feeder_id}` : ''}
        </p>
        ${isLinked && hasSelectedEvent ? `
          <p style="font-size: 12px; color: hsl(217, 91%, 60%); margin: 4px 0 0 0; font-weight: 500;">
            Linked to selected event
          </p>
        ` : ''}
      </div>`,
      { className: 'custom-popup' }
    );

    return () => {
      marker.unbindPopup();
    };
  }, [asset, isLinked, hasSelectedEvent]);

  return (
    <Marker
      ref={markerRef}
      position={[asset.lat, asset.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onAssetClick(asset),
      }}
    />
  );
}

export function AssetMarkers({ 
  assets, 
  linkedAssetIds, 
  selectedEventId, 
  visible,
  onAssetClick,
  highlightedAssetId,
}: AssetMarkersProps) {
  if (!visible) return null;
  
  const hasSelectedEvent = !!selectedEventId;
  
  return (
    <>
      {assets.map(asset => {
        const isLinked = linkedAssetIds.includes(asset.id);
        const isHighlighted = highlightedAssetId === asset.id;
        
        return (
          <AssetMarker
            key={`asset-${asset.id}`}
            asset={asset}
            isLinked={isLinked}
            hasSelectedEvent={hasSelectedEvent}
            isHighlighted={isHighlighted}
            onAssetClick={onAssetClick}
          />
        );
      })}
    </>
  );
}
