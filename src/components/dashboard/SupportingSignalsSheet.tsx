import { useEffect, useRef } from 'react';
import { Copy, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime, safeTruncate } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

type SignalSection = 'drivers' | 'assets' | 'uncertainty' | 'tradeoffs' | 'actions';

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
  initialSection?: SignalSection;
  selectedFeeder?: string | null;
  uncertaintyBand?: { p50: Date; p90: Date };
  rankedDrivers?: Array<{ label: string; score: number; rationale: string }>;
  taggedActions?: Array<{ tag: 'Oper' | 'Comms' | 'Safety'; text: string }>;
  tradeoffs?: string[];
  topAssets?: Array<{ id: string; name: string; customers: number; criticalLoads: number; risk: string }>;
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
  initialSection = 'drivers',
  selectedFeeder,
  uncertaintyBand,
  rankedDrivers = [],
  taggedActions = [],
  tradeoffs = [],
  topAssets = [],
}: SupportingSignalsSheetProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const driversRef = useRef<HTMLElement | null>(null);
  const assetsRef = useRef<HTMLElement | null>(null);
  const uncertaintyRef = useRef<HTMLElement | null>(null);
  const tradeoffsRef = useRef<HTMLElement | null>(null);
  const actionsRef = useRef<HTMLElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const refs = { drivers: driversRef, assets: assetsRef, uncertainty: uncertaintyRef, tradeoffs: tradeoffsRef, actions: actionsRef };
    const target = refs[initialSection].current;
    if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [initialSection, open]);

  const copySummary = async () => {
    const text = `${title}\n${summary}\nSource: ${sourceLabel}\nConfidence: ${confidence}`;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Summary copied to clipboard.' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
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

        <div ref={contentRef} className="h-[calc(100vh-7rem)] space-y-5 overflow-y-auto py-4 text-sm">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signal</h3>
            <p className="font-medium text-foreground">{safeTruncate(title, 120)}</p>
            <p className="text-muted-foreground">{safeTruncate(summary, 220)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">Confidence: {confidence}</Badge>
              <Badge variant="outline" className={sourceLabel.toLowerCase().includes('nemotron') ? 'border-[hsl(120,60%,40%)]/40 bg-[hsl(120,60%,40%)]/10 text-[hsl(120,60%,65%)]' : ''}>Provenance: {sourceLabel}</Badge>
              <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(timestamp)}</span>
              <Button variant="outline" size="sm" onClick={() => void copySummary()} className={cn('h-7 text-[11px] transition-colors hover:border-[hsl(120,60%,40%)]/50 hover:bg-[hsl(120,60%,40%)]/15 hover:text-[hsl(120,60%,65%)]', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}><Copy className="mr-1.5 h-3 w-3" />Copy summary</Button>
            </div>
          </section>

          <section ref={driversRef} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ranked Key Drivers</h3>
            <div className="space-y-2">
              {rankedDrivers.map((driver, index) => (
                <div key={driver.label} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-xs font-medium">{index + 1}. {driver.label} <span className="text-muted-foreground">({driver.score})</span></p>
                  <p className="text-[11px] text-muted-foreground">{driver.rationale}</p>
                </div>
              ))}
            </div>
          </section>

          <section ref={assetsRef} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affected Grid Assets</h3>
            <div className="space-y-2">
              {topAssets.map((asset) => (
                <div key={asset.id} className={cn('rounded-md border p-2.5', selectedFeeder === asset.id ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-muted/20')}>
                  <p className="text-xs font-medium">{asset.name} ({asset.id})</p>
                  <p className="text-[11px] text-muted-foreground">{asset.customers.toLocaleString()} customers · {asset.criticalLoads} critical loads · {asset.risk} risk</p>
                </div>
              ))}
            </div>
          </section>

          <section ref={uncertaintyRef} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uncertainty Band</h3>
            <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 text-[12px]">
              <div className="flex items-center gap-2">
                <span>P50: {uncertaintyBand ? formatDashboardTime(uncertaintyBand.p50) : '—'}</span>
                <span>·</span>
                <span>P90: {uncertaintyBand ? formatDashboardTime(uncertaintyBand.p90) : '—'}</span>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="cursor-help text-muted-foreground">ⓘ</span></TooltipTrigger><TooltipContent className="max-w-[220px] text-xs">P50 indicates the central estimate. P90 is conservative and is always ordered to be at or later than P50.</TooltipContent></Tooltip></TooltipProvider>
              </div>
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

          <section ref={tradeoffsRef} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trade-offs</h3>
            <ul className="list-disc space-y-1 pl-4 text-foreground/90">
              {tradeoffs.map((line, index) => <li key={index}>{safeTruncate(line, 180)}</li>)}
            </ul>
          </section>

          <section ref={actionsRef} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tagged Actions</h3>
            <div className="space-y-1.5">
              {taggedActions.map((line, index) => (
                <div key={index} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                  <Badge variant="outline" className="mr-2 text-[10px]">{line.tag}</Badge>
                  <span className="text-xs">{line.text}</span>
                </div>
              ))}
            </div>
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
