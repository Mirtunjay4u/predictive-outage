import { motion } from 'framer-motion';
import { Calendar, Clock, User, MoreVertical, Zap, AlertTriangle, Play, Loader2, ShieldX, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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

type PolicyEntry = {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: { policyGate?: string; allowedActions?: unknown[]; blockedActions?: unknown[]; escalationFlags?: string[] } | null;
};

function SeverityBar({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Severity ${score}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn(
          'inline-block h-1.5 w-5 rounded-sm',
          i < score
            ? score >= 4 ? 'bg-red-500' : score === 3 ? 'bg-amber-500' : 'bg-emerald-500'
            : 'bg-muted/60',
        )} />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">{score}/5</span>
    </span>
  );
}

function PolicyChip({ entry, onRun }: { entry: PolicyEntry | undefined; onRun: () => void }) {
  if (!entry || entry.status === 'idle') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onRun(); }}
        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Play className="h-2.5 w-2.5" />Run Copilot
      </button>
    );
  }
  if (entry.status === 'loading') return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Evaluating…</span>;
  if (entry.status === 'error') return <span className="text-[10px] text-destructive">Eval failed</span>;

  const gate = entry.result?.policyGate ?? 'PASS';
  const icon = gate === 'BLOCK' ? <ShieldX className="h-3 w-3" /> : gate === 'WARN' ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />;
  const cls = gate === 'BLOCK' ? 'bg-red-500/10 border-red-400/40 text-red-700 dark:text-red-300'
    : gate === 'WARN' ? 'bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300'
    : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-300';
  const allowed = entry.result?.allowedActions?.length ?? 0;
  const blocked = entry.result?.blockedActions?.length ?? 0;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls)}>
        {icon}{gate}
      </span>
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓{allowed}</span>
      <span className="text-[10px] text-red-600 dark:text-red-400">✗{blocked}</span>
    </div>
  );
}

interface EventCardProps {
  scenario: Scenario;
  policyState?: PolicyEntry;
  onClick: () => void;
  onDelete: () => void;
  onRunCopilot?: () => void;
}

export function EventCard({ scenario, policyState, onClick, onDelete, onRunCopilot }: EventCardProps) {
  const lifecycleVariant = scenario.lifecycle_stage === 'Pre-Event' ? 'pre-event'
    : scenario.lifecycle_stage === 'Event' ? 'event' : 'post-event';

  const severity = deriveSeverity(scenario);
  const etrBand = scenario.etr_earliest && scenario.etr_latest
    ? `${format(new Date(scenario.etr_earliest), 'HH:mm')}–${format(new Date(scenario.etr_latest), 'HH:mm')}`
    : null;

  const requiresEscalation =
    scenario.has_critical_load &&
    scenario.backup_runtime_remaining_hours != null &&
    scenario.critical_escalation_threshold_hours != null &&
    scenario.backup_runtime_remaining_hours <= scenario.critical_escalation_threshold_hours;

  const omsTag = scenario.feeder_id ? `Feeder ${scenario.feeder_id}` : scenario.fault_id ? `Fault ${scenario.fault_id}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className="cursor-pointer group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/40 bg-card h-full"
        onClick={onClick}
      >
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <OutageTypeBadge type={scenario.outage_type} />
                {omsTag && (
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/40">
                    {omsTag}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-base">
                {scenario.name}
              </h3>
              {scenario.location_name && (
                <p className="text-xs text-muted-foreground mt-0.5">{scenario.location_name}{scenario.service_area ? ` · ${scenario.service_area}` : ''}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 -mr-1 -mt-1 flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>View Details</DropdownMenuItem>
                {onRunCopilot && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRunCopilot(); }}>Run Copilot</DropdownMenuItem>}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">Delete Event</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Phase + lifecycle */}
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge variant={scenario.stage ? 'active' : 'inactive'}>{scenario.stage ? 'Active' : 'Inactive'}</StatusBadge>
            <StatusBadge variant={lifecycleVariant}>{scenario.lifecycle_stage}</StatusBadge>
            {scenario.priority === 'high' && (
              <span className="inline-flex items-center rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300">High Priority</span>
            )}
          </div>

          {/* Severity bar */}
          <SeverityBar score={severity} />

          {/* Key metrics row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {scenario.customers_impacted != null && (
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Customers</span>
                <span className="font-semibold text-foreground tabular-nums">{scenario.customers_impacted.toLocaleString()}</span>
              </div>
            )}
            {etrBand && (
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">ETR Band</span>
                <span className="font-semibold text-foreground tabular-nums">{etrBand}</span>
                {scenario.etr_confidence && (
                  <span className={cn('text-[10px] font-semibold',
                    scenario.etr_confidence === 'HIGH' ? 'text-emerald-600 dark:text-emerald-400'
                    : scenario.etr_confidence === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                  )}>{scenario.etr_confidence} conf.</span>
                )}
              </div>
            )}
          </div>

          {/* Critical load */}
          {scenario.has_critical_load && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-500/5 px-2.5 py-1.5">
              <Zap className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-red-700 dark:text-red-300">
                    {(scenario.critical_load_types as string[] ?? []).join(', ') || 'Critical Load'}
                  </span>
                  {scenario.backup_runtime_remaining_hours != null && (
                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-300 tabular-nums shrink-0">
                      {scenario.backup_runtime_remaining_hours.toFixed(1)}h left
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Escalation warning */}
          {requiresEscalation && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Escalation required
            </div>
          )}

          {/* Policy chip */}
          <div className="pt-1 border-t border-border/40">
            <PolicyChip entry={policyState} onRun={onRunCopilot ?? (() => {})} />
          </div>

          {/* Footer meta */}
          <div className="space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2 mt-1">
            {scenario.operator_role && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{scenario.operator_role}</span>
              </div>
            )}
            {scenario.scenario_time && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{format(new Date(scenario.scenario_time), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Updated {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
