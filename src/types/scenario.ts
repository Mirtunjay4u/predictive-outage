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
export type EtrRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type CriticalRunwayStatus = 'NORMAL' | 'AT_RISK' | 'BREACH';

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
export const ETR_RISK_LEVELS: EtrRiskLevel[] = ['HIGH', 'MEDIUM', 'LOW'];
export const CRITICAL_RUNWAY_STATUSES: CriticalRunwayStatus[] = ['NORMAL', 'AT_RISK', 'BREACH'];

export interface GeoCenter {
  lat: number;
  lng: number;
}

export interface GeoArea {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

// Copilot signals structure for AI context
export interface CopilotSignals {
  etr_confidence: EtrConfidence | null;
  etr_risk_level: EtrRiskLevel | null;
  critical_runway_status: CriticalRunwayStatus | null;
  has_critical_load: boolean;
  critical_load_types: string[];
  hours_remaining: number | null;
  threshold_hours: number | null;
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

// Extended scenario with derived intelligence fields (from events_intelligence view)
export interface ScenarioWithIntelligence extends Scenario {
  // Derived ETR risk assessment
  etr_band_hours: number | null;
  etr_risk_level: EtrRiskLevel | null;
  // Derived critical load runway status
  critical_runway_status: CriticalRunwayStatus | null;
  // Escalation signal
  requires_escalation: boolean;
  // Copilot narrative inputs (structured JSON)
  copilot_signals: CopilotSignals | null;
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
