import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import { getEventSeverity } from '@/lib/severity';

export interface PolicyEvalResult {
  allowedActions: Array<{ action: string; reason: string; constraints: string[] }>;
  blockedActions: Array<{ action: string; reason: string; remediation: string[] }>;
  escalationFlags: string[];
  etrBand: { band: string; confidence: number; rationale: string[] };
  safetyConstraints: Array<{
    id: string;
    title: string;
    severity: string;
    triggered: boolean;
    evidence: string[];
  }>;
  explainability?: {
    drivers: Array<{ key: string; value: string | number | boolean; weight: number }>;
    assumptions: string[];
    dataQualityWarnings: string[];
  };
  timestamps?: {
    evaluatedAt: string;
    inputLastUpdated?: string;
  };
  meta?: {
    engineVersion: string;
    deterministicHash: string;
  };
}

export function usePolicyEvaluation() {
  const [result, setResult] = useState<PolicyEvalResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async (event: ScenarioWithIntelligence) => {
    setIsLoading(true);
    setError(null);
    try {
      const hazardMap: Record<string, string> = {
        'Storm': 'STORM', 'High Wind': 'STORM', 'Lightning': 'STORM', 'Snow Storm': 'ICE',
        'Wildfire': 'WILDFIRE', 'Vegetation': 'WILDFIRE',
        'Flood': 'RAIN', 'Heavy Rain': 'RAIN',
        'Heatwave': 'HEAT', 'Equipment Failure': 'UNKNOWN',
      };
      const phaseMap: Record<string, string> = {
        'Pre-Event': 'PRE_EVENT', 'Event': 'ACTIVE', 'Post-Event': 'POST_EVENT',
      };

      const payload = {
        scenarioId: event.id,
        hazardType: hazardMap[event.outage_type || ''] || 'UNKNOWN',
        phase: phaseMap[event.lifecycle_stage] || 'UNKNOWN',
        severity: getEventSeverity(event),
        customersAffected: event.customers_impacted || 0,
        assets: [],
        criticalLoads: (event.critical_load_types || []).map(t => ({ type: t, name: t })),
        crews: { available: 0, enRoute: 0 },
        lastUpdated: event.event_last_update_time || undefined,
        dataQuality: { completeness: 0.5, freshnessMinutes: 15 },
      };

      const { data, error: fnError } = await supabase.functions.invoke('copilot-evaluate', {
        body: payload,
      });

      if (fnError) throw fnError;
      setResult(data as PolicyEvalResult);
    } catch (e: any) {
      setError(e.message || 'Evaluation failed');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, evaluate };
}
