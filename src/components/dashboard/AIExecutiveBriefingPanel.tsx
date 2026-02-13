import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
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
  onBriefingStateChange?: (payload: { briefing: BriefingData; isLoading: boolean; error: string | null }) => void;
}

const CONFIDENCE_BADGE_CLASS: Record<ConfidenceLevel, string> = {
  High: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Med: 'bg-amber-100 text-amber-800 border-amber-300',
  Low: 'bg-rose-100 text-rose-800 border-rose-300',
};

export { CONFIDENCE_BADGE_CLASS };

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseJsonObjectFromText(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseNemotronBriefing(answer: string): Omit<BriefingData, 'updatedTime' | 'source'> | null {
  const parsed = parseJsonObjectFromText(answer);
  if (!parsed) return null;

  const insightsRaw = Array.isArray(parsed.insights) ? parsed.insights : [];
  const actionsRaw = Array.isArray(parsed.actions) ? parsed.actions : [];
  const confidenceRaw = typeof parsed.confidence === 'string' ? parsed.confidence : 'Low';

  const insights = insightsRaw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 3);

  const actions = actionsRaw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 2);

  const normalizedConfidence = confidenceRaw.toLowerCase();
  const confidence: ConfidenceLevel = normalizedConfidence === 'high'
    ? 'High'
    : normalizedConfidence === 'med' || normalizedConfidence === 'medium'
      ? 'Med'
      : 'Low';

  if (insights.length < 3 || actions.length < 2) return null;

  return { insights, actions, confidence };
}

