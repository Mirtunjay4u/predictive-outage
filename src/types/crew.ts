// Crew Dispatch Types

export type CrewStatus = 'available' | 'dispatched' | 'en_route' | 'on_site' | 'returning';

export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

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
  // Shift scheduling
  shift_start: string | null; // TIME as string "HH:MM:SS"
  shift_end: string | null;
  break_start: string | null;
  break_end: string | null;
  days_of_week: DayOfWeek[] | null;
  created_at: string;
  updated_at: string;
}

export interface CrewWithAvailability extends Crew {
  isOnShift: boolean;
  isOnBreak: boolean;
  shiftStatus: 'on_shift' | 'on_break' | 'off_duty';
  nextShiftStart?: string;
}

export interface CrewWithAssignment extends Crew {
  assignedEventName?: string;
}
