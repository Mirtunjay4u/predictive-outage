// Feeder Zone Types

import type { GeoArea } from './scenario';

export interface FeederZone {
  id: string;
  feeder_id: string;
  feeder_name: string;
  geo_area: GeoArea;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
