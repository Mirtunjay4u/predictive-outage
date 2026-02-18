import type { ExplainabilityDriver, NormalizedScenario } from "../types.ts";

const HAZARD_MULTIPLIERS: Record<NormalizedScenario["hazardType"], number> = {
  STORM: 1.25,
  WILDFIRE: 1.4,
  RAIN: 1.1,
  UNKNOWN: 1,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export interface AssetRuleResult {
  assetRiskScore: number;
  drivers: ExplainabilityDriver[];
  assumptions: string[];
}

export const evaluateAssetRules = (scenario: NormalizedScenario): AssetRuleResult => {
  const assumptions: string[] = [];
  const assets = scenario.assets;

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

  const ageFactor = clamp(avgAgeYears / 60, 0, 1);
  const hazardMultiplier = HAZARD_MULTIPLIERS[scenario.hazardType];

  const rawScore = (ageFactor * 35 + avgVegetationExposure * 25 + avgLoadCriticality * 30 + (scenario.severity / 5) * 10) * hazardMultiplier;

  const assetRiskScore = clamp(Math.round(rawScore), 0, 100);

  const drivers: ExplainabilityDriver[] = [
    { key: "asset_age_years_avg", value: Number(avgAgeYears.toFixed(1)), weight: 0.35 },
    { key: "hazard_type", value: scenario.hazardType, weight: 0.25 },
    { key: "vegetation_exposure_avg", value: Number(avgVegetationExposure.toFixed(2)), weight: 0.2 },
    { key: "load_criticality_avg", value: Number(avgLoadCriticality.toFixed(2)), weight: 0.2 },
    { key: "asset_risk_score", value: assetRiskScore, weight: 1 },
  ];

  return { assetRiskScore, drivers, assumptions };
};
