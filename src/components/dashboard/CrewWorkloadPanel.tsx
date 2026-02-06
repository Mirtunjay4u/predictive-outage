import { Users, Truck, Coffee, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCrewsWithAvailability } from '@/hooks/useCrews';
import type { Scenario } from '@/types/scenario';

interface CrewWorkloadPanelProps {
  scenarios: Scenario[];
}

export function CrewWorkloadPanel({ scenarios }: CrewWorkloadPanelProps) {
  const { data: crews = [] } = useCrewsWithAvailability();

  const activeEvents = scenarios.filter(s => s.lifecycle_stage === 'Event');
  const assignedEventIds = new Set(crews.filter(c => c.assigned_event_id).map(c => c.assigned_event_id));
  const unassignedBacklog = activeEvents.filter(s => !assignedEventIds.has(s.id)).length;

  const onShift = crews.filter(c => c.shiftStatus === 'on_shift').length;
  const onBreak = crews.filter(c => c.shiftStatus === 'on_break').length;
  const offDuty = crews.filter(c => c.shiftStatus === 'off_duty').length;
  const dispatched = crews.filter(c => c.status === 'dispatched' || c.status === 'en_route' || c.status === 'on_site').length;

  const metrics = [
    { label: 'On Shift', value: onShift, icon: Users, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Dispatched / En Route', value: dispatched, icon: Truck, color: 'text-primary' },
    { label: 'On Break', value: onBreak, icon: Coffee, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Off Duty', value: offDuty, icon: Moon, color: 'text-muted-foreground/60' },
    { label: 'Unassigned Backlog', value: unassignedBacklog, icon: Users, color: unassignedBacklog > 0 ? 'text-destructive' : 'text-muted-foreground/40' },
  ];

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Crew & Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-1.5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="flex items-center justify-between px-3 py-1.5 rounded-md"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn('w-3.5 h-3.5 shrink-0', m.color)} strokeWidth={1.75} />
                  <span className="text-[12px] text-foreground/80 truncate">{m.label}</span>
                </div>
                <span className={cn(
                  'text-[15px] font-bold tabular-nums ml-3 shrink-0',
                  m.value > 0 ? m.color : 'text-muted-foreground/40'
                )}>
                  {m.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
