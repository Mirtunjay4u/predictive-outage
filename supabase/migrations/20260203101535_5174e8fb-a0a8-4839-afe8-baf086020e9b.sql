-- Create outage_type enum
CREATE TYPE public.outage_type AS ENUM (
  'Storm',
  'Flood',
  'Heavy Rain',
  'Heatwave',
  'Wildfire',
  'Lightning',
  'Ice/Snow',
  'High Wind',
  'Equipment Failure',
  'Vegetation',
  'Unknown'
);

-- Add outage_type column to scenarios table
ALTER TABLE public.scenarios 
ADD COLUMN outage_type public.outage_type DEFAULT 'Unknown'::public.outage_type;