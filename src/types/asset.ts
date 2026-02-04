// GIS Asset Types

export type AssetType = 'Fault' | 'Feeder' | 'Transformer';

export interface Asset {
  id: string;
  asset_type: AssetType;
  name: string;
  feeder_id: string | null;
  transformer_id: string | null;
  fault_id: string | null;
  lat: number;
  lng: number;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EventAsset {
  id: string;
  event_id: string;
  asset_id: string;
  created_at: string;
}

export interface AssetWithEventLink extends Asset {
  isLinkedToSelectedEvent?: boolean;
}
