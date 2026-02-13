import { useState } from 'react';
import { LucideIcon, RotateCcw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  onClick: () => void;
  onBreakdownClick?: (type: string) => void;
}

export function FlippableKPICard({
  label,
  subtitle,
  value,
  icon: Icon,
  tooltip,
  breakdown,
  emphasis = 'low',
  scenarios = [],
  onClick,
  onBreakdownClick,
}: FlippableKPICardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const emphasisStyles = {
    critical: 'border-red-300/40 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/[0.03]',
    high: 'border-sky-300/40 bg-sky-50/50 dark:border-cyan-500/30 dark:bg-cyan-500/[0.03]',
    medium: 'border-amber-300/40 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/[0.03]',
    low: 'border-blue-200/40 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/[0.03]',
  };

  const cardSurfaceClass = 'rounded-xl border shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const iconStyles = {
    critical: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    high: 'bg-sky-100 text-sky-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    medium: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  };

  const valueStyles = {
    critical: 'text-red-600 dark:text-red-400 dark:drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]',
    high: 'text-sky-600 dark:text-cyan-400 dark:drop-shadow-[0_0_12px_rgba(34,211,238,0.55)]',
    medium: 'text-amber-600 dark:text-amber-400 dark:drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]',
    low: 'text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_12px_rgba(96,165,250,0.55)]',
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="relative h-[200px] group"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  'h-full cursor-pointer',
                  cardSurfaceClass,
                  emphasisStyles[emphasis]
                )}
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(!isFlipped)}
                tabIndex={0}
                role="button"
                aria-label={`${label}: ${value} events. Click to flip for details.`}
              >
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75 leading-tight">
                      {label}
                    </p>
                    <div className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center shrink-0 opacity-65',
                      iconStyles[emphasis]
                    )}>
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    
                    <div className="min-h-11 flex items-end">
                      <p className={cn(
                        'text-4xl font-semibold tracking-tight tabular-nums leading-none',
                        valueStyles[emphasis]
                      )}>
                        {value}
                      </p>
                    </div>
                    
                    {/* Subtitle - Regular, muted */}
                    {subtitle && (
                      <p className="text-[10px] text-muted-foreground/55 font-normal mt-2.5 leading-relaxed line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {breakdown && breakdown.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-border/20">
                      <div className="space-y-1">
                        {breakdown.slice(0, 2).map(({ type, count }) => (
                          <div
                            key={type}
                            className="flex items-center justify-between text-[11px] text-muted-foreground/50 leading-relaxed"
                          >
                            <span className="truncate">• {type}</span>
                            <span className="ml-2 tabular-nums font-medium text-muted-foreground/70">{count}</span>
                          </div>
                        ))}
                        {breakdown.length > 2 && (
                          <p className="text-[9px] text-muted-foreground/40 pt-1">
                            +{breakdown.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Flip hint - clearer cue */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-50 transition-opacity">
                    <span className="text-[9px] text-muted-foreground">Click to drill down</span>
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[240px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <Card
            className={cn(
              'h-full',
              cardSurfaceClass,
              emphasisStyles[emphasis]
            )}
          >
            <CardContent className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {label} Details
                </h4>
                <button
                  onClick={handleFlip}
                  className="rounded p-1 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Flip back"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <ScrollArea className="flex-1 -mx-1 px-1">
                {scenarios.length > 0 ? (
                  <div className="space-y-1.5">
                    {scenarios.slice(0, 5).map((scenario) => (
                      <div
                        key={scenario.id}
                        className="p-2 rounded-md bg-muted/40 border border-border/40"
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
                      </div>
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
                          'transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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

              {/* Navigate action */}
              <button
                onClick={handleNavigate}
                className={cn(
                  'mt-3 w-full flex items-center justify-center gap-1.5',
                  'rounded-md border border-primary/30 py-2 text-xs font-medium',
                  'bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                View All
                <ExternalLink className="w-3 h-3" />
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
