import { useEffect, useMemo, useRef } from 'react';
import { Copy, Info, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime, safeTruncate } from '@/lib/dashboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DriverSignal {
  name: string;
  contribution: number;
  rationale: string;
}

interface RecommendationAction {
  tag: 'Ops' | 'Comms' | 'Safety';
  text: string;
}

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
  modelMode: 'Demo' | 'Active Event';
  keyDrivers: DriverSignal[];
  uncertainty: { p50: string; p90: string; rangeNote: string };
  tradeoffs: string[];
  recommendedActions: RecommendationAction[];
  focusSection?: 'provenance' | 'drivers' | 'uncertainty' | 'tradeoffs' | 'actions' | 'assets';
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
  modelMode,
  keyDrivers,
  uncertainty,
  tradeoffs,
  recommendedActions,
  focusSection,
}: SupportingSignalsSheetProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !focusSection) return;
    const section = contentRef.current?.querySelector<HTMLElement>(`[data-section='${focusSection}']`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSection, open]);

  const copySummary = async () => {
    const payload = [
      `Supporting Signals — ${title}`,
      summary,
      `Source: ${sourceLabel}`,
      `Mode: ${modelMode}`,
      `Updated: ${formatDashboardTime(timestamp)}`,
      `Confidence: ${confidence}`,
      `Drivers: ${keyDrivers.map((driver) => `${driver.name} (${driver.contribution}%)`).join(', ')}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      toast.success('Supporting summary copied');
    } catch {
      toast.error('Unable to copy summary');
    }
  };

  const confidenceBand = useMemo(() => (confidence === 'High' ? 'Narrow band' : confidence === 'Med' ? 'Moderate band' : 'Wide band'), [confidence]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base">Supporting Signals</SheetTitle>
              <SheetDescription className="mt-1 text-xs">Explainable AI evidence for operator decision support.</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copySummary} className={cn('h-8 gap-1 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>
                <Copy className="h-3.5 w-3.5" />Copy
              </Button>
              <SheetClose className={cn('rounded-md p-1.5 text-muted-foreground', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} aria-label="Close supporting signals panel">
                <X className="h-4 w-4" />
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        <div ref={contentRef} className="h-[calc(100vh-5.5rem)] space-y-5 overflow-y-auto py-4 text-sm pr-1">
          <section className="space-y-2" data-section="provenance">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provenance</h3>
            <p className="font-medium text-foreground">{safeTruncate(title, 120)}</p>
            <p className="text-muted-foreground">{safeTruncate(summary, 220)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{sourceLabel}</Badge>
              <Badge variant="outline">Model mode: {modelMode}</Badge>
              <Badge variant="outline">Confidence: {confidence}</Badge>
              <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(timestamp)}</span>
            </div>
          </section>

          <section className="space-y-2" data-section="drivers">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key drivers (ranked)</h3>
            <ul className="space-y-2">
              {keyDrivers.map((driver) => (
                <li key={driver.name} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{driver.name}</p>
                    <Badge variant="outline">{driver.contribution}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{driver.rationale}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2" data-section="uncertainty">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uncertainty</h3>
            <div className="rounded-md border border-border/60 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">ETR P50: {uncertainty.p50}</Badge>
                <Badge variant="outline">ETR P90: {uncertainty.p90}</Badge>
                <Badge variant="outline">{confidenceBand}</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className={cn('inline-flex items-center text-muted-foreground', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} aria-label="Uncertainty explanation">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] text-xs">
                    {uncertainty.rangeNote}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </section>

          <section className="space-y-2" data-section="tradeoffs">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trade-offs</h3>
            <ul className="list-disc space-y-1 pl-4 text-foreground/90">
              {tradeoffs.map((line, index) => <li key={index}>{safeTruncate(line, 170)}</li>)}
            </ul>
          </section>

          <section className="space-y-2" data-section="actions">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</h3>
            <ul className="space-y-2">
              {recommendedActions.map((action, index) => (
                <li key={`${action.tag}-${index}`} className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <Badge variant="secondary" className="mt-0.5 text-[10px]">{action.tag}</Badge>
                  <span className="text-foreground/90">{safeTruncate(action.text, 160)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2" data-section="assets">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affected grid assets / feeder context</h3>
            <div className="grid grid-cols-2 gap-2">
              {compactMetrics.map((metric) => (
                <div key={metric.label} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                  <p className="text-base font-semibold tabular-nums">{metric.value}</p>
                </div>
              ))}
            </div>
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional highlights</h4>
              <ul className="list-disc space-y-1 pl-4 text-foreground/90">
                {highlights.map((line, index) => <li key={index}>{safeTruncate(line, 160)}</li>)}
              </ul>
              <h4 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legacy recommendations</h4>
              <ul className="list-disc space-y-1 pl-4 text-foreground/90">
                {actions.map((line, index) => <li key={index}>{safeTruncate(line, 160)}</li>)}
              </ul>
            </section>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
