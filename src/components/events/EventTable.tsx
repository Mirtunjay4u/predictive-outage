import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, MoreVertical, Zap, Play, Loader2, ShieldX, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { deriveSeverity } from '@/components/events/EventDetailPanel';
import type { Scenario } from '@/types/scenario';

// ── Policy state type (mirrors Events.tsx PolicyMap value) ─────────────────────
type PolicyEntry = { status: 'idle' | 'loading' | 'done' | 'error'; result: { policyGate?: string; allowedActions?: unknown[]; blockedActions?: unknown[]; escalationFlags?: string[] } | null };

// ── Column helper classes ─────────────────────────────────────────────────────
function priorityClass(p: string | null) {
  if (p === 'high') return 'bg-red-500/10 text-red-700 border-red-500/40 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50';
  if (p === 'medium') return 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300';
  return 'bg-muted/60 text-muted-foreground border-border/60';
}

function lifecycleClass(stage: string) {
  if (stage === 'Pre-Event') return 'bg-primary/10 text-primary border-primary/30';
  if (stage === 'Event') return 'bg-orange-500/10 text-orange-700 border-orange-400/30 dark:text-orange-300';
  return 'bg-muted/60 text-muted-foreground border-border/60';
}

function etrConfClass(conf: string | null) {
  if (conf === 'HIGH') return 'text-emerald-600 dark:text-emerald-400';
  if (conf === 'MEDIUM') return 'text-amber-600 dark:text-amber-400';
  if (conf === 'LOW') return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

function SeverityDots({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Severity ${score}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'inline-block h-2 w-2 rounded-full border',
            i < score
              ? score >= 4
                ? 'bg-red-500 border-red-400'
                : score === 3
                ? 'bg-amber-500 border-amber-400'
                : 'bg-emerald-500 border-emerald-400'
              : 'bg-muted border-border/40',
          )}
        />
      ))}
    </span>
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

interface EventTableProps {
  scenarios: Scenario[];
  policyMap?: Record<string, PolicyEntry>;
  onRowClick: (scenario: Scenario) => void;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
  onRunCopilot?: (id: string) => void;
  bordered?: boolean;
}

export function EventTable({ scenarios, policyMap = {}, onRowClick, onEdit, onDelete, onRunCopilot, bordered = true }: EventTableProps) {
  return (
    <div className={cn('bg-card overflow-hidden', bordered && 'rounded-xl border border-border/50 shadow-sm')}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="font-semibold min-w-[200px]">Event / OMS Tag</TableHead>
            <TableHead className="font-semibold">Phase</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Severity</TableHead>
            <TableHead className="font-semibold">ETR Band</TableHead>
            <TableHead className="font-semibold">Crit. Load</TableHead>
            <TableHead className="font-semibold">Escalation</TableHead>
            <TableHead className="font-semibold">Policy</TableHead>
            <TableHead className="font-semibold">Updated</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((scenario) => {
            const severity = deriveSeverity(scenario);
            const etrBand =
              scenario.etr_earliest && scenario.etr_latest
                ? `${format(new Date(scenario.etr_earliest), 'HH:mm')}–${format(new Date(scenario.etr_latest), 'HH:mm')}`
                : '—';
            const requiresEscalation =
              scenario.has_critical_load &&
              scenario.backup_runtime_remaining_hours != null &&
              scenario.critical_escalation_threshold_hours != null &&
              scenario.backup_runtime_remaining_hours <= scenario.critical_escalation_threshold_hours;

            // OMS-style feeder/substation tag from fault_id / feeder_id
            const omsTag = scenario.feeder_id
              ? `Feeder ${scenario.feeder_id}`
              : scenario.fault_id
              ? `Fault ${scenario.fault_id}`
              : null;

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
                        {scenario.location_name}
                        {scenario.service_area && ` · ${scenario.service_area}`}
                      </p>
                    )}
                    {scenario.customers_impacted != null && (
                      <p className="text-xs text-muted-foreground">
                        {scenario.customers_impacted.toLocaleString()} customers
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Lifecycle phase */}
                <TableCell>
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', lifecycleClass(scenario.lifecycle_stage))}>
                    {scenario.lifecycle_stage}
                  </span>
                </TableCell>

                {/* Outage type */}
                <TableCell>
                  <OutageTypeBadge type={scenario.outage_type} />
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', priorityClass(scenario.priority))}>
                    {scenario.priority ?? 'medium'}
                  </span>
                </TableCell>

                {/* Severity dots */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <SeverityDots score={severity} />
                    <span className="text-[10px] text-muted-foreground">{severity}/5</span>
                  </div>
                </TableCell>

                {/* ETR band + confidence */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-foreground tabular-nums font-medium">{etrBand}</span>
                    <span className={cn('text-[10px] font-semibold', etrConfClass(scenario.etr_confidence))}>
                      {scenario.etr_confidence ?? '—'} conf.
                    </span>
                  </div>
                </TableCell>

                {/* Critical load */}
                <TableCell>
                  {scenario.has_critical_load ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          {scenario.backup_runtime_remaining_hours != null
                            ? `${scenario.backup_runtime_remaining_hours.toFixed(1)}h left`
                            : 'Active'}
                        </span>
                      </div>
                      {(scenario.critical_load_types as string[] ?? []).slice(0, 2).map((t) => (
                        <span key={t} className="block text-[9px] text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Escalation flag */}
                <TableCell>
                  {requiresEscalation ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Escalate</span>
                    </div>
                  ) : scenario.priority === 'high' ? (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Monitor</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Policy evaluation cell */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <PolicyCell
                    entry={policyMap[scenario.id]}
                    onRun={onRunCopilot ?? (() => {})}
                    eventId={scenario.id}
                  />
                </TableCell>

                {/* Updated */}
                <TableCell className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}
                </TableCell>

                {/* Actions */}
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
  );
}
