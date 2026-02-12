import { AlertTriangle, ChevronRight, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface ImmediateAttentionStripProps {
  scenarios: Scenario[];
  onViewAll: () => void;
  onEventClick: (id: string) => void;
}

export function ImmediateAttentionStrip({ scenarios, onViewAll, onEventClick }: ImmediateAttentionStripProps) {
  // Sort: critical runway breaches first, then high priority, then by critical load
  const sorted = [...scenarios].sort((a, b) => {
    const aPri = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2;
    const bPri = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2;
    if (aPri !== bPri) return aPri - bPri;
    if (a.has_critical_load && !b.has_critical_load) return -1;
    if (!a.has_critical_load && b.has_critical_load) return 1;
    return (b.customers_impacted ?? 0) - (a.customers_impacted ?? 0);
  }).slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <div className="mb-4">
      <div className={cn(
        'rounded-xl border border-amber-400/40 dark:border-amber-500/30',
        'bg-amber-500/[0.06] dark:bg-amber-950/20',
        'shadow-[0_0_0_1px_rgba(251,191,36,0.08)] dark:shadow-[0_0_22px_rgba(251,191,36,0.12)]',
      )}>
        <div className="flex items-center gap-3 px-5 py-4">
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Immediate Attention
              </p>
              <p className="text-[9px] text-amber-600/60 dark:text-amber-400/50">
                {sorted.length} urgent event{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="w-px h-10 bg-amber-400/20 dark:bg-amber-500/20 shrink-0" />

          {/* Scrollable event chips */}
          <ScrollArea className="flex-1">
            <div className="flex gap-2 pr-2">
              {sorted.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onEventClick(s.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md',
                    'bg-card/80 dark:bg-card/60 border border-border/50',
                    'hover:border-amber-400/50 hover:bg-amber-500/[0.04] transition-colors',
                    'text-left min-w-[200px] max-w-[260px]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.priority && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px] px-1 py-0 h-3.5',
                            s.priority === 'high' && 'border-destructive/50 text-destructive',
                            s.priority === 'medium' && 'border-amber-500/50 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {s.priority}
                        </Badge>
                      )}
                      {s.customers_impacted && (
                        <span className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {s.customers_impacted.toLocaleString()}
                        </span>
                      )}
                      {s.has_critical_load && (
                        <span className="text-[9px] text-destructive/80 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          Critical
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* View all */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 px-3 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 rounded-md"
            onClick={onViewAll}
          >
            View all
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
