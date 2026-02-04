import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Crew, CrewStatus } from '@/types/crew';

// Fetch all crews
export function useCrews() {
  return useQuery({
    queryKey: ['crews'],
    queryFn: async (): Promise<Crew[]> => {
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .order('crew_id');

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        current_lat: Number(row.current_lat),
        current_lng: Number(row.current_lng),
      })) as Crew[];
    },
  });
}

// Real-time subscription for crew updates
export function useCrewsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('crews-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crews',
        },
        (payload) => {
          console.log('Crew update:', payload);
          // Invalidate and refetch crews
          queryClient.invalidateQueries({ queryKey: ['crews'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Dispatch a crew to an event
export function useDispatchCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      crewId, 
      eventId, 
      eventLat, 
      eventLng 
    }: { 
      crewId: string; 
      eventId: string; 
      eventLat: number; 
      eventLng: number;
    }) => {
      // Get current crew position to calculate ETA
      const { data: crew } = await supabase
        .from('crews')
        .select('current_lat, current_lng')
        .eq('id', crewId)
        .single();

      if (!crew) throw new Error('Crew not found');

      // Simple ETA calculation based on distance (approx 30mph average speed)
      const distanceKm = calculateDistance(
        Number(crew.current_lat),
        Number(crew.current_lng),
        eventLat,
        eventLng
      );
      const etaMinutes = Math.round((distanceKm / 48) * 60); // 48 km/h = ~30 mph

      const { error } = await supabase
        .from('crews')
        .update({
          status: 'dispatched' as CrewStatus,
          assigned_event_id: eventId,
          eta_minutes: etaMinutes,
          dispatch_time: new Date().toISOString(),
        })
        .eq('id', crewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
    },
  });
}

// Simulate crew movement toward their assigned event
export function useSimulateCrewMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      crewId, 
      targetLat, 
      targetLng 
    }: { 
      crewId: string; 
      targetLat: number; 
      targetLng: number;
    }) => {
      const { data: crew } = await supabase
        .from('crews')
        .select('*')
        .eq('id', crewId)
        .single();

      if (!crew) throw new Error('Crew not found');

      const currentLat = Number(crew.current_lat);
      const currentLng = Number(crew.current_lng);

      // Move 20% of the remaining distance
      const newLat = currentLat + (targetLat - currentLat) * 0.2;
      const newLng = currentLng + (targetLng - currentLng) * 0.2;

      // Calculate new ETA
      const remainingDistanceKm = calculateDistance(newLat, newLng, targetLat, targetLng);
      const newEtaMinutes = Math.max(0, Math.round((remainingDistanceKm / 48) * 60));

      // Check if arrived (within 0.5km)
      const arrived = remainingDistanceKm < 0.5;

      const { error } = await supabase
        .from('crews')
        .update({
          current_lat: newLat,
          current_lng: newLng,
          eta_minutes: arrived ? 0 : newEtaMinutes,
          status: arrived ? 'on_site' : 'en_route',
        })
        .eq('id', crewId);

      if (error) throw error;

      return { arrived };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
    },
  });
}

// Update crew status
export function useUpdateCrewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ crewId, status }: { crewId: string; status: CrewStatus }) => {
      const updates: Record<string, unknown> = { status };

      // If marking as available, clear assignment
      if (status === 'available') {
        updates.assigned_event_id = null;
        updates.eta_minutes = null;
        updates.dispatch_time = null;
      }

      const { error } = await supabase
        .from('crews')
        .update(updates)
        .eq('id', crewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
    },
  });
}

// Haversine distance calculation (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
