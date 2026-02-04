-- Create overtime logs table for tracking emergency dispatches
CREATE TABLE public.crew_overtime_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
  dispatch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL DEFAULT 'Emergency dispatch',
  authorized_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_overtime_logs ENABLE ROW LEVEL SECURITY;

-- Create public access policies (matching existing pattern)
CREATE POLICY "Allow public read access on crew_overtime_logs"
ON public.crew_overtime_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert on crew_overtime_logs"
ON public.crew_overtime_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on crew_overtime_logs"
ON public.crew_overtime_logs FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on crew_overtime_logs"
ON public.crew_overtime_logs FOR DELETE USING (true);