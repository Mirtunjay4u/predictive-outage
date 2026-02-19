import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Ban, AlertTriangle, Info, ChevronRight,
  Users, Clock, Zap, ShieldCheck, ShieldAlert, ShieldX,
  Loader2, RefreshCw, Wind, CloudRain, Flame, Thermometer,
  Radio, MapPin, Activity, TrendingUp, HelpCircle, Snowflake,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatEtrBand, formatConfidenceFull, formatConfidencePct,
  confidenceBadgeClass, parseConfidence, formatRuntimeHours,
} from '@/lib/etr-format';
import { supabase } from '@/integrations/supabase/client';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import type { Scenario } from '@/types/scenario';

// ── Derived helpers ───────────────────────────────────────────────────────────
/**
 * Deterministic severity derivation:
 *   Priority score: high=3, medium=2, low=1
 *   Customer tier:  min(2, floor(customers / 500))
 *   Total: clamped to [1, 5]
 */
export function deriveSeverity(scenario: Scenario): number {
  const priorityScore = scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1;
  const custScore = Math.min(2, Math.floor((scenario.customers_impacted ?? 0) / 500));
  return Math.min(5, Math.max(1, priorityScore + custScore));
}

/** Severity label and colour class */
function severityLabel(score: number): { label: string; cls: string } {
  if (score >= 5) return { label: 'Critical', cls: 'text-red-600 dark:text-red-400' };
  if (score === 4) return { label: 'High', cls: 'text-red-600 dark:text-red-400' };
  if (score === 3) return { label: 'Moderate', cls: 'text-amber-600 dark:text-amber-400' };
  if (score === 2) return { label: 'Low', cls: 'text-emerald-600 dark:text-emerald-400' };
  return { label: 'Minimal', cls: 'text-emerald-600 dark:text-emerald-400' };
}

function getPriorityClass(priority: string | null) {
  if (priority === 'high') return 'bg-red-500/10 text-red-700 border-red-500/40 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50';
  if (priority === 'medium') return 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300';
  return 'bg-muted/60 text-muted-foreground border-border/60';
}

function getGateIcon(gate: string) {
  if (gate === 'BLOCK') return <ShieldX className="h-4 w-4 text-red-400" />;
  if (gate === 'WARN') return <ShieldAlert className="h-4 w-4 text-amber-400" />;
  return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
}

function getGateBg(gate: string) {
  if (gate === 'BLOCK') return 'bg-red-500/10 border-red-400/30 dark:bg-red-500/12';
  if (gate === 'WARN') return 'bg-amber-500/10 border-amber-400/30';
  return 'bg-emerald-500/10 border-emerald-400/30';
}

function humanise(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map outage type → hazard label + icon */
function hazardInfo(outageType: string | null | undefined): { label: string; icon: React.ElementType; cls: string } {
  const t = String(outageType ?? '');
  if (['Storm', 'Lightning', 'High Wind'].includes(t))
    return { label: 'STORM', icon: Wind, cls: 'bg-blue-500/10 text-blue-700 border-blue-400/30 dark:text-blue-300' };
  if (t === 'Snow Storm')
    return { label: 'ICE STORM', icon: Snowflake, cls: 'bg-sky-500/10 text-sky-700 border-sky-400/30 dark:text-sky-300' };
  if (t === 'Wildfire' || t === 'Vegetation')
    return { label: 'WILDFIRE', icon: Flame, cls: 'bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-300' };
  if (t === 'Flood' || t === 'Heavy Rain')
    return { label: 'FLOOD', icon: CloudRain, cls: 'bg-cyan-500/10 text-cyan-700 border-cyan-400/30 dark:text-cyan-300' };
  if (t === 'Heatwave')
    return { label: 'HEAT', icon: Thermometer, cls: 'bg-red-500/10 text-red-700 border-red-400/30 dark:text-red-300' };
  return { label: 'UNKNOWN', icon: HelpCircle, cls: 'bg-muted/60 text-muted-foreground border-border/60' };
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PolicyResult = {
  policyGate?: string;
  allowedActions?: Array<{ action: string; reason: string; constraints?: string[] }>;
  blockedActions?: Array<{ action: string; reason: string; remediation?: string | string[] }>;
  escalationFlags?: string[];
  etrBand?: { band: string; confidence?: number; rationale?: string[] };
  safetyConstraints?: Array<{
    id: string; title: string; description: string;
    severity: string; triggered: boolean; evidence?: string[];
  }>;
  explainability?: {
    drivers?: Array<{ key: string; value: string | number | boolean; weight: number }>;
    assumptions?: string[];
    dataQualityWarnings?: string[];
  };
};

type PolicyEntry = {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: PolicyResult | null;
};

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex-1">{label}</p>
      {children}
    </div>
  );
}

