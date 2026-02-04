-- Add missing columns
ALTER TABLE public.scenarios 
ADD COLUMN IF NOT EXISTS etr_expected timestamp with time zone,
ADD COLUMN IF NOT EXISTS critical_load_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_name text,
ADD COLUMN IF NOT EXISTS service_area text;

-- Drop the old single critical_load_type column
ALTER TABLE public.scenarios DROP COLUMN IF EXISTS critical_load_type;

-- Add documentation comments
COMMENT ON COLUMN public.scenarios.etr_expected IS 'Demo: Most likely estimated time of restoration';
COMMENT ON COLUMN public.scenarios.critical_load_types IS 'Demo: JSON array of critical load types (Hospital, Water, Telecom, etc.)';
COMMENT ON COLUMN public.scenarios.location_name IS 'Demo: Synthetic location name for map display';
COMMENT ON COLUMN public.scenarios.service_area IS 'Demo: Synthetic service area/district';