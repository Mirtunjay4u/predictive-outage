import { useState } from 'react';
import { format } from 'date-fns';
import {
  CloudLightning, Cpu, Bot, UserCheck, ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDecisionLog, type DecisionLogEntry } from '@/hooks/useDecisionLog';

const SOURCE_CONFIG: Record<string, { icon: typeof Bot; label: string; className: string }> = {
  'Weather API': {
    icon: CloudLightning,
    label: 'Weather',
    className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  'Rule Engine': {
    icon: Cpu,
    label: 'Rules',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  Copilot: {
    icon: Bot,
    label: 'Copilot',
    className: 'bg-primary/15 text-primary border-primary/30',
  },
  Operator: {
    icon: UserCheck,
    label: 'Operator',
    className: 'bg-success/15 text-success border-success/30',
  },
};

function TimelineEntry({ entry }: { entry: DecisionLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = SOURCE_CONFIG[entry.source] ?? SOURCE_CONFIG.Operator;
  const Icon = config.icon;
  const isLong = entry.action_taken.length > 120 || (entry.rule_impact?.length ?? 0) > 80;

  return (
    <div className="flex gap-3 py-2.5 group">
      {/* Time + dot */}
      <div className="flex flex-col items-center pt-0.5 shrink-0 w-[52px]">
        <span className="text-[10px] font-mono text-muted-foreground leading-none">
          {format(new Date(entry.timestamp), 'HH:mm')}
        </span>
        <span className="text-[9px] text-muted-foreground/50 mt-0.5">
          {format(new Date(entry.timestamp), 'MMM d')}
        </span>
      </div>

      {/* Vertical line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-2 h-2 rounded-full border-2 border-border bg-background mt-1" />
        <div className="flex-1 w-px bg-border/60" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={cn('text-[9px] h-[18px] gap-1 px-1.5', config.className)}>
            <Icon className="w-2.5 h-2.5" />
            {config.label}
          </Badge>
          <span className="text-xs font-medium text-foreground truncate">{entry.trigger}</span>
        </div>
        <p className={cn(
          'text-xs text-muted-foreground leading-relaxed break-words',
          !expanded && isLong && 'line-clamp-2',
        )}>
          {entry.action_taken}
        </p>
        {entry.rule_impact && (
          <p className={cn(
            'text-[11px] text-muted-foreground/70 mt-1 break-words',
            !expanded && isLong && 'line-clamp-1',
          )}>
            <span className="font-medium text-muted-foreground">Impact:</span> {entry.rule_impact}
          </p>
        )}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> View more</>}
          </button>
        )}
      </div>
    </div>
  );
}

interface EventDecisionTimelineProps {
  eventId: string | null;
  maxHeight?: string;
}

export function EventDecisionTimeline({ eventId, maxHeight = '320px' }: EventDecisionTimelineProps) {
  const { data: entries, isLoading } = useDecisionLog(eventId);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Event Decision Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-12 h-4" />
                <Skeleton className="flex-1 h-10" />
              </div>
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-4 text-center">
            No decision log entries yet. Actions taken on this event will appear here.
          </p>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="divide-y-0">
              {entries.map(entry => (
                <TimelineEntry key={entry.id} entry={entry} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
