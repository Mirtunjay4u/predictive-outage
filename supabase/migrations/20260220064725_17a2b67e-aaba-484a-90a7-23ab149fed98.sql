
-- Create event_decision_log table for traceability timeline
CREATE TABLE public.event_decision_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('Weather API', 'Rule Engine', 'Copilot', 'Operator')),
  trigger TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  rule_impact TEXT,
  metadata JSONB
);

-- Index for fast event lookups
CREATE INDEX idx_event_decision_log_event_id ON public.event_decision_log (event_id);
CREATE INDEX idx_event_decision_log_timestamp ON public.event_decision_log (event_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.event_decision_log ENABLE ROW LEVEL SECURITY;

-- Public access policies (matches existing pattern)
CREATE POLICY "Allow public read access on event_decision_log"
  ON public.event_decision_log FOR SELECT USING (true);

CREATE POLICY "Allow public insert on event_decision_log"
  ON public.event_decision_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on event_decision_log"
  ON public.event_decision_log FOR DELETE USING (true);
