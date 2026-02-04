-- Create crew_status enum
CREATE TYPE public.crew_status AS ENUM ('available', 'dispatched', 'en_route', 'on_site', 'returning');

-- Create crews table for dispatch tracking
CREATE TABLE public.crews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id TEXT NOT NULL UNIQUE,
  crew_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Truck',
  team_size INTEGER NOT NULL DEFAULT 2,
  specialization TEXT,
  contact_phone TEXT,
  status crew_status NOT NULL DEFAULT 'available',
  current_lat NUMERIC NOT NULL,
  current_lng NUMERIC NOT NULL,
  assigned_event_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
  eta_minutes INTEGER,
  dispatch_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (demo mode)
CREATE POLICY "Allow public read access on crews" ON public.crews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on crews" ON public.crews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on crews" ON public.crews FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on crews" ON public.crews FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_crews_updated_at
  BEFORE UPDATE ON public.crews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for crews table
ALTER PUBLICATION supabase_realtime ADD TABLE public.crews;