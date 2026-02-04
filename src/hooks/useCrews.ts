import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Crew, CrewStatus, CrewWithAvailability, DayOfWeek } from '@/types/crew';

// Helper to parse time string "HH:MM:SS" to minutes since midnight
function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Get current day abbreviation
function getCurrentDay(): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

// Get current time in minutes since midnight
function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Check if current time is within a time range (handles overnight shifts)
function isWithinTimeRange(
  current: number,
  start: number | null,
  end: number | null
): boolean {
  if (start === null || end === null) return false;
  
  if (start <= end) {
    // Normal shift (e.g., 08:00 - 18:00)
    return current >= start && current < end;
  } else {
    // Overnight shift (e.g., 22:00 - 06:00)
    return current >= start || current < end;
  }
}

// Calculate crew shift availability
export function calculateCrewAvailability(crew: Crew): CrewWithAvailability {
  const currentDay = getCurrentDay();
  const currentMinutes = getCurrentTimeMinutes();
  
  const shiftStart = parseTimeToMinutes(crew.shift_start);
  const shiftEnd = parseTimeToMinutes(crew.shift_end);
  const breakStart = parseTimeToMinutes(crew.break_start);
  const breakEnd = parseTimeToMinutes(crew.break_end);
  
  // Check if today is a work day
  const isWorkDay = crew.days_of_week?.includes(currentDay) ?? false;
  
  // Check if within shift hours
  const isWithinShift = isWithinTimeRange(currentMinutes, shiftStart, shiftEnd);
  
  // Check if on break
  const isOnBreak = breakStart !== null && breakEnd !== null && 
    isWithinTimeRange(currentMinutes, breakStart, breakEnd);
  
  const isOnShift = isWorkDay && isWithinShift && !isOnBreak;
  
  let shiftStatus: CrewWithAvailability['shiftStatus'];
  if (!isWorkDay || !isWithinShift) {
    shiftStatus = 'off_duty';
  } else if (isOnBreak) {
    shiftStatus = 'on_break';
  } else {
    shiftStatus = 'on_shift';
  }
  
  return {
    ...crew,
    isOnShift,
    isOnBreak,
    shiftStatus,
  };
}

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

// Fetch crews with availability status
export function useCrewsWithAvailability() {
  const { data: crews, ...rest } = useCrews();
  
  const crewsWithAvailability = useMemo(() => {
    if (!crews) return [];
    return crews.map(calculateCrewAvailability);
  }, [crews]);
  
  return { data: crewsWithAvailability, ...rest };
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

// Emergency dispatch an off-duty crew (with overtime logging)
export function useEmergencyDispatchCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      crewId,
      eventId,
      eventLat,
      eventLng,
      authorizedBy,
      notes,
    }: {
      crewId: string;
      eventId: string;
      eventLat: number;
      eventLng: number;
      authorizedBy: string;
      notes?: string;
    }) => {
      // Get current crew position to calculate ETA
      const { data: crew } = await supabase
        .from('crews')
        .select('current_lat, current_lng')
        .eq('id', crewId)
        .single();

      if (!crew) throw new Error('Crew not found');

      // Calculate ETA
      const distanceKm = calculateDistance(
        Number(crew.current_lat),
        Number(crew.current_lng),
        eventLat,
        eventLng
      );
      const etaMinutes = Math.round((distanceKm / 48) * 60);

      // Update crew status
      const { error: crewError } = await supabase
        .from('crews')
        .update({
          status: 'dispatched' as CrewStatus,
          assigned_event_id: eventId,
          eta_minutes: etaMinutes,
          dispatch_time: new Date().toISOString(),
        })
        .eq('id', crewId);

      if (crewError) throw crewError;

      // Log overtime entry
      const { error: overtimeError } = await supabase
        .from('crew_overtime_logs')
        .insert({
          crew_id: crewId,
          event_id: eventId,
          reason: 'Emergency dispatch',
          authorized_by: authorizedBy,
          notes: notes || null,
        });

      if (overtimeError) throw overtimeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      queryClient.invalidateQueries({ queryKey: ['crew-overtime-logs'] });
    },
  });
}

// Fetch overtime logs
export function useOvertimeLogs() {
  return useQuery({
    queryKey: ['crew-overtime-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_overtime_logs')
        .select('*, crews(crew_name), scenarios(name)')
        .order('dispatch_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
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
