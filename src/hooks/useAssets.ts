import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Asset, EventAsset } from '@/types/asset';

// Fetch all assets
export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('asset_type', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        asset_type: row.asset_type as Asset['asset_type'],
        name: row.name,
        feeder_id: row.feeder_id,
        transformer_id: row.transformer_id,
        fault_id: row.fault_id,
        lat: Number(row.lat),
        lng: Number(row.lng),
        meta: row.meta as Record<string, unknown> | null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch event-asset links for a specific event
export function useEventAssets(eventId: string | null) {
  return useQuery({
    queryKey: ['event-assets', eventId],
    queryFn: async (): Promise<string[]> => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_assets')
        .select('asset_id')
        .eq('event_id', eventId);

      if (error) throw error;
      
      return (data || []).map(row => row.asset_id);
    },
    enabled: !!eventId,
  });
}

// Fetch all event-asset links
export function useAllEventAssets() {
  return useQuery({
    queryKey: ['all-event-assets'],
    queryFn: async (): Promise<EventAsset[]> => {
      const { data, error } = await supabase
        .from('event_assets')
        .select('*');

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        event_id: row.event_id,
        asset_id: row.asset_id,
        created_at: row.created_at,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
