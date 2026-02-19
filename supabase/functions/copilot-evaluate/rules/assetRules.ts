import type { ExplainabilityDriver, NormalizedScenario } from "../types.ts";

const HAZARD_MULTIPLIERS: Record<NormalizedScenario["hazardType"], number> = {
  STORM: 1.25,
  WILDFIRE: 1.4,
  RAIN: 1.1,
  HEAT: 1.15,
  ICE: 1.2,
  UNKNOWN: 1,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export interface AssetRuleResult {
  assetRiskScore: number;
  drivers: ExplainabilityDriver[];
  assumptions: string[];
  escalationFlags: string[];
}

export const evaluateAssetRules = (scenario: NormalizedScenario): AssetRuleResult => {
  const assumptions: string[] = [];
  const escalationFlags: string[] = [];
  const assets = scenario.assets;
  const isHeat = scenario.hazardType === "HEAT";
  const isIce = scenario.hazardType === "ICE";
  const isWildfire = scenario.hazardType === "WILDFIRE";

  if (assets.length === 0) {
    assumptions.push("No assets provided; using scenario-level defaults for risk scoring.");
  }

  const avgAgeYears = assets.length
    ? assets.reduce((sum, asset) => sum + clamp(asset.ageYears ?? 15, 0, 120), 0) / assets.length
    : 15;
  const avgVegetationExposure = assets.length
    ? assets.reduce((sum, asset) => sum + clamp(asset.vegetationExposure ?? 0.4, 0, 1), 0) / assets.length
    : 0.4;
  const avgLoadCriticality = assets.length
    ? assets.reduce((sum, asset) => sum + clamp(asset.loadCriticality ?? 0.5, 0, 1), 0) / assets.length
    : 0.5;

  // HEAT hazard: cooling load priority elevates load_criticality weight from 0.30 → 0.40;
  // vegetation is less relevant in heat events so it drops from 0.25 → 0.15.
  //
  // ICE hazard: ice accumulation on conductors/vegetation is the primary failure driver,
  // so vegetation_exposure weight rises from 0.25 → 0.45; load_criticality drops to 0.15.
  //
  // WILDFIRE hazard: dry brush loading makes vegetation_exposure the primary ignition and
  // line-contact failure driver, rising from 0.25 → 0.45; load_criticality drops to 0.15.
  const loadCriticalityWeight = isHeat ? 0.40 : (isIce || isWildfire) ? 0.15 : 0.30;
  const vegetationWeight      = isHeat ? 0.15 : (isIce || isWildfire) ? 0.45 : 0.25;

  if (isHeat) {
    assumptions.push("HEAT hazard: load_criticality_avg weight elevated to 0.40 (cooling load priority).");
    assumptions.push("HEAT hazard: vegetation_exposure_avg weight reduced to 0.15 (less relevant in heat events).");
  }
  if (isIce) {
    assumptions.push("ICE hazard: vegetation_exposure_avg weight elevated to 0.45 (ice accumulation on lines is primary failure driver).");
    assumptions.push("ICE hazard: load_criticality_avg weight reduced to 0.15 (line mechanical risk dominates over load profile).");
  }
  if (isWildfire) {
    assumptions.push("WILDFIRE hazard: vegetation_exposure_avg weight elevated to 0.45 (dry brush loading is primary ignition and line-contact failure driver).");
    assumptions.push("WILDFIRE hazard: load_criticality_avg weight reduced to 0.15 (vegetation exposure risk dominates over load profile).");
  }

  const ageFactor = clamp(avgAgeYears / 60, 0, 1);
  const hazardMultiplier = HAZARD_MULTIPLIERS[scenario.hazardType];

  const rawScore =
    (ageFactor * 35 +
      avgVegetationExposure * vegetationWeight * 100 +
      avgLoadCriticality * loadCriticalityWeight * 100 +
      (scenario.severity / 5) * 10) *
    hazardMultiplier;

  const assetRiskScore = clamp(Math.round(rawScore), 0, 100);

  // HEAT escalation: transformer thermal stress flag when severity >= 3.
  // High ambient temps + sustained load push transformer cooling limits.
  if (isHeat && scenario.severity >= 3) {
    escalationFlags.push("transformer_thermal_stress");
    assumptions.push(
      `HEAT severity ${scenario.severity}/5: transformer_thermal_stress escalation flagged — ambient heat may accelerate insulation degradation under sustained load.`,
    );
  }

  const drivers: ExplainabilityDriver[] = [
    { key: "asset_age_years_avg", value: Number(avgAgeYears.toFixed(1)), weight: 0.35 },
    { key: "hazard_type", value: scenario.hazardType, weight: 0.25 },
    { key: "vegetation_exposure_avg", value: Number(avgVegetationExposure.toFixed(2)), weight: vegetationWeight },
    { key: "load_criticality_avg", value: Number(avgLoadCriticality.toFixed(2)), weight: loadCriticalityWeight },
    { key: "asset_risk_score", value: assetRiskScore, weight: 1 },
  ];

  return { assetRiskScore, drivers, assumptions, escalationFlags };
};
