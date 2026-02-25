import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface OperationalTimelineProps {
  scenarios: Scenario[];
}

interface TimelineItem {
  id: string;
  name: string;
  outageType: Scenario['outage_type'];
  urgencyLabel: string;
  urgencyColor: string;
  score: number;
}

function getUrgencyInfo(s: Scenario): { label: string; color: string; score: number } | null {
  // Critical-load runway < 6 hours
  if (
    s.has_critical_load &&
    s.backup_runtime_remaining_hours !== null &&
    s.backup_runtime_remaining_hours < 6
  ) {
    return {
      label: `Runway ${s.backup_runtime_remaining_hours.toFixed(1)}h`,
      color: 'text-destructive',
      score: 100 - s.backup_runtime_remaining_hours * 10,
    };
  }

  // Low ETR confidence
  if (s.etr_confidence === 'LOW') {
    return { label: 'ETR LOW', color: 'text-amber-600 dark:text-amber-400', score: 70 };
  }

  // Awaiting ETR validation
  if (!s.etr_expected && s.lifecycle_stage === 'Event') {
    return { label: 'Awaiting ETR', color: 'text-amber-600 dark:text-amber-400', score: 60 };
  }

  // Communications pending (high priority, large impact)
  if (s.priority === 'high' && s.customers_impacted && s.customers_impacted > 500) {
    return { label: 'Comms Pending', color: 'text-primary', score: 55 };
  }

  // High priority active
  if (s.priority === 'high' && s.lifecycle_stage === 'Event') {
    return { label: 'High Priority', color: 'text-destructive', score: 50 };
  }

  return null;
}

export function OperationalTimeline({ scenarios }: OperationalTimelineProps) {
  const navigate = useNavigate();

  const items: TimelineItem[] = scenarios
    .map((s) => {
      const info = getUrgencyInfo(s);
      if (!info) return null;
      return {
        id: s.id,
        name: s.name,
        outageType: s.outage_type,
        urgencyLabel: info.label,
        urgencyColor: info.color,
        score: info.score,
      };
    })
    .filter((item): item is TimelineItem => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  return (
    <Card data-tour="operational-timeline" className="border-border/50">
      <CardHeader className="pb-2.5 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75 leading-tight">
            Next 6 Hours — Operational Timeline
          </CardTitle>
          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary/70 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 px-3 py-4 text-center">
            No urgent items in the next 6 hours.
          </p>
        ) : (
          <ScrollArea className="max-h-[180px]">
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/event/${item.id}`)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md',
                    'hover:bg-muted/50 transition-colors text-left group cursor-pointer'
                  )}
                >
                  <span className="text-[12px] font-medium text-foreground/80 group-hover:text-foreground transition-colors truncate min-w-0 flex-1">
                    {item.name}
                  </span>
                  <OutageTypeBadge
                    type={item.outageType}
                    className="text-[9px] px-1.5 py-0.5 shrink-0 hidden xl:inline-flex"
                  />
                  <span
                    className={cn(
                      'text-[10px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded',
                      item.urgencyColor
                    )}
                  >
                    {item.urgencyLabel}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
