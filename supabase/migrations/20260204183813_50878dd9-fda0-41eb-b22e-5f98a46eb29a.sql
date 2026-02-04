-- Create event_status_history table for ETR movement tracking
CREATE TABLE public.event_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  etr_earliest TIMESTAMP WITH TIME ZONE,
  etr_expected TIMESTAMP WITH TIME ZONE,
  etr_latest TIMESTAMP WITH TIME ZONE,
  etr_confidence TEXT CHECK (etr_confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  etr_risk_level TEXT CHECK (etr_risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  critical_runway_status TEXT CHECK (critical_runway_status IN ('NORMAL', 'AT_RISK', 'BREACH')),
  backup_runtime_remaining_hours NUMERIC,
  uncertainty_drivers JSONB DEFAULT '[]'::jsonb,
  change_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by event_id and ordering by recorded_at
CREATE INDEX idx_event_status_history_event_id ON public.event_status_history(event_id);
CREATE INDEX idx_event_status_history_recorded_at ON public.event_status_history(recorded_at DESC);
CREATE INDEX idx_event_status_history_event_recorded ON public.event_status_history(event_id, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.event_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (matching existing table patterns)
CREATE POLICY "Allow public read access on event_status_history"
ON public.event_status_history
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on event_status_history"
ON public.event_status_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on event_status_history"
ON public.event_status_history
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on event_status_history"
ON public.event_status_history
FOR DELETE
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.event_status_history IS 'Tracks ETR movement and status changes over time for each event';