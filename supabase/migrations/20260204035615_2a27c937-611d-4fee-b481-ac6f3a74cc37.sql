-- Add GIS and infrastructure columns to scenarios table
ALTER TABLE public.scenarios 
ADD COLUMN IF NOT EXISTS geo_center jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS geo_area jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fault_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS feeder_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transformer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS customers_impacted integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS eta timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.scenarios.geo_center IS 'Center point as JSON: {"lat": number, "lng": number}';
COMMENT ON COLUMN public.scenarios.geo_area IS 'GeoJSON Polygon or MultiPolygon for outage area';
COMMENT ON COLUMN public.scenarios.fault_id IS 'Fault identifier for infrastructure tracking';
COMMENT ON COLUMN public.scenarios.feeder_id IS 'Feeder circuit identifier';
COMMENT ON COLUMN public.scenarios.transformer_id IS 'Transformer identifier';