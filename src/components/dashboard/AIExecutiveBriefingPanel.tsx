import { useEffect, useMemo, useState } from 'react';
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
  source: 'nemotron' | 'model-router' | 'fallback';
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
    if (insights.length === 0) return null;
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

// ── Module-level cache (survives remounts, shared across instances) ──
const nimCache = {
  briefing: null as BriefingData | null,
  fetchedAt: 0,
  backoff: 0,
  inflight: false,
};
const CACHE_TTL_MS = 60 * 1000;       // 1 minute
const BASE_BACKOFF_MS = 10_000;        // 10s
const MAX_BACKOFF_MS = 60 * 1000;      // 1 min

export function AIExecutiveBriefingPanel({ scenarios, dataUpdatedAt, boardroomMode = false, onOpenSupportingSignals, onBriefingStateChange }: AIExecutiveBriefingPanelProps) {
  const fallbackBriefing = useMemo(() => buildDeterministicFallback(scenarios, dataUpdatedAt), [dataUpdatedAt, scenarios]);
  const [briefing, setBriefing] = useState<BriefingData>(() => nimCache.briefing ?? fallbackBriefing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep fallback in sync but don't overwrite a cached NIM result
  useEffect(() => {
    if (!nimCache.briefing) setBriefing(fallbackBriefing);
  }, [fallbackBriefing]);

  useEffect(() => {
    onBriefingStateChange?.({ briefing, isLoading, error });
  }, [briefing, error, isLoading, onBriefingStateChange]);

  // Stable scenario key to avoid re-fetching when reference changes but data hasn't
  const scenarioKey = useMemo(() => {
    const active = scenarios.filter((s) => s.lifecycle_stage === 'Event');
    return `${active.length}-${active.map((s) => s.id).sort().join(',')}`;
  }, [scenarios]);

  useEffect(() => {
    const now = Date.now();

    // If already in-flight from another mount, don't start another call
    if (nimCache.inflight) return;

    // If cached and fresh, reuse without loading state
    if (nimCache.briefing && now - nimCache.fetchedAt < CACHE_TTL_MS) {
      setBriefing(nimCache.briefing);
      setError(null);
      setIsLoading(false);
      return;
    }

    // If in backoff window, skip
    if (nimCache.backoff > 0 && now - nimCache.fetchedAt < nimCache.backoff) {
      return;
    }

    nimCache.inflight = true;
    let active = true;

    setIsLoading(true);
    setError(null);

    supabase.functions.invoke('nemotron', {
      body: {
        prompt:
          'Generate an executive outage briefing for the last six hours in strict JSON only with schema {"insights":["...","...","..."],"actions":["...","..."],"confidence":"High|Med|Low"}.',
        context: JSON.stringify({ active_events: scenarios.filter((s) => s.lifecycle_stage === 'Event').slice(0, 20) }),
      },
    }).then(({ data, error: fnError }) => {
      if (fnError) throw fnError;
      // If both Nemotron and Model Router failed, use the edge function's domain fallback instead of client-side deterministic
      if (data?.fallback && data.data) {
        const fb = data.data as { insights?: string[]; actions?: string[]; confidence?: string; updatedAt?: string };
        const confText = (fb.confidence ?? 'low').toLowerCase();
        const nimBriefing: BriefingData = {
          insights: (fb.insights ?? []).filter(Boolean).slice(0, 3),
          actions: (fb.actions ?? []).filter(Boolean).slice(0, 2),
          confidence: confText === 'high' ? 'High' : confText.includes('med') ? 'Med' : 'Low',
          updatedTime: fb.updatedAt ? new Date(fb.updatedAt) : new Date(),
          source: 'model-router',
        };
        nimCache.briefing = nimBriefing;
        nimCache.fetchedAt = Date.now();
        nimCache.backoff = 0;
        nimCache.inflight = false;
        setBriefing(nimBriefing);
        setIsLoading(false);
        setError(null);
        return;
      }
      if (!data?.ok || typeof data.answer !== 'string') throw new Error('AI response unavailable');

      const parsed = parseNemotronBriefing(data.answer);
      if (!parsed) throw new Error('AI returned non-structured briefing content');

      const engineSource = (typeof data.model === 'string' && data.model.toLowerCase().includes('router')) ? 'model-router' as const : 'nemotron' as const;
      const nimBriefing = { ...parsed, updatedTime: new Date(), source: engineSource };
      nimCache.briefing = nimBriefing;
      nimCache.fetchedAt = Date.now();
      nimCache.backoff = 0;
      nimCache.inflight = false;

      // Always update state — even if "cancelled", this component instance is still mounted
      // React StrictMode double-invokes effects but the component itself stays mounted
      setBriefing(nimBriefing);
      setIsLoading(false);
      setError(null);
    }).catch((err: unknown) => {
      nimCache.fetchedAt = Date.now();
      nimCache.backoff = Math.min(
        nimCache.backoff > 0 ? nimCache.backoff * 2 : BASE_BACKOFF_MS,
        MAX_BACKOFF_MS
      );
      nimCache.inflight = false;

      if (active) {
        setError(err instanceof Error ? err.message : 'Unable to load AI briefing');
        setBriefing(fallbackBriefing);
        setIsLoading(false);
      }
    });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKey]);

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

      <CardContent className={boardroomMode ? 'space-y-3 px-5 pb-5' : 'space-y-4 px-4 pb-4'}>
        {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Refreshing briefing…</div>}
        {error && !boardroomMode && <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertCircle className="h-4 w-4" />AI engines unavailable. Showing Model Router domain response.</div>}

        {/* ── Insights ── always top 3; boardroom shows them larger */}
        <ul className={boardroomMode ? 'space-y-2.5' : 'space-y-1.5 text-sm'}>
          {briefing.insights.slice(0, 3).map((insight, index) => (
            <li
              key={index}
              className={cn(
                'list-disc pl-1 ml-4 text-foreground/90',
                boardroomMode ? 'text-sm leading-snug' : 'text-sm',
              )}
            >
              {insight}
            </li>
          ))}
        </ul>

        {/* ── Boardroom: 1 action bullet + confidence line; hide extended content */}
        {boardroomMode ? (
          <>
            {briefing.actions.length > 0 && (
              <p className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Next action: </span>
                {briefing.actions[0]}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Source: {briefing.source === 'nemotron' ? 'Nemotron AI briefing' : 'Model Router AI briefing'} · Confidence: {briefing.confidence}
            </p>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">Source: {briefing.source === 'nemotron' ? 'Nemotron AI briefing' : 'Model Router AI briefing'}.</p>
            <Button size="sm" variant="outline" onClick={onOpenSupportingSignals} className={cn('h-8 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}>Supporting Signals</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
