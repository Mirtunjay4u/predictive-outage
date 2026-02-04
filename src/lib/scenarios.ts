import { supabase } from '@/integrations/supabase/client';
import type { 
  Scenario, 
  ScenarioInsert, 
  ScenarioUpdate, 
  ScenarioWithIntelligence,
  LifecycleStage, 
  GeoCenter, 
  GeoArea,
  EtrConfidence,
  EtrRiskLevel,
  CriticalRunwayStatus,
  CopilotSignals
} from '@/types/scenario';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely parse JSON fields
function parseGeoCenter(json: Json | null): GeoCenter | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as { lat?: unknown; lng?: unknown };
  if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    return { lat: obj.lat, lng: obj.lng };
  }
  return null;
}

function parseGeoArea(json: Json | null): GeoArea | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as { type?: unknown; coordinates?: unknown };
  if ((obj.type === 'Polygon' || obj.type === 'MultiPolygon') && Array.isArray(obj.coordinates)) {
    return obj as GeoArea;
  }
  return null;
}

function parseStringArray(json: Json | null): string[] | null {
  if (!json) return null;
  if (Array.isArray(json)) return json.filter((s): s is string => typeof s === 'string');
  return null;
}

function parseCopilotSignals(json: Json | null): CopilotSignals | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  return {
    etr_confidence: (obj.etr_confidence as EtrConfidence) || null,
    etr_risk_level: (obj.etr_risk_level as EtrRiskLevel) || null,
    critical_runway_status: (obj.critical_runway_status as CriticalRunwayStatus) || null,
    has_critical_load: Boolean(obj.has_critical_load),
    critical_load_types: Array.isArray(obj.critical_load_types) 
      ? obj.critical_load_types.filter((s): s is string => typeof s === 'string')
      : [],
    hours_remaining: typeof obj.hours_remaining === 'number' ? obj.hours_remaining : null,
    threshold_hours: typeof obj.threshold_hours === 'number' ? obj.threshold_hours : null,
  };
}

// Map database row to Scenario type
function mapRowToScenario(row: any): Scenario {
  return {
    ...row,
    lifecycle_stage: row.lifecycle_stage as LifecycleStage,
    geo_center: parseGeoCenter(row.geo_center),
    geo_area: parseGeoArea(row.geo_area),
    etr_uncertainty_drivers: parseStringArray(row.etr_uncertainty_drivers),
    critical_load_types: parseStringArray(row.critical_load_types),
  };
}

// Map database row from events_intelligence view to ScenarioWithIntelligence
function mapRowToScenarioWithIntelligence(row: any): ScenarioWithIntelligence {
  return {
    ...mapRowToScenario(row),
    etr_band_hours: typeof row.etr_band_hours === 'number' ? row.etr_band_hours : null,
    etr_risk_level: (row.etr_risk_level as EtrRiskLevel) || null,
    critical_runway_status: (row.critical_runway_status as CriticalRunwayStatus) || null,
    requires_escalation: Boolean(row.requires_escalation),
    copilot_signals: parseCopilotSignals(row.copilot_signals),
  };
}

// Data adapter interface for future Dataverse integration
export interface ScenarioDataAdapter {
  getAll(): Promise<Scenario[]>;
  getAllWithIntelligence(): Promise<ScenarioWithIntelligence[]>;
  getById(id: string): Promise<Scenario | null>;
  getByIdWithIntelligence(id: string): Promise<ScenarioWithIntelligence | null>;
  create(scenario: ScenarioInsert): Promise<Scenario>;
  update(id: string, scenario: ScenarioUpdate): Promise<Scenario>;
  delete(id: string): Promise<void>;
}

// Supabase implementation
class SupabaseScenarioAdapter implements ScenarioDataAdapter {
  async getAll(): Promise<Scenario[]> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapRowToScenario);
  }

  async getAllWithIntelligence(): Promise<ScenarioWithIntelligence[]> {
    const { data, error } = await supabase
      .from('events_intelligence')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapRowToScenarioWithIntelligence);
  }

  async getById(id: string): Promise<Scenario | null> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? mapRowToScenario(data) : null;
  }

  async getByIdWithIntelligence(id: string): Promise<ScenarioWithIntelligence | null> {
    const { data, error } = await supabase
      .from('events_intelligence')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? mapRowToScenarioWithIntelligence(data) : null;
  }

  async create(scenario: ScenarioInsert): Promise<Scenario> {
    // Convert typed geo fields to JSON for storage
    const insertData = {
      ...scenario,
      geo_center: scenario.geo_center as unknown as Json,
      geo_area: scenario.geo_area as unknown as Json,
    };
    
    const { data, error } = await supabase
      .from('scenarios')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return mapRowToScenario(data);
  }

  async update(id: string, scenario: ScenarioUpdate): Promise<Scenario> {
    // Convert typed geo fields to JSON for storage
    const updateData = {
      ...scenario,
      geo_center: scenario.geo_center as unknown as Json,
      geo_area: scenario.geo_area as unknown as Json,
    };
    
    const { data, error } = await supabase
      .from('scenarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapRowToScenario(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Dataverse adapter placeholder
export interface DataverseConfig {
  url: string;
  tenantId: string;
  clientId: string;
}

// Factory function to get the appropriate adapter
export function getScenarioAdapter(): ScenarioDataAdapter {
  // Future: check config to determine which adapter to use
  return new SupabaseScenarioAdapter();
}

// Export default adapter instance
export const scenarioService = getScenarioAdapter();
