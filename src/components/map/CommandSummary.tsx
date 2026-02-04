import { useMemo, useState } from 'react';
import { Eye, AlertTriangle, Cable, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Scenario } from '@/types/scenario';

interface CommandSummaryProps {
  scenarios: Scenario[];
  onHighPriorityClick: () => void;
  onTopFeederClick: (feederId: string) => void;
  isHighPriorityActive: boolean;
}

export function CommandSummary({
  scenarios,
  onHighPriorityClick,
  onTopFeederClick,
  isHighPriorityActive,
}: CommandSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const visibleCount = scenarios.length;
    const highPriorityCount = scenarios.filter(s => s.priority === 'high').length;
    
    // Calculate top impact feeder
    const feederImpact = scenarios.reduce((acc, scenario) => {
      if (scenario.feeder_id && scenario.customers_impacted) {
        const key = scenario.feeder_id;
        if (!acc[key]) {
          acc[key] = { feederId: key, total: 0 };
        }
        acc[key].total += scenario.customers_impacted;
      }
      return acc;
    }, {} as Record<string, { feederId: string; total: number }>);
    
    const topFeeder = Object.values(feederImpact).sort((a, b) => b.total - a.total)[0] || null;
    
    return {
      visibleCount,
      highPriorityCount,
      topFeeder,
    };
  }, [scenarios]);

  return (
    <div className="absolute top-16 left-4 z-[1000]">
      {/* Collapsed State - Compact Toggle Button */}
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-9 bg-card/95 backdrop-blur-sm border-border gap-2"
          title="Expand Summary"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs font-medium">{metrics.visibleCount}</span>
          {metrics.highPriorityCount > 0 && (
            <span className="text-xs text-destructive font-medium">
              ({metrics.highPriorityCount} high)
            </span>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      ) : (
        /* Expanded State - Full Cards */
        <div className="flex items-stretch gap-2">
          {/* Visible Events Card */}
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border px-3 py-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Visible Events</span>
            </div>
            <div className="text-lg font-semibold text-foreground mt-0.5">
              {metrics.visibleCount}
            </div>
          </div>

          {/* High Priority Card */}
          <button
            onClick={onHighPriorityClick}
            className={cn(
              "bg-card/95 backdrop-blur-sm rounded-lg border px-3 py-2 min-w-[120px] text-left transition-all hover:border-destructive/50 hover:bg-destructive/5",
              isHighPriorityActive 
                ? "border-destructive/60 bg-destructive/10" 
                : "border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">High Priority</span>
            </div>
            <div className={cn(
              "text-lg font-semibold mt-0.5",
              metrics.highPriorityCount > 0 ? "text-destructive" : "text-foreground"
            )}>
              {metrics.highPriorityCount}
            </div>
          </button>

          {/* Top Impact Feeder Card */}
          {metrics.topFeeder ? (
            <button
              onClick={() => onTopFeederClick(metrics.topFeeder!.feederId)}
              className="bg-card/95 backdrop-blur-sm rounded-lg border border-border px-3 py-2 min-w-[160px] text-left transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2">
                <Cable className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Top Impact Feeder</span>
              </div>
              <div className="text-sm font-medium text-foreground mt-0.5 truncate">
                {metrics.topFeeder.feederId}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.topFeeder.total.toLocaleString()} customers
              </div>
            </button>
          ) : (
            <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border px-3 py-2 min-w-[160px]">
              <div className="flex items-center gap-2">
                <Cable className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Top Impact Feeder</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                No data
              </div>
            </div>
          )}

          {/* Collapse Button & Demo Footnote */}
          <div className="flex flex-col justify-between items-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Collapse Summary"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground/60 italic">
              Demo data
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
