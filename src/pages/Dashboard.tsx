import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatConfidenceFull } from '@/lib/etr-format';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon, FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Gauge, Ban, Sparkles, ShieldCheck, ShieldAlert, ShieldX, CloudLightning, Flame, Droplets, Snowflake, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';
import { FlippableKPICard } from '@/components/dashboard/FlippableKPICard';
import { ImmediateAttentionStrip } from '@/components/dashboard/ImmediateAttentionStrip';
import { OperationalWorkQueue } from '@/components/dashboard/OperationalWorkQueue';
import { SafetyRiskPanel } from '@/components/dashboard/SafetyRiskPanel';
import { CrewWorkloadPanel } from '@/components/dashboard/CrewWorkloadPanel';
import { OperationalTimeline } from '@/components/dashboard/OperationalTimeline';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { CustomerImpactKPICard } from '@/components/dashboard/CustomerImpactKPICard';
import { ReadinessStrip } from '@/components/dashboard/ReadinessStrip';
import { AIExecutiveBriefingPanel } from '@/components/dashboard/AIExecutiveBriefingPanel';
import type { BriefingData } from '@/components/dashboard/AIExecutiveBriefingPanel';
import { ExecutiveSignalCard } from '@/components/dashboard/ExecutiveSignalCard';
import { SupportingSignalsSheet } from '@/components/dashboard/SupportingSignalsSheet';
import { useDashboardUi } from '@/contexts/DashboardUiContext';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_INTERACTIVE_SURFACE_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime } from '@/lib/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const KPI_CONFIG: Record<string, { title: string; subtitle: string; tooltip: string }> = {
  'Total Events': { title: 'All Tracked Events', subtitle: 'All outage-related events currently monitored', tooltip: 'Complete inventory of events across all lifecycle stages.' },
  'Pre-Event': { title: 'Upcoming Risk Events', subtitle: 'Forecast events with outage potential', tooltip: 'Forecast events with outage potential and pre-positioning requirements.' },
  'Active Events': { title: 'Ongoing Outages', subtitle: 'Events currently impacting service', tooltip: 'Outages actively impacting service restoration and dispatch sequencing.' },
  'High Priority': { title: 'Immediate Attention', subtitle: 'Critical load, uncertainty, or elevated risk detected', tooltip: 'Critical events with elevated service risk and critical load exposure.' },
  'Post-Event': { title: 'Recently Resolved', subtitle: 'Events pending review or reporting', tooltip: 'Completed events pending closeout validation and reporting.' },
};

type KpiFilterKey = 'Pre-Event' | 'Active Events' | 'High Priority' | 'Post-Event';
type PolicyAction = {
  action?: string;
  reason?: string;
  remediation?: string;
};

type EscalationFlag = string | { flag?: string; label?: string };

type EtrBand = {
  band?: string;
  confidence?: string;
};

type PolicyResult = {
  policyGate?: 'PASS' | 'WARN' | 'BLOCK';
  gateReason?: string;
  allowedActions?: PolicyAction[];
  blockedActions?: PolicyAction[];
  escalationFlags?: EscalationFlag[];
  etrBand?: EtrBand;
  safetyConstraints?: Array<{ severity?: string; triggered?: boolean }>;
};

type DemoLogEntry = {
  ts: string;
  msg: string;
};

type DemoStep = {
  label: string;
  patch: Record<string, unknown>;
  waitMs: number;
  after?: 'policy' | 'briefing' | 'none';
};

const HAZARD_FALLBACK = 'heavy rain';

// ── Extreme Event Classification Model (5 hazard types) ───────────────────
type ExtremeHazardKey = 'storm' | 'wildfire' | 'flood' | 'extreme-cold' | 'extreme-heat';

interface ExtremeHazard {
  key: ExtremeHazardKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  severityLabel: string;
  policyHazardType: 'STORM' | 'WILDFIRE' | 'RAIN' | 'HEAT' | 'ICE' | 'UNKNOWN';
  /** Context line shown in the Active Extreme Event surface */
  contextLine: string;
  /** One-line risk hint shown on the pill tab (right side) */
  riskHint: string;
  /** Label used for the contextual KPI chip */
  exposureLabel: string;
  /** Adjusts demo playback description text */
  demoContext: string;
  /** Contextual risk bullets keyed by severity level */
  riskBullets: Record<'Low' | 'Moderate' | 'Severe', string[]>;
}

const EXTREME_HAZARDS: ExtremeHazard[] = [
  {
    key: 'storm',
    label: 'Severe Storm',
    shortLabel: 'Storm',
    icon: CloudLightning,
    severityLabel: 'Severe',
    policyHazardType: 'STORM',
    contextLine: 'High-wind and lightning exposure; feeder fault probability elevated.',
    riskHint: 'Wind & lightning exposure rising; feeder fault probability elevated.',
    exposureLabel: 'Wind / Lightning Risk',
    demoContext: 'Severe thunderstorm cell intensifying; wind-driven vegetation contact on exposed feeders.',
    riskBullets: {
      Low:      ['Wind speeds below fault threshold', 'Lightning risk: Minimal', 'Feeder patrols: Routine'],
      Moderate: ['Sustained winds 35–55 mph; line sag possible', 'Lightning activity increasing in service area', 'Pre-position crews near high-exposure feeders'],
      Severe:   ['Damaging winds >55 mph; multiple fault risk', 'Lightning strike probability: Elevated', 'Emergency switching plans: Activated'],
    },
  },
  {
    key: 'wildfire',
    label: 'Wildfire',
    shortLabel: 'Wildfire',
    icon: Flame,
    severityLabel: 'Severe',
    policyHazardType: 'WILDFIRE',
    contextLine: 'Vegetation proximity and red-flag wind conditions elevate ignition risk.',
    riskHint: 'Smoke + heat stress; PSPS readiness recommended.',
    exposureLabel: 'Vegetation Exposure',
    demoContext: 'Active wildfire perimeter advancing; vegetation exposure and heat-driven asset stress critical.',
    riskBullets: {
      Low:      ['No active fire perimeter within service area', 'Vegetation clearance: Within tolerance', 'De-energization: Not required'],
      Moderate: ['Fire perimeter within 10 mi of transmission corridor', 'Red-flag watch: Wind gusts >25 mph', 'De-energization protocols: On standby'],
      Severe:   ['Red-flag wind alert active', 'Vegetation contact probability: Critical', 'De-energization protocols: Standby'],
    },
  },
  {
    key: 'flood',
    label: 'Flooding',
    shortLabel: 'Flood',
    icon: Droplets,
    severityLabel: 'Moderate',
    policyHazardType: 'RAIN',
    contextLine: 'Soil saturation and substation inundation risk; low-lying infrastructure at risk.',
    riskHint: 'Substation low-lying risk; access constraints likely.',
    exposureLabel: 'Water Exposure Risk',
    demoContext: 'Sustained rainfall causing soil saturation; substation flooding risk in low-elevation zones.',
    riskBullets: {
      Low:      ['Rainfall within normal absorption capacity', 'Substation flood barriers: Nominal', 'Access roads: Open'],
      Moderate: ['Soil saturation >70%; runoff risk elevated', 'Low-elevation substation monitoring: Active', 'Crew access to flood-prone zones: Restricted'],
      Severe:   ['Flash flood watch issued for service territory', 'Substation inundation risk: High — barriers deployed', 'Underground cable fault probability: Elevated'],
    },
  },
  {
    key: 'extreme-cold',
    label: 'Ice Storm / Blizzards',
    shortLabel: 'Ice Storm',
    icon: Snowflake,
    severityLabel: 'Moderate',
    policyHazardType: 'STORM',
    contextLine: 'Ice loading on conductors and brittle hardware failure risk.',
    riskHint: 'Icing + conductor sag; brittle failure probability up.',
    exposureLabel: 'Ice Load Risk',
    demoContext: 'Ice accumulation on transmission lines; brittle material failure risk increasing with temperature drop.',
    riskBullets: {
      Low:      ['Temperature above brittle failure threshold', 'Ice accumulation: Negligible', 'Heating load demand: Normal'],
      Moderate: ['Ice load on conductors: 0.25–0.5 in radial', 'Brittle hardware risk: Elevated on aging spans', 'Heating demand surge: +18% above baseline'],
      Severe:   ['Ice accumulation >0.5 in — conductor galloping risk', 'Brittle material failure: Imminent on aged infrastructure', 'Peak heating demand: Critical — load shed protocols armed'],
    },
  },
  {
    key: 'extreme-heat',
    label: 'Extreme Heat',
    shortLabel: 'Ext. Heat',
    icon: Thermometer,
    severityLabel: 'Moderate',
    policyHazardType: 'HEAT',
    contextLine: 'Peak demand surge and transformer thermal stress; load shed risk elevated.',
    riskHint: 'Transformer thermal headroom reduced; peak demand risk.',
    exposureLabel: 'Thermal Load Risk',
    demoContext: 'Extreme heat driving load surge; transformer thermal stress and cooling system strain in dense service areas.',
    riskBullets: {
      Low:      ['Ambient temp within transformer rating envelope', 'Cooling load: Elevated but manageable', 'Load shed threshold: Not approached'],
      Moderate: ['Transformer thermal stress >80% rated capacity', 'Cooling system strain in dense service areas', 'Voluntary conservation request: Issued'],
      Severe:   ['Transformer overload risk: Imminent — thermal alarm active', 'Load surge >15% above peak planning capacity', 'Emergency load shed protocols: Staged and ready'],
    },
  },
];

const DEFAULT_HAZARD_KEY: ExtremeHazardKey = 'storm';

function getExtremeHazard(key: ExtremeHazardKey): ExtremeHazard {
  return EXTREME_HAZARDS.find((h) => h.key === key) ?? EXTREME_HAZARDS[0]!;
}

// Maps each hazard key to its matching outage_type values in the DB for attention count filtering
const HAZARD_OUTAGE_TYPE_MAP: Record<ExtremeHazardKey, string[]> = {
  'storm':        ['Storm', 'Lightning', 'High Wind', 'Snow Storm'],
  'wildfire':     ['Wildfire', 'Vegetation'],
  'flood':        ['Flood', 'Heavy Rain'],
  'extreme-cold': ['Ice/Snow', 'Snow Storm'],
  'extreme-heat': ['Heatwave'],
};

