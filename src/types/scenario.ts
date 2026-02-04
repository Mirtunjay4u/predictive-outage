export type LifecycleStage = 'Pre-Event' | 'Event' | 'Post-Event';

export type OutageType = 
  | 'Storm'
  | 'Flood'
  | 'Heavy Rain'
  | 'Heatwave'
  | 'Wildfire'
  | 'Lightning'
  | 'Ice/Snow'
  | 'High Wind'
  | 'Equipment Failure'
  | 'Vegetation'
  | 'Unknown';

export const OUTAGE_TYPES: OutageType[] = [
  'Storm',
  'Flood',
  'Heavy Rain',
  'Heatwave',
  'Wildfire',
  'Lightning',
  'Ice/Snow',
  'High Wind',
  'Equipment Failure',
  'Vegetation',
  'Unknown',
];

export interface GeoCenter {
  lat: number;
  lng: number;
}

export interface GeoArea {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  stage: boolean;
  scenario_time: string | null;
  lifecycle_stage: LifecycleStage;
  operator_role: string | null;
  notes: string | null;
  priority: string | null;
  outage_type: OutageType | null;
  created_at: string;
  updated_at: string;
  geo_center: GeoCenter | null;
  geo_area: GeoArea | null;
  fault_id: string | null;
  feeder_id: string | null;
  transformer_id: string | null;
  customers_impacted: number | null;
  eta: string | null;
}

export interface ScenarioInsert {
  name: string;
  description?: string | null;
  stage?: boolean;
  scenario_time?: string | null;
  lifecycle_stage?: LifecycleStage;
  operator_role?: string | null;
  notes?: string | null;
  priority?: string | null;
  outage_type?: OutageType | null;
  geo_center?: GeoCenter | null;
  geo_area?: GeoArea | null;
  fault_id?: string | null;
  feeder_id?: string | null;
  transformer_id?: string | null;
  customers_impacted?: number | null;
  eta?: string | null;
}

export interface ScenarioUpdate extends Partial<ScenarioInsert> {}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
