import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Asset } from '@/types/asset';

interface AssetMarkersProps {
  assets: Asset[];
  linkedAssetIds: string[];
  selectedEventId: string | null;
  visible: boolean;
  onAssetClick: (asset: Asset) => void;
}

// Create distinct icons for each asset type
const createAssetIcon = (assetType: string, isLinked: boolean, hasSelectedEvent: boolean) => {
  const opacity = hasSelectedEvent ? (isLinked ? 1 : 0.3) : 1;
  
  let shape: string;
  let color: string;
  let strokeColor: string;
  
  switch (assetType) {
    case 'Fault':
      // Lightning bolt shape - red
      color = isLinked ? '#ef4444' : '#6b7280';
      strokeColor = isLinked ? '#dc2626' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="opacity: ${opacity}">
          <polygon fill="${color}" stroke="${strokeColor}" stroke-width="1.5" points="13,2 3,14 12,14 11,22 21,10 12,10"/>
        </svg>
      `;
      break;
    case 'Feeder':
      // Cable/line shape - blue
      color = isLinked ? '#3b82f6' : '#6b7280';
      strokeColor = isLinked ? '#2563eb' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="opacity: ${opacity}">
          <rect x="4" y="8" width="16" height="8" rx="2" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
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
      color = isLinked ? '#f59e0b' : '#6b7280';
      strokeColor = isLinked ? '#d97706' : '#4b5563';
      shape = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="opacity: ${opacity}">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="4" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
          <line x1="12" y1="4" x2="12" y2="8" stroke="${strokeColor}" stroke-width="1.5"/>
          <line x1="12" y1="16" x2="12" y2="20" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      `;
      break;
  }
  
  return L.divIcon({
    html: shape,
    className: 'asset-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

export function AssetMarkers({ 
  assets, 
  linkedAssetIds, 
  selectedEventId, 
  visible,
  onAssetClick 
}: AssetMarkersProps) {
  if (!visible) return null;
  
  const hasSelectedEvent = !!selectedEventId;
  
  return (
    <>
      {assets.map(asset => {
        const isLinked = linkedAssetIds.includes(asset.id);
        const icon = createAssetIcon(asset.asset_type, isLinked, hasSelectedEvent);
        
        return (
          <Marker
            key={`asset-${asset.id}`}
            position={[asset.lat, asset.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onAssetClick(asset),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-semibold text-sm text-foreground">{asset.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {asset.asset_type}
                  {asset.feeder_id && ` • ${asset.feeder_id}`}
                </p>
                {isLinked && hasSelectedEvent && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    Linked to selected event
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