// ── Severity breakdown panel ───────────────────────────────────────────────────
function SeverityBreakdown({ scenario }: { scenario: Scenario }) {
  const priorityScore = scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1;
  const custScore = Math.min(2, Math.floor((scenario.customers_impacted ?? 0) / 500));
  const total = deriveSeverity(scenario);
  const { label: sevLabel, cls: sevCls } = severityLabel(total);
  const dotColor =
    total >= 4 ? 'bg-red-500 border-red-400' :
    total === 3 ? 'bg-amber-500 border-amber-400' :
    'bg-emerald-500 border-emerald-400';

  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-3">
      <SectionHead icon={TrendingUp} label="Severity Band (Deterministic)" />

      {/* Main score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={cn('h-3 w-3 rounded-full border', i < total ? dotColor : 'bg-muted border-border/40')} />
          ))}
        </div>
        <div>
          <span className={cn('text-2xl font-bold tabular-nums', sevCls)}>{total}</span>
          <span className="text-muted-foreground text-sm">/5</span>
          <span className={cn('ml-2 text-sm font-semibold', sevCls)}>{sevLabel}</span>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 px-3 py-2 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Priority Score</p>
          <p className="font-semibold text-foreground tabular-nums">{priorityScore} / 3</p>
          <p className="text-[10px] text-muted-foreground capitalize">{scenario.priority ?? 'medium'} priority</p>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Customer Tier</p>
          <p className="font-semibold text-foreground tabular-nums">{custScore} / 2</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {(scenario.customers_impacted ?? 0).toLocaleString()} impacted
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic">Formula: Priority (1–3) + Customer tier (0–2), clamped 1–5</p>
    </div>
  );
}

// ── ETR Band panel ─────────────────────────────────────────────────────────────
function EtrBandPanel({ scenario }: { scenario: Scenario }) {
  const band = formatEtrBand(scenario.etr_earliest, scenario.etr_latest);
  const { label: confLabel, pct } = parseConfidence(scenario.etr_confidence);
  const confClass = confidenceBadgeClass(scenario.etr_confidence);

  const windowStr =
    scenario.etr_earliest && scenario.etr_latest
      ? `${format(new Date(scenario.etr_earliest), 'HH:mm')} – ${format(new Date(scenario.etr_latest), 'HH:mm, MMM d')}`
      : scenario.etr_expected
      ? format(new Date(scenario.etr_expected), 'MMM d, HH:mm')
      : null;

  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-2.5">
      <SectionHead icon={Clock} label="ETR Band" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {band ? (
            <p className="text-lg font-bold text-foreground tabular-nums">{band}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No ETR data</p>
          )}
          {windowStr && (
            <p className="text-xs text-muted-foreground mt-0.5">{windowStr}</p>
          )}
          <p className="text-[10px] text-muted-foreground italic mt-0.5">AI-estimated restoration window</p>
        </div>
        {scenario.etr_confidence && (
          <div className="shrink-0 text-right">
            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold', confClass)}>
              {confLabel} — {pct}%
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">confidence</p>
          </div>
        )}
      </div>

      {/* Uncertainty drivers */}
      {Array.isArray(scenario.etr_uncertainty_drivers) && scenario.etr_uncertainty_drivers.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Uncertainty drivers</p>
          <div className="flex flex-wrap gap-1">
            {scenario.etr_uncertainty_drivers.map((d) => (
              <span key={String(d)} className="rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                {String(d)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Critical Load Continuity ────────────────────────────────────────────────────
function CriticalLoadPanel({ scenario }: { scenario: Scenario }) {
  if (!scenario.has_critical_load) return null;

  const types = (scenario.critical_load_types as string[] ?? []);
  const hospitals = types.filter((t) => t.toLowerCase().includes('hospital'));
  const water = types.filter((t) => t.toLowerCase().includes('water'));
  const shelters = types.filter((t) => t.toLowerCase().includes('shelter'));
  const datacenters = types.filter((t) => t.toLowerCase().includes('data center') || t.toLowerCase().includes('datacenter'));
  const telecom = types.filter((t) => t.toLowerCase().includes('telecom'));
  const other = types.filter((t) =>
    !['hospital', 'water', 'shelter', 'data center', 'datacenter', 'telecom'].some((k) => t.toLowerCase().includes(k))
  );

  const remaining = scenario.backup_runtime_remaining_hours;
  const threshold = scenario.critical_escalation_threshold_hours;
  const atRisk = remaining != null && threshold != null && remaining <= threshold;
  const breach = remaining != null && threshold != null && remaining <= 0;

  // Tier classification
  const tier = breach ? 'BREACH' : atRisk ? 'AT RISK' : 'NORMAL';
  const tierCls = breach ? 'bg-red-500/10 border-red-400/30 text-red-700 dark:text-red-300'
    : atRisk ? 'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-300'
    : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:text-emerald-300';

  return (
    <div className={cn('rounded-lg border px-4 py-3 space-y-2.5', atRisk ? 'border-red-400/30 bg-red-500/5' : 'border-amber-400/30 bg-amber-500/5')}>
      <div className="flex items-center gap-2 mb-2.5">
        <Zap className="h-3.5 w-3.5 text-red-500" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex-1">Critical Load Continuity</p>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold', tierCls)}>
          {tier}
        </span>
      </div>

      {/* Load type grid */}
      <div className="grid grid-cols-2 gap-2">
        {hospitals.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 border border-red-400/20 px-2 py-1.5">
            <span className="text-base">🏥</span>
            <div>
              <p className="text-[10px] font-semibold text-red-700 dark:text-red-300">{hospitals.length} Hospital{hospitals.length > 1 ? 's' : ''}</p>
              <p className="text-[9px] text-muted-foreground">Tier 1 Critical</p>
            </div>
          </div>
        )}
        {water.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-400/20 px-2 py-1.5">
            <span className="text-base">💧</span>
            <div>
              <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">{water.length} Water Plant{water.length > 1 ? 's' : ''}</p>
              <p className="text-[9px] text-muted-foreground">Tier 1 Critical</p>
            </div>
          </div>
        )}
        {shelters.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-400/20 px-2 py-1.5">
            <span className="text-base">🏠</span>
            <div>
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">{shelters.length} Shelter{shelters.length > 1 ? 's' : ''}</p>
              <p className="text-[9px] text-muted-foreground">Tier 2 Critical</p>
            </div>
          </div>
        )}
        {datacenters.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-purple-500/10 border border-purple-400/20 px-2 py-1.5">
            <span className="text-base">🖥️</span>
            <div>
              <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">{datacenters.length} Data Center{datacenters.length > 1 ? 's' : ''}</p>
              <p className="text-[9px] text-muted-foreground">Tier 2 Critical</p>
            </div>
          </div>
        )}
        {telecom.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-sky-500/10 border border-sky-400/20 px-2 py-1.5">
            <span className="text-base">📡</span>
            <div>
              <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">{telecom.length} Telecom{telecom.length > 1 ? ' Sites' : ' Site'}</p>
              <p className="text-[9px] text-muted-foreground">Tier 1 Critical</p>
            </div>
          </div>
        )}
        {other.map((t) => (
          <div key={t} className="flex items-center gap-1.5 rounded-md bg-muted/40 border border-border/40 px-2 py-1.5">
            <span className="text-base">⚡</span>
            <div>
              <p className="text-[10px] font-semibold text-foreground">{t}</p>
              <p className="text-[9px] text-muted-foreground">Tier 3</p>
            </div>
          </div>
        ))}
      </div>

      {/* Backup runway */}
      {remaining != null && (
        <div className="flex items-center justify-between text-sm border-t border-border/30 pt-2">
          <span className="text-muted-foreground text-xs">Backup runtime remaining</span>
          <span className={cn('font-bold tabular-nums', atRisk ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
            {formatRuntimeHours(remaining)}
          </span>
        </div>
      )}
      {threshold != null && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Escalation threshold</span>
          <span className="text-xs text-muted-foreground tabular-nums">{formatRuntimeHours(threshold)}</span>
        </div>
      )}
    </div>
  );
}

// ── Crew Readiness Panel ───────────────────────────────────────────────────────
function CrewReadinessPanel({
  scenario, policy,
}: { scenario: Scenario; policy: PolicyResult | null }) {
  const drivers = policy?.explainability?.drivers ?? [];
  const crewDriver = drivers.find((d) => d.key === 'crews_sufficient');
  const crewSufficient = crewDriver?.value === true;
  const flags = policy?.escalationFlags ?? [];
  const crewShortfall = flags.includes('insufficient_crews');

  // Extract crew numbers from safety constraints
  const crewConstraint = policy?.safetyConstraints?.find((c) => c.id === 'SC-CREW-001');
  const evidence = crewConstraint?.evidence ?? [];

  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-2.5">
      <SectionHead icon={Users} label="Crew Readiness" />

      <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        crewShortfall ? 'bg-red-500/10 border-red-400/30' : 'bg-emerald-500/10 border-emerald-400/30'
      )}>
        <Users className={cn('h-4 w-4', crewShortfall ? 'text-red-500' : 'text-emerald-500')} />
        <span className={cn('font-semibold', crewShortfall ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300')}>
          {policy ? (crewShortfall ? 'Crew Shortage — Actions Constrained' : 'Crew Coverage Sufficient') : (scenario.operator_role ? `Assigned: ${scenario.operator_role}` : 'No crew assigned')}
        </span>
      </div>

      {/* Evidence from policy engine */}
      {evidence.length > 0 && (
        <ul className="space-y-1">
          {evidence.map((e, i) => (
            <li key={i} className="text-xs text-muted-foreground">· {e}</li>
          ))}
        </ul>
      )}

      {/* Skill mismatch / shortage impact */}
      {crewShortfall && (
        <div className="rounded-md bg-amber-500/10 border border-amber-400/20 px-3 py-2 text-xs space-y-1">
          <p className="font-semibold text-amber-700 dark:text-amber-300">Shortage Impact</p>
          <p className="text-muted-foreground">· Reroute Load action is blocked until crew threshold is met</p>
          <p className="text-muted-foreground">· Mutual Aid request recommended (already allowed)</p>
        </div>
      )}

      {/* Operator role if available */}
      {scenario.operator_role && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Assigned operator</span>
          <span className="font-medium text-foreground">{scenario.operator_role}</span>
        </div>
      )}
    </div>
  );
}

