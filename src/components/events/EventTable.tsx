import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle, MoreVertical, Zap, Play, Loader2,
  ShieldX, ShieldAlert, ShieldCheck, Users, Wind, Flame, CloudRain,
  Thermometer, Snowflake, HelpCircle,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  formatEtrBand, formatConfidencePct, confidenceBadgeClass, parseConfidence,
} from '@/lib/etr-format';
import { deriveSeverity } from '@/components/events/EventDetailPanel';
import type { Scenario } from '@/types/scenario';

// ── Policy state type ─────────────────────────────────────────────────────────
type PolicyEntry = {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: {
    policyGate?: string;
    allowedActions?: unknown[];
    blockedActions?: unknown[];
    escalationFlags?: string[];
    explainability?: {
      drivers?: Array<{ key: string; value: string | number | boolean; weight: number }>;
    };
  } | null;
};

// ── Hazard tag helpers ────────────────────────────────────────────────────────
function hazardTag(outageType: string | null | undefined): {
  label: string;
  icon: React.ElementType;
  cls: string;
} {
  const t = outageType ?? '';
  if (['Storm', 'Lightning', 'High Wind', 'Snow Storm', 'Ice/Snow'].includes(t))
    return { label: 'STORM', icon: Wind, cls: 'bg-blue-500/10 text-blue-700 border-blue-400/30 dark:text-blue-300' };
  if (t === 'Wildfire' || t === 'Vegetation')
    return { label: 'WILDFIRE', icon: Flame, cls: 'bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-300' };
  if (t === 'Flood' || t === 'Heavy Rain')
    return { label: 'FLOOD', icon: CloudRain, cls: 'bg-cyan-500/10 text-cyan-700 border-cyan-400/30 dark:text-cyan-300' };
  if (t === 'Heatwave')
    return { label: 'HEAT', icon: Thermometer, cls: 'bg-red-500/10 text-red-700 border-red-400/30 dark:text-red-300' };
  return { label: 'UNKNOWN', icon: HelpCircle, cls: 'bg-muted/60 text-muted-foreground border-border/60' };
}

// ── Severity band ─────────────────────────────────────────────────────────────
function SeverityBand({ scenario }: { scenario: Scenario }) {
  const score = deriveSeverity(scenario);
  const priorityScore = scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1;
  const custScore = Math.min(2, Math.floor((scenario.customers_impacted ?? 0) / 500));

  const color =
    score >= 4 ? 'bg-red-500 border-red-400' :
    score === 3 ? 'bg-amber-500 border-amber-400' :
    'bg-emerald-500 border-emerald-400';

  const labelColor =
    score >= 4 ? 'text-red-600 dark:text-red-400' :
    score === 3 ? 'text-amber-600 dark:text-amber-400' :
    'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="space-y-1">
      {/* Dot strip */}
      <span
        className="flex items-center gap-0.5"
        title={`Sev ${score}/5 · Priority=${priorityScore} + Customers=${custScore} (derived)`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'inline-block h-2 w-2 rounded-full border',
              i < score ? color : 'bg-muted border-border/40',
            )}
          />
        ))}
      </span>
      {/* Numeric label */}
      <div className="flex items-center gap-1">
        <span className={cn('text-[10px] font-bold tabular-nums', labelColor)}>{score}/5</span>
        <span className="text-[9px] text-muted-foreground leading-none">derived</span>
      </div>
    </div>
  );
}

// ── ETR Band cell ─────────────────────────────────────────────────────────────
function EtrBandCell({ scenario }: { scenario: Scenario }) {
  const band = formatEtrBand(scenario.etr_earliest, scenario.etr_latest);
  const { label, pct } = parseConfidence(scenario.etr_confidence);
  const confClass = confidenceBadgeClass(scenario.etr_confidence);

  if (!band) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="space-y-0.5">
      <span className="text-xs text-foreground font-semibold tabular-nums">{band}</span>
      <div className="flex items-center gap-1">
        <span className={cn('inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-semibold', confClass)}>
          {label} {pct}%
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground italic">AI-estimated</span>
    </div>
  );
}

