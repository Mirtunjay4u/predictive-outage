import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DecisionLogEntry {
  id: string;
  event_id: string;
  timestamp: string;
  source: 'Weather API' | 'Rule Engine' | 'Copilot' | 'Operator';
  trigger: string;
  action_taken: string;
  rule_impact: string | null;
  metadata: Record<string, unknown> | null;
}

export function useDecisionLog(eventId: string | null) {
  return useQuery({
    queryKey: ['decision-log', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_decision_log')
        .select('*')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DecisionLogEntry[];
    },
    enabled: !!eventId,
    refetchInterval: 30_000,
  });
}

export function useInsertDecisionLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<DecisionLogEntry, 'id' | 'timestamp'>) => {
      const { error } = await supabase.from('event_decision_log').insert([entry as any]);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['decision-log', variables.event_id] });
    },
  });
}
