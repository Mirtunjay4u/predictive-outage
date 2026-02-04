import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeederZone } from '@/types/feederZone';
import type { GeoArea } from '@/types/scenario';

export function useFeederZones() {
  return useQuery({
    queryKey: ['feeder-zones'],
    queryFn: async (): Promise<FeederZone[]> => {
      const { data, error } = await supabase
        .from('feeder_zones')
        .select('*')
        .order('feeder_name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        feeder_id: row.feeder_id,
        feeder_name: row.feeder_name,
        geo_area: row.geo_area as unknown as GeoArea,
        meta: row.meta as Record<string, unknown> | null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
