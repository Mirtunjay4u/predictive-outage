export type HazardType = "STORM" | "WILDFIRE" | "RAIN" | "HEAT" | "ICE" | "UNKNOWN";
export type Phase = "PRE_EVENT" | "ACTIVE" | "POST_EVENT" | "UNKNOWN";
export type CriticalLoadType = "HOSPITAL" | "WATER" | "TELECOM" | "SHELTER" | "OTHER";

export interface AssetInput {
  id: string;
  type: string;
  ageYears?: number;
  vegetationExposure?: number;
  loadCriticality?: number;
}

export interface CriticalLoadInput {
  type: CriticalLoadType;
  name?: string;
  backupHoursRemaining?: number;
}

export interface CrewInput {
  available?: number;
  enRoute?: number;
  notes?: string;
}

export interface DataQualityInput {
  completeness?: number;
  freshnessMinutes?: number;
  notes?: string[];
}

export interface OperatorContext {
  region?: string;
  role?: string;
}

export interface ScenarioInput {
  scenarioId?: string;
  hazardType?: HazardType;
  phase?: Phase;
  severity?: number;
  customersAffected?: number;
  assets?: AssetInput[];
  criticalLoads?: CriticalLoadInput[];
  crews?: CrewInput;
  lastUpdated?: string;
  dataQuality?: DataQualityInput;
  operatorContext?: OperatorContext;
}

export interface NormalizedScenario {
  scenarioId: string;
  hazardType: HazardType;
  phase: Phase;
  severity: number;
  customersAffected: number;
  assets: AssetInput[];
  criticalLoads: CriticalLoadInput[];
  crews: Required<Pick<CrewInput, "available" | "enRoute">> & Pick<CrewInput, "notes">;
  lastUpdated?: string;
  dataQuality: Required<Pick<DataQualityInput, "completeness" | "freshnessMinutes">> & Pick<DataQualityInput, "notes">;
  operatorContext: OperatorContext;
}

export interface ExplainabilityDriver {
  key: string;
  value: string | number | boolean;
  weight: number;
}

export interface SafetyConstraint {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  triggered: boolean;
  evidence: string[];
}

export interface AllowedAction {
  action: ActionType;
  reason: string;
  constraints: string[];
}

export interface BlockedAction {
  action: ActionType;
  reason: string;
  remediation: string[];
}

export type ActionType =
  | "dispatch_crews"
  | "reroute_load"
  | "deenergize_section"
  | "public_advisory"
  | "request_mutual_aid"
  | "prioritize_critical_load"
  | "generate_restoration_plan";

export interface EtrBand {
  band: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  confidence: number;
  rationale: string[];
}

export interface EvaluationResponse {
  allowedActions: AllowedAction[];
  blockedActions: BlockedAction[];
  escalationFlags: string[];
  etrBand: EtrBand;
  safetyConstraints: SafetyConstraint[];
  explainability: {
    drivers: ExplainabilityDriver[];
    assumptions: string[];
    dataQualityWarnings: string[];
  };
  timestamps: {
    evaluatedAt: string;
    inputLastUpdated?: string;
  };
  meta: {
    engineVersion: string;
    deterministicHash: string;
  };
}

export interface RuleContext {
  scenario: NormalizedScenario;
  dataQualityWarnings: string[];
}
