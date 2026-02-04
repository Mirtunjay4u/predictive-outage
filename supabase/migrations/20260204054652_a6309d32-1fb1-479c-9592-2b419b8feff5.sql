-- Add event timeline timestamps to scenarios table
ALTER TABLE public.scenarios
ADD COLUMN event_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN event_last_update_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN event_end_time TIMESTAMP WITH TIME ZONE;

-- Create index for efficient time-based queries
CREATE INDEX idx_scenarios_event_times ON public.scenarios (event_start_time, event_end_time);