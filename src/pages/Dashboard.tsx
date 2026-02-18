import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Gauge, Ban, Sparkles } from 'lucide-react';
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
  if (severity === 'Severe') return 'bg-destructive/10 text-destructive border-destructive/40';
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
  const escalationFlags = (result.escalationFlags ?? []).map((flag, index) => normalizeFlag(flag, index));
  const blocked = result.blockedActions?.[0];
  const allowed = result.allowedActions?.[0];
  const etrBand = result.etrBand?.band ?? 'Unknown band';
  const etrConfidence = result.etrBand?.confidence ?? 'Unknown';
  const escalationText = escalationFlags.length > 0 ? `Escalation flags detected: ${escalationFlags.join(', ')}.` : 'No escalation flags detected.';
  const blockedText = blocked ? `Primary blocked action is ${toTitleCase(blocked.action)} due to ${blocked.reason ?? 'policy constraints'}.` : 'No blocked actions were returned.';
  const etrText = `ETR guidance is ${etrBand} with ${etrConfidence} confidence.`;
  const allowedText = allowed ? `Top allowed action is ${toTitleCase(allowed.action)}${allowed.reason ? ` (${allowed.reason})` : ''}.` : 'No allowed action recommendation was returned.';
  return `${escalationText} ${blockedText} ${etrText} ${allowedText}`;
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
        const remediationHint = item?.remediation
          ? item.remediation.split(/[\n•;-]/).map((part) => part.trim()).find(Boolean)
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

  const summary = useMemo(() => {
    if (stats.highPriority > 0) return `${stats.highPriority} high-priority events require attention`;
    if (stats.active > 0) return `${stats.active} active events currently in progress`;
    if (stats.preEvent > 0) return `${stats.preEvent} events under monitoring`;
    return 'No active events at this time';
  }, [stats.active, stats.highPriority, stats.preEvent]);

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
          { id: 'FEEDER-A12', vegetationExposure: 'high', loadCriticality: 'high', ageYears: 37 },
          { id: 'FEEDER-B07', vegetationExposure: 'med', loadCriticality: 'high', ageYears: 28 },
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
          { id: 'FEEDER-A12', vegetationExposure: 'high', loadCriticality: 'high', ageYears: 37 },
          { id: 'FEEDER-C19', vegetationExposure: 'high', loadCriticality: 'med', ageYears: 41 },
          { id: 'FEEDER-D03', vegetationExposure: 'med', loadCriticality: 'high', ageYears: 24 },
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
        severity: 3,
        customersAffected: 1880,
        customers_impacted: 1880,
        crews: { available: 8, enRoute: 2 },
        crews_available: 8,
        crews_enroute: 2,
        criticalLoads: [
          { name: 'Regional Hospital', backupHoursRemaining: 5.4 },
          { name: 'Water Treatment Plant', backupHoursRemaining: 7.1 },
        ],
      },
      waitMs: 1400,
      after: 'policy',
    },
  ], []);

  /** Maps a DB Scenario to the ScenarioInput shape expected by the copilot-evaluate edge function. */
  const buildPolicyPayload = useCallback(async (scenario: Scenario) => {
    // ── Severity: blend priority rank + customers_impacted bracket ──────────
    const priorityScore = scenario.priority === 'high' ? 5 : scenario.priority === 'low' ? 1 : 3;
    const customers = scenario.customers_impacted ?? 0;
    const customerScore = customers > 5000 ? 5 : customers > 1000 ? 4 : customers > 500 ? 3 : customers > 100 ? 2 : 1;
    const severity = Math.round((priorityScore + customerScore) / 2);

    // ── Phase: map lifecycle_stage to edge function enum ───────────────────
    const phaseMap: Record<string, 'PRE_EVENT' | 'ACTIVE' | 'POST_EVENT' | 'UNKNOWN'> = {
      'Pre-Event': 'PRE_EVENT',
      'Event': 'ACTIVE',
      'Post-Event': 'POST_EVENT',
    };
    const phase = phaseMap[scenario.lifecycle_stage] ?? 'UNKNOWN';

    // ── Hazard type: map outage_type to edge function enum ─────────────────
    const hazardMap: Record<string, 'STORM' | 'WILDFIRE' | 'RAIN' | 'UNKNOWN'> = {
      Storm: 'STORM', 'Snow Storm': 'STORM', 'High Wind': 'STORM', Lightning: 'STORM',
      'Ice/Snow': 'STORM', Heatwave: 'STORM',
      Wildfire: 'WILDFIRE',
      Flood: 'RAIN', 'Heavy Rain': 'RAIN',
    };
    const hazardType = scenario.outage_type ? (hazardMap[scenario.outage_type] ?? 'UNKNOWN') : 'UNKNOWN';

    // ── Assets: fetch from event_assets join table ─────────────────────────
    let assets: Array<{ id: string; type: string; ageYears?: number; vegetationExposure?: number; loadCriticality?: number }> = [];
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
        // Synthetic stubs from ID fields when no event_assets rows exist
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
      // Non-fatal — function normalizes missing assets gracefully
    }

    // ── Crews: fetch assigned crews + available pool ───────────────────────
    let crewsAvailable = 0;
    let crewsEnRoute = 0;
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

      crewsEnRoute = (assignedCrews ?? []).filter((c) => c.status === 'en_route' || c.status === 'on_site').length;
      crewsAvailable = (availableCrews ?? []).length;
    } catch {
      // Non-fatal — function defaults crew counts to 0
    }

    // ── Critical loads: map from scenario fields ───────────────────────────
    const criticalLoadTypes = Array.isArray(scenario.critical_load_types)
      ? (scenario.critical_load_types as string[])
      : [];
    const criticalLoadTypeMap: Record<string, 'HOSPITAL' | 'WATER' | 'TELECOM' | 'SHELTER' | 'OTHER'> = {
      Hospital: 'HOSPITAL', Water: 'WATER', Telecom: 'TELECOM', Shelter: 'SHELTER',
    };
    const criticalLoads = scenario.has_critical_load
      ? criticalLoadTypes.map((t) => ({
          type: criticalLoadTypeMap[t] ?? ('OTHER' as const),
          name: t,
          backupHoursRemaining: scenario.backup_runtime_remaining_hours ?? undefined,
        }))
      : [];

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
  }, []);

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
    } catch {
      setPolicyLatencyMs(Date.now() - start);
      setPolicyStatus('error');
      setPolicyError('Policy service unavailable — showing last evaluation');
    }
  }, [buildPolicyPayload, getScenarioPayload]);

  useEffect(() => {
    if (!autoRunEnabled) return;
    const timer = window.setTimeout(() => {
      void runPolicyCheck();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoRunEnabled, runPolicyCheck, scenarioPayload?.id, scenarioPayload?.name, scenarioPayload?.outage_type]);

  const policyView = policyResult ?? lastGoodPolicyResult;
  const policyEscalationFlags = (policyView?.escalationFlags ?? []).map((flag, index) => normalizeFlag(flag, index));
  const policyBlockedActions = policyView?.blockedActions ?? [];
  const policyEtrBand = policyView?.etrBand ?? null;
  const hasBlockingEscalation = policyEscalationFlags.some((flag) => ['critical_load_at_risk', 'critical_backup_window_short', 'safety_block', 'hard_block'].includes(flag));
  const policyGate: 'PASS' | 'WARN' | 'BLOCK' = (policyBlockedActions.length > 0 || hasBlockingEscalation)
    ? 'BLOCK'
    : (policyEscalationFlags.length > 0 || policyEtrBand?.band === 'LOW')
      ? 'WARN'
      : 'PASS';
  const gateReason = policyEscalationFlags.length > 0
    ? `${humanizePolicyFlag(policyEscalationFlags[0])}${policyEtrBand?.band ? ` · ETR ${policyEtrBand.band}${policyEtrBand?.confidence ? ` (${policyEtrBand.confidence})` : ''}` : ''}`
    : policyView
      ? policyEtrBand?.band
        ? `ETR ${policyEtrBand.band}${policyEtrBand?.confidence ? ` (${policyEtrBand.confidence})` : ''}`
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
    const weatherSeverity = Math.min(30, preEventScenarios.length * 6 + activeScenarios.length * 3);
    const activeHazards = Math.min(25, activeScenarios.length * 5 + highPriorityScenarios.length * 4);
    const criticalLoadExposure = Math.min(25, activeScenarios.filter((scenario) => scenario.has_critical_load).length * 8);
    const crewReadiness = Math.min(20, Math.max(0, 20 - postEventScenarios.length * 2));
    const index = Math.min(100, weatherSeverity + activeHazards + criticalLoadExposure + crewReadiness);
    return {
      index,
      severity: deriveRiskSeverity(index),
      chips: [
        { key: 'Weather severity', value: weatherSeverity },
        { key: 'Active hazards', value: activeHazards },
        { key: 'Critical load exposure', value: criticalLoadExposure },
        { key: 'Crew readiness', value: crewReadiness },
      ],
    };
  }, [activeScenarios, highPriorityScenarios.length, postEventScenarios.length, preEventScenarios.length]);

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

  return (
    <motion.div
      layout
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      animate={prefersReducedMotion ? { opacity: 1, y: 0 } : boardroomMode ? { opacity: 1, y: 0 } : { opacity: 0.98, y: 2 }}
      className={cn('mx-auto max-w-[1600px]', boardroomMode ? 'px-6 py-7 lg:px-7' : 'px-4 py-5 lg:px-5')}
    >
      <div className="space-y-6 lg:space-y-7">

      <header>
        <div className={cn('flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card shadow-sm', boardroomMode ? 'px-5 py-4' : 'px-4 py-3')}>
          <div>
            <p className="text-[11px] text-muted-foreground/70">Home &gt; Dashboard &gt; {scenarioName}</p>
            <h1 className={cn('font-semibold tracking-tight text-foreground', boardroomMode ? 'text-2xl' : 'text-xl')}>Operator Copilot — Grid Resilience Command Center</h1>
            <p className={cn('mt-1 text-muted-foreground', boardroomMode ? 'text-sm' : 'text-xs')}>Scenario: <span className="font-medium text-foreground">{scenarioName}</span> • Hazard: <span className="font-medium text-foreground capitalize">{hazard}</span></p>
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

      <section className={cn('mb-4 rounded-xl border border-primary/25 bg-card/95 px-4 py-3 shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Scenario Playback (GTC Demo)</h2>
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
              <span className="text-3xl font-semibold tabular-nums">{riskDrivers.index}</span>
              <Badge variant="outline" className={cn('text-[11px]', getRiskBadgeClass(riskDrivers.severity))}>{riskDrivers.severity}</Badge>
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

      {!boardroomMode && <ImmediateAttentionStrip scenarios={highPriorityScenarios} onViewAll={() => navigate('/events?lifecycle=Event&priority=high')} onEventClick={(id) => navigate(`/events/${id}`)} />}

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
        <section className={cn('mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-destructive">AI Briefing</p>
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-[10px] text-destructive">LOCKED</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">AI briefing locked by policy: {gateReason}</p>
          <Button size="sm" variant="outline" className={cn('mt-3 h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} disabled title={`AI briefing locked by policy: ${gateReason}`}>
            Supporting Signals
          </Button>
        </section>
      )}

      <section className={cn('rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Operational Policy Evaluation</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  policyGate === 'PASS'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : policyGate === 'WARN'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-destructive/40 bg-destructive/10 text-destructive',
                )}
              >
                Policy Gate: {policyGate}
              </Badge>
              <p className="text-[11px] text-muted-foreground">{gateReason}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>Status: <span className={cn('font-medium', policyStatusLabel === 'Error' ? 'text-destructive' : policyStatusLabel === 'Degraded' ? 'text-amber-700 dark:text-amber-300' : 'text-foreground')}>{policyStatusLabel}</span></span>
              <span>Latency: <span className="font-medium text-foreground">{policyLatencyMs !== null ? `${policyLatencyMs}ms` : '—'}</span></span>
              <span>Last evaluated: <span className="font-medium text-foreground">{compactEvaluationTimestamp}</span></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRunEnabled}
                onChange={(event) => setAutoRunEnabled(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Auto-run
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void runPolicyCheck()}
              disabled={policyStatus === 'evaluating' || !scenarioPayload}
              className={cn('h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
            >
              {policyStatus === 'evaluating' ? 'Evaluating…' : 'Run Policy Check'}
            </Button>
          </div>
        </div>

        {policyStatus === 'error' && (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {lastGoodPolicyResult ? 'Policy service unavailable — showing last evaluation.' : (policyError ?? 'Policy service unavailable — no prior evaluation available.')}
          </p>
        )}

        {!policyView && <p className="mt-3 text-sm text-muted-foreground">No evaluation run yet.</p>}

        {policyView && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />Executive Policy Summary</p>
              <p className="mt-1 text-xs text-foreground">{policySummary ?? summarizePolicy(policyView)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Escalation Flags</p>
              {(policyView.escalationFlags?.length ?? 0) > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {policyView.escalationFlags?.map((flag: EscalationFlag, index: number) => {
                    const label = normalizeFlag(flag, index);
                    const isCritical = label.includes('critical_load_at_risk') || label.includes('critical_backup_window_short');
                    return (
                      <Badge key={`flag-${index}`} variant="outline" className={cn('text-[10px]', isCritical && 'border-destructive/50 bg-destructive/10 text-destructive')}>
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">No escalation flags.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allowed Actions</p>
              {(policyView.allowedActions?.length ?? 0) > 0 ? (
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  {policyView.allowedActions?.map((item: PolicyAction, index: number) => (
                    <div key={`allowed-${index}`} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle className="h-3.5 w-3.5" />{toTitleCase(item?.action)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item?.reason ?? 'No reason returned.'}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Constraints: 0</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">No allowed actions returned.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocked Actions</p>
              {(policyView.blockedActions?.length ?? 0) > 0 ? (
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  {policyView.blockedActions?.map((item: PolicyAction, index: number) => (
                    <div key={`blocked-${index}`} className="rounded-md border border-muted-foreground/30 bg-muted/30 p-2.5 opacity-80">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Ban className="h-3.5 w-3.5" />{toTitleCase(item?.action)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item?.reason ?? 'No reason returned.'}</p>
                      {item?.remediation && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Remediation: {item.remediation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">No blocked actions returned.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ETR Band</p>
              {policyView.etrBand ? (
                <p className="mt-1">
                  <Badge variant="outline" className="mr-2 text-[10px]">{policyView.etrBand?.band ?? 'Unknown band'}</Badge>
                  <span className="text-muted-foreground">Confidence: {policyView.etrBand?.confidence ?? 'Unknown'}</span>
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">No ETR band returned.</p>
              )}
            </div>
          </div>
        )}
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

      <div className="grid grid-cols-12 items-start gap-5 lg:gap-6">
        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <OperationalWorkQueue scenarios={filteredScenarios} />
            <OperationalTimeline scenarios={filteredScenarios} />
          </div>
        )}

        <div className={cn('col-span-12', boardroomMode ? 'lg:col-span-12' : 'lg:col-span-6')}>
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
          <div className={cn('grid gap-4 lg:gap-5', boardroomMode ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 xl:grid-cols-3')}>
            {kpiCards.slice(0, boardroomMode ? 4 : 5).map((card) => {
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
          {!boardroomMode && <ReadinessStrip scenarios={filteredScenarios} />}
        </div>

        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <SafetyRiskPanel scenarios={filteredScenarios} />
            <CrewWorkloadPanel scenarios={filteredScenarios} />
          </div>
        )}
      </div>

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
