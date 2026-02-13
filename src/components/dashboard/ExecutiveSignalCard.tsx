import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Scenario } from '@/types/scenario';
import type { BriefingData } from '@/components/dashboard/AIExecutiveBriefingPanel';
import { CONFIDENCE_BADGE_CLASS } from '@/components/dashboard/AIExecutiveBriefingPanel';
import { formatDashboardTime, safeTruncate } from '@/lib/dashboard';

interface ExecutiveSignalCardProps {
  scenarios: Scenario[];
  dataUpdatedAt: number;
  briefing: BriefingData | null;
  isLoading: boolean;
  error: string | null;
  boardroomMode?: boolean;
  onOpenSupportingSignals: () => void;
}

type ExecutiveSignal = {
  title: string;
  detail: string;
  confidence: BriefingData['confidence'];
  updatedTime: Date;
  source: 'nemotron' | 'fallback';
};

function deriveFallbackSignal(scenarios: Scenario[], dataUpdatedAt: number): ExecutiveSignal {
  const active = scenarios.filter((scenario) => scenario.lifecycle_stage === 'Event');
  const highPriority = active.filter((scenario) => scenario.priority === 'high');

  return {
    title: highPriority.length > 0 ? 'Elevated restoration risk across high-priority events' : 'Operations stable with active monitoring posture',
    detail: `${highPriority.length} high-priority · ${active.length} active events`,
    confidence: highPriority.length > 2 ? 'Low' : highPriority.length > 0 ? 'Med' : 'High',
    updatedTime: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : new Date(),
    source: 'fallback',
  };
}

function deriveSignalFromBriefing(briefing: BriefingData): ExecutiveSignal {
  return {
    title: safeTruncate(briefing.insights[0], 74, 'Elevated operational risk requires attention'),
    detail: 'Derived from latest AI executive briefing',
    confidence: briefing.confidence,
    updatedTime: briefing.updatedTime,
    source: 'nemotron',
  };
}

export function ExecutiveSignalCard({ scenarios, dataUpdatedAt, briefing, isLoading, error, boardroomMode = false, onOpenSupportingSignals }: ExecutiveSignalCardProps) {
  const signal = briefing ? deriveSignalFromBriefing(briefing) : deriveFallbackSignal(scenarios, dataUpdatedAt);

  return (
    <Card className="mb-4 rounded-xl border border-border/60 bg-card shadow-sm">
      <CardHeader className={boardroomMode ? 'px-5 pb-2 pt-5' : 'px-4 pb-2 pt-4'}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={boardroomMode ? 'flex items-center gap-2 text-base font-semibold' : 'flex items-center gap-2 text-sm font-semibold'}>
            <Sparkles className="h-4 w-4 text-primary" />
            Executive Signal
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={CONFIDENCE_BADGE_CLASS[signal.confidence]}>Confidence: {signal.confidence}</Badge>
            <span>Updated {formatDashboardTime(signal.updatedTime)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className={boardroomMode ? 'space-y-3 px-5 pb-5' : 'space-y-2 px-4 pb-4'}>
        {isLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Refreshing executive signal…</div>}
        {error && <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertCircle className="h-3.5 w-3.5" />AI signal unavailable. Showing deterministic fallback.</div>}

        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
          <p className={boardroomMode ? 'text-2xl font-semibold tracking-tight text-foreground' : 'text-xl font-semibold tracking-tight text-foreground'}>{signal.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{signal.detail}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">Source: {signal.source === 'nemotron' ? 'Derived from AI Briefing' : 'Deterministic fallback'}.</p>
          <Button size="sm" variant="outline" onClick={onOpenSupportingSignals} className="h-8 text-xs">Supporting Signals</Button>
        </div>
      </CardContent>
    </Card>
  );
}
