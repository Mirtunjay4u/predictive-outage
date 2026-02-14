import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_INTERACTIVE_SURFACE_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime, safeTruncate } from '@/lib/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Scenario } from '@/types/scenario';

type ConfidenceLevel = 'High' | 'Med' | 'Low';

type BriefingData = {
  insights: string[];
  actions: string[];
  confidence: ConfidenceLevel;
  updatedTime: Date;
  source: 'nemotron' | 'fallback';
};

export type { BriefingData, ConfidenceLevel };

interface AIExecutiveBriefingPanelProps {
  scenarios: Scenario[];
  dataUpdatedAt: number;
  boardroomMode?: boolean;
  onOpenSupportingSignals: () => void;
  onBriefingStateChange?: (payload: { briefing: BriefingData; isLoading: boolean; error: string | null }) => void;
}

const CONFIDENCE_BADGE_CLASS: Record<ConfidenceLevel, string> = {
  High: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Med: 'bg-amber-100 text-amber-800 border-amber-300',
  Low: 'bg-rose-100 text-rose-800 border-rose-300',
};

export { CONFIDENCE_BADGE_CLASS };

function parseNemotronBriefing(answer: string): Omit<BriefingData, 'updatedTime' | 'source'> | null {
  const start = answer.indexOf('{');
  const end = answer.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(answer.slice(start, end + 1)) as Record<string, unknown>;
    const insights = (Array.isArray(parsed.insights) ? parsed.insights : [])
      .map((item) => (typeof item === 'string' ? safeTruncate(item, 180, '').trim() : ''))
      .filter(Boolean)
      .slice(0, 3);
    const actions = (Array.isArray(parsed.actions) ? parsed.actions : [])
      .map((item) => (typeof item === 'string' ? safeTruncate(item, 180, '').trim() : ''))
      .filter(Boolean)
      .slice(0, 2);

    const confidenceText = typeof parsed.confidence === 'string' ? parsed.confidence.toLowerCase() : 'low';
    const confidence: ConfidenceLevel = confidenceText === 'high' ? 'High' : confidenceText.includes('med') ? 'Med' : 'Low';
    if (insights.length < 3 || actions.length < 2) return null;
    return { insights, actions, confidence };
  } catch {
    return null;
  }
}

function buildDeterministicFallback(scenarios: Scenario[], dataUpdatedAt: number): BriefingData {
  const active = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  const highPriority = active.filter((s) => s.priority === 'high');
  const critical = active.filter((s) => s.has_critical_load);
  const customers = active.reduce((sum, s) => sum + (s.customers_impacted ?? 0), 0);

  return {
    insights: [
      `${active.length} active outage events are under management in the current window.`,
      highPriority.length > 0
        ? `${highPriority.length} high-priority event${highPriority.length === 1 ? '' : 's'} are driving executive risk focus.`
        : 'No high-priority events are currently flagged.',
      critical.length > 0
        ? `${critical.length} event${critical.length === 1 ? '' : 's'} are impacting critical loads and require tighter runway tracking.`
        : 'No active critical-load impact is detected at this moment.',
    ],
    actions: [
      'Stage crews around highest-risk clusters and validate switching plans before escalation windows compress.',
      `Refresh customer messaging for approximately ${customers.toLocaleString()} potentially impacted customers and align next update cadence.`,
    ],
    confidence: highPriority.length > 2 ? 'Low' : highPriority.length > 0 ? 'Med' : 'High',
    updatedTime: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : new Date(),
    source: 'fallback',
  };
}

