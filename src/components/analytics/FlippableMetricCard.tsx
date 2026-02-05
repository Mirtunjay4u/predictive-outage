import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

interface FlippableMetricCardProps {
  value: number;
  label: string;
  scenarios: Scenario[];
  colorClass: string;
}

export function FlippableMetricCard({
  value,
  label,
  scenarios,
  colorClass,
}: FlippableMetricCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="relative h-[140px] group"
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
              'text-center p-5 rounded-lg bg-muted/40 border border-border/50',
              'cursor-pointer hover:bg-muted/60 hover:border-border transition-all',
              'h-full flex flex-col items-center justify-center'
            )}
            onClick={handleFlip}
            onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
            tabIndex={0}
            role="button"
            aria-label={`${label}: ${value}. Click to flip for details.`}
          >
            <p className={`text-3xl font-bold ${colorClass} group-hover:scale-105 transition-transform`}>
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              {label}
            </p>
            <span className="text-[10px] text-muted-foreground/50 mt-2 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              Click to flip
            </span>
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
          <div className="h-full p-3 rounded-lg bg-muted/40 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground truncate">
                {label}
              </h4>
              <button
                onClick={handleFlip}
                className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                aria-label="Flip back"
              >
                <RotateCcw className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            <ScrollArea className="h-[80px]">
              {scenarios.length > 0 ? (
                <div className="space-y-1 pr-2">
                  {scenarios.slice(0, 5).map((scenario) => (
                    <div
                      key={scenario.id}
                      className="p-1.5 rounded bg-background/50 border border-border/30"
                    >
                      <p className="text-[10px] font-medium text-foreground truncate">
                        {scenario.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {scenario.priority && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[8px] px-1 py-0 h-3.5',
                              scenario.priority === 'high' && 'border-destructive/50 text-destructive',
                              scenario.priority === 'medium' && 'border-warning/50 text-warning'
                            )}
                          >
                            {scenario.priority}
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground">
                          {scenario.lifecycle_stage}
                        </span>
                      </div>
                    </div>
                  ))}
                  {scenarios.length > 5 && (
                    <p className="text-[9px] text-muted-foreground text-center pt-1">
                      +{scenarios.length - 5} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-4">
                  No scenarios
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
