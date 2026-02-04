import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BreakdownItem {
  type: string;
  count: number;
  tooltip: string;
}

interface KPICardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tooltip: string;
  breakdown?: BreakdownItem[];
  emphasis?: 'critical' | 'high' | 'medium' | 'low';
  onClick: () => void;
  onBreakdownClick?: (type: string) => void;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  tooltip,
  breakdown,
  emphasis = 'low',
  onClick,
  onBreakdownClick,
}: KPICardProps) {
  const emphasisStyles = {
    critical: 'border-destructive/40 bg-destructive/[0.02] hover:border-destructive/60 hover:bg-destructive/[0.04]',
    high: 'border-primary/30 bg-primary/[0.02] hover:border-primary/50 hover:bg-primary/[0.04]',
    medium: 'border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50 hover:bg-amber-500/[0.04]',
    low: 'border-slate-500/40 hover:border-slate-500/60 hover:bg-slate-500/[0.04]',
  };

  // Industrial color palette for icons
  const iconStyles = {
    critical: 'bg-destructive/15 text-destructive',
    high: 'bg-cyan-500/15 text-cyan-400',
    medium: 'bg-amber-500/15 text-amber-400',
    low: 'bg-slate-500/15 text-slate-400',
  };

  // Consistent glow effect for all values
  const valueStyles = {
    critical: 'text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)]',
    high: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    medium: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    low: 'text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]',
  };

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <Card
          className={cn(
            'cursor-pointer transition-all duration-200 ease-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'hover:shadow-md hover:-translate-y-0.5',
            emphasisStyles[emphasis]
          )}
          onClick={onClick}
          onKeyDown={(e) => e.key === 'Enter' && onClick()}
          tabIndex={0}
          role="button"
          aria-label={`${label}: ${value} events. Click to view details.`}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
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
              <div className="mt-4 pt-3 border-t border-border/30">
                <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                  {breakdown.map(({ type, count, tooltip: itemTooltip }) => (
                    <Tooltip key={type} delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'w-full flex items-center justify-between text-left',
                            'text-xs text-muted-foreground/60 py-0.5 px-1 -mx-1 rounded',
                            'hover:text-foreground hover:bg-muted/40 transition-colors'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBreakdownClick?.(type);
                          }}
                        >
                          <span className="truncate">• {type}</span>
                          <span className="ml-2 tabular-nums font-medium">{count}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-[200px] text-xs"
                      >
                        {itemTooltip}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-[240px] text-xs"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
