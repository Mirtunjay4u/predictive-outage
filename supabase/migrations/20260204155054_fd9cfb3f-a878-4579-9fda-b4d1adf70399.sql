-- Add ETR uncertainty columns
ALTER TABLE public.scenarios 
ADD COLUMN etr_earliest timestamp with time zone,
ADD COLUMN etr_latest timestamp with time zone,
ADD COLUMN etr_confidence text CHECK (etr_confidence IN ('High', 'Medium', 'Low')),
ADD COLUMN etr_uncertainty_drivers jsonb DEFAULT '[]'::jsonb;

-- Add critical load continuity columns
ALTER TABLE public.scenarios 
ADD COLUMN has_critical_load boolean DEFAULT false,
ADD COLUMN critical_load_type text,
ADD COLUMN backup_runtime_hours numeric,
ADD COLUMN backup_runtime_remaining_hours numeric,
ADD COLUMN critical_escalation_threshold_hours numeric;

-- Add comments for documentation (demo/synthetic data context)
COMMENT ON COLUMN public.scenarios.etr_earliest IS 'Demo: Earliest estimated time of restoration';
COMMENT ON COLUMN public.scenarios.etr_latest IS 'Demo: Latest estimated time of restoration';
COMMENT ON COLUMN public.scenarios.etr_confidence IS 'Demo: ETR confidence level (High, Medium, Low)';
COMMENT ON COLUMN public.scenarios.etr_uncertainty_drivers IS 'Demo: JSON array of factors affecting ETR uncertainty';
COMMENT ON COLUMN public.scenarios.has_critical_load IS 'Demo: Whether event affects critical infrastructure';
COMMENT ON COLUMN public.scenarios.critical_load_type IS 'Demo: Type of critical load (Hospital, Water, etc.)';
COMMENT ON COLUMN public.scenarios.backup_runtime_hours IS 'Demo: Total backup power capacity in hours';
COMMENT ON COLUMN public.scenarios.backup_runtime_remaining_hours IS 'Demo: Remaining backup power in hours';
COMMENT ON COLUMN public.scenarios.critical_escalation_threshold_hours IS 'Demo: Hours threshold for escalation';