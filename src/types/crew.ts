// Crew Dispatch Types

export type CrewStatus = 'available' | 'dispatched' | 'en_route' | 'on_site' | 'returning';

export interface Crew {
  id: string;
  crew_id: string;
  crew_name: string;
  vehicle_type: string;
  team_size: number;
  specialization: string | null;
  contact_phone: string | null;
  status: CrewStatus;
  current_lat: number;
  current_lng: number;
  assigned_event_id: string | null;
  eta_minutes: number | null;
  dispatch_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewWithAssignment extends Crew {
  assignedEventName?: string;
}
