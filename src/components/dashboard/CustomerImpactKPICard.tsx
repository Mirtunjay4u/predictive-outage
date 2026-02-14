import { useEffect, useRef, useState } from 'react';
import { Users, RotateCcw, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_INTERACTIVE_SURFACE_CLASS } from '@/lib/dashboard';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import type { Scenario } from '@/types/scenario';

interface CustomerImpactKPICardProps {
  scenarios: Scenario[];
  onClick: () => void;
  boardroomMode?: boolean;
}

export function CustomerImpactKPICard({ scenarios, onClick, boardroomMode = false }: CustomerImpactKPICardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const activeScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  const totalCustomersImpacted = activeScenarios.reduce((sum, s) => sum + (s.customers_impacted || 0), 0);
  const animatedTotal = useAnimatedNumber(totalCustomersImpacted, 380);

  const prevValueRef = useRef(totalCustomersImpacted);
  const [delta, setDelta] = useState(0);
  useEffect(() => {
    const nextDelta = totalCustomersImpacted - prevValueRef.current;
    setDelta(nextDelta);
    prevValueRef.current = totalCustomersImpacted;
  }, [totalCustomersImpacted]);

  const highPriorityCustomers = activeScenarios.filter((s) => s.priority === 'high').reduce((sum, s) => sum + (s.customers_impacted || 0), 0);
  const criticalLoadCustomers = activeScenarios.filter((s) => s.has_critical_load).reduce((sum, s) => sum + (s.customers_impacted || 0), 0);

  const formatNumber = (num: number) => (num >= 1000000 ? `${(num / 1000000).toFixed(1)}M` : num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toLocaleString());

  return (
    <div className={cn('group relative', boardroomMode ? 'h-[210px]' : 'h-[200px]')} style={{ perspective: '1000px' }}>
      <motion.div className="relative h-full w-full" initial={false} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.45, ease: 'easeInOut' }} style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Card className={cn('h-full cursor-pointer rounded-xl border border-orange-300/40 bg-orange-50/50 shadow-sm dark:border-orange-500/30 dark:bg-orange-500/[0.03]', DASHBOARD_INTERACTIVE_SURFACE_CLASS)} onClick={() => setIsFlipped((v) => !v)} tabIndex={0} role="button">
                <CardContent className={boardroomMode ? 'flex h-full flex-col p-5' : 'flex h-full flex-col p-4'}>
                  <div className="mb-2 flex items-start justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">Customer Impact</p><div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"><Users className="h-4 w-4" /></div></div>
                  <div className="flex-1">
                    <p className={cn(boardroomMode ? 'text-[2.15rem]' : 'text-4xl', 'font-semibold leading-none tracking-tight tabular-nums text-orange-600 dark:text-orange-400')}>{formatNumber(animatedTotal)}</p>
                    {!boardroomMode && <p className="mt-2.5 text-[10px] text-muted-foreground/55">Customers currently affected by active events</p>}
                  </div>
                  {!boardroomMode && (
                    <div className="mt-auto space-y-1 border-t border-border/20 pt-3 text-[11px] text-muted-foreground/60">
                      <div className="flex items-center justify-between"><span>• High Priority</span><span className="font-medium tabular-nums">{formatNumber(highPriorityCustomers)}</span></div>
                      {criticalLoadCustomers > 0 && <div className="flex items-center justify-between"><span>• Critical Load</span><span className="font-medium tabular-nums">{formatNumber(criticalLoadCustomers)}</span></div>}
                      {delta !== 0 && (
                        <div className="flex items-center gap-1 pt-1 text-[10px]">
                          {delta > 0 ? <TrendingUp className="h-3 w-3 text-muted-foreground" /> : <TrendingDown className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-muted-foreground">{delta > 0 ? '+' : ''}{delta.toLocaleString()} since last refresh</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-50"><span className="text-[9px] text-muted-foreground">Drill down</span><RotateCcw className="h-3 w-3 text-muted-foreground" /></div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Total customers currently affected across active outage events.</TooltipContent>
          </Tooltip>
        </div>

        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <Card className="h-full rounded-xl border border-orange-300/40 bg-orange-50/50 shadow-sm dark:border-orange-500/30 dark:bg-orange-500/[0.03]">
            <CardContent className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-center justify-between"><h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><Users className="h-3.5 w-3.5" />Impact by event</h4><button onClick={() => setIsFlipped(false)} className={cn('rounded p-1', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}><RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /></button></div>
              <ScrollArea className="-mx-1 flex-1 px-1">
                <div className="space-y-1.5">
                  {activeScenarios.sort((a, b) => (b.customers_impacted || 0) - (a.customers_impacted || 0)).slice(0, 5).map((scenario) => (
                    <div key={scenario.id} className="rounded-md border border-border/40 bg-muted/40 p-2">
                      <p className="truncate text-xs font-medium">{scenario.name}</p>
                      <div className="mt-1 flex items-center gap-2"><span className="text-[10px] text-muted-foreground tabular-nums">{(scenario.customers_impacted || 0).toLocaleString()} customers</span>{scenario.priority && <Badge variant="outline" className="px-1.5 py-0 text-[9px]">{scenario.priority}</Badge>}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <button onClick={onClick} className={cn('mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 py-2 text-xs font-medium text-primary', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>View All Events<ExternalLink className="h-3 w-3" /></button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
