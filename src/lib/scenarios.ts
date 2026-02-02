import { supabase } from '@/integrations/supabase/client';
import type { Scenario, ScenarioInsert, ScenarioUpdate, LifecycleStage } from '@/types/scenario';

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
    return (data || []).map(row => ({
      ...row,
      lifecycle_stage: row.lifecycle_stage as LifecycleStage
    }));
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
    return data ? {
      ...data,
      lifecycle_stage: data.lifecycle_stage as LifecycleStage
    } : null;
  }

  async create(scenario: ScenarioInsert): Promise<Scenario> {
    const { data, error } = await supabase
      .from('scenarios')
      .insert(scenario)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      lifecycle_stage: data.lifecycle_stage as LifecycleStage
    };
  }

  async update(id: string, scenario: ScenarioUpdate): Promise<Scenario> {
    const { data, error } = await supabase
      .from('scenarios')
      .update(scenario)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      lifecycle_stage: data.lifecycle_stage as LifecycleStage
    };
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
  clientSecret: string;
}

// Factory function to get the appropriate adapter
export function getScenarioAdapter(): ScenarioDataAdapter {
  // Future: check config to determine which adapter to use
  return new SupabaseScenarioAdapter();
}

// Export default adapter instance
export const scenarioService = getScenarioAdapter();
