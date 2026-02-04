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
    critical: 'border-red-300/40 bg-red-50/50 hover:border-red-400/60 hover:bg-red-50 dark:border-destructive/40 dark:bg-destructive/[0.03] dark:hover:border-destructive/60 dark:hover:bg-destructive/[0.05]',
    high: 'border-sky-300/40 bg-sky-50/50 hover:border-sky-400/60 hover:bg-sky-50 dark:border-cyan-500/30 dark:bg-cyan-500/[0.03] dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/[0.05]',
    medium: 'border-amber-300/40 bg-amber-50/50 hover:border-amber-400/60 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/[0.03] dark:hover:border-amber-500/50 dark:hover:bg-amber-500/[0.05]',
    low: 'border-slate-200/60 bg-slate-50/30 hover:border-slate-300/80 hover:bg-slate-50/50 dark:border-slate-600/40 dark:bg-slate-800/20 dark:hover:border-slate-500/60 dark:hover:bg-slate-700/30',
  };

  // Executive industrial color palette for icons - refined for light/dark modes
  const iconStyles = {
    critical: 'bg-red-100 text-red-600 dark:bg-destructive/15 dark:text-red-400',
    high: 'bg-sky-100 text-sky-600 dark:bg-cyan-500/15 dark:text-cyan-400',
    medium: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400',
  };

  // Executive value styles with refined glow for dark mode, solid colors for light mode
  const valueStyles = {
    critical: 'text-red-600 dark:text-red-400 dark:drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    high: 'text-sky-600 dark:text-cyan-400 dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]',
    medium: 'text-amber-600 dark:text-amber-400 dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]',
    low: 'text-slate-600 dark:text-slate-300 dark:drop-shadow-[0_0_8px_rgba(148,163,184,0.35)]',
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
