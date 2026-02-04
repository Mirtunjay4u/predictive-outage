-- Add new enum values (must be in separate transaction before using them)
ALTER TYPE public.outage_type ADD VALUE IF NOT EXISTS 'Others';
ALTER TYPE public.outage_type ADD VALUE IF NOT EXISTS 'Snow Storm';