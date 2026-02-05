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
      className="relative h-[180px] group"
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
                  'h-full cursor-pointer transition-all duration-200 ease-out',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'hover:shadow-md hover:-translate-y-0.5',
                  emphasisStyles[emphasis]
                )}
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(!isFlipped)}
                tabIndex={0}
                role="button"
                aria-label={`${label}: ${value} events. Click to flip for details.`}
              >
                <CardContent className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                        {label}
                      </p>
                      <p className={cn(
                        'text-3xl font-semibold tracking-tight tabular-nums',
                        valueStyles[emphasis]
                      )}>
                        {value}
                      </p>
                    </div>
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      iconStyles[emphasis]
                    )}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                  </div>

                  {breakdown && breakdown.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-border/30">
                      <div className="space-y-0.5">
                        {breakdown.slice(0, 2).map(({ type, count }) => (
                          <div
                            key={type}
                            className="flex items-center justify-between text-xs text-muted-foreground/60"
                          >
                            <span className="truncate">• {type}</span>
                            <span className="ml-2 tabular-nums font-medium">{count}</span>
                          </div>
                        ))}
                        {breakdown.length > 2 && (
                          <p className="text-[10px] text-muted-foreground/50 pt-1">
                            +{breakdown.length - 2} more • Click to flip
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Flip hint */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
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
              'h-full transition-all duration-200',
              emphasisStyles[emphasis]
            )}
          >
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {label} Details
                </h4>
                <button
                  onClick={handleFlip}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
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

              {/* Navigate action */}
              <button
                onClick={handleNavigate}
                className={cn(
                  'mt-3 w-full flex items-center justify-center gap-1.5',
                  'text-xs font-medium py-2 rounded-md',
                  'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
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
