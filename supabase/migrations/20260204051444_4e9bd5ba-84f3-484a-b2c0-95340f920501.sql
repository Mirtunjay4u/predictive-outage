-- Add shift scheduling fields to crews table
ALTER TABLE public.crews
ADD COLUMN shift_start TIME DEFAULT '08:00:00',
ADD COLUMN shift_end TIME DEFAULT '18:00:00',
ADD COLUMN break_start TIME DEFAULT '12:00:00',
ADD COLUMN break_end TIME DEFAULT '13:00:00',
ADD COLUMN days_of_week TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

-- Update existing crews with varied shift schedules for demo
UPDATE public.crews SET 
  shift_start = '06:00:00',
  shift_end = '14:00:00',
  break_start = '10:00:00',
  break_end = '10:30:00',
  days_of_week = ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
WHERE crew_id = 'CRW-101';

UPDATE public.crews SET 
  shift_start = '14:00:00',
  shift_end = '22:00:00',
  break_start = '18:00:00',
  break_end = '18:30:00',
  days_of_week = ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
WHERE crew_id = 'CRW-102';

UPDATE public.crews SET 
  shift_start = '22:00:00',
  shift_end = '06:00:00',
  break_start = '02:00:00',
  break_end = '02:30:00',
  days_of_week = ARRAY['Sun', 'Mon', 'Tue', 'Wed', 'Thu']
WHERE crew_id = 'CRW-103';

UPDATE public.crews SET 
  shift_start = '07:00:00',
  shift_end = '19:00:00',
  break_start = '12:00:00',
  break_end = '13:00:00',
  days_of_week = ARRAY['Mon', 'Wed', 'Fri', 'Sat', 'Sun']
WHERE crew_id = 'CRW-104';

UPDATE public.crews SET 
  shift_start = '08:00:00',
  shift_end = '16:00:00',
  break_start = '12:00:00',
  break_end = '12:30:00',
  days_of_week = ARRAY['Tue', 'Wed', 'Thu', 'Fri', 'Sat']
WHERE crew_id = 'CRW-105';

UPDATE public.crews SET 
  shift_start = '00:00:00',
  shift_end = '23:59:59',
  break_start = NULL,
  break_end = NULL,
  days_of_week = ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
WHERE crew_id = 'CRW-106';