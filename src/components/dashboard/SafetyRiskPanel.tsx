import { Shield, Zap, Droplets, ThermometerSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS } from '@/lib/dashboard';
import type { Scenario } from '@/types/scenario';

interface SafetyRiskPanelProps {
  scenarios: Scenario[];
}

export function SafetyRiskPanel({ scenarios }: SafetyRiskPanelProps) {
  const navigate = useNavigate();
  const activeEvents = scenarios.filter(s => s.lifecycle_stage === 'Event');

  const criticalLoadEvents = activeEvents.filter(s => s.has_critical_load).length;
  const runwayBreaches = activeEvents.filter(s =>
    s.has_critical_load &&
    s.backup_runtime_remaining_hours !== null &&
    s.backup_runtime_remaining_hours < (s.critical_escalation_threshold_hours ?? 4)
  ).length;
  const weatherDriven = activeEvents.filter(s =>
    s.outage_type && ['Storm', 'Flood', 'Heavy Rain', 'Heatwave', 'Wildfire', 'Lightning', 'Ice/Snow', 'High Wind', 'Snow Storm'].includes(s.outage_type)
  ).length;
  const highPriorityActive = activeEvents.filter(s => s.priority === 'high').length;

  const metrics = [
    { label: 'Critical Load at Risk', value: criticalLoadEvents, icon: Shield, alert: criticalLoadEvents > 0, path: '/events?lifecycle=Event&critical_load=true' },
    { label: 'Runway Breaches', value: runwayBreaches, icon: Zap, alert: runwayBreaches > 0, path: '/events?lifecycle=Event&critical_load=true' },
    { label: 'Weather-Driven Events', value: weatherDriven, icon: Droplets, alert: false, path: '/events?lifecycle=Event&outage_category=weather' },
    { label: 'High Priority Active', value: highPriorityActive, icon: ThermometerSun, alert: highPriorityActive > 2, path: '/events?lifecycle=Event&priority=high' },
  ];

  return (
    <Card data-tour="safety-risk-panel" className="border-border/50">
      <CardHeader className="pb-2.5 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75 leading-tight">
            Safety & Risk Exposure
          </CardTitle>
          <div className="w-7 h-7 rounded-md bg-destructive/10 text-destructive/70 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="space-y-1">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => navigate(m.path)}
                className={cn('flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    m.alert ? 'text-destructive' : 'text-muted-foreground/60'
                  )} strokeWidth={1.75} />
                  <span className="text-[12px] text-foreground/80 truncate">{m.label}</span>
                </div>
                <span className={cn(
                  'text-[15px] font-bold tabular-nums ml-3 shrink-0',
                  m.alert ? 'text-destructive' : m.value > 0 ? 'text-foreground' : 'text-muted-foreground/40'
                )}>
                  {m.value}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
