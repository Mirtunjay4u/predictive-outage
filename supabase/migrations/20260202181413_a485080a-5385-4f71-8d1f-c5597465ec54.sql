-- Create lifecycle stage enum
CREATE TYPE public.lifecycle_stage AS ENUM ('Pre-Event', 'Event', 'Post-Event');

-- Create scenarios table
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stage BOOLEAN NOT NULL DEFAULT false,
  scenario_time TIMESTAMP WITH TIME ZONE,
  lifecycle_stage lifecycle_stage NOT NULL DEFAULT 'Pre-Event',
  operator_role TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (demo mode)
CREATE POLICY "Allow public read access" 
ON public.scenarios 
FOR SELECT 
USING (true);

-- Create policy for public insert
CREATE POLICY "Allow public insert" 
ON public.scenarios 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update
CREATE POLICY "Allow public update" 
ON public.scenarios 
FOR UPDATE 
USING (true);

-- Create policy for public delete
CREATE POLICY "Allow public delete" 
ON public.scenarios 
FOR DELETE 
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_scenarios_updated_at
BEFORE UPDATE ON public.scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data (10 scenarios)
INSERT INTO public.scenarios (name, description, stage, scenario_time, lifecycle_stage, operator_role, notes, priority) VALUES
('Emergency Response Protocol', 'Standard emergency response procedure for facility incidents', true, now() + interval '2 days', 'Pre-Event', 'Safety Officer', 'Review quarterly', 'high'),
('Scheduled Maintenance Window', 'Planned downtime for system upgrades and maintenance', true, now() + interval '5 days', 'Event', 'Operations Lead', 'Notify stakeholders 48h prior', 'medium'),
('Customer Onboarding Flow', 'New enterprise customer onboarding process', false, now() + interval '1 week', 'Pre-Event', 'Account Manager', 'Include training session', 'high'),
('Security Audit Preparation', 'Annual security compliance audit preparation', true, now() + interval '10 days', 'Pre-Event', 'Security Analyst', 'Gather documentation', 'high'),
('Product Launch Event', 'Q2 product feature launch coordination', false, now() + interval '2 weeks', 'Event', 'Product Manager', 'Coordinate with marketing', 'medium'),
('Incident Post-Mortem', 'Analysis of recent system outage', true, now() - interval '3 days', 'Post-Event', 'Engineering Lead', 'Include RCA findings', 'high'),
('Training Session Delivery', 'Operator certification training program', true, now() + interval '4 days', 'Event', 'Training Coordinator', 'Prepare materials', 'medium'),
('Capacity Planning Review', 'Quarterly infrastructure capacity assessment', false, now() + interval '3 weeks', 'Pre-Event', 'Infrastructure Lead', 'Forecast Q3 needs', 'low'),
('Vendor Integration Testing', 'Third-party API integration validation', true, now() + interval '1 day', 'Event', 'Integration Engineer', 'Test all endpoints', 'high'),
('Compliance Documentation Update', 'Update SOC2 compliance documentation', false, now() + interval '6 days', 'Post-Event', 'Compliance Officer', 'Annual review cycle', 'medium');
