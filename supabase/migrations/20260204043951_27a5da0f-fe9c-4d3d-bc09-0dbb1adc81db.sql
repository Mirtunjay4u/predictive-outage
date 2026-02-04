-- Create feeder_zones table
CREATE TABLE public.feeder_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feeder_id TEXT NOT NULL UNIQUE,
  feeder_name TEXT NOT NULL,
  geo_area JSONB NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feeder_zones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (demo app)
CREATE POLICY "Allow public read access on feeder_zones" 
ON public.feeder_zones 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on feeder_zones" 
ON public.feeder_zones 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on feeder_zones" 
ON public.feeder_zones 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on feeder_zones" 
ON public.feeder_zones 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feeder_zones_updated_at
BEFORE UPDATE ON public.feeder_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();