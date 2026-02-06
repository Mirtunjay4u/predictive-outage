import { Shield, Zap, Droplets, ThermometerSun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface SafetyRiskPanelProps {
  scenarios: Scenario[];
}

export function SafetyRiskPanel({ scenarios }: SafetyRiskPanelProps) {
  const activeEvents = scenarios.filter(s => s.lifecycle_stage === 'Event');

  // Derive safety metrics
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
    { label: 'Critical Load at Risk', value: criticalLoadEvents, icon: Shield, alert: criticalLoadEvents > 0 },
    { label: 'Runway Breaches', value: runwayBreaches, icon: Zap, alert: runwayBreaches > 0 },
    { label: 'Weather-Driven Events', value: weatherDriven, icon: Droplets, alert: false },
    { label: 'High Priority Active', value: highPriorityActive, icon: ThermometerSun, alert: highPriorityActive > 2 },
  ];

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Safety & Risk Exposure
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
