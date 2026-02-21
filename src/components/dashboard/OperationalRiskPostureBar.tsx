import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Wind, Gauge, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS } from '@/lib/dashboard';
import type { Scenario } from '@/types/scenario';

type PostureLevel = 'Stable' | 'Elevated' | 'Critical';

const LEVEL_CLASS: Record<PostureLevel, string> = {
  Stable: 'text-sky-700 dark:text-sky-300',
  Elevated: 'text-amber-700 dark:text-amber-300',
  Critical: 'text-red-700 dark:text-red-300',
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
  /** data-tour-section id to scroll to, OR a route path */
  target: string;
}

interface OperationalRiskPostureBarProps {
  scenarios: Scenario[];
  hazardLabel?: string;
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

  // ── 1. Critical Load Risk ─────────────────────────────────────────────
  // Stable  → No critical loads under threshold
  // Elevated → At least one critical load nearing runway threshold
  // Critical → Any load below escalation threshold
  const loadsAtRisk = activeEvents.filter(
    (s) =>
      s.has_critical_load &&
      s.backup_runtime_remaining_hours != null &&
      s.critical_escalation_threshold_hours != null &&
      s.backup_runtime_remaining_hours < s.critical_escalation_threshold_hours,
  );
  const loadsNearing = activeEvents.filter(
    (s) =>
      s.has_critical_load &&
      s.backup_runtime_remaining_hours != null &&
      s.critical_escalation_threshold_hours != null &&
      s.backup_runtime_remaining_hours >= s.critical_escalation_threshold_hours &&
      s.backup_runtime_remaining_hours < s.critical_escalation_threshold_hours * 1.5,
  );
  const criticalLevel: PostureLevel = loadsAtRisk.length > 0 ? 'Critical' : loadsNearing.length > 0 ? 'Elevated' : 'Stable';
  const criticalValue = criticalLevel === 'Critical' ? 'Critical' : criticalLevel === 'Elevated' ? 'Elevated' : 'Stable';

  // ── 2. Hazard Exposure ────────────────────────────────────────────────
  const hazardLevel: PostureLevel =
    hazardSeverity === 'Severe' ? 'Critical' : hazardSeverity === 'Moderate' ? 'Elevated' : 'Stable';
  const hazardValue = `${hazardLevel === 'Critical' ? 'High' : hazardLevel === 'Elevated' ? 'Moderate' : 'Low'}${hazardLabel ? ` (${hazardLabel})` : ''}`;

  // ── 3. ETR Confidence Distribution ────────────────────────────────────
  const confidenceCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  activeEvents.forEach((s) => {
    const c = (s.etr_confidence ?? '').toUpperCase();
    if (c === 'HIGH') confidenceCounts.HIGH++;
    else if (c === 'MEDIUM') confidenceCounts.MEDIUM++;
    else if (c === 'LOW') confidenceCounts.LOW++;
  });
  const hasLow = confidenceCounts.LOW > 0;
  const dominantBand =
    confidenceCounts.HIGH >= confidenceCounts.MEDIUM && confidenceCounts.HIGH >= confidenceCounts.LOW
      ? 'High'
      : confidenceCounts.MEDIUM >= confidenceCounts.LOW
        ? 'Medium'
        : 'Low';
  const etrLevel: PostureLevel = hasLow ? 'Critical' : dominantBand === 'Medium' ? 'Elevated' : 'Stable';
  const etrValue =
    activeEvents.length === 0
      ? 'No Active ETRs'
      : hasLow
        ? 'Low Confidence Present'
        : `${dominantBand} Confidence Dominant`;

  // ── 4. Crew Readiness ─────────────────────────────────────────────────
  // Adequate → low high-priority pressure
  // Constrained → moderate pressure
  // Critical → heavy pressure (proxy for insufficient crews)
  const highPriorityCount = activeEvents.filter((s) => s.priority === 'high').length;
  const totalActive = activeEvents.length;
  const crewLevel: PostureLevel =
    highPriorityCount >= 5 || totalActive >= 10 ? 'Critical' : highPriorityCount >= 2 || totalActive >= 5 ? 'Elevated' : 'Stable';
  const crewValue = crewLevel === 'Critical' ? 'Critical' : crewLevel === 'Elevated' ? 'Constrained' : 'Adequate';

  const indicators: Indicator[] = [
    { label: 'Critical Load Risk', value: criticalValue, level: criticalLevel, icon: Shield, target: 'safety-risk' },
    { label: 'Hazard Exposure', value: hazardValue, level: hazardLevel, icon: Wind, target: '/weather-alerts' },
    { label: 'ETR Confidence', value: etrValue, level: etrLevel, icon: Gauge, target: 'dashboard-kpi' },
    { label: 'Crew Readiness', value: crewValue, level: crewLevel, icon: Users, target: 'crew-workload' },
  ];

  const handleClick = useCallback(
    (target: string) => {
      if (target.startsWith('/')) {
        navigate(target);
        return;
      }
      // Scroll to section by data-tour-section attribute
      const el = document.querySelector(`[data-tour-section="${target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [navigate],
  );

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card px-4 py-2 shadow-sm max-h-16 overflow-hidden', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0 h-full">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0 sm:mr-3 leading-none">
          Operational Risk Posture
        </span>
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:divide-x sm:divide-border/40 flex-1 gap-0.5 sm:gap-0">
          {indicators.map((ind) => {
            const Icon = ind.icon;
            return (
              <button
                key={ind.label}
                type="button"
                onClick={() => handleClick(ind.target)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-left min-w-0',
                  DASHBOARD_INTERACTIVE_BUTTON_CLASS,
                )}
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASS[ind.level])} />
                <Icon className="h-3 w-3 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
                <span className="text-[10px] text-muted-foreground/80 shrink-0 hidden lg:inline">{ind.label}:</span>
                <span className="text-[10px] text-muted-foreground/80 shrink-0 lg:hidden">{ind.label.split(' ')[0]}:</span>
                <span className={cn('text-[10px] font-semibold truncate', LEVEL_CLASS[ind.level])}>
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
