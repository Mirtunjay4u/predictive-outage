import { useNavigate } from 'react-router-dom';
import { Inbox, Clock, AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface OperationalWorkQueueProps {
  scenarios: Scenario[];
}

interface QueueItem {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export function OperationalWorkQueue({ scenarios }: OperationalWorkQueueProps) {
  const navigate = useNavigate();

  const activeEvents = scenarios.filter(s => s.lifecycle_stage === 'Event');
  const postEvents = scenarios.filter(s => s.lifecycle_stage === 'Post-Event');

  // Derive operational queue counts
  const newUntriaged = activeEvents.filter(s => !s.priority).length;
  const awaitingEtr = activeEvents.filter(s => !s.etr_expected && s.priority).length;
  const criticalEscalations = activeEvents.filter(s => s.has_critical_load && s.backup_runtime_remaining_hours !== null && s.backup_runtime_remaining_hours < (s.critical_escalation_threshold_hours ?? 4)).length;
  const commsPending = activeEvents.filter(s => s.priority === 'high' && s.customers_impacted && s.customers_impacted > 500).length;
  const readyToClose = postEvents.length;

  const items: QueueItem[] = [
    {
      label: 'New Events (Untriaged)',
      count: newUntriaged,
      icon: Inbox,
      color: 'text-primary',
      onClick: () => navigate('/events?lifecycle=Event'),
    },
    {
      label: 'Awaiting ETR Validation',
      count: awaitingEtr,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      onClick: () => navigate('/events?lifecycle=Event'),
    },
    {
      label: 'Critical Load Escalations',
      count: criticalEscalations,
      icon: AlertTriangle,
      color: 'text-destructive',
      onClick: () => navigate('/events?lifecycle=Event&priority=high'),
    },
    {
      label: 'Communications Pending',
      count: commsPending,
      icon: MessageSquare,
      color: 'text-amber-600 dark:text-amber-400',
      onClick: () => navigate('/events?lifecycle=Event&priority=high'),
    },
    {
      label: 'Ready to Close',
      count: readyToClose,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/events?lifecycle=Post-Event'),
    },
  ];

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Operational Work Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="h-[calc(100%-0.5rem)]">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md',
                    'hover:bg-muted/50 transition-colors text-left group'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', item.color)} strokeWidth={1.75} />
                    <span className="text-[12px] text-foreground/80 group-hover:text-foreground transition-colors truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className={cn(
                    'text-[15px] font-bold tabular-nums ml-3 shrink-0',
                    item.count > 0 ? item.color : 'text-muted-foreground/40'
                  )}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