export function AIExecutiveBriefingPanel({ scenarios, dataUpdatedAt, boardroomMode = false, onOpenSupportingSignals, onBriefingStateChange }: AIExecutiveBriefingPanelProps) {
  const fallbackBriefing = useMemo(() => buildDeterministicFallback(scenarios, dataUpdatedAt), [dataUpdatedAt, scenarios]);
  const [briefing, setBriefing] = useState<BriefingData>(fallbackBriefing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBriefing(fallbackBriefing);
  }, [fallbackBriefing]);

  useEffect(() => {
    onBriefingStateChange?.({ briefing, isLoading, error });
  }, [briefing, error, isLoading, onBriefingStateChange]);

  // Throttle NIM calls: cache successful responses for 5 minutes, back off on failures
  const lastFetchRef = useRef<number>(0);
  const backoffRef = useRef<number>(0);
  const cachedBriefingRef = useRef<BriefingData | null>(null);

  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  const BASE_BACKOFF_MS = 30_000; // 30s initial backoff
  const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 min max backoff

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();

    // If we have a cached NIM response that's still fresh, reuse it
    if (cachedBriefingRef.current && now - lastFetchRef.current < CACHE_TTL_MS) {
      setBriefing(cachedBriefingRef.current);
      return;
    }

    // If in backoff window after a failure, skip
    if (backoffRef.current > 0 && now - lastFetchRef.current < backoffRef.current) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('nemotron', {
          body: {
            prompt:
              'Generate an executive outage briefing for the last six hours in strict JSON only with schema {"insights":["...","...","..."],"actions":["...","..."],"confidence":"High|Med|Low"}.',
            context: JSON.stringify({ active_events: scenarios.filter((s) => s.lifecycle_stage === 'Event').slice(0, 20) }),
          },
        });

        if (fnError) throw fnError;

        // Handle graceful fallback responses from the edge function (429/timeout)
        if (data?.fallback) {
          throw new Error(`NIM ${data.reason || 'unavailable'}`);
        }

        if (!data?.ok || typeof data.answer !== 'string') throw new Error('Nemotron response unavailable');

        const parsed = parseNemotronBriefing(data.answer);
        if (!parsed) throw new Error('Nemotron returned non-structured briefing content');
        if (!cancelled) {
          const nimBriefing = { ...parsed, updatedTime: new Date(), source: 'nemotron' as const };
          setBriefing(nimBriefing);
          cachedBriefingRef.current = nimBriefing;
          lastFetchRef.current = Date.now();
          backoffRef.current = 0; // reset backoff on success
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load AI briefing');
          setBriefing(fallbackBriefing);
          lastFetchRef.current = Date.now();
          // Exponential backoff: 30s → 60s → 120s → … capped at 5min
          backoffRef.current = Math.min(
            backoffRef.current > 0 ? backoffRef.current * 2 : BASE_BACKOFF_MS,
            MAX_BACKOFF_MS
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [fallbackBriefing, scenarios]);

  return (
    <Card className={cn('mb-4 rounded-xl border border-border/60 bg-card shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
      <CardHeader className={boardroomMode ? 'px-5 pb-2 pt-5' : 'px-4 pb-2 pt-4'}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={boardroomMode ? 'flex items-center gap-2 text-base font-semibold' : 'flex items-center gap-2 text-sm font-semibold'}>
            <Sparkles className="h-4 w-4 text-primary" />
            AI Briefing
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={CONFIDENCE_BADGE_CLASS[briefing.confidence]}>Confidence: {briefing.confidence}</Badge>
            <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(briefing.updatedTime)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className={boardroomMode ? 'space-y-4 px-5 pb-5' : 'space-y-4 px-4 pb-4'}>
        {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Refreshing briefing…</div>}
        {error && <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertCircle className="h-4 w-4" />Nemotron unavailable. Showing deterministic fallback.</div>}

        <ul className={boardroomMode ? 'space-y-2 text-sm' : 'space-y-1.5 text-sm'}>
          {briefing.insights.slice(0, boardroomMode ? 2 : 3).map((insight, index) => (
            <li key={index} className="list-disc pl-1 ml-4 text-foreground/90">{insight}</li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">Source: {briefing.source === 'nemotron' ? 'Nemotron AI briefing' : 'Deterministic fallback'}.</p>
          <Button size="sm" variant="outline" onClick={onOpenSupportingSignals} className={cn('h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>Supporting Signals</Button>
        </div>
      </CardContent>
    </Card>
  );
}
