import type { EtrBand, NormalizedScenario } from "../types.ts";

export interface EtrRuleInput {
  scenario: NormalizedScenario;
  crewsSufficient: boolean;
  hasStormLikeActiveHazard: boolean;
  dataQualityWarnings: string[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// HEAT hazard: stale data degrades ETR confidence faster because grid thermal
// state changes rapidly during heat events. Penalise 0.02 per minute over 60.
const heatFreshnessConfidencePenalty = (freshnessMinutes: number): number => {
  if (freshnessMinutes <= 60) return 0;
  return clamp((freshnessMinutes - 60) * 0.002, 0, 0.25);
};

export const evaluateEtrRules = ({
  scenario,
  crewsSufficient,
  hasStormLikeActiveHazard,
  dataQualityWarnings,
}: EtrRuleInput): EtrBand => {
  const rationale: string[] = [];

  const dataCompleteness = scenario.dataQuality.completeness;
  const freshnessMinutes = scenario.dataQuality.freshnessMinutes;
  const isHeat = scenario.hazardType === "HEAT";

  // For HEAT events, stale data (>60 min) is treated as a confidence penalty
  // because thermal grid state can shift faster than a standard hazard cycle.
  const heatPenalty = isHeat ? heatFreshnessConfidencePenalty(freshnessMinutes) : 0;
  const freshnessThreshold = isHeat ? 60 : 60; // explicit for future per-hazard tuning
  const dataGood =
    dataCompleteness >= 0.75 &&
    freshnessMinutes <= freshnessThreshold &&
    dataQualityWarnings.length === 0;
  const keyInputsMissing = scenario.assets.length === 0 || scenario.customersAffected === 0;

  if (isHeat && freshnessMinutes > 60) {
    rationale.push(
      `Thermal grid data is ${freshnessMinutes} minutes old — real-time load readings degrade HEAT ETR accuracy.`,
    );
  }

  if (dataGood && crewsSufficient && !hasStormLikeActiveHazard) {
    rationale.push("Data quality is strong and current.");
    rationale.push("Crew capacity meets estimated demand.");
    rationale.push("Hazard conditions are not rapidly escalating.");
    return {
      band: "HIGH",
      confidence: clamp(0.85 - heatPenalty, 0.5, 0.85),
      rationale,
    };
  }

  if (keyInputsMissing || (hasStormLikeActiveHazard && scenario.severity >= 4) || !crewsSufficient) {
    rationale.push(keyInputsMissing ? "Missing key operational inputs (assets or customers affected)." : "");
    rationale.push(
      hasStormLikeActiveHazard && scenario.severity >= 4
        ? "Active severe hazard creates uncertain restoration path."
        : "",
    );
    rationale.push(!crewsSufficient ? "Crew availability is below estimated need." : "");
    rationale.push(dataQualityWarnings.length > 0 ? "Data quality warnings reduce confidence in precision." : "");

    return {
      band: "LOW",
      confidence: clamp(0.35 - dataQualityWarnings.length * 0.03 - heatPenalty, 0.1, 0.45),
      rationale: rationale.filter(Boolean),
    };
  }

  rationale.push("Conditions are mixed across hazard, workforce, and data quality.");
  rationale.push(`Data completeness=${dataCompleteness.toFixed(2)}, freshness=${freshnessMinutes} minutes.`);
  rationale.push(`Crews sufficient=${crewsSufficient}.`);
  if (isHeat && heatPenalty > 0) {
    rationale.push(`HEAT stale-data confidence penalty applied: −${(heatPenalty * 100).toFixed(0)}%.`);
  }

  return {
    band: "MEDIUM",
    confidence: clamp(0.62 - heatPenalty, 0.35, 0.62),
    rationale,
  };
};