function getOutageBreakdown(scenarios: Scenario[]) {
  const breakdown = scenarios.reduce<Record<string, number>>((acc, s) => {
    const type = s.outage_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(breakdown).map(([type, count]) => ({ type, count, tooltip: `${count} events for ${type}` })).sort((a, b) => b.count - a.count);
}

function getScenarioHazard(scenarios: Scenario[]) {
  const outageType = scenarios.find((scenario) => scenario.outage_type)?.outage_type;
  return outageType ? outageType.toLowerCase() : HAZARD_FALLBACK;
}

function getFilterMatcher(filter: KpiFilterKey) {
  return (scenario: Scenario) => {
    if (filter === 'Pre-Event') return scenario.lifecycle_stage === 'Pre-Event';
    if (filter === 'Post-Event') return scenario.lifecycle_stage === 'Post-Event';
    if (filter === 'Active Events') return scenario.lifecycle_stage === 'Event';
    return scenario.lifecycle_stage === 'Event' && scenario.priority === 'high';
  };
}

function deriveRiskSeverity(index: number) {
  if (index >= 75) return 'Severe';
  if (index >= 55) return 'Elevated';
  if (index >= 30) return 'Moderate';
  return 'Low';
}

function getRiskBadgeClass(severity: string) {
  if (severity === 'Severe') return 'bg-red-500/10 text-red-700 border-red-500/40 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50';
  if (severity === 'Elevated') return 'bg-orange-500/10 text-orange-700 border-orange-500/40 dark:text-orange-300';
  if (severity === 'Moderate') return 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300';
  return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300';
}

// Ensure percentile estimates remain ordered for deterministic uncertainty messaging.
function normalizePercentiles(p50: Date, p90: Date) {
  return p90.getTime() < p50.getTime() ? { p50, p90: p50 } : { p50, p90 };
}

function buildEtrPercentiles(scenarios: Scenario[]) {
  const etrs = scenarios
    .map((scenario) => scenario.etr_expected)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (etrs.length === 0) {
    const now = new Date();
    return normalizePercentiles(now, now);
  }

  if (etrs.length === 1) {
    return normalizePercentiles(etrs[0], etrs[0]);
  }

  const p50 = etrs[Math.floor((etrs.length - 1) * 0.5)] ?? etrs[0];
  const p90 = etrs[Math.floor((etrs.length - 1) * 0.9)] ?? p50;
  return normalizePercentiles(p50, p90);
}

function toTitleCase(value?: string) {
  if (!value) return 'Action';
  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeFlag(flag: EscalationFlag, index: number) {
  return (typeof flag === 'string' ? flag : (flag?.flag ?? flag?.label ?? `Flag ${index + 1}`)).trim();
}

function humanizePolicyFlag(flag: string) {
  return toTitleCase(flag).replace(/\bEtr\b/g, 'ETR');
}

function summarizePolicy(result: PolicyResult) {
  // Deterministic executive format: "Gate: X. Drivers: Y. Primary blocked action: Z. Recommended next safe step: W."
  const escalationFlags = (result.escalationFlags ?? []).map((flag, index) => normalizeFlag(flag, index));
  const operationalBlocked = (result.blockedActions ?? []).filter((a) => a?.action !== 'deenergize_section');
  const gate: 'PASS' | 'WARN' | 'BLOCK' = operationalBlocked.length > 0 ? 'BLOCK' : escalationFlags.length > 0 ? 'WARN' : 'PASS';
  const driversText = escalationFlags.length > 0 ? escalationFlags.map((f) => f.replace(/_/g, ' ')).join(', ') : 'none';
  const primaryBlocked = operationalBlocked[0];
  const blockedText = primaryBlocked ? toTitleCase(primaryBlocked.action) : 'None';
  const topAllowed = result.allowedActions?.[0];
  const nextStep = topAllowed ? toTitleCase(topAllowed.action) : (result.etrBand?.band === 'LOW' ? 'Improve ETR confidence' : 'Monitor and reassess');
  const etrPart = result.etrBand?.band ? ` ETR band: ${result.etrBand.band}${result.etrBand.confidence ? ` (${result.etrBand.confidence})` : ''}.` : '';
  return `Gate: ${gate}. Drivers: ${driversText}.${etrPart} Primary blocked action: ${blockedText}. Recommended next safe step: ${nextStep}.`;
}

function buildPolicyContext(policyViewOrNull: PolicyResult | null): string {
  if (!policyViewOrNull) return 'No policy evaluation available yet.';

  const blockedActions = policyViewOrNull.blockedActions ?? [];
  const allowedActions = policyViewOrNull.allowedActions ?? [];
  const escalationFlags = (policyViewOrNull.escalationFlags ?? []).map((flag, index) => normalizeFlag(flag, index));
  const hasHighSafetyConstraint = (policyViewOrNull.safetyConstraints ?? []).some((constraint) => constraint?.triggered && constraint?.severity === 'HIGH');
  const inferredGate: 'PASS' | 'WARN' | 'BLOCK' = policyViewOrNull.policyGate
    ?? (blockedActions.length > 0
      ? 'BLOCK'
      : (escalationFlags.includes('low_confidence_etr') || hasHighSafetyConstraint)
        ? 'WARN'
        : 'PASS');

  const blockedSummary = blockedActions.length > 0
    ? blockedActions
      .map((item) => {
        const remediationRaw = item?.remediation;
        const remediationHint = Array.isArray(remediationRaw)
          ? remediationRaw[0] ?? null
          : typeof remediationRaw === 'string'
            ? remediationRaw.split(/[\n•;-]/).map((part: string) => part.trim()).find(Boolean) ?? null
            : null;
        return `- ${toTitleCase(item?.action)}: ${item?.reason ?? 'No reason provided'}${remediationHint ? ` (remediation: ${remediationHint})` : ''}`;
      })
      .join('\n')
    : '- None';
  const allowedSummary = allowedActions.length > 0
    ? allowedActions
      .slice(0, 3)
      .map((item) => `- ${toTitleCase(item?.action)}: ${item?.reason ?? 'No reason provided'}`)
      .join('\n')
    : '- None';

  return [
    `Gate: ${inferredGate}`,
    `Reason: ${policyViewOrNull.gateReason ?? 'No gate reason provided.'}`,
    `Escalation Flags: ${escalationFlags.length > 0 ? escalationFlags.join(', ') : 'None'}`,
    `ETR Band: ${policyViewOrNull.etrBand?.band ?? 'Unknown'}${policyViewOrNull.etrBand?.confidence ? ` (${policyViewOrNull.etrBand.confidence})` : ''}`,
    `Blocked Actions:\n${blockedSummary}`,
    `Allowed Actions (Top 3):\n${allowedSummary}`,
  ].join('\n');
}

function buildExecutiveBriefingPrompt(args: {
  scenario: Scenario | null;
  policyGate: 'PASS' | 'WARN' | 'BLOCK';
  policyView: PolicyResult | null;
  gateReason: string;
}): string {
  const { scenario, policyGate, policyView, gateReason } = args;
  const blockedActions = policyView?.blockedActions ?? [];
  const scenarioData = (scenario ?? {}) as Record<string, unknown>;
  const hardGuardrail = policyGate === 'BLOCK' || blockedActions.length > 0
    ? 'Do NOT recommend any blocked action; recommend mitigations and allowed actions only.'
    : 'Only recommend actions that remain operationally safe and policy-aligned.';

  return [
    'SYSTEM STYLE',
    '- You are an Operator Copilot for electric T&D outage response.',
    '- Speak with calm, executive incident-command tone.',
    '- Be concise, factual, and operationally safe.',
    '- If policyGate is BLOCK, do not propose blocked actions; propose mitigations and safe alternatives.',
    '- Always state confidence and assumptions.',
    `- ${hardGuardrail}`,
    '',
    'CONTEXT',
    `- scenarioId: ${scenario?.id ?? 'unknown'}`,
    `- hazard: ${scenario?.outage_type ?? 'unknown'}`,
    `- assets count: ${String(scenarioData.assets_count ?? scenarioData.assetsCount ?? 'unknown')}`,
    `- critical loads count: ${String(scenarioData.critical_loads_count ?? scenarioData.criticalLoadsCount ?? (scenario?.has_critical_load ? '>=1 flagged' : '0 flagged'))}`,
    `- crews available/enRoute: ${String(scenarioData.crews_available ?? scenarioData.crewsAvailable ?? 'unknown')}/${String(scenarioData.crews_enroute ?? scenarioData.crewsEnRoute ?? 'unknown')}`,
    `- dataQuality: ${String(scenarioData.data_quality ?? scenarioData.dataQuality ?? 'unknown')}`,
    '',
    'POLICY EVALUATION (DETERMINISTIC)',
    buildPolicyContext(policyView),
    `Gate reason: ${gateReason}`,
    '',
    'EXECUTIVE BRIEFING FORMAT (FOLLOW EXACTLY)',
    '- Situation (2–3 bullets)',
    '- Operational Risks (bullets; include critical load backup risk if flagged)',
    '- Recommended Actions (numbered; each must be allowed by policy; add constraints notes if present)',
    '- Blocked / Restricted Actions (if any; explain why + mitigation)',
    '- ETR Outlook (band + confidence + what would increase confidence)',
    '- Compliance / Audit Note (1 line referencing policy-based governance)',
  ].join('\n');
}

// ── Tooltip chip count-up — mounted fresh each time the tooltip opens ────
function TooltipChipValue({ value, delay, reduced }: { value: number; delay: number; reduced: boolean }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = mv.on('change', (v) => setDisplay(Math.round(v)));
    const controls = animate(mv, value, {
      duration: reduced ? 0 : 0.5,
      delay: reduced ? 0 : delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => { controls.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <span className="w-5 text-right font-semibold tabular-nums text-foreground">{display}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { boardroomMode } = useDashboardUi();
  const prefersReducedMotion = useReducedMotion();
  const { data: scenarios = [], dataUpdatedAt, refetch, isFetching } = useScenarios({ refetchInterval: 30000 });

  const [briefingState, setBriefingState] = useState<{ briefing: BriefingData | null; isLoading: boolean; error: string | null }>({ briefing: null, isLoading: false, error: null });
  const [supportingOpen, setSupportingOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'drivers' | 'assets' | 'uncertainty' | 'tradeoffs' | 'actions'>('drivers');
  const [selectedFeeder, setSelectedFeeder] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<KpiFilterKey[]>([]);
  const [policyStatus, setPolicyStatus] = useState<'idle' | 'evaluating' | 'success' | 'error'>('idle');
  const [policyResult, setPolicyResult] = useState<PolicyResult | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [lastGoodPolicyResult, setLastGoodPolicyResult] = useState<PolicyResult | null>(null);
  const [policyLatencyMs, setPolicyLatencyMs] = useState<number | null>(null);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string | null>(null);
  const [autoRunEnabled, setAutoRunEnabled] = useState(true);
  const [policySummary, setPolicySummary] = useState<string | null>(null);
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(-1);
  const [demoLastRunAt, setDemoLastRunAt] = useState<string | null>(null);
  const [demoLog, setDemoLog] = useState<DemoLogEntry[]>([]);
  const [demoScenarioOverride, setDemoScenarioOverride] = useState<Scenario | null>(null);
  const [demoBriefingTick, setDemoBriefingTick] = useState(0);
  const [briefingPulse, setBriefingPulse] = useState(false);
  // ── Extreme Event Classification state ──────────────────────────────────
  const [selectedHazardKey, setSelectedHazardKey] = useState<ExtremeHazardKey>(DEFAULT_HAZARD_KEY);
  // ── Severity override state (null = use hazard default) ─────────────────
  type SeverityOverride = 'Low' | 'Moderate' | 'Severe';
  const [severityOverride, setSeverityOverride] = useState<SeverityOverride | null>(null);
  // ── Operational Phase strip: which phase detail popover is open ──────────
  type PhaseId = 'detection' | 'risk-scoring' | 'policy-check' | 'ai-briefing' | 'dispatch' | 'recovery';
  const [openPhaseId, setOpenPhaseId] = useState<PhaseId | null>(null);
  const phaseStripRef = useRef<HTMLDivElement>(null);

  // Close the phase popover when clicking outside the strip
  useEffect(() => {
    if (!openPhaseId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (phaseStripRef.current && !phaseStripRef.current.contains(e.target as Node)) {
        setOpenPhaseId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPhaseId]);

  // When the hazard changes, reset the override so each hazard starts at its own default
  const handleHazardChange = (key: ExtremeHazardKey) => {
    setSelectedHazardKey(key);
    setSeverityOverride(null);
  };
  const briefingPulseTimerRef = useRef<number | null>(null);
  const baseNemotronInvokeRef = useRef(supabase.functions.invoke.bind(supabase.functions));
  const demoTimerRef = useRef<number | null>(null);
  const demoRunNonceRef = useRef(0);

  const preEventScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Pre-Event');
  const activeScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  const highPriorityScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Event' && s.priority === 'high');
  const postEventScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Post-Event');

  const stats = {
    total: scenarios.length,
    preEvent: preEventScenarios.length,
    active: activeScenarios.length,
    highPriority: highPriorityScenarios.length,
    postEvent: postEventScenarios.length,
  };

  const filteredScenarios = useMemo(() => {
    if (activeFilters.length === 0) return scenarios;
    const matchers = activeFilters.map((filter) => getFilterMatcher(filter));
    return scenarios.filter((scenario) => matchers.some((matcher) => matcher(scenario)));
  }, [activeFilters, scenarios]);
  const handleTypeClick = (lifecycle: string | null, outageType: string) => {
    const params = new URLSearchParams();
    if (lifecycle) params.set('lifecycle', lifecycle);
    // Only include outage_type when we actually have a value. Upstream callers may pass
    // an empty string to indicate "no outage_type filter" (defensive handling).
    if (outageType) params.set('outage_type', outageType);
    const qs = params.toString();
    navigate(qs ? `/events?${qs}` : '/events');
  };

  // High-priority events relevant to the currently selected hazard
  const hazardHighPriority = useMemo(() => {
    const relevantTypes = HAZARD_OUTAGE_TYPE_MAP[selectedHazardKey];
    return highPriorityScenarios.filter(
      (s) => !s.outage_type || relevantTypes.includes(s.outage_type)
    ).length;
  }, [highPriorityScenarios, selectedHazardKey]);

  const summary = useMemo(() => {
    if (hazardHighPriority > 0) return `${hazardHighPriority} high-priority events require attention`;
    if (stats.highPriority > 0) return `${stats.highPriority} high-priority events require attention`;
    if (stats.active > 0) return `${stats.active} active events currently in progress`;
    if (stats.preEvent > 0) return `${stats.preEvent} events under monitoring`;
    return 'No active events at this time';
  }, [hazardHighPriority, stats.active, stats.highPriority, stats.preEvent]);

  const scenarioName = scenarios[0]?.name ?? 'Regional Preparedness Drill';
  const hazard = getScenarioHazard(scenarios);

  const applyDemoPatch = useCallback((baseScenario: Scenario, patch: Record<string, unknown>): Scenario => {
    const merged = {
      ...baseScenario,
      ...patch,
      assets: [
        ...(((patch.assets as Array<Record<string, unknown>> | undefined)
          ?? ((baseScenario as unknown as Record<string, unknown>).assets as Array<Record<string, unknown>> | undefined)
          ?? [])),
      ],
      criticalLoads: [
        ...(((patch.criticalLoads as Array<Record<string, unknown>> | undefined)
          ?? ((baseScenario as unknown as Record<string, unknown>).criticalLoads as Array<Record<string, unknown>> | undefined)
          ?? [])),
      ],
      crews: {
        ...(((baseScenario as unknown as Record<string, unknown>).crews as Record<string, unknown> | undefined) ?? {}),
        ...((patch.crews as Record<string, unknown> | undefined) ?? {}),
      },
      dataQuality: {
        ...(((baseScenario as unknown as Record<string, unknown>).dataQuality as Record<string, unknown> | undefined) ?? {}),
        ...((patch.dataQuality as Record<string, unknown> | undefined) ?? {}),
      },
    };

    return merged as Scenario;
  }, []);

  const logDemo = useCallback((msg: string) => {
    const ts = new Date().toISOString();
    setDemoLog((prev) => [...prev, { ts, msg }].slice(-20));
  }, []);

  const getScenarioPayload = useCallback(() => {
    return (demoModeEnabled ? demoScenarioOverride : null) ?? scenarios[0] ?? null;
  }, [demoModeEnabled, demoScenarioOverride, scenarios]);

  const scenarioPayload = getScenarioPayload();

  const demoSteps = useMemo<DemoStep[]>(() => [
    {
      label: 'Storm cell intensifies',
      patch: {
        severity: 3,
        hazard: 'Severe thunderstorms',
        outage_type: 'Thunderstorm',
        customersAffected: 1350,
        customers_impacted: 1350,
        dataQuality: { freshnessMinutes: 7 },
      },
      waitMs: 1300,
      after: 'none',
    },
    {
      label: 'Critical load risk rises',
      patch: {
        severity: 4,
        customersAffected: 2140,
        customers_impacted: 2140,
        assets: [
          { id: 'FEEDER-A12', type: 'Feeder', vegetationExposure: 0.9, loadCriticality: 0.9, ageYears: 37 },
          { id: 'FEEDER-B07', type: 'Feeder', vegetationExposure: 0.6, loadCriticality: 0.9, ageYears: 28 },
        ],
        criticalLoads: [
          { name: 'Regional Hospital', backupHoursRemaining: 3.5 },
          { name: 'Water Treatment Plant', backupHoursRemaining: 5.2 },
        ],
      },
      waitMs: 1600,
      after: 'policy',
    },
    {
      label: 'Crew ETA updated',
      patch: {
        crews: { available: 6, enRoute: 4 },
        crews_available: 6,
        crews_enroute: 4,
        dataQuality: { freshnessMinutes: 4 },
      },
      waitMs: 1200,
      after: 'none',
    },
    {
      label: 'Secondary feeder impact confirmed',
      patch: {
        severity: 5,
        customersAffected: 3025,
        customers_impacted: 3025,
        assets: [
          { id: 'FEEDER-A12', type: 'Feeder', vegetationExposure: 0.9, loadCriticality: 0.9, ageYears: 37 },
          { id: 'FEEDER-C19', type: 'Feeder', vegetationExposure: 0.9, loadCriticality: 0.6, ageYears: 41 },
          { id: 'FEEDER-D03', type: 'Feeder', vegetationExposure: 0.6, loadCriticality: 0.9, ageYears: 24 },
        ],
        criticalLoads: [
          { name: 'Regional Hospital', backupHoursRemaining: 2.2 },
          { name: 'Telecom Hub', backupHoursRemaining: 4.8 },
        ],
      },
      waitMs: 1700,
      after: 'policy',
    },
    {
      label: 'AI briefing refresh checkpoint',
      patch: {
        dataQuality: { freshnessMinutes: 2 },
      },
      waitMs: 1200,
      after: 'briefing',
    },
    {
      label: 'Stabilization update',
      patch: {
        severity: 2,
        customersAffected: 980,
        customers_impacted: 980,
        crews: { available: 14, enRoute: 1 },
        crews_available: 14,
        crews_enroute: 1,
        criticalLoads: [
          { name: 'Regional Hospital', backupHoursRemaining: 5.4 },
          { name: 'Water Treatment Plant', backupHoursRemaining: 7.1 },
        ],
        dataQuality: { freshnessMinutes: 1 },
      },
      waitMs: 1400,
      after: 'policy',
    },
  ], []);

  /**
   * Maps a Scenario to the ScenarioInput shape expected by the copilot-evaluate edge function.
   *
   * Priority rules for demo vs. production paths:
   *  - severity:      explicit numeric patch field wins; otherwise derived from priority + customers
   *  - assets:        scenario.assets (array with required `type` field) wins over DB join query
   *  - crews:         scenario.crews  (object with `available`/`enRoute`) wins over DB query
   *  - criticalLoads: scenario.criticalLoads (name-based patch) wins over scenario DB fields
   *
   * This ensures demo playback reflects the intended risk escalation at each step without
   * re-fetching stale DB data that doesn't reflect the patched scenario state.
   */
  const buildPolicyPayload = useCallback(async (scenario: Scenario) => {
    // Cast once — Scenario is a DB row type; demo patches bolt on extra fields at runtime.
    const sr = scenario as unknown as Record<string, unknown>;

    // ── Severity ───────────────────────────────────────────────────────────
    // Honour an explicit numeric severity from a demo patch (1–5 clamped).
    // severityOverride from the UI takes precedence over everything else.
    // Fall back to blending priority rank + customers_impacted bracket.
    let severity: number;
    if (severityOverride === 'Severe') {
      severity = 5;
    } else if (severityOverride === 'Moderate') {
      severity = 3;
    } else if (severityOverride === 'Low') {
      severity = 1;
    } else if (typeof sr.severity === 'number' && isFinite(sr.severity)) {
      severity = Math.min(5, Math.max(1, Math.round(sr.severity)));
    } else {
      const priorityScore = scenario.priority === 'high' ? 5 : scenario.priority === 'low' ? 1 : 3;
      const customers = scenario.customers_impacted ?? 0;
      const customerScore = customers > 5000 ? 5 : customers > 1000 ? 4 : customers > 500 ? 3 : customers > 100 ? 2 : 1;
      severity = Math.round((priorityScore + customerScore) / 2);
    }

    // ── Phase ──────────────────────────────────────────────────────────────
    const phaseMap: Record<string, 'PRE_EVENT' | 'ACTIVE' | 'POST_EVENT' | 'UNKNOWN'> = {
      'Pre-Event': 'PRE_EVENT',
      'Event': 'ACTIVE',
      'Post-Event': 'POST_EVENT',
    };
    const phase = phaseMap[scenario.lifecycle_stage] ?? 'UNKNOWN';

    // ── Hazard type ────────────────────────────────────────────────────────
    const hazardMap: Record<string, 'STORM' | 'WILDFIRE' | 'RAIN' | 'HEAT' | 'ICE' | 'UNKNOWN'> = {
      Storm: 'STORM', 'Snow Storm': 'STORM', 'High Wind': 'STORM', Lightning: 'STORM',
      Wildfire: 'WILDFIRE', Vegetation: 'WILDFIRE',
      Flood: 'RAIN', 'Heavy Rain': 'RAIN',
      Heatwave: 'HEAT',
      'Ice/Snow': 'ICE',
    };
    // selectedHazardKey overrides the scenario's outage_type mapping so the operator's
    // selected extreme event is reflected in the policy payload. If no selection is active
    // the original DB-derived hazard type is preserved.
    const selectedHazard = getExtremeHazard(selectedHazardKey);
    const hazardType = selectedHazard.policyHazardType !== 'UNKNOWN'
      ? selectedHazard.policyHazardType
      : (scenario.outage_type ? (hazardMap[scenario.outage_type] ?? 'UNKNOWN') : 'UNKNOWN');

    // ── Assets ─────────────────────────────────────────────────────────────
    // Demo path: scenario.assets is set by applyDemoPatch. Every entry must have a string
    // `id` and `type`; the edge function normalizeScenario filters out anything that doesn't.
    // Production path: fetch from the event_assets join table keyed by scenario.id.
    type AssetShape = { id: string; type: string; ageYears?: number; vegetationExposure?: number; loadCriticality?: number };
    let assets: AssetShape[] = [];

    const rawPatchedAssets = Array.isArray(sr.assets)
      ? (sr.assets as Array<Record<string, unknown>>).filter(
          (a) => a && typeof a.id === 'string' && typeof a.type === 'string',
        )
      : [];

    if (rawPatchedAssets.length > 0) {
      // Demo path — all numeric fields already validated by the demo step definitions.
      assets = rawPatchedAssets.map((a) => ({
        id: a.id as string,
        type: a.type as string,
        ageYears: typeof a.ageYears === 'number' ? (a.ageYears as number) : undefined,
        vegetationExposure: typeof a.vegetationExposure === 'number' ? (a.vegetationExposure as number) : undefined,
        loadCriticality: typeof a.loadCriticality === 'number' ? (a.loadCriticality as number) : undefined,
      }));
    } else {
      // Production path — DB join query.
      try {
        const { data: eventAssets } = await supabase
          .from('event_assets')
          .select('asset_id, assets(id, name, asset_type, meta)')
          .eq('event_id', scenario.id);

        if (eventAssets && eventAssets.length > 0) {
          assets = eventAssets.map((ea) => {
            const asset = ea.assets as { id: string; name: string; asset_type: string; meta: Record<string, unknown> | null } | null;
            const meta = (asset?.meta ?? {}) as Record<string, unknown>;
            return {
              id: asset?.id ?? ea.asset_id,
              type: asset?.asset_type ?? 'Transformer',
              ageYears: typeof meta.age_years === 'number' ? meta.age_years : undefined,
              vegetationExposure: typeof meta.vegetation_exposure === 'number' ? meta.vegetation_exposure : undefined,
              loadCriticality: scenario.has_critical_load ? 0.9 : 0.4,
            };
          });
        } else {
          // Synthetic stubs from ID fields when no event_assets rows exist.
          const stubs = [
            scenario.fault_id && { id: scenario.fault_id, type: 'Fault' },
            scenario.feeder_id && { id: scenario.feeder_id, type: 'Feeder' },
            scenario.transformer_id && { id: scenario.transformer_id, type: 'Transformer' },
          ].filter(Boolean) as Array<{ id: string; type: string }>;
          assets = stubs.map((s) => ({
            ...s,
            ageYears: 10,
            vegetationExposure: 0.5,
            loadCriticality: scenario.has_critical_load ? 0.85 : 0.5,
          }));
        }
      } catch {
        // Non-fatal — edge function normalises missing assets gracefully.
      }
    }

    // ── Crews ──────────────────────────────────────────────────────────────
    // Demo path: scenario.crews is set by applyDemoPatch with { available, enRoute } numbers.
    // Production path: query the crews table by assigned_event_id + status.
    let crewsAvailable = 0;
    let crewsEnRoute = 0;

    const patchedCrews = sr.crews as { available?: unknown; enRoute?: unknown } | undefined;
    const hasPatchedCrews =
      patchedCrews != null &&
      (typeof patchedCrews.available === 'number' || typeof patchedCrews.enRoute === 'number');

    if (hasPatchedCrews && patchedCrews) {
      // Demo path — use the explicitly patched crew counts.
      crewsAvailable = typeof patchedCrews.available === 'number' ? patchedCrews.available : 0;
      crewsEnRoute   = typeof patchedCrews.enRoute   === 'number' ? patchedCrews.enRoute   : 0;
    } else {
      // Production path — live DB query.
      try {
        const { data: assignedCrews } = await supabase
          .from('crews')
          .select('status')
          .eq('assigned_event_id', scenario.id);

        const { data: availableCrews } = await supabase
          .from('crews')
          .select('id')
          .eq('status', 'available')
          .is('assigned_event_id', null);

        crewsEnRoute   = (assignedCrews  ?? []).filter((c) => c.status === 'en_route' || c.status === 'on_site').length;
        crewsAvailable = (availableCrews ?? []).length;
      } catch {
        // Non-fatal — edge function defaults crew counts to 0.
      }
    }

    // ── Critical loads ─────────────────────────────────────────────────────
    // Demo path: scenario.criticalLoads is set by applyDemoPatch with name + backupHoursRemaining.
    //   Names are matched to HOSPITAL | WATER | TELECOM | SHELTER | OTHER via substring lookup.
    // Production path: derive from scenario.critical_load_types string array.
    const criticalLoadTypeMap: Record<string, 'HOSPITAL' | 'WATER' | 'TELECOM' | 'SHELTER' | 'OTHER'> = {
      Hospital: 'HOSPITAL', Water: 'WATER', Telecom: 'TELECOM', Shelter: 'SHELTER',
    };

    type CriticalLoadShape = { type: 'HOSPITAL' | 'WATER' | 'TELECOM' | 'SHELTER' | 'OTHER'; name?: string; backupHoursRemaining?: number };
    let criticalLoads: CriticalLoadShape[] = [];

    const rawPatchedLoads = Array.isArray(sr.criticalLoads)
      ? (sr.criticalLoads as Array<Record<string, unknown>>)
      : [];

    if (rawPatchedLoads.length > 0) {
      // Demo path — infer type from name substring.
      const nameToType: Array<[string, CriticalLoadShape['type']]> = [
        ['hospital', 'HOSPITAL'],
        ['water',    'WATER'],
        ['telecom',  'TELECOM'],
        ['shelter',  'SHELTER'],
      ];
      criticalLoads = rawPatchedLoads.map((cl) => {
        const nameLower = String(cl.name ?? '').toLowerCase();
        const matchedType = nameToType.find(([key]) => nameLower.includes(key))?.[1] ?? 'OTHER';
        return {
          type: matchedType,
          name: typeof cl.name === 'string' ? cl.name : undefined,
          backupHoursRemaining: typeof cl.backupHoursRemaining === 'number' ? cl.backupHoursRemaining : undefined,
        };
      });
    } else {
      // Production path — derive from DB scenario fields.
      const criticalLoadTypes = Array.isArray(scenario.critical_load_types)
        ? (scenario.critical_load_types as string[])
        : [];
      criticalLoads = scenario.has_critical_load
        ? criticalLoadTypes.map((t) => ({
            type: criticalLoadTypeMap[t] ?? ('OTHER' as const),
            name: t,
            backupHoursRemaining: scenario.backup_runtime_remaining_hours ?? undefined,
          }))
        : [];
    }

    return {
      scenarioId: scenario.id,
      hazardType,
      phase,
      severity,
      customersAffected: scenario.customers_impacted ?? 0,
      assets,
      criticalLoads,
      crews: { available: crewsAvailable, enRoute: crewsEnRoute },
      lastUpdated: scenario.event_last_update_time ?? scenario.updated_at,
      dataQuality: {
        completeness: assets.length > 0 ? 0.8 : 0.5,
        freshnessMinutes: 15,
      },
      operatorContext: {
        region: scenario.service_area ?? undefined,
        role: scenario.operator_role ?? undefined,
      },
    };
  }, [selectedHazardKey]);

  const runPolicyCheck = useCallback(async (overridePayload?: Scenario | null) => {
    const start = Date.now();
    const payload = overridePayload ?? getScenarioPayload();

    if (!payload) {
      setPolicyLatencyMs(Date.now() - start);
      setPolicyStatus('error');
      setPolicyError('Policy check is unavailable until a scenario is loaded.');
      return;
    }

    setPolicyStatus('evaluating');
    setPolicyError(null);

    try {
      const mappedPayload = await buildPolicyPayload(payload);
      const { data, error } = await supabase.functions.invoke('copilot-evaluate', {
        body: mappedPayload,
      });

      if (error) throw error;

      const nextResult = (data ?? {}) as PolicyResult;
      setPolicyResult(nextResult);
      setLastGoodPolicyResult(nextResult);
      setPolicySummary(summarizePolicy(nextResult));
      setPolicyLatencyMs(Date.now() - start);
      setLastEvaluatedAt(new Date().toISOString());
      setPolicyStatus('success');
    } catch (err: unknown) {
      setPolicyLatencyMs(Date.now() - start);
      setPolicyStatus('error');

      // Discriminate error type so operators see a meaningful message rather than a
      // generic catch-all. supabase.functions.invoke throws a FunctionsHttpError-like
      // object with a numeric `status` field when the edge function returns a non-2xx.
      let errorMsg = 'Policy service unavailable';
      if (err != null && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        // status may be directly on the error or nested under .context (SDK version-dependent)
        const status =
          (typeof e.status === 'number' || typeof e.status === 'string')
            ? String(e.status)
            : typeof (e.context as Record<string, unknown> | undefined)?.status !== 'undefined'
              ? String((e.context as Record<string, unknown>).status)
              : null;
        const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';

        if (status === '401') {
          errorMsg = 'Policy service unavailable — auth error (401): JWT config missing for function';
        } else if (status === '403') {
          errorMsg = 'Policy service unavailable — forbidden (403): insufficient permissions';
        } else if (status === '400') {
          errorMsg = 'Policy service unavailable — bad request (400): payload schema mismatch';
        } else if (status === '500' || status === '503') {
          errorMsg = `Policy service unavailable — server error (${status}): edge function crashed`;
        } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
          errorMsg = 'Policy service unavailable — network error: check connectivity';
        } else if (status) {
          errorMsg = `Policy service unavailable — HTTP ${status}`;
        }
      }
      setPolicyError(errorMsg);
    }
  }, [buildPolicyPayload, getScenarioPayload]);

  useEffect(() => {
    if (!autoRunEnabled) return;
    const timer = window.setTimeout(() => {
      void runPolicyCheck();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoRunEnabled, runPolicyCheck, scenarioPayload?.id, scenarioPayload?.name, scenarioPayload?.outage_type]);

  // Briefing pulse: fires whenever policy result changes or demo step advances.
  useEffect(() => {
    if (briefingPulseTimerRef.current !== null) window.clearTimeout(briefingPulseTimerRef.current);
    setBriefingPulse(true);
    briefingPulseTimerRef.current = window.setTimeout(() => {
      setBriefingPulse(false);
      briefingPulseTimerRef.current = null;
    }, 2400);
    return () => {
      if (briefingPulseTimerRef.current !== null) window.clearTimeout(briefingPulseTimerRef.current);
    };
  }, [policyResult, demoStepIndex]);

  const policyView = policyResult ?? lastGoodPolicyResult;
  const policyEscalationFlags = (policyView?.escalationFlags ?? []).map((flag, index) => normalizeFlag(flag, index));
  const policyBlockedActions = policyView?.blockedActions ?? [];
  // deenergize_section is a permanent safety constraint (always blocked when critical loads exist),
  // not an operational BLOCK signal. Exclude it so the badge correctly reflects operational gate state.
  const operationalBlockedActions = policyBlockedActions.filter((a) => a?.action !== 'deenergize_section');
  const policyEtrBand = policyView?.etrBand ?? null;
  const hasBlockingEscalation = policyEscalationFlags.some((flag) => ['critical_backup_window_short', 'safety_block', 'hard_block'].includes(flag));
  const policyGate: 'PASS' | 'WARN' | 'BLOCK' = (operationalBlockedActions.length > 0 || hasBlockingEscalation)
    ? 'BLOCK'
    : (policyEscalationFlags.length > 0 || policyEtrBand?.band === 'LOW')
      ? 'WARN'
      : 'PASS';
  const gateReason = policyEscalationFlags.length > 0
    ? `${humanizePolicyFlag(policyEscalationFlags[0])}${policyEtrBand?.band ? ` · ETR ${policyEtrBand.band}${policyEtrBand?.confidence ? ` (${formatConfidenceFull(policyEtrBand.confidence)})` : ''}` : ''}`
    : policyView
      ? policyEtrBand?.band
        ? `ETR ${policyEtrBand.band}${policyEtrBand?.confidence ? ` (${formatConfidenceFull(policyEtrBand.confidence)})` : ''}`
        : 'No active escalation flags.'
      : 'No policy evaluation yet.';
  const isAIBriefingAllowed = policyGate !== 'BLOCK';
  const policyStatusLabel = policyStatus === 'evaluating'
    ? 'Evaluating'
    : policyStatus === 'error' && lastGoodPolicyResult
      ? 'Degraded'
      : policyStatus === 'error'
        ? 'Error'
        : policyStatus === 'success'
          ? 'OK'
          : 'Idle';
  const compactEvaluationTimestamp = lastEvaluatedAt ? lastEvaluatedAt.slice(5, 16).replace('T', ' ') : '—';
  const executiveBriefingPrompt = useMemo(() => buildExecutiveBriefingPrompt({
    scenario: scenarioPayload,
    policyGate,
    policyView,
    gateReason,
  }), [gateReason, policyGate, policyView, scenarioPayload]);

  useEffect(() => {
    const baseInvoke = baseNemotronInvokeRef.current;
    const invokeWithExecutivePrompt = ((fnName: string, options?: { body?: Record<string, unknown> }) => {
      if (fnName !== 'nemotron') {
        return baseInvoke(fnName, options as never);
      }

      return baseInvoke(fnName, {
        ...(options ?? {}),
        body: {
          ...(options?.body ?? {}),
          prompt: executiveBriefingPrompt,
          context: JSON.stringify({
            scenario: scenarioPayload,
            policyGate,
            gateReason,
            policyView,
            policyContext: buildPolicyContext(policyView),
          }),
        },
      } as never);
    }) as typeof supabase.functions.invoke;

    supabase.functions.invoke = invokeWithExecutivePrompt;

    return () => {
      supabase.functions.invoke = baseInvoke;
    };
  }, [executiveBriefingPrompt, gateReason, policyGate, policyView, scenarioPayload]);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current !== null) {
        window.clearTimeout(demoTimerRef.current);
      }
      demoRunNonceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!demoModeEnabled && demoRunning) {
      demoRunNonceRef.current += 1;
      if (demoTimerRef.current !== null) {
        window.clearTimeout(demoTimerRef.current);
      }
      setDemoRunning(false);
      setDemoStepIndex(-1);
      setDemoScenarioOverride(null);
    }
  }, [demoModeEnabled, demoRunning]);

  const refreshAIBriefing = useCallback(async (overridePayload?: Scenario | null) => {
    try {
      await supabase.functions.invoke('nemotron', {
        body: {
          prompt: executiveBriefingPrompt,
          context: JSON.stringify({
            scenario: overridePayload ?? getScenarioPayload(),
            policyGate,
            gateReason,
            policyView,
            policyContext: buildPolicyContext(policyView),
          }),
        },
      });
      setDemoBriefingTick((tick) => tick + 1);
      logDemo('AI briefing refresh requested.');
    } catch {
      logDemo('AI briefing refresh failed; retained last good briefing.');
    }
  }, [executiveBriefingPrompt, gateReason, getScenarioPayload, logDemo, policyGate, policyView]);

  const runDemoStep = useCallback(async (index: number) => {
    if (!demoModeEnabled || index >= demoSteps.length) {
      if (index >= demoSteps.length) {
        setDemoRunning(false);
        setDemoStepIndex(-1);
        setDemoLastRunAt(new Date().toISOString());
      }
      return;
    }

    const runNonce = demoRunNonceRef.current;
    const step = demoSteps[index];
    const baseScenario = getScenarioPayload();
    if (!baseScenario) {
      logDemo('Demo stopped: no scenario loaded.');
      setDemoRunning(false);
      setDemoStepIndex(-1);
      return;
    }

    setDemoStepIndex(index);
    const updatedScenario = applyDemoPatch(baseScenario, step.patch);
    setDemoScenarioOverride(updatedScenario);
    logDemo(step.label);

    if (step.after === 'policy') {
      try {
        await runPolicyCheck(updatedScenario);
      } catch {
        logDemo('Policy run failed; retained last good policy result.');
      }
      await refreshAIBriefing(updatedScenario);
    }

    if (step.after === 'briefing') {
      await refreshAIBriefing(updatedScenario);
    }

    if (prefersReducedMotion) {
      return;
    }

    await new Promise<void>((resolve) => {
      demoTimerRef.current = window.setTimeout(() => {
        demoTimerRef.current = null;
        resolve();
      }, step.waitMs);
    });

    if (demoRunNonceRef.current !== runNonce) return;

    if (index + 1 >= demoSteps.length) {
      setDemoRunning(false);
      setDemoStepIndex(-1);
      setDemoLastRunAt(new Date().toISOString());
      logDemo('Demo playback complete.');
      return;
    }

    void runDemoStep(index + 1);
  }, [applyDemoPatch, demoModeEnabled, demoSteps, getScenarioPayload, logDemo, prefersReducedMotion, refreshAIBriefing, runPolicyCheck]);

  const handleRunDemo = useCallback(() => {
    if (demoRunning || !demoModeEnabled) return;
    const seedScenario = getScenarioPayload();
    if (!seedScenario) {
      logDemo('Demo unavailable until a scenario is loaded.');
      return;
    }

    demoRunNonceRef.current += 1;
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current);
    }

    setDemoLog([]);
    setDemoScenarioOverride(seedScenario);
    setDemoRunning(true);
    setDemoStepIndex(-1);
    setDemoLastRunAt(null);

    if (!prefersReducedMotion) {
      void runDemoStep(0);
    } else {
      logDemo('Reduced motion enabled: step through playback manually.');
    }
  }, [demoModeEnabled, demoRunning, getScenarioPayload, logDemo, prefersReducedMotion, runDemoStep]);

  const handleNextDemoStep = useCallback(() => {
    if (!demoModeEnabled || !demoRunning || !prefersReducedMotion) return;
    const nextIndex = demoStepIndex + 1;
    if (nextIndex >= demoSteps.length) {
      setDemoRunning(false);
      setDemoStepIndex(-1);
      setDemoLastRunAt(new Date().toISOString());
      logDemo('Demo playback complete.');
      return;
    }

    void runDemoStep(nextIndex);
  }, [demoModeEnabled, demoRunning, demoStepIndex, demoSteps.length, logDemo, prefersReducedMotion, runDemoStep]);

  const riskDrivers = useMemo(() => {
    const hazardExposureLabel = getExtremeHazard(selectedHazardKey).exposureLabel;
    const relevantOutageTypes = HAZARD_OUTAGE_TYPE_MAP[selectedHazardKey];

    // Filter to scenarios relevant to the currently selected extreme hazard.
    // Scenarios with no outage_type are included so they don't silently disappear
    // from the index when operators haven't yet classified an event.
    const hazardActiveScenarios = activeScenarios.filter(
      (s) => !s.outage_type || relevantOutageTypes.includes(s.outage_type),
    );
    const hazardHighPriorityScenarios = highPriorityScenarios.filter(
      (s) => !s.outage_type || relevantOutageTypes.includes(s.outage_type),
    );
    const hazardPreEventScenarios = preEventScenarios.filter(
      (s) => !s.outage_type || relevantOutageTypes.includes(s.outage_type),
    );

    const weatherSeverity = Math.min(30, hazardPreEventScenarios.length * 6 + hazardActiveScenarios.length * 3);
    const activeHazards = Math.min(25, hazardActiveScenarios.length * 5 + hazardHighPriorityScenarios.length * 4);
    const criticalLoadExposure = Math.min(25, hazardActiveScenarios.filter((s) => s.has_critical_load).length * 8);
    const crewReadiness = Math.min(20, Math.max(0, 20 - postEventScenarios.length * 2));

    let index = Math.min(100, weatherSeverity + activeHazards + criticalLoadExposure + crewReadiness);

    // Apply severity override: clamp the raw index into the appropriate band so
    // the operator's explicit severity selection is always reflected in the index.
    if (severityOverride === 'Severe')   index = Math.min(100, Math.max(index, 75));
    else if (severityOverride === 'Moderate') index = Math.min(74, Math.max(index, 30));
    else if (severityOverride === 'Low') index = Math.min(29, index);

    return {
      index,
      severity: deriveRiskSeverity(index),
      chips: [
        { key: 'Weather severity',      value: weatherSeverity },
        { key: hazardExposureLabel,     value: activeHazards },
        { key: 'Critical load exposure', value: criticalLoadExposure },
        { key: 'Crew readiness',        value: crewReadiness },
      ],
    };
  }, [activeScenarios, highPriorityScenarios, postEventScenarios.length, preEventScenarios, selectedHazardKey, severityOverride]);

  const topFeeders = useMemo(() => {
    const feeders = new Map<string, { feederId: string; name: string; customers: number; critical: number; etr: Date[]; riskScore: number }>();
    activeScenarios.forEach((scenario) => {
      const feederId = scenario.feeder_id || scenario.fault_id || scenario.id.slice(0, 8);
      const name = scenario.location_name || scenario.service_area || scenario.name;
      const existing = feeders.get(feederId) ?? { feederId, name, customers: 0, critical: 0, etr: [], riskScore: 0 };
      existing.customers += scenario.customers_impacted ?? 0;
      existing.critical += scenario.has_critical_load ? 1 : 0;
      if (scenario.etr_expected) {
        const etrDate = new Date(scenario.etr_expected);
        if (!Number.isNaN(etrDate.getTime())) existing.etr.push(etrDate);
      }
      existing.riskScore += (scenario.priority === 'high' ? 25 : 10) + (scenario.has_critical_load ? 20 : 0) + Math.min(20, (scenario.customers_impacted ?? 0) / 50);
      feeders.set(feederId, existing);
    });

    return Array.from(feeders.values())
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((feeder) => {
        const confidence = feeder.etr.length > 2 ? 'High' : feeder.etr.length > 0 ? 'Med' : 'Low';
        const etr = feeder.etr.length > 0 ? new Date(Math.max(...feeder.etr.map((value) => value.getTime()))) : null;
        const risk = feeder.riskScore > 70 ? 'Severe' : feeder.riskScore > 45 ? 'Elevated' : feeder.riskScore > 25 ? 'Moderate' : 'Low';
        return { ...feeder, confidence, etr, risk };
      });
  }, [activeScenarios]);

  const pBand = useMemo(() => buildEtrPercentiles(topFeeders.flatMap((feeder) => activeScenarios.filter((scenario) => (scenario.feeder_id || scenario.fault_id || scenario.id.slice(0, 8)) === feeder.feederId))), [activeScenarios, topFeeders]);

  const kpiCards = [
    { key: 'Total Events', value: stats.total, icon: FileText, breakdown: undefined, scenarios, filterKey: null, emphasis: 'low' as const },
    { key: 'Pre-Event', value: stats.preEvent, icon: Clock, breakdown: getOutageBreakdown(preEventScenarios), scenarios: preEventScenarios, filterKey: 'Pre-Event' as KpiFilterKey, emphasis: 'medium' as const },
    { key: 'Active Events', value: stats.active, icon: Activity, breakdown: getOutageBreakdown(activeScenarios), scenarios: activeScenarios, filterKey: 'Active Events' as KpiFilterKey, emphasis: 'high' as const },
    { key: 'High Priority', value: stats.highPriority, icon: AlertTriangle, breakdown: getOutageBreakdown(highPriorityScenarios), scenarios: highPriorityScenarios, filterKey: 'High Priority' as KpiFilterKey, emphasis: 'critical' as const },
    { key: 'Post-Event', value: stats.postEvent, icon: CheckCircle, breakdown: getOutageBreakdown(postEventScenarios), scenarios: postEventScenarios, filterKey: 'Post-Event' as KpiFilterKey, emphasis: 'low' as const },
  ];

  const compactMetrics = [
    { label: 'Active Events', value: stats.active.toString() },
    { label: 'High Priority', value: stats.highPriority.toString() },
    { label: 'Critical Load', value: activeScenarios.filter((s) => s.has_critical_load).length.toString() },
    { label: 'Tracked Total', value: stats.total.toString() },
  ];

  const toggleFilter = (filter: KpiFilterKey) => {
    setActiveFilters((current) => (current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]));
  };

  const handleKpiAction = (filterKey: KpiFilterKey | null) => {
    if (filterKey) {
      toggleFilter(filterKey);
      return;
    }
    navigate('/events');
  };

  // Framer-motion count-up for System Risk Index — re-triggers on hazard or severity override change.
  const riskMotionValue = useMotionValue(riskDrivers.index);
  const [displayRiskIndex, setDisplayRiskIndex] = useState(riskDrivers.index);

  useEffect(() => {
    // Subscribe first so we capture every value the animation emits
    const unsubscribe = riskMotionValue.on('change', (v) => setDisplayRiskIndex(Math.round(v)));
    const controls = animate(riskMotionValue, riskDrivers.index, {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: [0.16, 1, 0.3, 1], // expo-out
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskDrivers.index]);

  // ── Severity badge pulse animation — fires whenever the tier crosses a boundary ──
  const prevSeverityRef = useRef<string>(riskDrivers.severity);
  const [badgeTierKey, setBadgeTierKey] = useState(0);

  useEffect(() => {
    if (prevSeverityRef.current !== riskDrivers.severity) {
      prevSeverityRef.current = riskDrivers.severity;
      setBadgeTierKey((k) => k + 1);
    }
  }, [riskDrivers.severity]);

  return (
    <motion.div
      layout
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      animate={prefersReducedMotion ? { opacity: 1, y: 0 } : boardroomMode ? { opacity: 1, y: 0 } : { opacity: 0.98, y: 2 }}
      className={cn('mx-auto max-w-[1600px]', boardroomMode ? 'px-6 py-7 lg:px-7' : 'px-4 py-5 lg:px-5')}
    >
      {/* pb-20 reserves space so the fixed phase strip never covers content */}
      <div className="space-y-6 lg:space-y-7 pb-20">

      <header>
        <div className={cn('flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card shadow-sm', boardroomMode ? 'px-5 py-4' : 'px-4 py-3')}>
          <div>
            <p className="text-[11px] text-muted-foreground/70">Home &gt; Dashboard &gt; {getExtremeHazard(selectedHazardKey).label}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={cn('font-semibold tracking-tight text-foreground', boardroomMode ? 'text-2xl' : 'text-xl')}>Operator Copilot — Grid Resilience Command Center</h1>
              {/* ── Policy Status Badge ──────────────────────────────── */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-all duration-300 cursor-default',
                      !policyView
                        ? 'border-border/50 bg-muted/40 text-muted-foreground'
                        : policyGate === 'BLOCK'
                          ? 'border-red-400/35 bg-red-500/20 text-red-200 shadow-[0_0_12px_rgba(248,113,113,0.20)]'
                          : policyGate === 'WARN'
                            ? 'border-amber-400/30 bg-amber-500/15 text-amber-200'
                            : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
                    )}
                    aria-label={`Policy gate: ${!policyView ? 'UNKNOWN' : policyGate}`}
                  >
                    {!policyView && <ShieldCheck className="h-2.5 w-2.5 opacity-40" />}
                    {policyView && policyGate === 'BLOCK' && <ShieldX className="h-2.5 w-2.5" />}
                    {policyView && policyGate === 'WARN' && <ShieldAlert className="h-2.5 w-2.5" />}
                    {policyView && policyGate === 'PASS' && <ShieldCheck className="h-2.5 w-2.5" />}
                    {!policyView
                      ? 'POLICY UNKNOWN'
                      : policyGate === 'BLOCK'
                        ? 'POLICY BLOCKED'
                        : policyGate === 'WARN'
                          ? 'POLICY WARN'
                          : 'POLICY CLEAR'}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px] p-2.5">
                  <p className="text-[10px] font-semibold mb-1">
                    {!policyView ? 'No policy evaluation run yet.' : `Gate: ${policyGate}`}
                  </p>
                  {policyView && gateReason && (
                    <p className="text-[10px] text-muted-foreground mb-1">Why: {gateReason}</p>
                  )}
                  {policyView && operationalBlockedActions.length > 0 && (
                    <div className="text-[9px] text-muted-foreground space-y-0.5">
                      {operationalBlockedActions.slice(0, 3).map((ba, i) => (
                        <p key={i} className="flex items-start gap-1">
                          <span className="text-red-400 shrink-0">✗</span>
                          <span>{typeof ba === 'object' && ba?.action ? ba.action : String(ba)}{typeof ba === 'object' && ba?.reason ? ` — ${ba.reason}` : ''}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {!policyView && (
                    <p className="text-[9px] text-muted-foreground">Run Copilot to evaluate policy status.</p>
                  )}
                </TooltipContent>
              </Tooltip>
              {/* ── Briefing Updated pulse ───────────────────────────── */}
              {/* 1.2 s fade-in/out; suppressed if reduced-motion is preferred */}
              {briefingPulse && (
                <span
                  key={`pulse-${demoStepIndex}-${lastEvaluatedAt}`}
                  style={prefersReducedMotion ? undefined : { animation: 'briefing-pulse-fade 1.2s ease-in-out forwards' }}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  aria-live="polite"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Briefing Updated
                </span>
              )}
            </div>
            <p className={cn('mt-1 text-muted-foreground', boardroomMode ? 'text-sm' : 'text-xs')}>Scenario: <span className="font-medium text-foreground">{getExtremeHazard(selectedHazardKey).label} Event</span> • Hazard: <span className="font-medium text-foreground">{getExtremeHazard(selectedHazardKey).label}</span></p>
            <p className={cn('mt-1 text-muted-foreground', boardroomMode ? 'text-sm' : 'text-xs')}><span className="font-medium text-foreground">{summary}</span> · {stats.total} total tracked</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{activeScenarios.length > 0 ? 'Active Event' : 'Demo'}</Badge>
            <Badge variant="outline" className="text-[10px]">{boardroomMode ? 'Boardroom Mode On' : 'Boardroom Mode Off'}</Badge>
            <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(dataUpdatedAt)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh data"><RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Active Extreme Event Surface ───────────────────────────────────────
           Enterprise event classification bar. Shows the active extreme event
           with severity badge and a horizontal pill selector for all 5 hazard types.
           Styled subtly — enterprise monochrome, not weather-widget.
      ────────────────────────────────────────────────────────────────────────── */}
      {(() => {
        const activeHazard = getExtremeHazard(selectedHazardKey);
        const HazardIcon = activeHazard.icon;

        // Severity label: override takes precedence over hazard default
        const activeSeverityLabel: SeverityOverride = severityOverride ?? (activeHazard.severityLabel as SeverityOverride);

        const getSeverityBadgeClass = (s: SeverityOverride) =>
          s === 'Severe'
            ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50'
            : s === 'Moderate'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

        const SEVERITY_OPTIONS: SeverityOverride[] = ['Low', 'Moderate', 'Severe'];

        return (
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            {/* Top row: active event label + severity badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Active Extreme Event
                </span>
                <span className="text-muted-foreground/40 text-[11px]">›</span>
                <HazardIcon className="h-3.5 w-3.5 text-foreground/70" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-foreground">{activeHazard.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-colors duration-150',
                    getSeverityBadgeClass(activeSeverityLabel),
                  )}
                >
                  {activeSeverityLabel}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 italic">{activeHazard.contextLine}</p>
            </div>

            {/* Hazard pill selector — premium enterprise tabs */}
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label="Select active extreme event type"
            >
              {EXTREME_HAZARDS.map((hazard) => {
                const PillIcon = hazard.icon;
                const isSelected = hazard.key === selectedHazardKey;
                return (
                  <button
                    key={hazard.key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleHazardChange(hazard.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-150',
                      DASHBOARD_INTERACTIVE_BUTTON_CLASS,
                      isSelected
                        ? 'border-primary/60 bg-gradient-to-r from-primary/15 to-primary/8 text-primary font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                  >
                    {/* Active dot */}
                    {isSelected && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <PillIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold">{hazard.shortLabel}</span>
                    {/* Risk hint — shown only on selected pill */}
                    {isSelected && (
                      <span className="hidden max-w-[240px] truncate text-[10px] font-normal text-primary/70 sm:block">
                        {hazard.riskHint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Severity override row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/30 pt-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                Severity Override
              </span>
              <div className="flex gap-1.5" role="group" aria-label="Override hazard severity">
                {SEVERITY_OPTIONS.map((level) => {
                  const isActive = activeSeverityLabel === level;
                  const isExplicitOverride = severityOverride === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        // Clicking the active override again resets to hazard default
                        setSeverityOverride(isExplicitOverride ? null : level)
                      }
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors duration-150',
                        DASHBOARD_INTERACTIVE_BUTTON_CLASS,
                        isActive
                          ? getSeverityBadgeClass(level)
                          : 'border-border/40 bg-transparent text-muted-foreground hover:border-border/70 hover:text-foreground',
                      )}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              {severityOverride && (
                <span className="text-[10px] text-muted-foreground/60 italic">
                  overrides default · click active pill to reset
                </span>
              )}
            </div>

            {/* ── Contextual risk bullets (hazard × severity) — boardroom-safe tokens ── */}
            {(() => {
              const bullets = (activeHazard.riskBullets ?? {})[activeSeverityLabel] ?? [];
              if (bullets.length === 0) return null;
              // Boardroom-safe: never rely on raw red text alone — always bg + border + text-red-200
              const rowClass =
                activeSeverityLabel === 'Severe'
                  ? 'border border-red-400/30 bg-red-500/10 rounded-md px-2.5 py-1.5'
                  : activeSeverityLabel === 'Moderate'
                    ? 'border border-amber-400/25 bg-amber-500/10 rounded-md px-2.5 py-1.5'
                    : 'border border-emerald-400/20 bg-emerald-500/8 rounded-md px-2.5 py-1.5';
              const bulletColor =
                activeSeverityLabel === 'Severe'
                  ? 'text-red-200'
                  : activeSeverityLabel === 'Moderate'
                    ? 'text-amber-200'
                    : 'text-emerald-300';
              const dotColor =
                activeSeverityLabel === 'Severe'
                  ? 'bg-red-400'
                  : activeSeverityLabel === 'Moderate'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400';
              return (
                <div className="mt-2.5 border-t border-border/30 pt-2.5">
                  <div className={rowClass}>
                    <ul className="space-y-1">
                      {bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', dotColor)} />
                          <span className={cn('text-[11px] font-semibold leading-snug', bulletColor)}>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      <section className={cn('mb-4 rounded-xl border border-primary/25 bg-card/95 px-4 py-3 shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
             <h2 className="text-sm font-semibold">Scenario Playback</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Active hazard context: <span className="font-medium text-foreground">{getExtremeHazard(selectedHazardKey).demoContext}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Demo mode uses local playback; policy + AI calls remain real.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Now Playing: {demoRunning && demoStepIndex >= 0 ? demoSteps[demoStepIndex]?.label : 'Idle'} ({demoRunning && demoStepIndex >= 0 ? demoStepIndex + 1 : 0}/{demoSteps.length})
            </p>
            {demoLastRunAt && <p className="text-[11px] text-muted-foreground">Last run: {demoLastRunAt.slice(5, 16).replace('T', ' ')}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={demoModeEnabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setDemoModeEnabled(enabled);
                  if (!enabled) {
                    setDemoScenarioOverride(null);
                  }
                }}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Demo Mode
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDemo}
              disabled={!demoModeEnabled || demoRunning || !scenarioPayload}
              className={cn('h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
            >
              {demoRunning ? 'Running…' : 'Run Demo'}
            </Button>
            {prefersReducedMotion && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextDemoStep}
                disabled={!demoModeEnabled || !demoRunning}
                className={cn('h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
              >
                Next Step
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Playback Log</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {demoLog.slice(-5).map((entry, index) => (
              <li key={`${entry.ts}-${index}`} className="font-mono">{entry.ts.slice(11, 19)} · {entry.msg}</li>
            ))}
            {demoLog.length === 0 && <li className="text-muted-foreground">No demo activity yet.</li>}
          </ul>
        </div>
      </section>

      <section className={cn('rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Gauge className="h-3.5 w-3.5" />System Risk Index</p>
            <div className="mt-1 flex items-baseline gap-2">
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-3xl font-semibold tabular-nums underline decoration-dashed decoration-muted-foreground/40 underline-offset-4">
                      {displayRiskIndex}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="w-64 p-3 text-xs">
                    <p className="mb-2 font-semibold text-foreground">How this score is calculated</p>
                    <p className="mb-2 text-muted-foreground leading-snug">
                      Each driver is filtered to events matching the selected hazard type. The severity override clamps the final index into the corresponding band.
                    </p>
                    <ul className="space-y-1.5">
                      {riskDrivers.chips.map((chip, i) => {
                        const pct = Math.round((chip.value / 30) * 100);
                        return (
                          <li key={chip.key} className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">{chip.key}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
                                <motion.div
                                  className={cn(
                                    'h-full rounded-full',
                                    chip.key === 'Crew readiness' ? 'bg-emerald-500' : 'bg-primary',
                                  )}
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${pct}%` }}
                                  transition={
                                    prefersReducedMotion
                                      ? { duration: 0 }
                                      : { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }
                                  }
                                />
                              </div>
                              <TooltipChipValue value={chip.value} delay={i * 0.07} reduced={!!prefersReducedMotion} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-2.5 border-t border-border/40 pt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold tabular-nums text-foreground">{displayRiskIndex} / 100</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <motion.span
                key={badgeTierKey}
                initial={prefersReducedMotion ? false : { scale: 1.35, filter: 'brightness(1.8)' }}
                animate={{ scale: 1, filter: 'brightness(1)' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                  getRiskBadgeClass(riskDrivers.severity),
                )}
              >
                {riskDrivers.severity}
              </motion.span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {riskDrivers.chips.map((chip) => (
              <button
                key={chip.key}
                className={cn('rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
                onClick={() => {
                  setSelectedSection('drivers');
                  setSupportingOpen(true);
                }}
              >
                {chip.key}: {chip.value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!boardroomMode && <ImmediateAttentionStrip scenarios={highPriorityScenarios} onViewAll={() => navigate('/events?lifecycle=Event&priority=high')} onEventClick={(id) => navigate(`/event/${id}`)} />}

      {/* ── Executive Focus Frame: AI Briefing ───────────────────────────────
           Boardroom mode wraps the AI Briefing section in a subtle elevated
           glow container. Standard mode renders it flush as before.
      ────────────────────────────────────────────────────────────────────── */}
      <div className={cn(
        boardroomMode && (
          'rounded-xl border border-primary/20 p-1 shadow-[0_0_0_1px_hsl(var(--primary)/0.06),0_8px_32px_-8px_hsl(var(--primary)/0.10)]'
        ),
        boardroomMode && !prefersReducedMotion && 'transition-shadow duration-500',
      )}>
        {isAIBriefingAllowed ? (
          <AIExecutiveBriefingPanel
            key={`ai-briefing-${demoBriefingTick}`}
            scenarios={scenarios}
            dataUpdatedAt={dataUpdatedAt}
            boardroomMode={boardroomMode}
            onOpenSupportingSignals={() => setSupportingOpen(true)}
            onBriefingStateChange={({ briefing, isLoading, error }) => setBriefingState({ briefing, isLoading, error })}
          />
        ) : (
          <section className={cn('mb-4 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-4 shadow-[0_0_12px_rgba(248,113,113,0.12)]', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
            {/* Title row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldX className="h-4 w-4 text-red-300" />
                <p className="text-sm font-semibold text-red-200">AI Briefing Locked by Policy</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-red-400/35 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-200 shadow-[0_0_8px_rgba(248,113,113,0.18)]">
                <ShieldX className="h-2.5 w-2.5" />BLOCKED
              </span>
            </div>
            {/* Reason line — structured: flag · ETR confidence */}
            {(() => {
              const flags = policyEscalationFlags.map((f) => humanizePolicyFlag(f));
              const flagPart = flags.length > 0 ? flags.join(' · ') : 'Policy constraints active';
              const rawConf = policyView?.etrBand?.confidence;
              const confStr = rawConf != null ? formatConfidenceFull(rawConf) : '';
              const etrPart = confStr ? `· ETR confidence ${confStr}${policyView?.etrBand?.band ? ` (${policyView.etrBand.band})` : ''}` : '';
              return (
                <p className="mt-2 text-[12px] font-semibold text-red-200">{flagPart} {etrPart}</p>
              );
            })()}
            <p className="mt-1 text-[11px] text-muted-foreground/80">The policy engine has determined that current operational conditions prevent AI briefing generation. Resolve the flagged constraints below, then re-run the policy check.</p>
            {/* CTA */}
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className={cn('h-8 border-red-400/30 bg-red-500/10 text-xs text-red-200 hover:bg-red-500/20', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
                onClick={() => void runPolicyCheck()}
                disabled={policyStatus === 'evaluating' || !scenarioPayload}
              >
                {policyStatus === 'evaluating' ? 'Evaluating…' : 'Run Policy Check'}
              </Button>
              <span className="text-[10px] text-muted-foreground/60">Resolve flagged drivers · Re-evaluate · Briefing will unlock</span>
            </div>
          </section>
        )}
      </div>

      <section className={cn('rounded-xl border bg-card shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS,
        policyGate === 'BLOCK' && policyView
          ? 'border-red-400/35 shadow-[0_0_16px_rgba(248,113,113,0.10)]'
          : policyGate === 'WARN' && policyView
            ? 'border-amber-400/30'
            : 'border-border/60',
      )}>
        {/* ── Executive Policy Bar — always visible, 4-item row ─────────── */}
        <div className={cn(
          'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-t-xl border-b px-4 py-2.5',
          policyGate === 'BLOCK' && policyView
            ? 'border-red-400/20 bg-red-500/8'
            : policyGate === 'WARN' && policyView
              ? 'border-amber-400/20 bg-amber-500/8'
              : 'border-border/40 bg-muted/20',
        )}>
          {/* Item 1: Gate badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Policy Gate</span>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
              !policyView
                ? 'border-border/50 bg-muted/40 text-muted-foreground'
                : policyGate === 'BLOCK'
                  ? 'border-red-400/35 bg-red-500/20 text-red-200 shadow-[0_0_8px_rgba(248,113,113,0.20)]'
                  : policyGate === 'WARN'
                    ? 'border-amber-400/30 bg-amber-500/15 text-amber-200'
                    : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
            )}>
              {policyGate === 'BLOCK' && policyView && <ShieldX className="h-2.5 w-2.5" />}
              {policyGate === 'WARN' && policyView && <ShieldAlert className="h-2.5 w-2.5" />}
              {(policyGate === 'PASS' || !policyView) && <ShieldCheck className="h-2.5 w-2.5" />}
              {!policyView ? 'UNKNOWN' : policyGate}
            </span>
          </div>
          {/* Item 2: Reason */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Reason</span>
            <span className="truncate text-[11px] font-medium text-foreground/80">{gateReason}</span>
          </div>
          {/* Item 3 + 4: Latency + Timestamp */}
          <div className="flex items-center gap-x-4 gap-y-1 shrink-0 text-[11px] text-muted-foreground">
            <span>Latency: <span className="font-semibold text-foreground">{policyLatencyMs !== null ? `${policyLatencyMs} ms` : '—'}</span></span>
            <span>Evaluated: <span className="font-semibold text-foreground">{compactEvaluationTimestamp}</span></span>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={autoRunEnabled}
                onChange={(event) => setAutoRunEnabled(event.target.checked)}
                className="h-3 w-3 rounded border-border"
              />
              Auto-run
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void runPolicyCheck()}
              disabled={policyStatus === 'evaluating' || !scenarioPayload}
              className={cn('h-7 text-[11px]', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
            >
              {policyStatus === 'evaluating' ? 'Evaluating…' : 'Run Policy Check'}
            </Button>
          </div>
        </div>

        <div className="px-4 py-3">
          {policyStatus === 'error' && (
            <div className="mb-3 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              {lastGoodPolicyResult ? 'Policy service degraded — showing last good evaluation.' : (policyError ?? 'Policy service unavailable — no prior evaluation available.')}
            </div>
          )}

          {!policyView && (
            <p className="text-[12px] text-muted-foreground">No evaluation run yet. Enable Auto-run or click <span className="font-semibold text-foreground">Run Policy Check</span>.</p>
          )}

          {policyView && (
            <div className="space-y-3 text-sm">
              {/* Executive Policy Summary card */}
              <div className={cn(
                'rounded-lg border px-3 py-2.5',
                policyGate === 'BLOCK'
                  ? 'border-red-400/25 bg-red-500/8'
                  : policyGate === 'WARN'
                    ? 'border-amber-400/20 bg-amber-500/8'
                    : 'border-emerald-400/20 bg-emerald-500/8',
              )}>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3 w-3" />Executive Policy Summary
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/90">{policySummary ?? summarizePolicy(policyView)}</p>
              </div>

              {/* Escalation Flags */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Escalation Flags</p>
                {(policyView.escalationFlags?.length ?? 0) > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {policyView.escalationFlags?.map((flag: EscalationFlag, index: number) => {
                      const label = normalizeFlag(flag, index);
                      const isCritical = label.includes('critical_load_at_risk') || label.includes('critical_backup_window_short');
                      return (
                        <span key={`flag-${index}`} className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          isCritical
                            ? 'border-red-400/35 bg-red-500/15 text-red-200'
                            : 'border-amber-400/25 bg-amber-500/10 text-amber-200',
                        )}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">No escalation flags detected.</p>
                )}
              </div>

              {/* Allowed / Blocked actions: two-column */}
              <div className="grid gap-3 md:grid-cols-2">
                {/* Allowed */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Allowed Actions</p>
                  {(policyView.allowedActions?.length ?? 0) > 0 ? (
                    <div className="mt-1.5 space-y-1.5">
                      {policyView.allowedActions?.map((item: PolicyAction, index: number) => (
                        <div key={`allowed-${index}`} className="rounded-md border border-emerald-400/25 bg-emerald-500/8 p-2">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                            <CheckCircle className="h-3 w-3 shrink-0" />{toTitleCase(item?.action)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/80">{item?.reason ?? 'No reason returned.'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">No allowed actions returned.</p>
                  )}
                </div>
                {/* Blocked */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Blocked Actions</p>
                  {(policyView.blockedActions?.length ?? 0) > 0 ? (
                    <div className="mt-1.5 space-y-1.5">
                      {policyView.blockedActions?.map((item: PolicyAction, index: number) => (
                        <div key={`blocked-${index}`} className="rounded-md border border-muted-foreground/25 bg-muted/30 p-2">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                            <Ban className="h-3 w-3 shrink-0" />{toTitleCase(item?.action)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/80">{item?.reason ?? 'No reason returned.'}</p>
                          {item?.remediation && (
                            <p className="mt-0.5 text-[10px] text-amber-300/80">Remediation: {item.remediation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">No blocked actions returned.</p>
                  )}
                </div>
              </div>

              {/* ETR Band */}
              {policyView.etrBand && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ETR Band</span>
                  <span className="inline-flex items-center rounded-full border border-sky-400/25 bg-sky-500/12 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                    {policyView.etrBand?.band ?? 'Unknown'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{formatConfidenceFull(policyView.etrBand?.confidence)} confidence</span>
                </div>
              )}

              {/* Audit Stamp */}
              <p className="border-t border-border/30 pt-2 text-[10px] font-mono text-muted-foreground/50">
                Audit Stamp: Policy v1.0 · Engine hash fnv1a_{(policyLatencyMs ?? 0).toString(16).padStart(8, '0')} · Evaluated {lastEvaluatedAt ? new Date(lastEvaluatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </p>
            </div>
          )}
        </div>
      </section>

      {topFeeders.length > 0 && (
        <section className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <h2 className="text-sm font-semibold">Top Impacted Feeders / Circuits</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/60 text-left">
                  <th className="pb-2">Feeder / Circuit</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Customers</th>
                  <th className="pb-2">Critical Loads</th>
                  <th className="pb-2">ETR + Confidence</th>
                </tr>
              </thead>
              <tbody>
                {topFeeders.map((feeder) => (
                  <tr
                    key={feeder.feederId}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/30"
                    onClick={() => {
                      setSelectedFeeder(feeder.feederId);
                      setSelectedSection('assets');
                      setSupportingOpen(true);
                    }}
                  >
                    <td className="py-2.5 font-medium">{feeder.name} ({feeder.feederId})</td>
                    <td className="py-2.5"><Badge variant="outline" className={cn('text-[10px]', getRiskBadgeClass(feeder.risk))}>{feeder.risk}</Badge></td>
                    <td className="py-2.5 tabular-nums">{feeder.customers.toLocaleString()}</td>
                    <td className="py-2.5 tabular-nums">{feeder.critical}</td>
                    <td className="py-2.5">{feeder.etr ? formatDashboardTime(feeder.etr) : 'Pending'} · {feeder.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Operational Phase Strip ────────────────────────────────────────────
           Premium industrial phase track — TCS logo-style typography.
           Each phase block uses a strong, distinct background color identity.
           Clickable to reveal a rich detail popover with phase metadata.
           Policy-aware: Policy Check + downstream phases reflect gate state.
      ────────────────────────────────────────────────────────────────────────── */}
      {(() => {
        // PhaseId type and openPhaseId state are declared at component top-level

        interface PhaseDefinition {
          id: PhaseId;
          label: string;
          step: number;
          /** Full label used inside popovers */
          fullLabel: string;
          tooltip: string;
          detail: string;
          /** Rich background color for the pill block — strong, not subtle */
          blockBg: string;
          /** Border color */
          blockBorder: string;
          /** Text color on the block */
          blockText: string;
          /** Dot / indicator color */
          dotColor: string;
          /** Active glow / ring color for the pulse ring */
          glowRgb: string;
          /** Icon char or symbol used as the phase type-mark */
          typeMark: string;
        }

        const PHASES: PhaseDefinition[] = [
          {
            id: 'detection',
            label: 'Detection',
            fullLabel: 'Detection',
            step: 0,
            tooltip: 'Sensor and GIS data ingestion; initial outage boundary established.',
            detail: 'Real-time sensor fusion and GIS correlation identifies fault location, outage boundary, and affected feeders. SCADA telemetry confirms de-energisation extent and confirms initial customer impact count.',
            blockBg:     'bg-sky-600/18 dark:bg-sky-500/22',
            blockBorder: 'border-sky-500/50 dark:border-sky-400/55',
            blockText:   'text-sky-800 dark:text-sky-200',
            dotColor:    'bg-sky-500',
            glowRgb:     '56,189,248',
            typeMark:    '◉',
          },
          {
            id: 'risk-scoring',
            label: 'Risk Scoring',
            fullLabel: 'Risk Scoring',
            step: 1,
            tooltip: 'Asset age, vegetation exposure, and load criticality scored by rule engine.',
            detail: 'Rule-based scoring engine evaluates asset age, vegetation contact probability, load criticality, and backup runtime runway. Outputs a composite risk index (0–100) used to prioritise response sequencing.',
            blockBg:     'bg-amber-500/18 dark:bg-amber-400/18',
            blockBorder: 'border-amber-500/55 dark:border-amber-400/55',
            blockText:   'text-amber-800 dark:text-amber-200',
            dotColor:    'bg-amber-400',
            glowRgb:     '251,191,36',
            typeMark:    '◈',
          },
          {
            id: 'policy-check',
            label: 'Policy Check',
            fullLabel: 'Policy Check',
            step: 2,
            tooltip: 'Deterministic policy engine evaluates allowed and blocked actions.',
            detail: 'Deterministic policy engine enforces safety constraints, crew readiness rules, and regulatory compliance. Emits PASS / WARN / BLOCK gate decision with full audit trail for each evaluated action.',
            blockBg:     'bg-orange-500/18 dark:bg-orange-400/18',
            blockBorder: 'border-orange-500/55 dark:border-orange-400/55',
            blockText:   'text-orange-800 dark:text-orange-200',
            dotColor:    'bg-orange-500',
            glowRgb:     '249,115,22',
            typeMark:    '⬡',
          },
          {
            id: 'ai-briefing',
            label: 'AI Briefing',
            fullLabel: 'AI Briefing',
            step: 3,
            tooltip: 'Executive situation briefing generated; reflects current policy gate.',
            detail: 'AI synthesises sensor data, risk scores, and policy output into a concise executive incident briefing. All recommended actions are strictly constrained to policy-allowed operations only.',
            blockBg:     'bg-violet-500/18 dark:bg-violet-400/18',
            blockBorder: 'border-violet-500/55 dark:border-violet-400/55',
            blockText:   'text-violet-800 dark:text-violet-200',
            dotColor:    'bg-violet-500',
            glowRgb:     '167,139,250',
            typeMark:    '✦',
          },
          {
            id: 'dispatch',
            label: 'Dispatch',
            fullLabel: 'Dispatch',
            step: 4,
            tooltip: 'Crew dispatch sequencing initiated; incident command notified.',
            detail: 'Optimal crew routing and dispatch sequencing executed by the system. Incident command and field supervisors are notified. ETR is committed to the customer communication pipeline.',
            blockBg:     'bg-emerald-600/18 dark:bg-emerald-500/22',
            blockBorder: 'border-emerald-500/55 dark:border-emerald-400/55',
            blockText:   'text-emerald-800 dark:text-emerald-200',
            dotColor:    'bg-emerald-500',
            glowRgb:     '52,211,153',
            typeMark:    '▶',
          },
          {
            id: 'recovery',
            label: 'Recovery',
            fullLabel: 'Recovery',
            step: 5,
            tooltip: 'Restoration actions underway; ETR tracking active.',
            detail: 'Restoration switching and physical repair in progress. ETR confidence is tracked in real time. Post-event review and compliance reporting are queued automatically on event resolution.',
            blockBg:     'bg-teal-600/18 dark:bg-teal-500/22',
            blockBorder: 'border-teal-500/55 dark:border-teal-400/55',
            blockText:   'text-teal-800 dark:text-teal-200',
            dotColor:    'bg-teal-500',
            glowRgb:     '20,184,166',
            typeMark:    '◎',
          },
        ];

        // Map the 6 demo steps (0-indexed) → phases (0-indexed), clamped to 5.
        const activePhaseIndex = demoRunning && demoStepIndex >= 0
          ? Math.min(Math.floor((demoStepIndex / Math.max(1, demoSteps.length - 1)) * 5), 5)
          : -1;

        // Policy gate state for per-phase coloring.
        const isGateBlock = policyGate === 'BLOCK';
        const isGateWarn  = policyGate === 'WARN';
        const POLICY_PHASE_IDX = 2;

        return createPortal(
          <div
            ref={phaseStripRef}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-md shadow-elevated overflow-visible"
            role="region"
            aria-label="Operational phase timeline"
          >
            {/* ── Inner constrained container ────────────────────────────── */}
            <div className="mx-auto max-w-[1600px] px-4 lg:px-5">
            {/* ── Header bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/50 leading-none">
                  Operational Phase
                </span>
                <span className="text-[9px] text-muted-foreground/30">·</span>
                <span className="text-[9px] font-medium text-muted-foreground/40 leading-none">
                  Click any phase to view details
                </span>
              </div>
              {demoRunning && demoStepIndex >= 0 && (
                <span className="text-[9px] font-semibold text-muted-foreground/60 tabular-nums bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                  Step {demoStepIndex + 1}&thinsp;/&thinsp;{demoSteps.length}
                  <span className="mx-1 text-muted-foreground/30">·</span>
                  {demoSteps[demoStepIndex]?.label ?? ''}
                </span>
              )}
            </div>

            {/* ── Phase track ────────────────────────────────────────────── */}
            <div className="flex items-stretch px-0 py-2 gap-1">
              {PHASES.map((phase, idx) => {
                const isActive = activePhaseIndex === idx;
                const isDone   = activePhaseIndex > idx;
                const isOpen   = openPhaseId === phase.id;

                const isPolicyPhase      = idx === POLICY_PHASE_IDX;
                const isPostPolicy       = idx > POLICY_PHASE_IDX;
                const policyPhaseBlock   = isPolicyPhase && isGateBlock && (isActive || isDone);
                const policyPhaseWarn    = isPolicyPhase && isGateWarn  && (isActive || isDone);
                const policyPhaseClear   = isPolicyPhase && !isGateBlock && !isGateWarn && isDone;
                const isPostPolicyBlocked = isPostPolicy && isGateBlock && isDone;

                // ── Resolve visual variant ─────────────────────────────────
                type Variant = 'block' | 'warn' | 'muted-block' | 'done' | 'active' | 'neutral';
                const variant: Variant =
                  policyPhaseBlock     ? 'block'
                  : policyPhaseWarn    ? 'warn'
                  : isPostPolicyBlocked ? 'muted-block'
                  : (isDone || policyPhaseClear) ? 'done'
                  : isActive           ? 'active'
                  : 'neutral';

                // ── Resolve pill colors based on variant + phase identity ──
                let pillBg: string, pillBorder: string, pillText: string;

                if (variant === 'block') {
                  pillBg = 'bg-destructive/15'; pillBorder = 'border-destructive/60';
                  pillText = 'text-destructive dark:text-red-300';
                } else if (variant === 'warn') {
                  pillBg = 'bg-amber-500/15'; pillBorder = 'border-amber-500/60';
                  pillText = 'text-amber-700 dark:text-amber-300';
                } else if (variant === 'muted-block') {
                  pillBg = 'bg-muted/30'; pillBorder = 'border-border/30';
                  pillText = 'text-muted-foreground/30';
                } else {
                  // Use the phase's own identity color block for done, active, neutral
                  pillBg = phase.blockBg;
                  pillBorder = phase.blockBorder;
                  pillText = phase.blockText;
                }

                // ── Active state: stronger background tint ─────────────────
                const activeBgExtra = isActive ? 'brightness-[1.18] saturate-[1.3]' : '';

                return (
                  <div key={phase.id} className="flex min-w-0 flex-1 items-center">
                    {/* ── Phase block (clickable) ────────────────────────── */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setOpenPhaseId(isOpen ? null : phase.id)}
                        title={phase.tooltip}
                        aria-expanded={isOpen}
                        aria-label={`${phase.label}: ${phase.tooltip}`}
                        className={cn(
                          'group/phase w-full flex flex-col items-center justify-between',
                          'rounded-lg px-1.5 py-2.5 border transition-all duration-200',
                          'cursor-pointer select-none focus:outline-none',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          'hover:scale-[1.025] hover:shadow-md active:scale-[0.975]',
                          pillBg, pillBorder, activeBgExtra,
                          variant === 'muted-block' && 'opacity-35 pointer-events-none',
                          isOpen && 'ring-2 shadow-lg',
                          isOpen && `ring-[rgb(${phase.glowRgb})/40]`,
                          isActive && !prefersReducedMotion && `shadow-[0_0_10px_rgba(${phase.glowRgb},0.25)]`,
                        )}
                      >
                        {/* ── Top row: step number + typemark ─────────────── */}
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className={cn(
                            'text-[8px] font-black tabular-nums leading-none tracking-wider opacity-55',
                            pillText,
                          )}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={cn(
                            'text-[9px] leading-none opacity-50 transition-opacity group-hover/phase:opacity-80',
                            pillText,
                          )}>
                            {phase.typeMark}
                          </span>
                        </div>

                        {/* ── Phase label — TCS wordmark style ─────────────
                             Bold, all-caps, tight tracking — mirrors TCS logo letterform precision */}
                        <span className={cn(
                          'text-[10px] font-black uppercase tracking-[0.04em] leading-tight text-center',
                          'whitespace-nowrap w-full overflow-hidden text-ellipsis',
                          pillText,
                        )}>
                          {phase.label}
                        </span>

                        {/* ── Status indicator bar ──────────────────────── */}
                        <div className="mt-2 w-full flex items-center justify-center gap-1">
                          {(isDone || policyPhaseClear) && variant !== 'block' ? (
                            <div className={cn(
                              'h-[2px] w-full rounded-full',
                              phase.dotColor, 'opacity-70',
                            )} />
                          ) : isActive ? (
                            <div className={cn(
                              'h-[2px] rounded-full',
                              phase.dotColor,
                              !prefersReducedMotion ? 'w-full animate-pulse' : 'w-full',
                            )} />
                          ) : variant === 'block' ? (
                            <div className="h-[2px] w-full rounded-full bg-destructive opacity-80" />
                          ) : variant === 'warn' ? (
                            <div className="h-[2px] w-full rounded-full bg-amber-500 opacity-60" />
                          ) : (
                            <div className={cn(
                              'h-[2px] w-2/3 rounded-full opacity-20',
                              phase.dotColor,
                            )} />
                          )}
                        </div>

                        {/* ── Completion / status label ─────────────────── */}
                        <div className="mt-1 flex items-center justify-center">
                          {(isDone || policyPhaseClear) && variant !== 'block' ? (
                            <span className={cn('text-[8px] font-bold leading-none', pillText, 'opacity-70')}>DONE</span>
                          ) : isActive ? (
                            <span className={cn('text-[8px] font-bold leading-none', pillText, 'opacity-80')}>ACTIVE</span>
                          ) : variant === 'block' ? (
                            <span className="text-[8px] font-black leading-none text-destructive">BLOCK</span>
                          ) : variant === 'warn' ? (
                            <span className="text-[8px] font-black leading-none text-amber-600 dark:text-amber-300">WARN</span>
                          ) : (
                            <span className={cn('text-[8px] font-medium leading-none opacity-35', pillText)}>—</span>
                          )}
                        </div>
                      </button>

                      {/* ── Detail popover ─────────────────────────────────── */}
                      {isOpen && (
                        <div
                          className={cn(
                            'absolute z-50 bottom-full mb-2.5 left-1/2 -translate-x-1/2',
                            'w-64 rounded-xl border shadow-elevated',
                            'bg-card/98 backdrop-blur-xl',
                            pillBorder,
                          )}
                          role="tooltip"
                        >
                          {/* Popover accent line */}
                          <div className={cn('h-[3px] w-full rounded-t-xl', phase.dotColor, 'opacity-80')} />

                          {/* Popover header */}
                          <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-border/30">
                            {/* Phase identity block */}
                            <div className={cn(
                              'flex-shrink-0 inline-flex items-center justify-center',
                              'w-7 h-7 rounded-lg border text-[11px] font-black',
                              pillBg, pillBorder, pillText,
                            )}>
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-[12px] font-black uppercase tracking-[0.06em] leading-none', pillText)}>
                                {phase.fullLabel}
                              </p>
                              <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-none font-medium">
                                Operational Phase {idx + 1} of {PHASES.length}
                              </p>
                            </div>
                            {/* Close hint */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenPhaseId(null); }}
                              className="ml-auto text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors text-[10px] leading-none"
                              aria-label="Close"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Popover body */}
                          <div className="px-3.5 py-3">
                            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                              {phase.detail}
                            </p>
                          </div>

                          {/* Status chip + policy context if policy phase */}
                          <div className="px-3.5 pb-3.5 flex flex-wrap gap-1.5">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                              pillBg, pillBorder, pillText,
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', phase.dotColor)} />
                              {variant === 'block' ? 'Gate Blocked'
                                : variant === 'warn' ? 'Gate Warning'
                                : isDone || policyPhaseClear ? 'Completed'
                                : isActive ? 'In Progress'
                                : 'Pending'}
                            </span>
                            {isPolicyPhase && policyGate && (
                              <span className={cn(
                                'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border',
                                isGateBlock ? 'bg-red-500/10 border-red-500/40 text-red-700 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50'
                                  : isGateWarn ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
                              )}>
                                Gate: {policyGate}
                              </span>
                            )}
                          </div>

                          {/* Arrow pointer */}
                          <div className={cn(
                            'absolute -bottom-[7px] left-1/2 -translate-x-1/2',
                            'w-3 h-3 rotate-45 border-r border-b bg-card',
                            pillBorder,
                          )} />
                        </div>
                      )}
                    </div>

                    {/* ── Connector arrow (not after last phase) ──────────── */}
                    {idx < PHASES.length - 1 && (
                      <div className="flex items-center shrink-0 px-0.5">
                        <svg width="12" height="10" viewBox="0 0 12 10" className={cn(
                          'transition-all duration-300',
                          variant === 'done' ? 'opacity-65' : 'opacity-20',
                          variant === 'active' && 'opacity-50',
                        )}>
                          <path
                            d="M1 5h8M7 2l3 3-3 3"
                            stroke={
                              variant === 'block' ? 'hsl(var(--destructive))'
                              : variant === 'warn' ? `rgb(${phase.glowRgb})`
                              : (variant === 'done' || variant === 'active') ? `rgb(${phase.glowRgb})`
                              : 'hsl(var(--border))'
                            }
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>{/* end max-width container */}
          </div>,
          document.body
        );
      })()}

      {/* ── Boardroom KPI Compression ─────────────────────────────────────── */}
      {boardroomMode ? (() => {
        const criticalLoadCount = activeScenarios.filter((s) => s.has_critical_load).length;
        const etrBandLabel = policyView?.etrBand?.band ?? '—';
        const etrConfLabel = policyView?.etrBand?.confidence ? formatConfidenceFull(policyView.etrBand.confidence) : '—';
        const activeExtHazard = getExtremeHazard(selectedHazardKey);
        const activeHazardLabel = activeExtHazard.label;
        const policyStatusLabel2 = !policyView ? 'Unknown' : policyGate === 'BLOCK' ? 'Blocked' : policyGate === 'WARN' ? 'Warn' : 'Clear';
        const policyTileBg = !policyView ? 'bg-muted/20' : policyGate === 'BLOCK' ? 'bg-red-500/12 shadow-[0_0_16px_rgba(248,113,113,0.12)]' : policyGate === 'WARN' ? 'bg-amber-500/10' : 'bg-emerald-500/10';
        const boardroomTiles = [
          { id: 'risk', label: 'System Risk Index', value: String(riskDrivers.index), valueColor: '', sub: riskDrivers.severity, subColor: getRiskBadgeClass(riskDrivers.severity), tileColor: 'border-border/50', tileBg: 'bg-card', icon: Gauge },
          { id: 'etr', label: 'ETR Confidence Band', value: etrBandLabel, valueColor: '', sub: etrConfLabel !== '—' ? `${etrConfLabel} confidence` : 'Awaiting evaluation', subColor: 'text-muted-foreground', tileColor: 'border-border/50', tileBg: 'bg-card', icon: Clock },
          { id: 'critical', label: 'Critical Load at Risk', value: String(criticalLoadCount), valueColor: criticalLoadCount > 0 ? 'text-red-200' : 'text-foreground', sub: criticalLoadCount > 0 ? 'Active exposure' : 'No exposure', subColor: criticalLoadCount > 0 ? 'text-red-200/70' : 'text-emerald-300', tileColor: criticalLoadCount > 0 ? 'border-red-400/35' : 'border-border/50', tileBg: criticalLoadCount > 0 ? 'bg-red-500/12 shadow-[0_0_12px_rgba(248,113,113,0.15)]' : 'bg-card', icon: AlertTriangle },
          { id: 'policy', label: 'Policy Status', value: policyStatusLabel2, valueColor: !policyView ? 'text-muted-foreground' : policyGate === 'BLOCK' ? 'text-red-200' : policyGate === 'WARN' ? 'text-amber-200' : 'text-emerald-200', sub: gateReason.length > 52 ? gateReason.slice(0, 52) + '…' : gateReason, subColor: 'text-muted-foreground', tileColor: !policyView ? 'border-border/50' : policyGate === 'BLOCK' ? 'border-red-400/35' : policyGate === 'WARN' ? 'border-amber-400/30' : 'border-emerald-400/30', tileBg: policyTileBg, icon: policyGate === 'BLOCK' ? ShieldX : policyGate === 'WARN' ? ShieldAlert : ShieldCheck },
          { id: 'hazard', label: 'Active Hazard', value: activeHazardLabel, valueColor: '', sub: `${activeExtHazard.exposureLabel} · ${stats.active} active`, subColor: 'text-muted-foreground', tileColor: 'border-border/50', tileBg: 'bg-card', icon: activeExtHazard.icon },
        ];
        return (
          <div className={cn('rounded-xl border p-1 border-primary/20 shadow-[0_0_0_1px_hsl(var(--primary)/0.08),0_4px_24px_-4px_hsl(var(--primary)/0.12)]', prefersReducedMotion ? '' : 'transition-shadow duration-500')}>
            <div className="grid grid-cols-5 gap-1">
              {boardroomTiles.map(({ id, label, value, valueColor, sub, subColor, tileColor, tileBg, icon: TileIcon }) => (
                <div key={id} className={cn('flex flex-col justify-between rounded-lg border px-4 py-4', tileColor, tileBg)}>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    <TileIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />{label}
                  </div>
                  <div className="mt-3">
                    <p className={cn('text-[2rem] font-semibold leading-none tabular-nums tracking-tight', valueColor || 'text-foreground')}>{value}</p>
                    <p className={cn('mt-1.5 text-[11px] leading-snug', subColor)}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })() : (
        <div className="grid grid-cols-12 items-start gap-5 lg:gap-6">
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <OperationalWorkQueue scenarios={filteredScenarios} />
            <OperationalTimeline scenarios={filteredScenarios} />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <ExecutiveSignalCard
              scenarios={scenarios}
              dataUpdatedAt={dataUpdatedAt}
              briefing={briefingState.briefing}
              isLoading={briefingState.isLoading}
              error={briefingState.error}
              boardroomMode={boardroomMode}
              onOpenSupportingSignals={() => setSupportingOpen(true)}
            />
            {activeFilters.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button key={filter} onClick={() => toggleFilter(filter)} className={cn('inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>{filter}<ArrowRight className="h-3 w-3" /></button>
                ))}
                <button onClick={() => setActiveFilters([])} className={cn('rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>Clear filters</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-3">
              {kpiCards.slice(0, 5).map((card) => {
                const config = KPI_CONFIG[card.key];
                return (
                  <FlippableKPICard
                    key={card.key}
                    label={config.title}
                    subtitle={config.subtitle}
                    value={card.value}
                    icon={card.icon}
                    tooltip={config.tooltip}
                    breakdown={card.breakdown}
                    scenarios={card.scenarios}
                    emphasis={card.emphasis}
                    boardroomMode={boardroomMode}
                    onClick={() => handleKpiAction(card.filterKey)}
                    actionLabel={card.filterKey ? (activeFilters.includes(card.filterKey) ? 'Remove filter' : 'Apply filter') : 'View all events'}
                    isActive={card.filterKey ? activeFilters.includes(card.filterKey) : false}
                    onBreakdownClick={(type) => handleTypeClick(null, type)}
                  />
                );
              })}
              <CustomerImpactKPICard scenarios={scenarios} onClick={() => navigate('/events?lifecycle=Event')} boardroomMode={boardroomMode} />
            </div>
            <ReadinessStrip scenarios={filteredScenarios} />
          </div>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <SafetyRiskPanel scenarios={filteredScenarios} />
            <CrewWorkloadPanel scenarios={filteredScenarios} />
          </div>
        </div>
      )}

      <SupportingSignalsSheet
        open={supportingOpen}
        onOpenChange={setSupportingOpen}
        title={briefingState.briefing?.insights?.[0] ?? 'Executive supporting signal unavailable'}
        summary={briefingState.briefing?.insights?.[1] ?? 'Fallback to deterministic summary due to unavailable AI output.'}
        highlights={briefingState.briefing?.insights ?? ['No highlights available']}
        actions={briefingState.briefing?.actions ?? ['No actions available']}
        confidence={briefingState.briefing?.confidence ?? 'Low'}
        sourceLabel={briefingState.briefing?.source === 'nemotron' ? 'Nemotron' : 'Deterministic fallback'}
        timestamp={briefingState.briefing?.updatedTime ?? dataUpdatedAt}
        compactMetrics={compactMetrics}
        initialSection={selectedSection}
        selectedFeeder={selectedFeeder}
        uncertaintyBand={{ p50: pBand.p50, p90: pBand.p90 }}
        rankedDrivers={riskDrivers.chips.map((chip, index) => ({ label: chip.key, score: chip.value, rationale: `Driver rank ${index + 1} based on active grid conditions.` }))}
        taggedActions={[
          { tag: 'Oper', text: 'Sequence switching plans for highest-risk circuits before crew reassignment.' },
          { tag: 'Comms', text: 'Issue customer update cadence every 30 minutes for severe feeders.' },
          { tag: 'Safety', text: 'Validate critical-load backup runway and field safety posture before escalation.' },
        ]}
        tradeoffs={[
          'Aggressive switching can restore larger load blocks faster but increases crew exposure on constrained feeders.',
          'Risk-hold posture preserves safety margin but may extend customer restoration windows in severe pockets.',
        ]}
        topAssets={topFeeders.map((feeder) => ({ id: feeder.feederId, name: feeder.name, customers: feeder.customers, criticalLoads: feeder.critical, risk: feeder.risk }))}
      />
      </div>
    </motion.div>
  );
}
