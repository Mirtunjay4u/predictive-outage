import type { EtrBand, NormalizedScenario } from "../types.ts";

export interface EtrRuleInput {
  scenario: NormalizedScenario;
  crewsSufficient: boolean;
  hasStormLikeActiveHazard: boolean;
  dataQualityWarnings: string[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const evaluateEtrRules = ({
  scenario,
  crewsSufficient,
  hasStormLikeActiveHazard,
  dataQualityWarnings,
}: EtrRuleInput): EtrBand => {
  const rationale: string[] = [];

  const dataCompleteness = scenario.dataQuality.completeness;
  const freshnessMinutes = scenario.dataQuality.freshnessMinutes;
  const dataGood = dataCompleteness >= 0.75 && freshnessMinutes <= 60 && dataQualityWarnings.length === 0;
  const keyInputsMissing = scenario.assets.length === 0 || scenario.customersAffected === 0;

  if (dataGood && crewsSufficient && !hasStormLikeActiveHazard) {
    rationale.push("Data quality is strong and current.");
    rationale.push("Crew capacity meets estimated demand.");
    rationale.push("Hazard conditions are not rapidly escalating.");
    return {
      band: "HIGH",
      confidence: 0.85,
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
      confidence: clamp(0.35 - dataQualityWarnings.length * 0.03, 0.15, 0.45),
      rationale: rationale.filter(Boolean),
    };
  }

  rationale.push("Conditions are mixed across hazard, workforce, and data quality.");
  rationale.push(`Data completeness=${dataCompleteness.toFixed(2)}, freshness=${freshnessMinutes} minutes.`);
  rationale.push(`Crews sufficient=${crewsSufficient}.`);

  return {
    band: "MEDIUM",
    confidence: 0.62,
    rationale,
  };
};
