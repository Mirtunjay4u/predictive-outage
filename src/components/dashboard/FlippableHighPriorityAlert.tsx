import { useState } from 'react';
import { AlertCircle, X, ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface FlippableHighPriorityAlertProps {
  count: number;
  scenarios: Scenario[];
  onView: () => void;
  onDismiss: () => void;
}

export function FlippableHighPriorityAlert({ 
  count, 
  scenarios, 
  onView, 
  onDismiss 
}: FlippableHighPriorityAlertProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="relative mb-6 h-[88px]"
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
          <div
            className={cn(
              'h-full rounded-lg border',
              'bg-amber-500/[0.08] dark:bg-amber-950/30',
              'border-amber-400/40 dark:border-amber-500/40',
              'transition-all duration-200',
              'hover:bg-amber-500/[0.12] dark:hover:bg-amber-950/40',
              'hover:border-amber-400/60 dark:hover:border-amber-400/50'
            )}
          >
            <div className="flex items-center w-full gap-4 h-full px-5">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/15 dark:bg-amber-500/20 shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              </div>
              
              {/* Content - executive summary tone */}
              <div
                className="flex-1 cursor-pointer"
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(true)}
                tabIndex={0}
                role="button"
                aria-label={`${count} events requiring immediate attention. Click to see details.`}
              >
                <div className="flex items-baseline gap-2">
                  {/* Emphasized count */}
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums tracking-tight">
                    {count}
                  </span>
                  <span className="font-medium text-amber-700/90 dark:text-amber-300/90 text-sm">
                    event{count > 1 ? 's' : ''} requiring immediate attention
                  </span>
                </div>
                <span className="text-[10px] text-amber-600/60 dark:text-amber-400/60 flex items-center gap-1 mt-0.5">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Click to view event list
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/15 font-semibold text-xs"
                  onClick={onView}
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  aria-label="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div
            className={cn(
              'h-full rounded-lg border',
              'bg-amber-500/[0.08] dark:bg-amber-950/30',
              'border-amber-400/40 dark:border-amber-500/40'
            )}
          >
            <div className="flex items-center gap-4 h-full px-5">
              {/* Icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/15 dark:bg-amber-500/20 shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Events Requiring Immediate Attention
                  </h4>
                  <button
                    onClick={handleFlip}
                    className="p-1 rounded hover:bg-amber-500/15 transition-colors"
                    aria-label="Flip back"
                  >
                    <RotateCcw className="w-3 h-3 text-muted-foreground/60" />
                  </button>
                </div>

                <ScrollArea className="h-[36px]">
                  <div className="flex flex-wrap gap-1 pr-2">
                    {scenarios.slice(0, 6).map((scenario) => (
                      <Badge
                        key={scenario.id}
                        variant="outline"
                        className="text-[9px] border-amber-400/40 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/10 px-1.5 py-0 font-medium"
                      >
                        {scenario.name.length > 18 
                          ? `${scenario.name.slice(0, 18)}...` 
                          : scenario.name
                        }
                      </Badge>
                    ))}
                    {scenarios.length > 6 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] border-muted-foreground/20 text-muted-foreground/60 font-medium px-1.5 py-0"
                      >
                        +{scenarios.length - 6} more
                      </Badge>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/15 font-semibold text-[10px]"
                  onClick={onView}
                >
                  View all
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  aria-label="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
