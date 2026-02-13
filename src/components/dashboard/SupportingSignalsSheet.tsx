import { X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime, safeTruncate } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

interface SupportingSignalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  highlights: string[];
  actions: string[];
  confidence: 'High' | 'Med' | 'Low';
  sourceLabel: string;
  timestamp: Date | number;
  compactMetrics: Array<{ label: string; value: string }>;
}

export function SupportingSignalsSheet({
  open,
  onOpenChange,
  title,
  summary,
  highlights,
  actions,
  confidence,
  sourceLabel,
  timestamp,
  compactMetrics,
}: SupportingSignalsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base">Supporting Signals</SheetTitle>
              <SheetDescription className="mt-1 text-xs">Quick-scan supporting evidence for leadership review.</SheetDescription>
            </div>
            <SheetClose className={cn('rounded-md p-1.5 text-muted-foreground', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} aria-label="Close supporting signals panel">
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="space-y-5 py-4 text-sm">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signal</h3>
            <p className="font-medium text-foreground">{safeTruncate(title, 120)}</p>
            <p className="text-muted-foreground">{safeTruncate(summary, 220)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">Confidence: {confidence}</Badge>
              <Badge variant="outline">{sourceLabel}</Badge>
              <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(timestamp)}</span>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compact metrics</h3>
            <div className="grid grid-cols-2 gap-2">
              {compactMetrics.map((metric) => (
                <div key={metric.label} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                  <p className="text-base font-semibold tabular-nums">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key highlights</h3>
            <ul className="list-disc space-y-1 pl-4 text-foreground/90">
              {highlights.map((line, index) => <li key={index}>{safeTruncate(line, 160)}</li>)}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended actions</h3>
            <ul className="list-disc space-y-1 pl-4 text-foreground/90">
              {actions.map((line, index) => <li key={index}>{safeTruncate(line, 160)}</li>)}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
