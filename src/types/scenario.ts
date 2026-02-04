export type LifecycleStage = 'Pre-Event' | 'Event' | 'Post-Event';

export type OutageType = 
  | 'Storm'
  | 'Flood'
  | 'Heavy Rain'
  | 'Heatwave'
  | 'Wildfire'
  | 'Lightning'
  | 'Snow Storm'
  | 'High Wind'
  | 'Equipment Failure'
  | 'Vegetation'
  | 'Others';

export type EtrConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export const OUTAGE_TYPES: OutageType[] = [
  'Storm',
  'Flood',
  'Heavy Rain',
  'Heatwave',
  'Wildfire',
  'Lightning',
  'Snow Storm',
  'High Wind',
  'Equipment Failure',
  'Vegetation',
  'Others',
];

export const ETR_CONFIDENCE_LEVELS: EtrConfidence[] = ['HIGH', 'MEDIUM', 'LOW'];

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
  // Event timeline timestamps
  event_start_time: string | null;
  event_last_update_time: string | null;
  event_end_time: string | null;
  // ETR uncertainty fields (Demo/synthetic data)
  etr_earliest: string | null;
  etr_expected: string | null;
  etr_latest: string | null;
  etr_confidence: EtrConfidence | null;
  etr_uncertainty_drivers: string[] | null;
  // Critical load continuity fields (Demo/synthetic data)
  has_critical_load: boolean | null;
  critical_load_types: string[] | null;
  backup_runtime_hours: number | null;
  backup_runtime_remaining_hours: number | null;
  critical_escalation_threshold_hours: number | null;
  // Location metadata (Demo/synthetic data)
  location_name: string | null;
  service_area: string | null;
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
  // ETR uncertainty fields
  etr_earliest?: string | null;
  etr_expected?: string | null;
  etr_latest?: string | null;
  etr_confidence?: EtrConfidence | null;
  etr_uncertainty_drivers?: string[] | null;
  // Critical load continuity fields
  has_critical_load?: boolean | null;
  critical_load_types?: string[] | null;
  backup_runtime_hours?: number | null;
  backup_runtime_remaining_hours?: number | null;
  critical_escalation_threshold_hours?: number | null;
  // Location metadata
  location_name?: string | null;
  service_area?: string | null;
}

export interface ScenarioUpdate extends Partial<ScenarioInsert> {}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
