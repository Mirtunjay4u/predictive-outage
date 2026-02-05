import { useState } from 'react';
import { AlertCircle, X, ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
          <Alert
            variant="destructive"
            className={cn(
              'h-full border-2 border-destructive/25 bg-destructive/[0.03]',
              'transition-all duration-200',
              'hover:bg-destructive/[0.05] hover:border-destructive/35',
              'focus-within:ring-2 focus-within:ring-destructive/30 focus-within:ring-offset-2'
            )}
          >
            <div className="flex items-center w-full gap-3 h-full">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 shrink-0">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              
              <div
                className="flex-1 cursor-pointer"
                onClick={handleFlip}
                onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(true)}
                tabIndex={0}
                role="button"
                aria-label={`${count} high priority events. Click to see details.`}
              >
                <AlertDescription className="flex flex-col gap-1">
                  <span className="font-semibold text-destructive text-lg">
                    {count} high priority event{count > 1 ? 's' : ''}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    require{count === 1 ? 's' : ''} immediate attention
                  </span>
                  <span className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-1">
                    <RotateCcw className="w-3 h-3" />
                    Click to see event list
                  </span>
                </AlertDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
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
          </Alert>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <Alert
            variant="destructive"
            className={cn(
              'h-full border-2 border-destructive/25 bg-destructive/[0.03]',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start gap-3 h-full">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-destructive">
                    High Priority Events
                  </h4>
                  <button
                    onClick={handleFlip}
                    className="p-1 rounded hover:bg-destructive/10 transition-colors"
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
                        className="text-[10px] border-destructive/40 text-destructive bg-destructive/5 px-2 py-0.5"
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
                        className="text-[10px] border-muted-foreground/30 text-muted-foreground"
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
                  className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium text-xs"
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
          </Alert>
        </div>
      </motion.div>
    </div>
  );
}
