import { supabase } from '@/integrations/supabase/client';
import type { Scenario, ScenarioInsert, ScenarioUpdate, LifecycleStage, GeoCenter, GeoArea } from '@/types/scenario';
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

// Map database row to Scenario type
function mapRowToScenario(row: any): Scenario {
  return {
    ...row,
    lifecycle_stage: row.lifecycle_stage as LifecycleStage,
    geo_center: parseGeoCenter(row.geo_center),
    geo_area: parseGeoArea(row.geo_area),
  };
}

// Data adapter interface for future Dataverse integration
export interface ScenarioDataAdapter {
  getAll(): Promise<Scenario[]>;
  getById(id: string): Promise<Scenario | null>;
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
