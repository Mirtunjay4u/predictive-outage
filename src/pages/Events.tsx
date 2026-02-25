import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, AlertTriangle, Activity, Zap, ShieldX, ShieldAlert, ShieldCheck,
  Loader2, Play, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useScenarios, useCreateScenario, useUpdateScenario, useDeleteScenario } from '@/hooks/useScenarios';
import { EventFilters } from '@/components/events/EventFilters';
import { EventTable } from '@/components/events/EventTable';
import { EventCard } from '@/components/events/EventCard';
import { EventDrawer } from '@/components/events/EventDrawer';
import { EventDetailPanel } from '@/components/events/EventDetailPanel';
import { EmptyState } from '@/components/EmptyState';
import { ScenarioTableSkeleton, ScenarioCardsSkeleton } from '@/components/LoadingSkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { deriveSeverity } from '@/components/events/EventDetailPanel';
import type { Scenario, ScenarioInsert } from '@/types/scenario';
import { fetchNWSAlerts, fetchWindGrid, type NWSAlertFeature, type WindPoint } from '@/lib/weather';
import { computeAllWeatherRisks, type WeatherRiskResult } from '@/lib/weather-risk';
import { useInsertDecisionLog } from '@/hooks/useDecisionLog';

// ── Policy evaluation result type ────────────────────────────────────────────
type PolicyResult = {
  policyGate?: string;
  allowedActions?: Array<{ action: string; reason: string }>;
  blockedActions?: Array<{ action: string; reason: string; remediation?: string | string[] }>;
  escalationFlags?: string[];
  etrBand?: { band: string; confidence?: number };
  explainability?: {
    drivers?: Array<{ key: string; value: string | number | boolean; weight: number }>;
    assumptions?: string[];
    dataQualityWarnings?: string[];
  };
};

// Per-event policy state stored in a map
type PolicyMap = Record<string, { status: 'idle' | 'loading' | 'done' | 'error'; result: PolicyResult | null }>;

// ── Triage buckets ────────────────────────────────────────────────────────────
type Bucket = 'immediate' | 'monitoring' | 'resolved';

function triageBucket(s: Scenario): Bucket {
  const sev = deriveSeverity(s);
  if (s.lifecycle_stage === 'Post-Event') return 'resolved';
  if (sev >= 4 || s.has_critical_load || s.priority === 'high') return 'immediate';
  return 'monitoring';
}

// ── Tiny summary stat chip ────────────────────────────────────────────────────
function StatChip({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/40 bg-surface-1 px-3 py-2.5 flex flex-col gap-0.5', accent)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

// ── Policy Status mini badge (for table rows) ─────────────────────────────────
export function PolicyStatusBadge({
  policyState,
  onRun,
  eventId,
}: {
  policyState: { status: 'idle' | 'loading' | 'done' | 'error'; result: PolicyResult | null } | undefined;
  onRun: (id: string) => void;
  eventId: string;
}) {
  const s = policyState;

  if (!s || s.status === 'idle') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onRun(eventId); }}
        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Play className="h-2.5 w-2.5" />
        Run Copilot
      </button>
    );
  }

  if (s.status === 'loading') {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Evaluating…
      </div>
    );
  }

  if (s.status === 'error') {
    return <span className="text-[10px] text-destructive">Eval failed</span>;
  }

  const gate = s.result?.policyGate ?? 'PASS';
  const icon =
    gate === 'BLOCK' ? <ShieldX className="h-3 w-3 text-red-400" />
    : gate === 'WARN' ? <ShieldAlert className="h-3 w-3 text-amber-400" />
    : <ShieldCheck className="h-3 w-3 text-emerald-400" />;

  const cls =
    gate === 'BLOCK' ? 'bg-red-500/10 border-red-400/40 text-red-700 dark:text-red-300'
    : gate === 'WARN' ? 'bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300'
    : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-300';

  const allowed = s.result?.allowedActions?.length ?? 0;
  const blocked = s.result?.blockedActions?.length ?? 0;

  return (
    <div className="space-y-0.5">
      <div className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls)}>
        {icon}
        {gate}
      </div>
      <div className="flex gap-1.5 text-[10px] text-muted-foreground">
        <span className="text-emerald-600 dark:text-emerald-400">✓{allowed}</span>
        <span className="text-red-600 dark:text-red-400">✗{blocked}</span>
      </div>
    </div>
  );
}

