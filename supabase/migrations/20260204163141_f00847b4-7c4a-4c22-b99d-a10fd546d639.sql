-- Add constraint for uppercase confidence levels
ALTER TABLE public.scenarios 
ADD CONSTRAINT scenarios_etr_confidence_check CHECK (etr_confidence IS NULL OR etr_confidence IN ('HIGH', 'MEDIUM', 'LOW'));