// ── Critical Load cell ────────────────────────────────────────────────────────
function CritLoadCell({ scenario }: { scenario: Scenario }) {
  if (!scenario.has_critical_load) return <span className="text-xs text-muted-foreground">—</span>;

  const types = (scenario.critical_load_types as string[] ?? []);
  const hospitalCount = types.filter((t) => t.toLowerCase().includes('hospital')).length;
  const waterCount = types.filter((t) => t.toLowerCase().includes('water')).length;
  const shelterCount = types.filter((t) => t.toLowerCase().includes('shelter')).length;
  const remaining = scenario.backup_runtime_remaining_hours;
  const threshold = scenario.critical_escalation_threshold_hours;
  const atRisk = remaining != null && threshold != null && remaining <= threshold;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <Zap className={cn('h-3 w-3 shrink-0', atRisk ? 'text-red-500' : 'text-amber-500')} />
        <span className={cn('text-[10px] font-semibold', atRisk ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400')}>
          {atRisk ? 'AT RISK' : 'Exposed'}
        </span>
      </div>
      {hospitalCount > 0 && <span className="block text-[9px] text-muted-foreground">🏥 {hospitalCount} Hospital{hospitalCount > 1 ? 's' : ''}</span>}
      {waterCount > 0 && <span className="block text-[9px] text-muted-foreground">💧 {waterCount} Water</span>}
      {shelterCount > 0 && <span className="block text-[9px] text-muted-foreground">🏠 {shelterCount} Shelter</span>}
      {types.filter((t) => !['hospital', 'water', 'shelter'].some((k) => t.toLowerCase().includes(k))).slice(0, 1).map((t) => (
        <span key={t} className="block text-[9px] text-muted-foreground">{t}</span>
      ))}
      {remaining != null && (
        <span className={cn('block text-[9px] font-semibold tabular-nums', atRisk ? 'text-red-500' : 'text-amber-500')}>
          {remaining.toFixed(1)}h left
        </span>
      )}
    </div>
  );
}

// ── Crew cell ─────────────────────────────────────────────────────────────────
function CrewCell({ scenario, policyEntry }: { scenario: Scenario; policyEntry: PolicyEntry | undefined }) {
  // If policy evaluated → show policy-driven crew status
  if (policyEntry?.status === 'done' && policyEntry.result) {
    const flags = policyEntry.result.escalationFlags ?? [];
    const crewShortfall = flags.includes('insufficient_crews');
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <Users className={cn('h-3 w-3 shrink-0', crewShortfall ? 'text-red-500' : 'text-emerald-500')} />
          <span className={cn('text-[10px] font-semibold', crewShortfall ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {crewShortfall ? 'Shortage' : 'Ready'}
          </span>
        </div>
        {crewShortfall && (
          <span className="block text-[9px] text-amber-600 dark:text-amber-400">↳ Blocks switching</span>
        )}
      </div>
    );
  }

  // Baseline: show operator_role assignment, or "Unassigned"
  if (scenario.operator_role) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="text-[10px] font-medium text-foreground truncate max-w-[72px]">{scenario.operator_role}</span>
        </div>
        <span className="block text-[9px] text-muted-foreground">Assigned</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Users className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      <span className="text-[10px] text-muted-foreground">Unassigned</span>
    </div>
  );
}

// ── Hazard cell ───────────────────────────────────────────────────────────────
function HazardCell({ scenario }: { scenario: Scenario }) {
  const { label, icon: Icon, cls } = hazardTag(scenario.outage_type);
  const isActive = scenario.lifecycle_stage === 'Event';

  return (
    <div className="space-y-0.5">
      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold', cls)}>
        <Icon className="h-2.5 w-2.5" />
        {label}
      </span>
      {isActive && (
        <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-medium">Active hazard</span>
      )}
    </div>
  );
}

// ── Escalation cell ───────────────────────────────────────────────────────────
function EscalationCell({ scenario, policyEntry }: { scenario: Scenario; policyEntry: PolicyEntry | undefined }) {
  const requiresEscalation =
    scenario.has_critical_load &&
    scenario.backup_runtime_remaining_hours != null &&
    scenario.critical_escalation_threshold_hours != null &&
    scenario.backup_runtime_remaining_hours <= scenario.critical_escalation_threshold_hours;

  const flags = policyEntry?.result?.escalationFlags ?? [];

  if (!requiresEscalation && flags.length === 0 && scenario.priority !== 'high') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5">
      {requiresEscalation && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Escalate</span>
        </div>
      )}
      {flags.slice(0, 2).map((f) => (
        <span key={f} className="block rounded-full bg-amber-500/10 border border-amber-400/30 px-1.5 py-px text-[9px] font-medium text-amber-700 dark:text-amber-300 w-fit">
          {f.replace(/_/g, ' ')}
        </span>
      ))}
      {!requiresEscalation && flags.length === 0 && scenario.priority === 'high' && (
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Monitor</span>
      )}
    </div>
  );
}

// ── Policy cell ────────────────────────────────────────────────────────────────
function PolicyCell({ entry, onRun, eventId }: { entry: PolicyEntry | undefined; onRun: (id: string) => void; eventId: string }) {
  if (!entry || entry.status === 'idle') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onRun(eventId); }}
        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
      >
        <Play className="h-2.5 w-2.5" />
        Run Copilot
      </button>
    );
  }
  if (entry.status === 'loading') {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Evaluating…</span>
      </div>
    );
  }
  if (entry.status === 'error') {
    return <span className="text-[10px] text-destructive">Eval failed</span>;
  }

  const gate = entry.result?.policyGate ?? 'PASS';
  const icon =
    gate === 'BLOCK' ? <ShieldX className="h-3 w-3 text-red-400" />
    : gate === 'WARN' ? <ShieldAlert className="h-3 w-3 text-amber-400" />
    : <ShieldCheck className="h-3 w-3 text-emerald-400" />;
  const cls =
    gate === 'BLOCK' ? 'bg-red-500/10 border-red-400/40 text-red-700 dark:text-red-300'
    : gate === 'WARN' ? 'bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300'
    : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-300';
  const allowed = entry.result?.allowedActions?.length ?? 0;
  const blocked = entry.result?.blockedActions?.length ?? 0;

  return (
    <div className="space-y-0.5">
      <div className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls)}>
        {icon}
        {gate}
      </div>
      <div className="flex gap-1.5 text-[10px]">
        <span className="text-emerald-600 dark:text-emerald-400">✓{allowed}</span>
        <span className="text-red-600 dark:text-red-400">✗{blocked}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface EventTableProps {
  scenarios: Scenario[];
  policyMap?: Record<string, PolicyEntry>;
  onRowClick: (scenario: Scenario) => void;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
  onRunCopilot?: (id: string) => void;
  bordered?: boolean;
}

