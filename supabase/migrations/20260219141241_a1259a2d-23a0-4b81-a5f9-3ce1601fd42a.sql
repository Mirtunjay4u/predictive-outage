-- Seed ETR bands, confidence, critical loads, and fix customers for all operational events

-- Galveston Bay Flooding (id: 19e73a03)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '2.5 hours',
  etr_expected = NOW() + INTERVAL '3.5 hours',
  etr_latest   = NOW() + INTERVAL '5 hours',
  etr_confidence = 'LOW',
  etr_uncertainty_drivers = '["floodwater access", "substation ingress risk", "crew safety hold"]'::jsonb,
  has_critical_load = true,
  critical_load_types = '["Hospital", "Water Treatment Plant"]'::jsonb,
  backup_runtime_remaining_hours = 3.2,
  critical_escalation_threshold_hours = 4.0,
  customers_impacted = 8200,
  event_start_time = NOW() - INTERVAL '4 hours',
  event_last_update_time = NOW() - INTERVAL '1 hour'
WHERE id = '19e73a03-bf13-41b7-be9e-12143969fb39';

-- Downtown Houston Storm Damage (id: 471105eb)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '1.5 hours',
  etr_expected = NOW() + INTERVAL '2.5 hours',
  etr_latest   = NOW() + INTERVAL '4 hours',
  etr_confidence = 'MEDIUM',
  etr_uncertainty_drivers = '["wind damage extent", "conductor assessment pending"]'::jsonb,
  has_critical_load = true,
  critical_load_types = '["Hospital", "Emergency Shelter"]'::jsonb,
  backup_runtime_remaining_hours = 6.5,
  critical_escalation_threshold_hours = 4.0,
  customers_impacted = 12450,
  event_start_time = NOW() - INTERVAL '6 hours',
  event_last_update_time = NOW() - INTERVAL '30 minutes'
WHERE id = '471105eb-fbf9-43c1-8cc5-ad8214abfed8';

-- Memorial Park Equipment Failure (id: 6fc42491)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '0.5 hours',
  etr_expected = NOW() + INTERVAL '1 hour',
  etr_latest   = NOW() + INTERVAL '2 hours',
  etr_confidence = 'HIGH',
  etr_uncertainty_drivers = '["parts availability"]'::jsonb,
  has_critical_load = false,
  customers_impacted = 3400,
  event_start_time = NOW() - INTERVAL '2 hours',
  event_last_update_time = NOW() - INTERVAL '20 minutes'
WHERE id = '6fc42491-3951-404b-9f46-55d3b9c3b249';

-- Pasadena Lightning Strike (id: 41c02d1a)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '2 hours',
  etr_expected = NOW() + INTERVAL '3 hours',
  etr_latest   = NOW() + INTERVAL '4.5 hours',
  etr_confidence = 'MEDIUM',
  etr_uncertainty_drivers = '["lightning damage assessment", "recloser inspection"]'::jsonb,
  has_critical_load = true,
  critical_load_types = '["Water Treatment Plant"]'::jsonb,
  backup_runtime_remaining_hours = 5.0,
  critical_escalation_threshold_hours = 3.0,
  customers_impacted = 4200,
  event_start_time = NOW() - INTERVAL '3 hours',
  event_last_update_time = NOW() - INTERVAL '45 minutes'
WHERE id = '41c02d1a-e9d1-4eb8-83bc-a4c8b101aef1';

-- Sugar Land Heatwave Load Shed (id: f9370dab)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '3 hours',
  etr_expected = NOW() + INTERVAL '5 hours',
  etr_latest   = NOW() + INTERVAL '8 hours',
  etr_confidence = 'LOW',
  etr_uncertainty_drivers = '["peak demand forecast", "transformer thermal limit", "cooling load uncertainty"]'::jsonb,
  has_critical_load = true,
  critical_load_types = '["Hospital", "Data Center"]'::jsonb,
  backup_runtime_remaining_hours = 4.5,
  critical_escalation_threshold_hours = 5.0,
  customers_impacted = 5600,
  event_start_time = NOW() - INTERVAL '1 hour',
  event_last_update_time = NOW() - INTERVAL '15 minutes'
WHERE id = 'f9370dab-c0c5-4982-8c83-426751482ac9';

-- Katy High Wind Damage (id: 04af3eaa)
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '2 hours',
  etr_expected = NOW() + INTERVAL '3.5 hours',
  etr_latest   = NOW() + INTERVAL '5 hours',
  etr_confidence = 'MEDIUM',
  etr_uncertainty_drivers = '["wind speed ongoing", "conductor slap damage", "tree contact risk"]'::jsonb,
  has_critical_load = false,
  customers_impacted = 7800,
  event_start_time = NOW() - INTERVAL '3 hours',
  event_last_update_time = NOW() - INTERVAL '1 hour'
WHERE id = '04af3eaa-628e-4000-bd0e-bd3455119402';

-- storm (id: eaf9354f) - update customers and ETR
UPDATE scenarios SET
  etr_earliest = NOW() + INTERVAL '4 hours',
  etr_expected = NOW() + INTERVAL '6 hours',
  etr_latest   = NOW() + INTERVAL '9 hours',
  etr_confidence = 'LOW',
  etr_uncertainty_drivers = '["storm track uncertainty", "damage assessment incomplete"]'::jsonb,
  customers_impacted = 2100,
  event_start_time = NOW() - INTERVAL '8 hours',
  event_last_update_time = NOW() - INTERVAL '2 hours'
WHERE id = 'eaf9354f-43c1-4b3d-8295-c8fb5039304a';