// ── Hazard Correlation Panel ───────────────────────────────────────────────────
function HazardPanel({ scenario }: { scenario: Scenario }) {
  const { label, icon: HIcon, cls } = hazardInfo(scenario.outage_type);
  const isActive = scenario.lifecycle_stage === 'Event';
  const weatherSignal = scenario.outage_type ?? 'No data';

  // Derive exposure signal from outage type
  const exposureSignals: string[] = [];
  const ot = String(scenario.outage_type ?? '');
  if (['Storm', 'Lightning', 'High Wind', 'Snow Storm', 'Ice/Snow'].includes(ot)) {
    exposureSignals.push('High wind exposure', 'Conductor slap risk', 'Tree contact risk');
  } else if (ot === 'Wildfire' || ot === 'Vegetation') {
    exposureSignals.push('Smoke / heat stress', 'PSPS readiness recommended', 'Vegetation contact risk');
  } else if (ot === 'Flood' || ot === 'Heavy Rain') {
    exposureSignals.push('Ground saturation', 'Pad-mount access risk', 'Substation flooding risk');
  } else if (ot === 'Heatwave') {
    exposureSignals.push('Transformer overloading', 'Load spike risk', 'Cable insulation stress');
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-2.5">
      <SectionHead icon={Wind} label="Hazard Correlation" />

      <div className="flex items-center gap-3">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', cls)}>
          <HIcon className="h-3.5 w-3.5" />
          {label}
        </span>
        {isActive && (
          <span className="rounded-full bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            ⚠ Active hazard
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 border border-border/40 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">Weather Signal</p>
          <p className="font-medium text-foreground mt-0.5">{weatherSignal}</p>
        </div>
        <div className="rounded-md bg-muted/30 border border-border/40 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">Phase</p>
          <p className="font-medium text-foreground mt-0.5">{scenario.lifecycle_stage}</p>
        </div>
      </div>

      {exposureSignals.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Exposure Signals</p>
          <ul className="space-y-0.5">
            {exposureSignals.map((s) => (
              <li key={s} className="text-xs text-muted-foreground">· {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Operational Timeline ───────────────────────────────────────────────────────
type TimelineStep = { label: string; time: string | null; status: 'done' | 'active' | 'pending' };

function buildTimeline(s: Scenario): TimelineStep[] {
  const stage = s.lifecycle_stage;
  const hasCrewAssigned = !!s.operator_role;

  return [
    {
      label: 'Detected',
      time: s.event_start_time ? format(new Date(s.event_start_time), 'MMM d, HH:mm') : null,
      status: s.event_start_time ? 'done' : 'pending',
    },
    {
      label: 'Confirmed',
      time: s.event_last_update_time ? format(new Date(s.event_last_update_time), 'HH:mm') : null,
      status: stage !== 'Pre-Event' ? 'done' : 'pending',
    },
    {
      label: 'Crew Dispatched',
      time: null,
      status: hasCrewAssigned && stage === 'Event' ? 'done' : stage === 'Event' ? 'active' : 'pending',
    },
    {
      label: 'Field Assessment',
      time: null,
      status: stage === 'Event' && hasCrewAssigned ? 'active' : stage === 'Post-Event' ? 'done' : 'pending',
    },
    {
      label: 'Restoration Started',
      time: null,
      status: stage === 'Post-Event' ? 'done' : 'pending',
    },
    {
      label: 'Est. Restoration (ETR)',
      time: s.etr_expected ? format(new Date(s.etr_expected), 'MMM d, HH:mm')
        : s.etr_latest ? format(new Date(s.etr_latest), 'HH:mm') : null,
      status: stage === 'Post-Event' && s.event_end_time ? 'done' : 'pending',
    },
  ];
}

function OperationalTimeline({ scenario }: { scenario: Scenario }) {
  const steps = buildTimeline(scenario);
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
              step.status === 'done' ? 'border-emerald-500 bg-emerald-500'
              : step.status === 'active' ? 'border-primary bg-primary/20'
              : 'border-border/50 bg-muted/30',
            )}>
              {step.status === 'done' && <span className="block h-1.5 w-1.5 rounded-full bg-white" />}
              {step.status === 'active' && <span className="block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-0.5 h-6 mt-0.5', step.status === 'done' ? 'bg-emerald-500/40' : 'bg-border/30')} />
            )}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-xs font-medium',
                step.status === 'done' ? 'text-foreground'
                : step.status === 'active' ? 'text-primary'
                : 'text-muted-foreground',
              )}>
                {step.label}
              </span>
              {step.time && (
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{step.time}</span>
              )}
              {step.status === 'active' && !step.time && (
                <span className="text-[10px] text-primary font-semibold">In progress</span>
              )}
              {step.status === 'pending' && !step.time && (
                <span className="text-[10px] text-muted-foreground">Pending</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Supporting Signals ─────────────────────────────────────────────────────────
function SupportingSignals({ scenario }: { scenario: Scenario }) {
  const weatherIcon = scenario.outage_type === 'Wildfire' ? Flame
    : scenario.outage_type === 'Heavy Rain' || scenario.outage_type === 'Flood' ? CloudRain
    : scenario.outage_type === 'High Wind' || scenario.outage_type === 'Storm' ? Wind
    : scenario.outage_type === 'Heatwave' ? Thermometer
    : Wind;

  const signals = [
    {
      icon: weatherIcon,
      label: 'Weather Signal',
      value: scenario.outage_type ?? 'No weather data',
      ok: !['Storm', 'Wildfire', 'Flood', 'Heavy Rain', 'Heatwave', 'High Wind', 'Ice/Snow', 'Snow Storm'].includes(scenario.outage_type ?? ''),
    },
    {
      icon: Radio,
      label: 'Asset Status',
      value: scenario.fault_id ? `Fault isolated: ${scenario.fault_id}` : scenario.feeder_id ? `Feeder: ${scenario.feeder_id}` : 'No fault tag',
      ok: !!scenario.fault_id || !!scenario.feeder_id,
    },
    {
      icon: Users,
      label: 'Crew Signal',
      value: scenario.operator_role ? `Assigned: ${scenario.operator_role}` : 'No crew assigned',
      ok: !!scenario.operator_role,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: scenario.location_name ?? scenario.service_area ?? 'Unknown',
      ok: !!scenario.location_name,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {signals.map(({ icon: Icon, label, value, ok }) => (
        <div key={label} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className={cn('ml-auto h-1.5 w-1.5 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-amber-500')} />
          </div>
          <p className="text-xs text-foreground leading-snug">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Escalation flag chip config ────────────────────────────────────────────────
type FlagConfig = {
  icon: React.ElementType;
  label: string;
  chipCls: string;
  iconCls: string;
  labelCls: string;
};

const FLAG_CONFIG: Record<string, FlagConfig> = {
  transformer_thermal_stress: {
    icon: Thermometer,
    label: 'Transformer Thermal Stress',
    chipCls: 'bg-amber-500/10 border-amber-400/30',
    iconCls: 'text-amber-500',
    labelCls: 'text-amber-700 dark:text-amber-300',
  },
  critical_load_at_risk: {
    icon: Zap,
    label: 'Critical Load At Risk',
    chipCls: 'bg-red-500/10 border-red-400/30',
    iconCls: 'text-red-500',
    labelCls: 'text-red-700 dark:text-red-300',
  },
  insufficient_crews: {
    icon: Users,
    label: 'Insufficient Crews',
    chipCls: 'bg-orange-500/10 border-orange-400/30',
    iconCls: 'text-orange-500',
    labelCls: 'text-orange-700 dark:text-orange-300',
  },
  low_confidence_etr: {
    icon: Clock,
    label: 'Low Confidence ETR',
    chipCls: 'bg-amber-500/10 border-amber-400/30',
    iconCls: 'text-amber-500',
    labelCls: 'text-amber-700 dark:text-amber-300',
  },
  storm_active: {
    icon: Wind,
    label: 'Storm Active',
    chipCls: 'bg-blue-500/10 border-blue-400/30',
    iconCls: 'text-blue-500',
    labelCls: 'text-blue-700 dark:text-blue-300',
  },
  ice_load_risk: {
    icon: Snowflake,
    label: 'Ice Vegetation Line Risk',
    chipCls: 'bg-sky-500/10 border-sky-400/30',
    iconCls: 'text-sky-500',
    labelCls: 'text-sky-700 dark:text-sky-300',
  },
  critical_backup_window_short: {
    icon: Zap,
    label: 'Backup Window Short',
    chipCls: 'bg-red-500/10 border-red-400/30',
    iconCls: 'text-red-500',
    labelCls: 'text-red-700 dark:text-red-300',
  },
};

function EscalationFlagChips({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
        Active Escalation Flags
      </p>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((flag) => {
          const cfg = FLAG_CONFIG[flag];
          if (cfg) {
            const Icon = cfg.icon;
            return (
              <span
                key={flag}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                  cfg.chipCls,
                )}
              >
                <Icon className={cn('h-3 w-3 shrink-0', cfg.iconCls)} />
                <span className={cfg.labelCls}>{cfg.label}</span>
              </span>
            );
          }
          // Fallback for unknown flags
          return (
            <span
              key={flag}
              className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
            >
              ⚑ {flag.replace(/_/g, ' ')}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Policy Evaluation Section ──────────────────────────────────────────────────

function PolicySection({
  policy, policyStatus, gate, whyOpen, setWhyOpen, handleRunEvaluation,
}: {
  policy: PolicyResult | null;
  policyStatus: string;
  gate: string | null;
  whyOpen: boolean;
  setWhyOpen: (v: boolean) => void;
  handleRunEvaluation: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <SectionHead icon={ShieldCheck} label="Policy Evaluation" />
        <button
          onClick={handleRunEvaluation}
          disabled={policyStatus === 'loading'}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', policyStatus === 'loading' && 'animate-spin')} />
        </button>
      </div>

      {policyStatus === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Evaluating policy rules…
        </div>
      )}

      {policyStatus === 'error' && (
        <p className="text-xs text-destructive">Policy evaluation unavailable.</p>
      )}

      {policyStatus === 'done' && gate && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* Gate badge */}
          <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2', getGateBg(gate))}>
            {getGateIcon(gate)}
            <span className="text-sm font-semibold">Policy Gate: {gate}</span>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {policy?.allowedActions?.length ?? 0} allowed
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                ✗ {policy?.blockedActions?.length ?? 0} blocked
              </span>
            </div>
          </div>

          {/* Escalation flag chips — styled per flag type */}
          {(policy?.escalationFlags ?? []).length > 0 && (
            <EscalationFlagChips flags={policy!.escalationFlags!} />
          )}

          {/* Allowed actions */}
          {(policy?.allowedActions ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Allowed Actions</p>
              <ul className="space-y-1.5">
                {policy!.allowedActions!.map((a) => (
                  <li key={a.action} className="rounded-lg border border-emerald-400/25 bg-emerald-500/5 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{humanise(a.action)}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{a.reason}</p>
                        {a.constraints && a.constraints.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 italic">↳ {a.constraints[0]}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blocked actions */}
          {(policy?.blockedActions ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Blocked Actions + Remediation</p>
              <ul className="space-y-1.5">
                {policy!.blockedActions!.map((b) => {
                  const remArr = Array.isArray(b.remediation)
                    ? b.remediation
                    : typeof b.remediation === 'string'
                    ? b.remediation.split(/[\n•;]/).map((s) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <li key={b.action} className="rounded-lg border border-red-400/25 bg-red-500/5 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <Ban className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">{humanise(b.action)}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{b.reason}</p>
                          {remArr.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Remediation steps:</p>
                              {remArr.slice(0, 2).map((r, i) => (
                                <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">↳ {r}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* "Why" explainability panel */}
          {policy?.explainability && (
            <div>
              <button
                onClick={() => setWhyOpen(!whyOpen)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                Why did the policy engine decide this?
                <ChevronRight className={cn('h-3 w-3 transition-transform', whyOpen && 'rotate-90')} />
              </button>
              <AnimatePresence>
                {whyOpen && (
                  <motion.div
                    key="why"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-3 space-y-3 text-xs">
                      {(policy.explainability.drivers ?? []).length > 0 && (
                        <div>
                          <p className="font-semibold text-foreground mb-1.5">Decision Drivers</p>
                          <ul className="space-y-2">
                            {policy.explainability.drivers!.map((d) => (
                              <li key={d.key} className="space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground capitalize">{d.key.replace(/_/g, ' ')}</span>
                                  <span className="text-foreground font-medium tabular-nums text-right">
                                    {String(d.value).slice(0, 8)}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${Math.min(100, Math.round(d.weight * 100))}%` }}
                                  />
                                </div>
                                <p className="text-[9px] text-muted-foreground">Weight: {Math.round(d.weight * 100)}%</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(policy.explainability.assumptions ?? []).length > 0 && (
                        <div>
                          <p className="font-semibold text-foreground mb-1">Assumptions</p>
                          <ul className="space-y-0.5">
                            {policy.explainability.assumptions!.map((a, i) => (
                              <li key={i} className="text-muted-foreground leading-snug">· {a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(policy.explainability.dataQualityWarnings ?? []).length > 0 && (
                        <div>
                          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Data Quality Warnings</p>
                          <ul className="space-y-0.5">
                            {policy.explainability.dataQualityWarnings!.map((w, i) => (
                              <li key={i} className="text-muted-foreground leading-snug">⚠ {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface EventDetailPanelProps {
  scenario: Scenario | null;
  open: boolean;
  onClose: () => void;
  onEdit: (scenario: Scenario) => void;
  externalPolicyState?: PolicyEntry;
  onRunCopilot?: () => void;
}

export function EventDetailPanel({
  scenario, open, onClose, onEdit, externalPolicyState, onRunCopilot,
}: EventDetailPanelProps) {
  const [localPolicy, setLocalPolicy] = useState<PolicyResult | null>(null);
  const [localPolicyStatus, setLocalPolicyStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [whyOpen, setWhyOpen] = useState(false);

  const policyStatus = externalPolicyState?.status ?? localPolicyStatus;
  const policy = externalPolicyState?.result ?? localPolicy;

  // Auto-open the "Why" panel once evaluation completes
  useEffect(() => {
    if (policyStatus === 'done' && policy?.explainability) {
      setWhyOpen(true);
    }
  }, [policyStatus, policy]);

  const buildPayload = useCallback((s: Scenario) => {
    const priority = s.priority ?? 'medium';
    const severityNum = deriveSeverity(s);
    const hazardMap: Record<string, string> = {
      Storm: 'STORM', Lightning: 'STORM', 'High Wind': 'STORM', 'Snow Storm': 'STORM',
      Wildfire: 'WILDFIRE', Vegetation: 'WILDFIRE',
      Flood: 'RAIN', 'Heavy Rain': 'RAIN',
      Heatwave: 'HEAT',
      'Ice/Snow': 'ICE',
    };
    const hazardType = hazardMap[s.outage_type ?? ''] ?? 'UNKNOWN';
    const phase =
      s.lifecycle_stage === 'Pre-Event' ? 'PRE_EVENT'
      : s.lifecycle_stage === 'Event' ? 'ACTIVE'
      : 'POST_EVENT';

    return {
      scenarioId: s.id,
      hazardType,
      phase,
      severity: severityNum,
      customersAffected: s.customers_impacted ?? 0,
      criticalLoads: (s.critical_load_types ?? []).map((t) => ({
        type: String(t).toUpperCase(),
        backupHoursRemaining: s.backup_runtime_remaining_hours ?? undefined,
      })),
      crews: { available: 3, enRoute: 1 },
      dataQuality: { completeness: 0.8, freshnessMinutes: 15 },
    };
  }, []);

  const runLocalEvaluation = useCallback(async (s: Scenario) => {
    setLocalPolicyStatus('loading');
    setLocalPolicy(null);
    setWhyOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke('copilot-evaluate', { body: buildPayload(s) });
      if (error) throw error;
      setLocalPolicy(data as PolicyResult);
      setLocalPolicyStatus('done');
    } catch {
      setLocalPolicyStatus('error');
    }
  }, [buildPayload]);

  const handleRunEvaluation = useCallback(() => {
    if (onRunCopilot) {
      onRunCopilot();
    } else if (scenario) {
      runLocalEvaluation(scenario);
    }
  }, [onRunCopilot, scenario, runLocalEvaluation]);

  useEffect(() => {
    if (open && scenario && !externalPolicyState) {
      runLocalEvaluation(scenario);
    } else if (!open) {
      setLocalPolicy(null);
      setLocalPolicyStatus('idle');
      setWhyOpen(false);
    }
  }, [open, scenario, externalPolicyState, runLocalEvaluation]);

  const severity = scenario ? deriveSeverity(scenario) : 0;
  const gate = policy?.policyGate ?? (policyStatus === 'done' ? 'PASS' : null);
  const omsTag = scenario?.feeder_id ? `Feeder ${scenario.feeder_id}` : scenario?.fault_id ? `Fault ${scenario.fault_id}` : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        {scenario && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <OutageTypeBadge type={scenario.outage_type} />
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    getPriorityClass(scenario.priority),
                  )}>
                    {(scenario.priority ?? 'medium').charAt(0).toUpperCase() + (scenario.priority ?? 'medium').slice(1)} Priority
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold',
                    severity >= 4 ? 'text-red-600 dark:text-red-400' : severity === 3 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
                  )}>
                    Sev&nbsp;{severity}/5
                  </span>
                  {omsTag && (
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/40">{omsTag}</span>
                  )}
                </div>
                <h2 className="font-semibold text-base text-foreground leading-snug line-clamp-2">{scenario.name}</h2>
                {scenario.location_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scenario.location_name}{scenario.service_area ? ` · ${scenario.service_area}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* KPI strip */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Customers</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {scenario.customers_impacted != null ? scenario.customers_impacted.toLocaleString() : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Phase</p>
                  <p className="text-sm font-semibold text-foreground">{scenario.lifecycle_stage}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">ETR Conf.</p>
                  <p className="text-sm font-semibold text-foreground">
                    {scenario.etr_confidence ? formatConfidenceFull(scenario.etr_confidence) : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Crit. Load</p>
                  <p className={cn('text-sm font-semibold', scenario.has_critical_load ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {scenario.has_critical_load ? 'Exposed' : 'None'}
                  </p>
                </div>
              </div>

              {/* 1. Severity breakdown — deterministic */}
              <SeverityBreakdown scenario={scenario} />

              {/* 2. ETR band — duration range + AI-estimated */}
              <EtrBandPanel scenario={scenario} />

              {/* 3. Critical load continuity */}
              {scenario.has_critical_load && <CriticalLoadPanel scenario={scenario} />}

              {/* 4. Policy evaluation — allowed/blocked/why */}
              <PolicySection
                policy={policy}
                policyStatus={policyStatus}
                gate={gate}
                whyOpen={whyOpen}
                setWhyOpen={setWhyOpen}
                handleRunEvaluation={handleRunEvaluation}
              />

              {/* 5. Crew readiness */}
              <CrewReadinessPanel scenario={scenario} policy={policy} />

              {/* 6. Hazard correlation */}
              <HazardPanel scenario={scenario} />

              {/* 7. Operational timeline */}
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                <SectionHead icon={Activity} label="Operational Timeline" />
                <OperationalTimeline scenario={scenario} />
              </div>

              {/* 8. Evidence / supporting signals */}
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                <SectionHead icon={Activity} label="Evidence / Supporting Signals" />
                <SupportingSignals scenario={scenario} />
              </div>

              {/* Notes */}
              {scenario.notes && (
                <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                  <SectionHead icon={AlertTriangle} label="Notes" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{scenario.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/50 px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Updated {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={() => { onEdit(scenario); onClose(); }}>Edit Event</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
