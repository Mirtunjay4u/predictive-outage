import { useNavigate } from 'react-router-dom';
import { Shield, Wind, Gauge, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS } from '@/lib/dashboard';
import type { Scenario } from '@/types/scenario';

type PostureLevel = 'Stable' | 'Elevated' | 'Critical';

function deriveLevel(value: number, thresholds: [number, number]): PostureLevel {
  if (value >= thresholds[1]) return 'Critical';
  if (value >= thresholds[0]) return 'Elevated';
  return 'Stable';
}

const LEVEL_CLASS: Record<PostureLevel, string> = {
  Stable: 'text-sky-300 dark:text-sky-300 text-sky-700',
  Elevated: 'text-amber-300 dark:text-amber-300 text-amber-700',
  Critical: 'text-red-300 dark:text-red-300 text-red-700',
};

const DOT_CLASS: Record<PostureLevel, string> = {
  Stable: 'bg-sky-400',
  Elevated: 'bg-amber-400',
  Critical: 'bg-red-400',
};

interface Indicator {
  label: string;
  value: string;
  level: PostureLevel;
  icon: React.ElementType;
  path: string;
}

interface OperationalRiskPostureBarProps {
  scenarios: Scenario[];
  /** Optional active hazard label for Hazard Exposure value */
  hazardLabel?: string;
  /** Optional hazard severity for deriving hazard exposure level */
  hazardSeverity?: 'Low' | 'Moderate' | 'Severe';
  className?: string;
}

export function OperationalRiskPostureBar({
  scenarios,
  hazardLabel,
  hazardSeverity,
  className,
}: OperationalRiskPostureBarProps) {
  const navigate = useNavigate();
  const activeEvents = scenarios.filter((s) => s.lifecycle_stage === 'Event');

  // 1. Critical Load Risk
  const criticalLoadCount = activeEvents.filter((s) => s.has_critical_load).length;
  const criticalLevel = deriveLevel(criticalLoadCount, [1, 3]);
  const criticalValue = criticalLoadCount === 0 ? 'None' : criticalLoadCount >= 3 ? 'Critical' : 'Elevated';

  // 2. Hazard Exposure
  const hazardLevel: PostureLevel =
    hazardSeverity === 'Severe' ? 'Critical' : hazardSeverity === 'Moderate' ? 'Elevated' : 'Stable';
  const hazardValue = hazardLabel
    ? `${hazardLevel === 'Critical' ? 'High' : hazardLevel === 'Elevated' ? 'Moderate' : 'Low'}${hazardLabel ? ` (${hazardLabel})` : ''}`
    : hazardLevel === 'Critical' ? 'High' : hazardLevel === 'Elevated' ? 'Moderate' : 'Low';

  // 3. ETR Confidence Distribution
  const confidenceCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  activeEvents.forEach((s) => {
    const c = (s.etr_confidence ?? '').toUpperCase();
    if (c === 'HIGH') confidenceCounts.HIGH++;
    else if (c === 'MEDIUM') confidenceCounts.MEDIUM++;
    else if (c === 'LOW') confidenceCounts.LOW++;
  });
  const dominantBand =
    confidenceCounts.HIGH >= confidenceCounts.MEDIUM && confidenceCounts.HIGH >= confidenceCounts.LOW
      ? 'High'
      : confidenceCounts.MEDIUM >= confidenceCounts.LOW
        ? 'Medium'
        : 'Low';
  const etrLevel: PostureLevel = dominantBand === 'Low' ? 'Critical' : dominantBand === 'Medium' ? 'Elevated' : 'Stable';
  const etrValue = activeEvents.length === 0 ? 'No Active ETRs' : `${dominantBand} Band Dominant`;

  // 4. Crew Readiness
  const highPriorityCount = activeEvents.filter((s) => s.priority === 'high').length;
  const crewLevel = deriveLevel(highPriorityCount, [3, 6]);
  const crewValue = crewLevel === 'Critical' ? 'Constrained' : crewLevel === 'Elevated' ? 'Stretched' : 'Adequate';

  const indicators: Indicator[] = [
    { label: 'Critical Load Risk', value: criticalValue, level: criticalLevel, icon: Shield, path: '/events?lifecycle=Event&critical_load=true' },
    { label: 'Hazard Exposure', value: hazardValue, level: hazardLevel, icon: Wind, path: '/weather-alerts' },
    { label: 'ETR Confidence', value: etrValue, level: etrLevel, icon: Gauge, path: '/events?lifecycle=Event' },
    { label: 'Crew Readiness', value: crewValue, level: crewLevel, icon: Users, path: '/outage-map' },
  ];

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0 sm:mr-4">
          Operational Risk Posture
        </span>
        <div className="flex flex-wrap items-center gap-1 sm:gap-0 sm:divide-x sm:divide-border/40 flex-1">
          {indicators.map((ind) => {
            const Icon = ind.icon;
            return (
              <button
                key={ind.label}
                type="button"
                onClick={() => navigate(ind.path)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-left min-w-0',
                  DASHBOARD_INTERACTIVE_BUTTON_CLASS,
                )}
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[ind.level])} />
                <Icon className="h-3 w-3 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
                <span className="text-[11px] text-muted-foreground/80 shrink-0">{ind.label}:</span>
                <span className={cn('text-[11px] font-semibold truncate', LEVEL_CLASS[ind.level])}>
                  {ind.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
