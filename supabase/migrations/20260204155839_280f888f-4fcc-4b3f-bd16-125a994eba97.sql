-- Drop the constraint temporarily to allow data update
ALTER TABLE public.scenarios DROP CONSTRAINT IF EXISTS scenarios_etr_confidence_check;