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
      className="relative mb-8 h-[120px]"
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
              'h-full rounded-lg border-2',
              'bg-amber-500/10 dark:bg-amber-950/40',
              'border-amber-500/50 dark:border-amber-500/60',
              'transition-all duration-200',
              'hover:bg-amber-500/15 dark:hover:bg-amber-950/50',
              'hover:border-amber-500/70 dark:hover:border-amber-400/70',
              'focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:ring-offset-2'
            )}
          >
            <div className="flex items-center w-full gap-4 h-full px-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/20 dark:bg-amber-500/25 shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              
              <div
                className="flex-1 cursor-pointer"
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(true)}
                tabIndex={0}
                role="button"
                aria-label={`${count} high priority events. Click to see details.`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-amber-700 dark:text-amber-300 text-lg tracking-tight">
                    {count} high priority event{count > 1 ? 's' : ''}
                  </span>
                  <span className="text-amber-600/80 dark:text-amber-400/80 text-sm font-medium">
                    require{count === 1 ? 's' : ''} immediate attention
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <RotateCcw className="w-3 h-3" />
                    Click to see event list
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/20 font-semibold"
                  onClick={onView}
                >
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
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
              'h-full rounded-lg border-2',
              'bg-amber-500/10 dark:bg-amber-950/40',
              'border-amber-500/50 dark:border-amber-500/60',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start gap-4 h-full px-5 py-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 dark:bg-amber-500/25 shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 tracking-tight">
                    High Priority Events
                  </h4>
                  <button
                    onClick={handleFlip}
                    className="p-1 rounded hover:bg-amber-500/20 transition-colors"
                    aria-label="Flip back"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <ScrollArea className="h-[50px]">
                  <div className="flex flex-wrap gap-1.5 pr-2">
                    {scenarios.slice(0, 6).map((scenario) => (
                      <Badge
                        key={scenario.id}
                        variant="outline"
                        className="text-[10px] border-amber-500/50 dark:border-amber-400/50 text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 px-2 py-0.5 font-medium"
                      >
                        {scenario.name.length > 20 
                          ? `${scenario.name.slice(0, 20)}...` 
                          : scenario.name
                        }
                      </Badge>
                    ))}
                    {scenarios.length > 6 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-muted-foreground/30 text-muted-foreground font-medium"
                      >
                        +{scenarios.length - 6} more
                      </Badge>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-500/20 font-semibold text-xs"
                  onClick={onView}
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
