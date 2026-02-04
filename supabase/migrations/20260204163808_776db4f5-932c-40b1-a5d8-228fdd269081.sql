-- Recreate view with SECURITY INVOKER to use querying user's permissions
DROP VIEW IF EXISTS public.events_intelligence;

CREATE VIEW public.events_intelligence 
WITH (security_invoker = true)
AS
SELECT 
  s.*,
  
  -- ETR band calculation (hours between latest and earliest)
  CASE 
    WHEN s.etr_latest IS NOT NULL AND s.etr_earliest IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (s.etr_latest - s.etr_earliest)) / 3600.0
    ELSE NULL 
  END AS etr_band_hours,
  
  -- ETR risk level derivation
  CASE
    WHEN s.etr_confidence = 'LOW' THEN 'HIGH'
    WHEN s.etr_latest IS NOT NULL AND s.etr_earliest IS NOT NULL 
         AND EXTRACT(EPOCH FROM (s.etr_latest - s.etr_earliest)) / 3600.0 > 6 THEN 'HIGH'
    WHEN s.etr_confidence = 'MEDIUM' THEN 'MEDIUM'
    WHEN s.etr_confidence = 'HIGH' 
         AND s.etr_latest IS NOT NULL AND s.etr_earliest IS NOT NULL
         AND EXTRACT(EPOCH FROM (s.etr_latest - s.etr_earliest)) / 3600.0 <= 2 THEN 'LOW'
    WHEN s.etr_confidence = 'HIGH' THEN 'MEDIUM'
    ELSE NULL
  END AS etr_risk_level,
  
  -- Critical load runway status
  CASE
    WHEN s.has_critical_load = false OR s.has_critical_load IS NULL THEN NULL
    WHEN s.backup_runtime_remaining_hours IS NULL THEN NULL
    WHEN s.backup_runtime_remaining_hours <= 0 THEN 'BREACH'
    WHEN s.backup_runtime_remaining_hours <= COALESCE(s.critical_escalation_threshold_hours, 0) THEN 'AT_RISK'
    ELSE 'NORMAL'
  END AS critical_runway_status,
  
  -- Escalation signal
  CASE
    WHEN s.has_critical_load = true 
         AND s.backup_runtime_remaining_hours IS NOT NULL
         AND s.backup_runtime_remaining_hours <= COALESCE(s.critical_escalation_threshold_hours, 0) 
    THEN true
    ELSE false
  END AS requires_escalation,
  
  -- Copilot signals JSON packet for AI context
  jsonb_build_object(
    'etr_confidence', s.etr_confidence,
    'etr_risk_level', CASE
      WHEN s.etr_confidence = 'LOW' THEN 'HIGH'
      WHEN s.etr_latest IS NOT NULL AND s.etr_earliest IS NOT NULL 
           AND EXTRACT(EPOCH FROM (s.etr_latest - s.etr_earliest)) / 3600.0 > 6 THEN 'HIGH'
      WHEN s.etr_confidence = 'MEDIUM' THEN 'MEDIUM'
      WHEN s.etr_confidence = 'HIGH' 
           AND s.etr_latest IS NOT NULL AND s.etr_earliest IS NOT NULL
           AND EXTRACT(EPOCH FROM (s.etr_latest - s.etr_earliest)) / 3600.0 <= 2 THEN 'LOW'
      WHEN s.etr_confidence = 'HIGH' THEN 'MEDIUM'
      ELSE NULL
    END,
    'critical_runway_status', CASE
      WHEN s.has_critical_load = false OR s.has_critical_load IS NULL THEN NULL
      WHEN s.backup_runtime_remaining_hours IS NULL THEN NULL
      WHEN s.backup_runtime_remaining_hours <= 0 THEN 'BREACH'
      WHEN s.backup_runtime_remaining_hours <= COALESCE(s.critical_escalation_threshold_hours, 0) THEN 'AT_RISK'
      ELSE 'NORMAL'
    END,
    'has_critical_load', COALESCE(s.has_critical_load, false),
    'critical_load_types', COALESCE(s.critical_load_types, '[]'::jsonb),
    'hours_remaining', s.backup_runtime_remaining_hours,
    'threshold_hours', s.critical_escalation_threshold_hours
  ) AS copilot_signals

FROM public.scenarios s;

COMMENT ON VIEW public.events_intelligence IS 'Derived intelligence view computing ETR risk, critical runway status, and copilot signals from base event data. Demo/synthetic data context.';