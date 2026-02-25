import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Scenario } from '@/types/scenario';

interface ReadinessStripProps {
  scenarios: Scenario[];
}

interface MiniMetric {
  label: string;
  count: number;
  status: 'green' | 'amber' | 'red';
  route: string;
  tooltip: string;
}

export function ReadinessStrip({ scenarios }: ReadinessStripProps) {
  const navigate = useNavigate();

  const activeScenarios = scenarios.filter(s => s.lifecycle_stage === 'Event');

  const lowEtrConfidence = activeScenarios.filter(s => s.etr_confidence === 'LOW').length;
  const criticalLoadAtRisk = activeScenarios.filter(s =>
    s.has_critical_load &&
    s.backup_runtime_remaining_hours !== null &&
    s.critical_escalation_threshold_hours !== null &&
    s.backup_runtime_remaining_hours <= s.critical_escalation_threshold_hours
  ).length;
  const awaitingEtrValidation = activeScenarios.filter(s => !s.etr_expected).length;
  const weatherEscalation = activeScenarios.filter(s =>
    ['Storm', 'High Wind', 'Lightning', 'Wildfire', 'Heatwave'].includes(s.outage_type || '')
  ).length;
  const unassignedBacklog = activeScenarios.filter(s => !s.fault_id && !s.feeder_id).length;

  const getStatus = (count: number, amberThreshold: number, redThreshold: number): 'green' | 'amber' | 'red' => {
    if (count >= redThreshold) return 'red';
    if (count >= amberThreshold) return 'amber';
    return 'green';
  };

  const metrics: MiniMetric[] = [
    { label: 'Low ETR Confidence', count: lowEtrConfidence, status: getStatus(lowEtrConfidence, 1, 3), route: '/events?lifecycle=Event', tooltip: 'Events with low confidence in estimated time of restoration. These may need re-assessment or additional field data.' },
    { label: 'Critical Load at Risk', count: criticalLoadAtRisk, status: getStatus(criticalLoadAtRisk, 1, 2), route: '/events?lifecycle=Event', tooltip: 'Events affecting critical infrastructure (hospitals, water) where backup runtime is at or below the escalation threshold.' },
    { label: 'Awaiting ETR Validation', count: awaitingEtrValidation, status: getStatus(awaitingEtrValidation, 2, 4), route: '/events?lifecycle=Event', tooltip: 'Active events that have not yet received a validated estimated time of restoration from field or dispatch.' },
    { label: 'Weather Escalation', count: weatherEscalation, status: getStatus(weatherEscalation, 2, 4), route: '/events?lifecycle=Event', tooltip: 'Events driven by weather conditions (storm, wind, lightning, wildfire, heatwave) that may worsen or expand.' },
    { label: 'Unassigned Backlog', count: unassignedBacklog, status: getStatus(unassignedBacklog, 1, 3), route: '/events?lifecycle=Event', tooltip: 'Active events not yet assigned to a fault or feeder for field investigation or crew dispatch.' },
  ];

  const dotColor = {
    green: 'bg-success',
    amber: 'bg-warning',
    red: 'bg-destructive',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div data-tour="readiness-strip" className="mt-3 rounded-lg border border-border/50 bg-card shadow-card px-4 py-2.5">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
            Restoration Readiness (Next 6–12h)
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {metrics.map((m) => (
              <Tooltip key={m.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(m.route)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md flex-1 min-w-0',
                      'border border-border/40 bg-muted/30',
                      'hover:bg-muted/60 transition-colors cursor-pointer group'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[m.status])} />
                    <span className="text-lg font-bold tabular-nums text-foreground leading-none">{m.count}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight truncate">{m.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  {m.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
