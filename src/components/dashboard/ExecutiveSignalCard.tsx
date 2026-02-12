import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';
import type { BriefingData } from '@/components/dashboard/AIExecutiveBriefingPanel';
import { CONFIDENCE_BADGE_CLASS } from '@/components/dashboard/AIExecutiveBriefingPanel';

interface ExecutiveSignalCardProps {
  scenarios: Scenario[];
  dataUpdatedAt: number;
  briefing: BriefingData | null;
  isLoading: boolean;
  error: string | null;
}

type ExecutiveSignal = {
  title: string;
  detail: string;
  confidence: BriefingData['confidence'];
  updatedTime: Date;
  source: 'nemotron' | 'fallback';
};

function pickConfidenceFromCounts(highPriorityCount: number, activeCount: number): BriefingData['confidence'] {
  if (highPriorityCount >= 5 || activeCount >= 10) return 'Low';
  if (highPriorityCount >= 2 || activeCount >= 5) return 'Med';
  return 'High';
}

function deriveFallbackSignal(scenarios: Scenario[], dataUpdatedAt: number): ExecutiveSignal {
  const forecasted = scenarios.filter((scenario) => scenario.lifecycle_stage === 'Pre-Event');
  const active = scenarios.filter((scenario) => scenario.lifecycle_stage === 'Event');
  const highPriority = active.filter((scenario) => scenario.priority === 'high');

  const title = highPriority.length > 0
    ? 'High Storm Escalation Risk'
    : active.length > 0
      ? 'Active Outage Stabilization Needed'
      : forecasted.length > 0
        ? 'Preparedness Window Open'
        : 'Operations Stable — Continue Monitoring';

  const detail = `${highPriority.length} high priority events · ${forecasted.length} forecasted risk events`;

  return {
    title,
    detail,
    confidence: pickConfidenceFromCounts(highPriority.length, active.length),
    updatedTime: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : new Date(),
    source: 'fallback',
  };
}

function deriveSignalFromBriefing(briefing: BriefingData): ExecutiveSignal {
  const topInsight = briefing.insights[0]?.trim() || 'Elevated operational risk requires attention';
  const sanitizedTitle = topInsight.length > 58 ? `${topInsight.slice(0, 57).trimEnd()}…` : topInsight;

  return {
    title: sanitizedTitle,
    detail: 'Derived from latest AI executive briefing',
    confidence: briefing.confidence,
    updatedTime: briefing.updatedTime,
    source: 'nemotron',
  };
}

export function ExecutiveSignalCard({ scenarios, dataUpdatedAt, briefing, isLoading, error }: ExecutiveSignalCardProps) {
  const fallbackSignal = deriveFallbackSignal(scenarios, dataUpdatedAt);
  const signal = briefing ? deriveSignalFromBriefing(briefing) : fallbackSignal;

  return (
    <Card className="mb-3 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Executive Signal
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">AI-identified priority</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={CONFIDENCE_BADGE_CLASS[signal.confidence]}>
              Confidence: {signal.confidence}
            </Badge>
            <span>Updated {format(signal.updatedTime, 'h:mm a')}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-1">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Refreshing executive signal…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            AI signal unavailable. Showing deterministic fallback.
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 px-3 py-3">
          <div
            className={cn(
              'pointer-events-none absolute inset-0 rounded-lg opacity-60',
              'bg-[radial-gradient(circle_at_15%_50%,hsl(var(--primary)/0.20),transparent_55%)]',
              'animate-pulse',
            )}
          />
          <p className="relative text-xl font-semibold tracking-tight text-foreground">{signal.title}</p>
          <p className="relative mt-1 text-xs text-muted-foreground">{signal.detail}</p>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Source: {signal.source === 'nemotron' ? 'Nemotron AI briefing' : 'Deterministic KPI fallback'}.
        </p>
      </CardContent>
    </Card>
  );
}