export function EventTable({
  scenarios, policyMap = {}, onRowClick, onEdit, onDelete, onRunCopilot, bordered = true,
}: EventTableProps) {
  return (
    <div className={cn('bg-card overflow-hidden', bordered && 'rounded-xl border border-border/50 shadow-sm')}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="font-semibold min-w-[200px]">Event / OMS Tag</TableHead>
              <TableHead className="font-semibold min-w-[80px]">Phase</TableHead>
              <TableHead className="font-semibold min-w-[90px]">Hazard</TableHead>
              <TableHead className="font-semibold min-w-[60px]">Priority</TableHead>
              <TableHead className="font-semibold min-w-[80px]">
                <span title="Derived: Priority score (1-3) + Customer impact tier (0-2)">Severity ⓘ</span>
              </TableHead>
              <TableHead className="font-semibold min-w-[110px]">ETR Band</TableHead>
              <TableHead className="font-semibold min-w-[100px]">Crit. Load</TableHead>
              <TableHead className="font-semibold min-w-[80px]">Crew</TableHead>
              <TableHead className="font-semibold min-w-[100px]">Escalation</TableHead>
              <TableHead className="font-semibold min-w-[90px]">Policy</TableHead>
              <TableHead className="font-semibold min-w-[70px]">Updated</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.map((scenario) => {
              const omsTag = scenario.feeder_id
                ? `Feeder ${scenario.feeder_id}`
                : scenario.fault_id
                ? `Fault ${scenario.fault_id}`
                : null;

              const lifecycleClass =
                scenario.lifecycle_stage === 'Pre-Event' ? 'bg-primary/10 text-primary border-primary/30'
                : scenario.lifecycle_stage === 'Event' ? 'bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-300'
                : 'bg-muted/60 text-muted-foreground border-border/60';

              const priorityClass =
                scenario.priority === 'high' ? 'bg-red-500/10 text-red-700 border-red-500/40 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50'
                : scenario.priority === 'medium' ? 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300'
                : 'bg-muted/60 text-muted-foreground border-border/60';

              return (
                <TableRow
                  key={scenario.id}
                  className="cursor-pointer group transition-colors hover:bg-primary/5 border-b border-border/30"
                  onClick={() => onRowClick(scenario)}
                >
                  {/* Name + OMS tag */}
                  <TableCell className="font-medium py-3">
                    <div>
                      <span className="group-hover:text-primary transition-colors text-sm font-semibold">
                        {scenario.name}
                      </span>
                      {omsTag && (
                        <span className="ml-2 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/40">
                          {omsTag}
                        </span>
                      )}
                      {scenario.location_name && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {scenario.location_name}{scenario.service_area && ` · ${scenario.service_area}`}
                        </p>
                      )}
                      {scenario.customers_impacted != null && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {scenario.customers_impacted.toLocaleString()} customers
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Phase */}
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', lifecycleClass)}>
                      {scenario.lifecycle_stage}
                    </span>
                  </TableCell>

                  {/* Hazard tag */}
                  <TableCell>
                    <HazardCell scenario={scenario} />
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', priorityClass)}>
                      {scenario.priority ?? 'medium'}
                    </span>
                  </TableCell>

                  {/* Severity — deterministic, derived, stored */}
                  <TableCell>
                    <SeverityBand scenario={scenario} />
                  </TableCell>

                  {/* ETR band — duration range + confidence % + AI-estimated label */}
                  <TableCell>
                    <EtrBandCell scenario={scenario} />
                  </TableCell>

                  {/* Critical load — type breakdown */}
                  <TableCell>
                    <CritLoadCell scenario={scenario} />
                  </TableCell>

                  {/* Crew constraint — derived from policy result */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <CrewCell scenario={scenario} policyEntry={policyMap[scenario.id]} />
                  </TableCell>

                  {/* Escalation flags */}
                  <TableCell>
                    <EscalationCell scenario={scenario} policyEntry={policyMap[scenario.id]} />
                  </TableCell>

                  {/* Policy gate */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <PolicyCell
                      entry={policyMap[scenario.id]}
                      onRun={onRunCopilot ?? (() => {})}
                      eventId={scenario.id}
                    />
                  </TableCell>

                  {/* Updated */}
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}
                  </TableCell>

                  {/* Actions menu */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(scenario); }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(scenario); }}>
                          Edit Event
                        </DropdownMenuItem>
                        {onRunCopilot && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRunCopilot(scenario.id); }}>
                            Run Copilot
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
                          className="text-destructive"
                        >
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
