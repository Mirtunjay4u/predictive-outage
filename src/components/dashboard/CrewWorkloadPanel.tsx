import { Users, Truck, Coffee, Moon, CalendarClock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCrewsWithAvailability } from '@/hooks/useCrews';
import type { Scenario } from '@/types/scenario';

interface CrewWorkloadPanelProps {
  scenarios: Scenario[];
}

export function CrewWorkloadPanel({ scenarios }: CrewWorkloadPanelProps) {
  const navigate = useNavigate();
  const { data: crews = [] } = useCrewsWithAvailability();

  const activeEvents = scenarios.filter(s => s.lifecycle_stage === 'Event');
  const assignedEventIds = new Set(crews.filter(c => c.assigned_event_id).map(c => c.assigned_event_id));
  const unassignedBacklog = activeEvents.filter(s => !assignedEventIds.has(s.id)).length;

  const onShift = crews.filter(c => c.shiftStatus === 'on_shift').length;
  const onBreak = crews.filter(c => c.shiftStatus === 'on_break').length;
  const offDuty = crews.filter(c => c.shiftStatus === 'off_duty').length;
  const dispatched = crews.filter(c => c.status === 'dispatched' || c.status === 'en_route' || c.status === 'on_site').length;

  const plannedEvents = scenarios.filter(s => s.lifecycle_stage === 'Pre-Event').length;
  const unplannedEvents = activeEvents.length;

  const metrics = [
    { label: 'On Shift', value: onShift, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', path: '/outage-map?crew_filter=on_shift' },
    { label: 'Dispatched / En Route', value: dispatched, icon: Truck, color: 'text-primary', path: '/outage-map?crew_filter=dispatched' },
    { label: 'On Break', value: onBreak, icon: Coffee, color: 'text-amber-600 dark:text-amber-400', path: '/outage-map?crew_filter=on_break' },
    { label: 'Off Duty', value: offDuty, icon: Moon, color: 'text-muted-foreground/60', path: '/outage-map?crew_filter=off_duty' },
    { label: 'Unassigned Backlog', value: unassignedBacklog, icon: AlertCircle, color: unassignedBacklog > 0 ? 'text-destructive' : 'text-muted-foreground/40', path: '/events?lifecycle=Event&assigned=unassigned' },
    { label: 'Planned Events', value: plannedEvents, icon: CalendarClock, color: 'text-sky-500 dark:text-sky-400', path: '/events?lifecycle=Pre-Event' },
    { label: 'Unplanned Events', value: unplannedEvents, icon: AlertCircle, color: 'text-orange-500 dark:text-orange-400', path: '/events?lifecycle=Event' },
  ];

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-2.5 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75 leading-tight">
            Crew & Workload
          </CardTitle>
          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary/70 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-1.5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                onClick={() => navigate(m.path)}
                className="flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer hover:bg-muted/40 transition-colors"
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