// ── Triage Queue Section ───────────────────────────────────────────────────────
function TriageSection({
  title,
  subtitle,
  accentClass,
  dot,
  scenarios,
  policyMap,
  weatherRiskMap,
  onRowClick,
  onEdit,
  onDelete,
  onRunCopilot,
  defaultOpen,
}: {
  title: string;
  subtitle: string;
  accentClass: string;
  dot: string;
  scenarios: Scenario[];
  policyMap: PolicyMap;
  weatherRiskMap?: Map<string, WeatherRiskResult>;
  onRowClick: (s: Scenario) => void;
  onEdit: (s: Scenario) => void;
  onDelete: (id: string) => void;
  onRunCopilot: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div className="rounded-lg border border-border/40 bg-surface-1 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dot)} />
          <span className="font-semibold text-sm text-foreground">{title}</span>
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', accentClass)}>
            {scenarios.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground hidden sm:block">{subtitle}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {scenarios.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No events in this queue</p>
            ) : (
              <EventTable
                scenarios={scenarios}
                policyMap={policyMap}
                weatherRiskMap={weatherRiskMap}
                onRowClick={onRowClick}
                onEdit={onEdit}
                onDelete={onDelete}
                onRunCopilot={onRunCopilot}
                bordered={false}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stageFilter, setStageFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [outageTypeFilter, setOutageTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [triageMode, setTriageMode] = useState(true);

  // Policy eval map: eventId → {status, result}
  const [policyMap, setPolicyMap] = useState<PolicyMap>({});

  // Detail panel
  const [detailScenario, setDetailScenario] = useState<Scenario | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit drawer
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // URL params from dashboard / analytics
  useEffect(() => {
    const lifecycleParam = searchParams.get('lifecycle');
    const outageTypeParam = searchParams.get('outage_type');
    const outageTypesParam = searchParams.get('outage_types');
    const priorityParam = searchParams.get('priority');
    if (lifecycleParam || outageTypeParam || outageTypesParam || priorityParam) {
      if (lifecycleParam) setLifecycleFilter(lifecycleParam);
      if (outageTypesParam) setOutageTypeFilter(outageTypesParam);
      else if (outageTypeParam) setOutageTypeFilter(outageTypeParam);
      if (priorityParam) setPriorityFilter(priorityParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: scenarios = [], isLoading, error } = useScenarios();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const deleteMutation = useDeleteScenario();

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((s) => {
      if (stageFilter !== 'all') {
        if (stageFilter === 'active' && !s.stage) return false;
        if (stageFilter === 'inactive' && s.stage) return false;
      }
      if (lifecycleFilter !== 'all' && s.lifecycle_stage !== lifecycleFilter) return false;
      if (outageTypeFilter !== 'all') {
        const types = outageTypeFilter.split(',');
        if (!types.includes(s.outage_type ?? '')) return false;
      }
      if (priorityFilter !== 'all' && s.priority !== priorityFilter) return false;
      return true;
    });
  }, [scenarios, stageFilter, lifecycleFilter, outageTypeFilter, priorityFilter]);

  // Weather data for risk scores (auto-fetch, no user toggle needed)
  const { data: nwsAlertsData } = useQuery({
    queryKey: ['nws-alerts-events'],
    queryFn: fetchNWSAlerts,
    refetchInterval: 3 * 60 * 1000,
    staleTime: 90 * 1000,
    retry: 2,
  });

  const { data: windPoints = [] } = useQuery({
    queryKey: ['wind-grid-events'],
    queryFn: () => fetchWindGrid(29.76, -95.37, 4, 0.35),
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const weatherRiskMap = useMemo(() => {
    return computeAllWeatherRisks(filteredScenarios, nwsAlertsData?.features ?? [], windPoints);
  }, [filteredScenarios, nwsAlertsData, windPoints]);

  // ── Weather API decision log writes ──
  const insertLog = useInsertDecisionLog();
  const weatherLogRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nwsAlertsData || !filteredScenarios.length) return;
    // Build a fingerprint to avoid duplicate logs on re-render
    const alertCount = nwsAlertsData.features?.length ?? 0;
    const fingerprint = `${alertCount}-${filteredScenarios.length}-${windPoints.length}`;
    if (weatherLogRef.current === fingerprint) return;
    weatherLogRef.current = fingerprint;

    // Find the top-risk active event to log against
    const activeEvents = filteredScenarios.filter(s => s.lifecycle_stage === 'Event');
    const topEvent = activeEvents.length > 0
      ? activeEvents.reduce((best, s) => {
          const score = weatherRiskMap.get(s.id)?.score ?? 0;
          return score > (weatherRiskMap.get(best.id)?.score ?? 0) ? s : best;
        })
      : filteredScenarios[0];

    if (!topEvent) return;

    const risk = weatherRiskMap.get(topEvent.id);
    const eventsWithRisk = filteredScenarios.filter(s => (weatherRiskMap.get(s.id)?.score ?? 0) > 0).length;

    insertLog.mutate({
      event_id: topEvent.id,
      source: 'Weather API',
      trigger: `NWS alert refresh (${alertCount} active alerts, wind grid ${windPoints.length} pts)`,
      action_taken: `Weather data refreshed — ${eventsWithRisk} events scored. Top: ${risk?.score ?? 0}/100 (${risk?.tier ?? 'N/A'}) for "${topEvent.name}"`,
      rule_impact: (risk?.score ?? 0) >= 60 ? 'Elevated weather exposure — operator review recommended' : null,
      metadata: { alertCount, windPoints: windPoints.length, eventsScored: eventsWithRisk, topScore: risk?.score, topTier: risk?.tier },
    });
  }, [nwsAlertsData, windPoints, weatherRiskMap]); // eslint-disable-line react-hooks/exhaustive-deps
  const immediate = useMemo(() => filteredScenarios.filter((s) => triageBucket(s) === 'immediate'), [filteredScenarios]);
  const monitoring = useMemo(() => filteredScenarios.filter((s) => triageBucket(s) === 'monitoring'), [filteredScenarios]);
  const resolved = useMemo(() => filteredScenarios.filter((s) => triageBucket(s) === 'resolved'), [filteredScenarios]);

  const activeFilters = useMemo(() => {
    const f: string[] = [];
    if (lifecycleFilter !== 'all') f.push(lifecycleFilter);
    if (outageTypeFilter !== 'all') {
      const types = outageTypeFilter.split(',');
      f.push(types.length > 1 ? `${types.length} Outage Types` : outageTypeFilter);
    }
    if (priorityFilter !== 'all') f.push(`Priority: ${priorityFilter}`);
    return f;
  }, [lifecycleFilter, outageTypeFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: filteredScenarios.length,
    active: filteredScenarios.filter((s) => s.lifecycle_stage === 'Event').length,
    high: filteredScenarios.filter((s) => s.priority === 'high').length,
    critical: filteredScenarios.filter((s) => s.has_critical_load).length,
  }), [filteredScenarios]);

  const clearFilters = () => {
    setLifecycleFilter('all');
    setOutageTypeFilter('all');
    setStageFilter('all');
    setPriorityFilter('all');
  };

  // ── Run Copilot for a single event ──────────────────────────────────────────
  const runCopilot = useCallback(async (eventId: string) => {
    const scenario = scenarios.find((s) => s.id === eventId);
    if (!scenario) return;

    setPolicyMap((prev) => ({ ...prev, [eventId]: { status: 'loading', result: null } }));

    const priority = scenario.priority ?? 'medium';
    const severityNum = priority === 'high' ? 5 : priority === 'medium' ? 3 : 1;
    const hazardMap: Record<string, string> = {
      Storm: 'STORM', Lightning: 'STORM', 'High Wind': 'STORM', 'Snow Storm': 'STORM',
      Wildfire: 'WILDFIRE', Vegetation: 'WILDFIRE',
      Flood: 'RAIN', 'Heavy Rain': 'RAIN',
      Heatwave: 'HEAT', 'Ice/Snow': 'ICE',
    };
    const hazardType = hazardMap[scenario.outage_type ?? ''] ?? 'UNKNOWN';
    const phase =
      scenario.lifecycle_stage === 'Pre-Event' ? 'PRE_EVENT'
      : scenario.lifecycle_stage === 'Event' ? 'ACTIVE'
      : 'POST_EVENT';

    const payload = {
      scenarioId: scenario.id,
      hazardType,
      phase,
      severity: severityNum,
      customersAffected: scenario.customers_impacted ?? 0,
      criticalLoads: (scenario.critical_load_types ?? []).map((t) => ({
        type: String(t).toUpperCase(),
        backupHoursRemaining: scenario.backup_runtime_remaining_hours ?? undefined,
      })),
      crews: { available: 3, enRoute: 1 },
      dataQuality: { completeness: 0.8, freshnessMinutes: 15 },
    };

    try {
      const { data, error } = await supabase.functions.invoke('copilot-evaluate', { body: payload });
      if (error) throw error;
      setPolicyMap((prev) => ({ ...prev, [eventId]: { status: 'done', result: data as PolicyResult } }));
    } catch {
      setPolicyMap((prev) => ({ ...prev, [eventId]: { status: 'error', result: null } }));
    }
  }, [scenarios]);

  const handleRowClick = (scenario: Scenario) => {
    setDetailScenario(scenario);
    setIsDetailOpen(true);
  };

  const handleCreate = () => { setEditingScenario(null); setIsDrawerOpen(true); };
  const handleEdit = (scenario: Scenario) => { setEditingScenario(scenario); setIsDrawerOpen(true); };

  const handleSave = (data: ScenarioInsert) => {
    if (editingScenario) {
      updateMutation.mutate({ id: editingScenario.id, data }, { onSuccess: () => setIsDrawerOpen(false) });
    } else {
      createMutation.mutate(data, { onSuccess: () => setIsDrawerOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          if (detailScenario?.id === deleteId) setIsDetailOpen(false);
        },
      });
    }
  };

  return (
    <div data-tour-section="events" className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6 space-y-4">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold text-foreground">Operational Events</h1>
                <span className="rounded border border-border/50 bg-muted/30 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rule Engine Gateway
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Operator decision-support layer — each event includes ETR confidence banding, critical load prioritization, and deterministic policy evaluation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Triage mode toggle */}
              <button
                onClick={() => setTriageMode((v) => !v)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                  triageMode
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                Triage View
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Summary strip ── */}
        {!isLoading && scenarios.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch"
            data-tour="events-summary-strip"
          >
            <StatChip label="Total Events" value={stats.total} />
            <StatChip label="Active Outages" value={stats.active} />
            <StatChip label="High Priority" value={stats.high} accent={stats.high > 0 ? 'border-amber-400/30' : ''} />
            <StatChip label="Crit. Load" value={stats.critical} accent={stats.critical > 0 ? 'border-red-400/30' : ''} />
          </motion.div>
        )}

        {/* ── Active filter banner ── */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2 border border-border/50"
          >
            <span className="text-muted-foreground">Filtered by:</span>
            <span className="font-medium">{activeFilters.join(' · ')}</span>
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}

        {/* ── Filters bar ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <EventFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
            lifecycleFilter={lifecycleFilter}
            onLifecycleFilterChange={setLifecycleFilter}
            outageTypeFilter={outageTypeFilter}
            onOutageTypeFilterChange={setOutageTypeFilter}
            onCreateClick={handleCreate}
          />
        </motion.div>

        {/* ── Content ── */}
        {isLoading ? (
          viewMode === 'table' ? <ScenarioTableSkeleton /> : <ScenarioCardsSkeleton />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load events"
            description="There was an error loading events. Please try again."
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        ) : filteredScenarios.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No events found"
            description={
              scenarios.length === 0
                ? 'Get started by creating your first event'
                : 'No events match your current filters'
            }
            actionLabel={scenarios.length === 0 ? 'Create Event' : undefined}
            onAction={scenarios.length === 0 ? handleCreate : undefined}
          />
        ) : triageMode && viewMode === 'table' ? (
          /* ── Triage queue view ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-4">
            {/* Policy eval strip */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Policy Evaluation</p>
                <span className="text-xs text-muted-foreground">— Run Copilot per event to evaluate operator actions</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => filteredScenarios.forEach((s) => {
                  if (!policyMap[s.id] || policyMap[s.id].status === 'idle') runCopilot(s.id);
                })}
              >
                <Play className="h-3 w-3" />
                Run All
              </Button>
            </div>

            <TriageSection
              title="Immediate Attention"
              subtitle="Sev 4–5 · Critical load · High priority"
              accentClass="bg-red-500/10 border-red-400/40 text-red-700 dark:text-red-300"
              dot="bg-red-500"
              scenarios={immediate}
              policyMap={policyMap}
              weatherRiskMap={weatherRiskMap}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onRunCopilot={runCopilot}
              defaultOpen
            />
            <TriageSection
              title="Monitoring"
              subtitle="Sev 2–3 · No critical load · Stable"
              accentClass="bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300"
              dot="bg-amber-400"
              scenarios={monitoring}
              policyMap={policyMap}
              weatherRiskMap={weatherRiskMap}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onRunCopilot={runCopilot}
              defaultOpen
            />
            <TriageSection
              title="Resolved / De-escalated"
              subtitle="Post-event · Closed · Sev 1"
              accentClass="bg-muted/60 border-border/60 text-muted-foreground"
              dot="bg-muted-foreground"
              scenarios={resolved}
              policyMap={policyMap}
              weatherRiskMap={weatherRiskMap}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onRunCopilot={runCopilot}
              defaultOpen={false}
            />
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <EventTable
              scenarios={filteredScenarios}
              policyMap={policyMap}
              weatherRiskMap={weatherRiskMap}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onRunCopilot={runCopilot}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredScenarios.map((scenario) => (
              <EventCard
                key={scenario.id}
                scenario={scenario}
                policyState={policyMap[scenario.id]}
                onClick={() => handleRowClick(scenario)}
                onDelete={() => setDeleteId(scenario.id)}
                onRunCopilot={() => runCopilot(scenario.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Event Detail Panel ── */}
      <EventDetailPanel
        scenario={detailScenario}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
        externalPolicyState={detailScenario ? policyMap[detailScenario.id] : undefined}
        onRunCopilot={detailScenario ? () => runCopilot(detailScenario.id) : undefined}
      />

      {/* ── Edit Drawer ── */}
      <EventDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenario={editingScenario}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
