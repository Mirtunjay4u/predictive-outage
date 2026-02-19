import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, MoreVertical, Zap } from 'lucide-react';
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

// ── Column helper classes ────────────────────────────────────────────────────
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

interface EventTableProps {
  scenarios: Scenario[];
  onRowClick: (scenario: Scenario) => void;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export function EventTable({ scenarios, onRowClick, onEdit, onDelete }: EventTableProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="font-semibold min-w-[180px]">Event</TableHead>
            <TableHead className="font-semibold">Phase</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Severity</TableHead>
            <TableHead className="font-semibold">ETR Conf.</TableHead>
            <TableHead className="font-semibold">Crit. Load</TableHead>
            <TableHead className="font-semibold">Escalation</TableHead>
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

            return (
              <TableRow
                key={scenario.id}
                className="cursor-pointer group transition-colors hover:bg-primary/5 border-b border-border/30"
                onClick={() => onRowClick(scenario)}
              >
                {/* Name + description */}
                <TableCell className="font-medium py-3">
                  <div>
                    <span className="group-hover:text-primary transition-colors text-sm">
                      {scenario.name}
                    </span>
                    {scenario.location_name && (
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {scenario.location_name}
                      </p>
                    )}
                    {scenario.customers_impacted != null && (
                      <p className="text-xs text-muted-foreground">
                        {scenario.customers_impacted.toLocaleString()} cust.
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Lifecycle phase */}
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    lifecycleClass(scenario.lifecycle_stage),
                  )}>
                    {scenario.lifecycle_stage}
                  </span>
                </TableCell>

                {/* Outage type */}
                <TableCell>
                  <OutageTypeBadge type={scenario.outage_type} />
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
                    priorityClass(scenario.priority),
                  )}>
                    {scenario.priority ?? 'medium'}
                  </span>
                </TableCell>

                {/* Severity dots */}
                <TableCell>
                  <SeverityDots score={severity} />
                </TableCell>

                {/* ETR band + confidence */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground tabular-nums">{etrBand}</span>
                    <span className={cn('text-[11px] font-semibold', etrConfClass(scenario.etr_confidence))}>
                      {scenario.etr_confidence ?? '—'}
                    </span>
                  </div>
                </TableCell>

                {/* Critical load */}
                <TableCell>
                  {scenario.has_critical_load ? (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {scenario.backup_runtime_remaining_hours != null
                          ? `${scenario.backup_runtime_remaining_hours.toFixed(1)}h`
                          : 'Active'}
                      </span>
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
