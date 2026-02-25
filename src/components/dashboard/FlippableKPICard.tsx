import { useState } from 'react';
import { LucideIcon, RotateCcw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_INTERACTIVE_SURFACE_CLASS } from '@/lib/dashboard';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import type { Scenario } from '@/types/scenario';

interface BreakdownItem {
  type: string;
  count: number;
  tooltip: string;
}

interface FlippableKPICardProps {
  label: string;
  subtitle?: string;
  value: number;
  icon: LucideIcon;
  tooltip: string;
  breakdown?: BreakdownItem[];
  emphasis?: 'critical' | 'high' | 'medium' | 'low';
  scenarios?: Scenario[];
  boardroomMode?: boolean;
  onClick: () => void;
  actionLabel?: string;
  isActive?: boolean;
  onBreakdownClick?: (type: string) => void;
}

export function FlippableKPICard({ label, subtitle, value, icon: Icon, tooltip, breakdown, emphasis = 'low', scenarios = [], boardroomMode = false, onClick, actionLabel = 'View All', isActive = false, onBreakdownClick, ...rest }: FlippableKPICardProps & { 'data-tour'?: string }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useAnimatedNumber(value, 360);

  const emphasisStyles = {
    critical: 'border-red-300/40 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/[0.03]',
    high: 'border-sky-300/40 bg-sky-50/50 dark:border-cyan-500/30 dark:bg-cyan-500/[0.03]',
    medium: 'border-amber-300/40 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/[0.03]',
    low: 'border-blue-200/40 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/[0.03]',
  };

  const iconStyles = {
    critical: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    high: 'bg-sky-100 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    medium: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  };

  return (
    <div className={cn('group relative', boardroomMode ? 'h-[210px]' : 'h-[200px]')} style={{ perspective: '1000px' }}>
      <motion.div className="relative h-full w-full" initial={false} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.45, ease: 'easeInOut' }} style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: 'hidden' }}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Card
                className={cn('h-full cursor-pointer rounded-xl border shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS, emphasisStyles[emphasis])}
                data-tour={rest['data-tour']}
                onClick={() => setIsFlipped((v) => !v)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped((v) => !v)}
                role="button"
                aria-label={`${label}: ${value} events. Click to view details.`}
              >
                <CardContent className={boardroomMode ? 'flex h-full flex-col p-5' : 'flex h-full flex-col p-4'}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">{label}</p>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', iconStyles[emphasis])}><Icon className="h-4 w-4" /></div>
                  </div>

                  <div className="flex-1">
                    <p className={cn(boardroomMode ? 'text-[2.15rem]' : 'text-4xl', 'font-semibold leading-none tracking-tight tabular-nums')}>{animatedValue}</p>
                    {!boardroomMode && subtitle && <p className="mt-2.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground/55">{subtitle}</p>}
                  </div>

                  {!boardroomMode && breakdown && breakdown.length > 0 && (
                    <div className="mt-auto border-t border-border/20 pt-3 text-[11px] text-muted-foreground/60">
                      {breakdown.slice(0, 2).map((item) => (
                        <div key={item.type} className="flex items-center justify-between"><span className="truncate">• {item.type}</span><span className="font-medium tabular-nums">{item.count}</span></div>
                      ))}
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-50">
                    <span className="text-[9px] text-muted-foreground">Drill down</span>
                    <RotateCcw className="h-3 w-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} className="max-w-[240px] text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </div>

        <div className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <Card className={cn('h-full rounded-xl border shadow-sm', emphasisStyles[emphasis])}>
            <CardContent className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><Icon className="h-3.5 w-3.5" />{label} details</h4>
                <button onClick={() => setIsFlipped(false)} className={cn('rounded p-1', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} aria-label="Flip back"><RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /></button>
              </div>

              <ScrollArea className="flex-1 -mx-1 px-1">
                {scenarios.length > 0 ? (
                  <div className="space-y-1.5">
                    {scenarios.slice(0, 5).map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        className="w-full text-left p-2 rounded-md bg-muted/40 border border-border/40"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Drilldown contract: the dashboard drilldown expects an `outage_type` identifier.
                          // Pass the scenario.outage_type (not scenario.name). If missing/empty we pass
                          // an empty string so the upstream handler can omit the `outage_type` filter
                          // and navigate to `/events` (least-disruptive UX for demo).
                          onBreakdownClick?.(scenario.outage_type || '');
                        }}
                        aria-label={`Drilldown to events for ${scenario.name}`}
                      >
                        <p className="text-xs font-medium text-foreground truncate">
                          {scenario.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {scenario.priority && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[9px] px-1.5 py-0',
                                scenario.priority === 'high' && 'border-destructive/50 text-destructive',
                                scenario.priority === 'medium' && 'border-warning/50 text-warning',
                                scenario.priority === 'low' && 'border-muted-foreground/50'
                              )}
                            >
                              {scenario.priority}
                            </Badge>
                          )}
                          {scenario.customers_impacted && (
                            <span className="text-[10px] text-muted-foreground">
                              {scenario.customers_impacted.toLocaleString()} affected
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {scenarios.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        +{scenarios.length - 5} more events
                      </p>
                    )}
                  </div>
                ) : breakdown && breakdown.length > 0 ? (
                  <div className="space-y-1.5">
                    {breakdown.map(({ type, count, tooltip: itemTooltip }) => (
                      <button
                        key={type}
                        type="button"
                        className={cn(
                          'w-full flex items-center justify-between text-left',
                          'text-xs text-muted-foreground p-2 rounded-md',
                          'bg-muted/40 border border-border/40',
                          'hover:bg-muted/60 transition-colors'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBreakdownClick?.(type);
                        }}
                      >
                        <span className="truncate">{type}</span>
                        <span className="ml-2 tabular-nums font-semibold">{count}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No details available
                  </p>
                )}
              </ScrollArea>
              <button
                onClick={onClick}
                className={cn(
                  'mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/30 py-2 text-xs font-medium text-primary',
                  isActive ? 'bg-primary/20' : 'bg-primary/10',
                  DASHBOARD_INTERACTIVE_BUTTON_CLASS,
                )}
              >
                {actionLabel}
                <ExternalLink className="h-3 w-3" />
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
