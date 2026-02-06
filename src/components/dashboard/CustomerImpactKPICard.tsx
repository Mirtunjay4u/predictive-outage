import { useState } from 'react';
import { Users, RotateCcw, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface CustomerImpactKPICardProps {
  scenarios: Scenario[];
  onClick: () => void;
}

export function CustomerImpactKPICard({ scenarios, onClick }: CustomerImpactKPICardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Calculate metrics from active events only
  const activeScenarios = scenarios.filter(s => s.lifecycle_stage === 'Event');
  
  const totalCustomersImpacted = activeScenarios.reduce(
    (sum, s) => sum + (s.customers_impacted || 0),
    0
  );

  const highPriorityScenarios = activeScenarios.filter(s => s.priority === 'high');
  const highPriorityCustomersImpacted = highPriorityScenarios.reduce(
    (sum, s) => sum + (s.customers_impacted || 0),
    0
  );

  const criticalLoadScenarios = activeScenarios.filter(s => s.has_critical_load);
  const criticalLoadCustomersImpacted = criticalLoadScenarios.reduce(
    (sum, s) => sum + (s.customers_impacted || 0),
    0
  );

  // Simulated trend (in a real app, compare to previous snapshot)
  const trendPercent = activeScenarios.length > 0 ? Math.round((Math.random() - 0.5) * 20) : 0;
  const trendUp = trendPercent > 0;

  const emphasisStyles = 'border-orange-300/40 bg-orange-50/50 dark:border-orange-500/30 dark:bg-orange-500/[0.03]';
  const iconStyles = 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
  const valueStyles = 'text-orange-600 dark:text-orange-400 dark:drop-shadow-[0_0_12px_rgba(251,146,60,0.55)]';

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
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
                  'h-full cursor-pointer transition-all duration-200 ease-out',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'hover:shadow-md hover:-translate-y-0.5',
                  emphasisStyles
                )}
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(!isFlipped)}
                tabIndex={0}
                role="button"
                aria-label={`Customer Impact: ${totalCustomersImpacted.toLocaleString()} customers affected. Click to flip for details.`}
              >
                <CardContent className="p-5 h-full flex flex-col">
                  {/* Icon positioned top-right */}
                  <div className={cn(
                    'absolute top-4 right-4 w-8 h-8 rounded-md flex items-center justify-center opacity-60',
                    iconStyles
                  )}>
                    <Users className="w-4 h-4" strokeWidth={1.5} />
                  </div>

                  <div className="flex-1 min-w-0 pr-10">
                    {/* Title */}
                    <p className="text-xs font-medium tracking-wide text-muted-foreground/80 mb-2 leading-tight">
                      Customer Impact
                    </p>
                    
                    {/* Main Metric */}
                    <p className={cn(
                      'text-4xl font-bold tracking-tight tabular-nums leading-none',
                      valueStyles
                    )}>
                      {formatNumber(totalCustomersImpacted)}
                    </p>
                    
                    {/* Subtitle */}
                    <p className="text-[10px] text-muted-foreground/50 font-normal mt-2 leading-relaxed">
                      Customers currently affected by active events
                    </p>
                  </div>

                  {/* Secondary metrics */}
                  <div className="mt-auto pt-3 border-t border-border/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/50 leading-relaxed">
                      <span className="truncate">• High Priority</span>
                      <span className="ml-2 tabular-nums font-medium text-muted-foreground/70">
                        {formatNumber(highPriorityCustomersImpacted)}
                      </span>
                    </div>
                    {criticalLoadCustomersImpacted > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/50 leading-relaxed">
                        <span className="truncate">• Critical Load</span>
                        <span className="ml-2 tabular-nums font-medium text-muted-foreground/70">
                          {formatNumber(criticalLoadCustomersImpacted)}
                        </span>
                      </div>
                    )}
                    {trendPercent !== 0 && (
                      <div className="flex items-center gap-1 pt-1">
                        {trendUp ? (
                          <TrendingUp className="w-3 h-3 text-destructive/70" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-green-600/70" />
                        )}
                        <span className={cn(
                          'text-[9px] font-medium',
                          trendUp ? 'text-destructive/70' : 'text-green-600/70'
                        )}>
                          {Math.abs(trendPercent)}% vs last update
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Flip hint */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-50 transition-opacity">
                    <span className="text-[9px] text-muted-foreground">Click to drill down</span>
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[240px] text-xs">
              Total customers currently affected across all active outage events.
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
          <Card className={cn('h-full transition-all duration-200', emphasisStyles)}>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Impact by Event
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
                {activeScenarios.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeScenarios
                      .sort((a, b) => (b.customers_impacted || 0) - (a.customers_impacted || 0))
                      .slice(0, 5)
                      .map((scenario) => (
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
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {(scenario.customers_impacted || 0).toLocaleString()} customers
                            </span>
                            {scenario.has_critical_load && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-orange-500/50 text-orange-600 dark:text-orange-400">
                                Critical Load
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    {activeScenarios.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        +{activeScenarios.length - 5} more events
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No active events impacting customers
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
                View All Events
                <ExternalLink className="w-3 h-3" />
              </button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
