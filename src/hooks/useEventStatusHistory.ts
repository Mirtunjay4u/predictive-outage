 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface EventStatusSnapshot {
   id: string;
   event_id: string;
   recorded_at: string;
   etr_earliest: string | null;
   etr_expected: string | null;
   etr_latest: string | null;
   etr_confidence: string | null;
   etr_risk_level: string | null;
   critical_runway_status: string | null;
   backup_runtime_remaining_hours: number | null;
   uncertainty_drivers: string[] | null;
   change_note: string | null;
   created_at: string;
 }
 
 export function useEventStatusHistory(eventId: string | null) {
   return useQuery({
     queryKey: ["event-status-history", eventId],
     queryFn: async (): Promise<EventStatusSnapshot[]> => {
       if (!eventId) return [];
 
       const { data, error } = await supabase
         .from("event_status_history")
         .select("*")
         .eq("event_id", eventId)
         .order("recorded_at", { ascending: true });
 
       if (error) {
         console.error("Error fetching event status history:", error);
         throw error;
       }
 
       // Parse uncertainty_drivers from JSON if needed
       return (data || []).map((row) => ({
         ...row,
         uncertainty_drivers: Array.isArray(row.uncertainty_drivers)
           ? row.uncertainty_drivers
           : row.uncertainty_drivers
           ? JSON.parse(JSON.stringify(row.uncertainty_drivers))
           : null,
       }));
     },
     enabled: !!eventId,
   });
 }