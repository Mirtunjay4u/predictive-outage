-- Create asset_type enum
CREATE TYPE public.asset_type AS ENUM ('Fault', 'Feeder', 'Transformer');

-- Create assets table for GIS assets
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type public.asset_type NOT NULL,
  name TEXT NOT NULL,
  feeder_id TEXT,
  transformer_id TEXT,
  fault_id TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_assets junction table (many-to-many)
CREATE TABLE public.event_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, asset_id)
);

-- Enable RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies for assets (public read/write for demo)
CREATE POLICY "Allow public read access on assets" 
ON public.assets 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on assets" 
ON public.assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on assets" 
ON public.assets 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on assets" 
ON public.assets 
FOR DELETE 
USING (true);

-- Enable RLS on event_assets
ALTER TABLE public.event_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for event_assets (public read/write for demo)
CREATE POLICY "Allow public read access on event_assets" 
ON public.event_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on event_assets" 
ON public.event_assets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on event_assets" 
ON public.event_assets 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on event_assets" 
ON public.event_assets 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on assets
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_assets_asset_type ON public.assets(asset_type);
CREATE INDEX idx_event_assets_event_id ON public.event_assets(event_id);
CREATE INDEX idx_event_assets_asset_id ON public.event_assets(asset_id);