function buildDeterministicFallback(scenarios: Scenario[], dataUpdatedAt: number): BriefingData {
  const active = scenarios.filter((scenario) => scenario.lifecycle_stage === 'Event');
  const highPriority = active.filter((scenario) => scenario.priority === 'high');
  const criticalLoad = active.filter((scenario) => scenario.has_critical_load);

  const outageTypeCounts = active.reduce<Record<string, number>>((acc, scenario) => {
    const key = scenario.outage_type ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const [topOutageType = 'mixed causes'] = Object.entries(outageTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  const clusterCounts = active.reduce<Record<string, number>>((acc, scenario) => {
    const clusterKey = scenario.service_area ?? scenario.location_name ?? 'Unspecified area';
    acc[clusterKey] = (acc[clusterKey] ?? 0) + 1;
    return acc;
  }, {});

  const topClusters = Object.entries(clusterCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name, count]) => `${name} (${count})`);

  const criticalLoadTypes = Array.from(
    new Set(
      criticalLoad.flatMap((scenario) => scenario.critical_load_types ?? []),
    ),
  );

  const totalImpactedCustomers = active.reduce(
    (sum, scenario) => sum + (scenario.customers_impacted ?? 0),
    0,
  );

  const confidence: ConfidenceLevel = highPriority.length === 0
    ? 'High'
    : highPriority.length <= 2
      ? 'Med'
      : 'Low';

  return {
    insights: [
      `Primary risk driver in the last six hours is ${toTitleCase(topOutageType)} with ${active.length} active outage event${active.length === 1 ? '' : 's'} tracked.`,
      topClusters.length > 0
        ? `Likely outage clusters are concentrated in ${topClusters.join(' and ')}.`
        : 'Likely outage clusters are currently dispersed with no dominant concentration.',
      criticalLoad.length > 0
        ? `Critical loads impacted: ${criticalLoad.length} event${criticalLoad.length === 1 ? '' : 's'} affecting ${criticalLoadTypes.length > 0 ? criticalLoadTypes.join(', ') : 'priority facilities'}.`
        : 'No active critical-load impact detected; continue targeted monitoring for hospitals, water, and emergency services.',
    ],
    actions: [
      `Stage crews near ${topClusters[0]?.split(' (')[0] ?? 'highest-risk zones'} and pre-position restoration kits for ${toTitleCase(topOutageType)} fault patterns.`,
      `Review switching plans for high-priority feeders and issue customer communications for ~${totalImpactedCustomers.toLocaleString()} potentially impacted customers in at-risk clusters.`,
    ],
    confidence,
    updatedTime: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : new Date(),
    source: 'fallback',
  };
}

export function AIExecutiveBriefingPanel({ scenarios, dataUpdatedAt, onBriefingStateChange }: AIExecutiveBriefingPanelProps) {
  const fallbackBriefing = useMemo(
    () => buildDeterministicFallback(scenarios, dataUpdatedAt),
    [dataUpdatedAt, scenarios],
  );
  const [briefing, setBriefing] = useState<BriefingData>(fallbackBriefing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBriefing(fallbackBriefing);
  }, [fallbackBriefing]);

  useEffect(() => {
    onBriefingStateChange?.({ briefing, isLoading, error });
  }, [briefing, error, isLoading, onBriefingStateChange]);

  useEffect(() => {
    let isCancelled = false;

    const loadBriefing = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const context = {
          last6h_window: true,
          total_events: scenarios.length,
          active_events: scenarios.filter((scenario) => scenario.lifecycle_stage === 'Event').length,
          high_priority_events: scenarios.filter((scenario) => scenario.lifecycle_stage === 'Event' && scenario.priority === 'high').length,
          active_scenarios: scenarios
            .filter((scenario) => scenario.lifecycle_stage === 'Event')
            .slice(0, 20)
            .map((scenario) => ({
              name: scenario.name,
              outage_type: scenario.outage_type,
              priority: scenario.priority,
              service_area: scenario.service_area,
              location_name: scenario.location_name,
              customers_impacted: scenario.customers_impacted,
              has_critical_load: scenario.has_critical_load,
              critical_load_types: scenario.critical_load_types,
              notes: scenario.notes,
            })),
        };

        const { data, error: fnError } = await supabase.functions.invoke('nemotron', {
          body: {
            prompt: `Generate an executive outage briefing for the last six hours in strict JSON only with this schema: {"insights":["...","...","..."],"actions":["...","..."],"confidence":"High|Med|Low"}. Insights must cover risk drivers, likely outage clusters, and critical loads impacted. Actions must cover crew staging and switching plan/customer communications review.`,
            context: JSON.stringify(context),
          },
        });

        if (fnError) throw fnError;
        if (!data?.ok || typeof data.answer !== 'string') {
          throw new Error(data?.error || 'Nemotron response unavailable');
        }

        const parsed = parseNemotronBriefing(data.answer);
        if (!parsed) {
          throw new Error('Nemotron returned non-structured briefing content');
        }

        if (!isCancelled) {
          setBriefing({
            ...parsed,
            updatedTime: new Date(),
            source: 'nemotron',
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load AI briefing');
          setBriefing(fallbackBriefing);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBriefing();

    return () => {
      isCancelled = true;
    };
  }, [fallbackBriefing, scenarios]);

  const isEmptyState = scenarios.length === 0;

  return (
    <Card className="mb-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-0 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Briefing (Last 6 hours)
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={CONFIDENCE_BADGE_CLASS[briefing.confidence]}>
              Confidence: {briefing.confidence}
            </Badge>
            <span>Updated {format(briefing.updatedTime, 'h:mm a')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating AI executive summary…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4" />
            Nemotron unavailable. Showing deterministic briefing fallback.
          </div>
        )}

        {briefing.source === 'fallback' && (
          <div className="flex items-center justify-start">
            <Badge variant="outline" className="border-amber-300 bg-amber-100/70 text-amber-900">
              Using fallback summary
            </Badge>
          </div>
        )}

        {isEmptyState && (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No scenario records found in the last refresh window. Showing baseline operational guidance.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Insights</h3>
            <ul className="space-y-1.5 text-sm text-foreground/90 list-disc pl-4">
              {briefing.insights.map((insight, index) => (
                <li key={`insight-${index}`}>{insight}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Recommended actions</h3>
            <ul className="space-y-1.5 text-sm text-foreground/90 list-disc pl-4">
              {briefing.actions.map((action, index) => (
                <li key={`action-${index}`}>{action}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Source: {briefing.source === 'nemotron' ? 'Nemotron AI' : 'Deterministic fallback brief'}.
        </p>
      </CardContent>
    </Card>
  );
}
