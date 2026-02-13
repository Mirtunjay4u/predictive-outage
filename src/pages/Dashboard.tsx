import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, Zap, Users, Leaf, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';
import { FlippableKPICard } from '@/components/dashboard/FlippableKPICard';
import { ImmediateAttentionStrip } from '@/components/dashboard/ImmediateAttentionStrip';
import { OperationalWorkQueue } from '@/components/dashboard/OperationalWorkQueue';
import { SafetyRiskPanel } from '@/components/dashboard/SafetyRiskPanel';
import { CrewWorkloadPanel } from '@/components/dashboard/CrewWorkloadPanel';
import { OperationalTimeline } from '@/components/dashboard/OperationalTimeline';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { CustomerImpactKPICard } from '@/components/dashboard/CustomerImpactKPICard';
import { ReadinessStrip } from '@/components/dashboard/ReadinessStrip';
import { AIExecutiveBriefingPanel } from '@/components/dashboard/AIExecutiveBriefingPanel';
import type { BriefingData } from '@/components/dashboard/AIExecutiveBriefingPanel';
import { ExecutiveSignalCard } from '@/components/dashboard/ExecutiveSignalCard';
import { SupportingSignalsSheet } from '@/components/dashboard/SupportingSignalsSheet';
import { useDashboardUi } from '@/contexts/DashboardUiContext';
import { useAuth } from '@/contexts/AuthContext';
import { DASHBOARD_INTERACTIVE_BUTTON_CLASS, DASHBOARD_INTERACTIVE_SURFACE_CLASS, DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime } from '@/lib/dashboard';

const KPI_CONFIG: Record<string, { title: string; subtitle: string; tooltip: string }> = {
  'Total Events': { title: 'All Tracked Events', subtitle: 'All outage-related events currently monitored', tooltip: 'Complete inventory of events across all lifecycle stages.' },
  'Pre-Event': { title: 'Upcoming Risk Events', subtitle: 'Forecasted events with outage potential', tooltip: 'Events under monitoring or preparedness before outages occur.' },
  'Active Events': { title: 'Ongoing Outages', subtitle: 'Events currently impacting service', tooltip: 'Events with active service impact, switching plans, or restoration work.' },
  'High Priority': { title: 'Immediate Attention', subtitle: 'Critical load, uncertainty, or elevated risk detected', tooltip: 'Critical events affecting hospitals, public safety corridors, and high-impact customers.' },
  'Post-Event': { title: 'Recently Resolved', subtitle: 'Events pending review or reporting', tooltip: 'Completed events under review or post-event analysis.' },
};

type FilterKey = 'Pre-Event' | 'Event' | 'High Priority' | 'Post-Event' | 'Customer Impact';
type FocusSection = 'provenance' | 'drivers' | 'uncertainty' | 'tradeoffs' | 'actions' | 'assets';

function getOutageBreakdown(scenarios: Scenario[]) {
  const breakdown = scenarios.reduce<Record<string, number>>((acc, s) => {
    const type = s.outage_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(breakdown).map(([type, count]) => ({ type, count, tooltip: `${count} events for ${type}` })).sort((a, b) => b.count - a.count);
}

function computeSystemRisk(scenarios: Scenario[]) {
  const active = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  const highPriority = active.filter((s) => s.priority === 'high').length;
  const weatherSeverity = Math.min(100, scenarios.filter((s) => ['Storm', 'Heavy Rain', 'Wildfire', 'High Wind'].includes(s.outage_type ?? '')).length * 14);
  const criticalLoadExposure = Math.min(100, active.filter((s) => s.has_critical_load).length * 20);
  const outageIntensity = Math.min(100, active.length * 12);
  const crewPressure = Math.min(100, Math.max(0, (active.length - 3) * 14));
  const vegetationExposure = Math.min(100, scenarios.filter((s) => (s.outage_type ?? '').includes('Vegetation')).length * 18);

  const score = Math.round((weatherSeverity * 0.25) + (criticalLoadExposure * 0.25) + (outageIntensity * 0.2) + (crewPressure * 0.15) + (vegetationExposure * 0.15) + highPriority * 1.5);
  const clamped = Math.max(0, Math.min(100, score));

  return {
    score: clamped,
    label: clamped < 25 ? 'Low' : clamped < 50 ? 'Moderate' : clamped < 75 ? 'Elevated' : 'Severe',
    drivers: [
      { key: 'weather', label: 'Weather severity', value: weatherSeverity, section: 'drivers' as const },
      { key: 'critical', label: 'Critical load exposure', value: criticalLoadExposure, section: 'drivers' as const },
      { key: 'active', label: 'Active outages', value: outageIntensity, section: 'assets' as const },
      { key: 'crew', label: 'Crew availability', value: Math.max(5, 100 - crewPressure), section: 'tradeoffs' as const },
      { key: 'vegetation', label: 'Vegetation exposure', value: vegetationExposure, section: 'drivers' as const },
    ],
  };
}

function getEventContext(scenarios: Scenario[]) {
  const current = scenarios.find((s) => s.lifecycle_stage === 'Event') ?? scenarios[0];
  return {
    eventName: current?.location_name || current?.service_area || 'Houston Load Zone',
    hazard: current?.outage_type || 'Storm',
  };
}

function getTopFeeders(scenarios: Scenario[]) {
  const active = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  return active
    .slice()
    .sort((a, b) => (b.customers_impacted ?? 0) - (a.customers_impacted ?? 0))
    .slice(0, 5)
    .map((scenario, idx) => {
      const impacted = scenario.customers_impacted ?? 120 * (idx + 2);
      const confidence = scenario.etr_confidence ?? 'MEDIUM';
      const etr = scenario.etr_expected ? new Date(scenario.etr_expected) : null;
      const risk = scenario.priority === 'high' || (scenario.has_critical_load ?? false) ? 'Elevated' : 'Moderate';
      return {
        id: scenario.id,
        name: scenario.name,
        feederId: scenario.feeder_id ?? `FD-${String(idx + 11).padStart(3, '0')}`,
        risk,
        customersImpacted: impacted,
        criticalLoads: scenario.critical_load_types?.length ?? ((scenario.has_critical_load ?? false) ? 2 : 0),
        etr: etr ? formatDashboardTime(etr) : 'TBD',
        confidence: confidence === 'HIGH' ? 'High' : confidence === 'LOW' ? 'Low' : 'Med',
      };
    });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { boardroomMode } = useDashboardUi();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const { data: scenarios = [], dataUpdatedAt, refetch, isFetching } = useScenarios({ refetchInterval: 30000 });

  const [briefingState, setBriefingState] = useState<{ briefing: BriefingData | null; isLoading: boolean; error: string | null }>({ briefing: null, isLoading: false, error: null });
  const [supportingOpen, setSupportingOpen] = useState(false);
  const [supportingFocus, setSupportingFocus] = useState<FocusSection>('provenance');
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);

  const preEventScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Pre-Event');
  const activeScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Event');
  const highPriorityScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Event' && s.priority === 'high');
  const postEventScenarios = scenarios.filter((s) => s.lifecycle_stage === 'Post-Event');

  const stats = {
    total: scenarios.length,
    preEvent: preEventScenarios.length,
    active: activeScenarios.length,
    highPriority: highPriorityScenarios.length,
    postEvent: postEventScenarios.length,
  };

  const summary = useMemo(() => {
    if (stats.highPriority > 0) return `${stats.highPriority} high-priority events require attention`;
    if (stats.active > 0) return `${stats.active} active events currently in progress`;
    if (stats.preEvent > 0) return `${stats.preEvent} events under monitoring`;
    return 'No active events at this time';
  }, [stats.active, stats.highPriority, stats.preEvent]);

  const eventContext = useMemo(() => getEventContext(scenarios), [scenarios]);
  const systemRisk = useMemo(() => computeSystemRisk(scenarios), [scenarios]);
  const topFeeders = useMemo(() => getTopFeeders(scenarios), [scenarios]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const filteredScenarios = useMemo(() => {
    if (activeFilters.length === 0) return scenarios;
    return scenarios.filter((scenario) => activeFilters.some((filter) => {
      if (filter === 'Event') return scenario.lifecycle_stage === 'Event';
      if (filter === 'Pre-Event') return scenario.lifecycle_stage === 'Pre-Event';
      if (filter === 'Post-Event') return scenario.lifecycle_stage === 'Post-Event';
      if (filter === 'High Priority') return scenario.lifecycle_stage === 'Event' && scenario.priority === 'high';
      if (filter === 'Customer Impact') return (scenario.customers_impacted ?? 0) > 500;
      return false;
    }));
  }, [activeFilters, scenarios]);

  const emphasizedIds = useMemo(() => new Set(filteredScenarios.map((scenario) => scenario.id)), [filteredScenarios]);

  const kpiCards = [
    { key: 'Total Events', value: stats.total, icon: FileText, breakdown: undefined, scenarios, filter: null, emphasis: 'low' as const, filterKey: null },
    { key: 'Pre-Event', value: stats.preEvent, icon: Clock, breakdown: getOutageBreakdown(preEventScenarios), scenarios: preEventScenarios, filter: 'Pre-Event', emphasis: 'medium' as const, filterKey: 'Pre-Event' as const },
    { key: 'Active Events', value: stats.active, icon: Activity, breakdown: getOutageBreakdown(activeScenarios), scenarios: activeScenarios, filter: 'Event', emphasis: 'high' as const, filterKey: 'Event' as const },
    { key: 'High Priority', value: stats.highPriority, icon: AlertTriangle, breakdown: getOutageBreakdown(highPriorityScenarios), scenarios: highPriorityScenarios, filter: 'Event&priority=high', emphasis: 'critical' as const, filterKey: 'High Priority' as const },
    { key: 'Post-Event', value: stats.postEvent, icon: CheckCircle, breakdown: getOutageBreakdown(postEventScenarios), scenarios: postEventScenarios, filter: 'Post-Event', emphasis: 'low' as const, filterKey: 'Post-Event' as const },
  ];

  const compactMetrics = [
    { label: 'Active Events', value: stats.active.toString() },
    { label: 'High Priority', value: stats.highPriority.toString() },
    { label: 'Critical Load', value: activeScenarios.filter((s) => s.has_critical_load).length.toString() },
    { label: 'Tracked Total', value: stats.total.toString() },
  ];

  const modelMode = user?.isDemo ? 'Demo' : 'Active Event';
  const keyDrivers = systemRisk.drivers
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((driver, idx) => ({
      name: driver.label,
      contribution: Math.max(8, Math.round(driver.value / 5)),
      rationale: idx === 0
        ? 'This signal is currently the largest contributor to restoration complexity.'
        : `${driver.label} is raising outage handling complexity in the current operating window.`,
    }));

  const uncertainty = {
    p50: topFeeders[0]?.etr ?? '2:30 PM',
    p90: topFeeders[1]?.etr ?? '4:10 PM',
    rangeNote: 'P50 indicates the most likely restoration time. P90 represents a higher-confidence bound that includes weather and crew variability.',
  };

  return (
    <motion.div
      layout
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      animate={prefersReducedMotion ? { opacity: 1, y: 0 } : boardroomMode ? { opacity: 1, y: 0 } : { opacity: 0.98, y: 2 }}
      className={cn('mx-auto max-w-[1600px]', boardroomMode ? 'px-6 py-7 lg:px-7' : 'px-4 py-5 lg:px-5')}
    >
      <div className="space-y-6 lg:space-y-7">
      <header>
        <div className={cn('flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card shadow-sm', boardroomMode ? 'px-5 py-4' : 'px-4 py-3')}>
          <div>
            <p className="text-[11px] text-muted-foreground">Home &gt; Dashboard &gt; {eventContext.eventName}</p>
            <h1 className={cn('font-semibold tracking-tight text-foreground', boardroomMode ? 'text-2xl' : 'text-xl')}>Operator Copilot — Predictive Outage Management</h1>
            <p className={cn('mt-1 text-muted-foreground', boardroomMode ? 'text-sm' : 'text-xs')}>Event: <span className="font-medium text-foreground">{eventContext.eventName}</span> • Hazard: <span className="font-medium text-foreground">{eventContext.hazard}</span></p>
            {!boardroomMode && <p className="mt-1 text-xs text-muted-foreground/80">{summary} · {stats.total} total tracked</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{modelMode}</Badge>
            {boardroomMode && <Badge variant="outline" className="text-[10px]">Boardroom</Badge>}
            <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(dataUpdatedAt)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh data"><RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {!boardroomMode && <ImmediateAttentionStrip scenarios={highPriorityScenarios} onViewAll={() => navigate('/events?lifecycle=Event&priority=high')} onEventClick={(id) => navigate(`/events/${id}`)} />}

      <Card className={cn('rounded-xl border border-border/60 bg-card shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <CardHeader className="px-4 pb-2 pt-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="h-4 w-4 text-primary" />System Risk Index</CardTitle>
            <Badge variant="outline">{systemRisk.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold tabular-nums">{systemRisk.score}</p>
            <p className="text-xs text-muted-foreground">/ 100 operational risk</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {systemRisk.drivers.map((driver) => (
              <button
                key={driver.key}
                className={cn('rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs', DASHBOARD_INTERACTIVE_BUTTON_CLASS)}
                onClick={() => {
                  setSupportingFocus(driver.section);
                  setSupportingOpen(true);
                }}
              >
                {driver.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AIExecutiveBriefingPanel
        scenarios={scenarios}
        dataUpdatedAt={dataUpdatedAt}
        boardroomMode={boardroomMode}
        onOpenSupportingSignals={() => {
          setSupportingFocus('provenance');
          setSupportingOpen(true);
        }}
        onBriefingStateChange={({ briefing, isLoading, error }) => setBriefingState({ briefing, isLoading, error })}
      />

      <Card className={cn('rounded-xl border border-border/60 bg-card shadow-sm', DASHBOARD_INTERACTIVE_SURFACE_CLASS)}>
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4 text-primary" />Top Impacted Feeders / Circuits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          {topFeeders.map((feeder) => (
            <button
              key={feeder.id}
              onClick={() => {
                setSupportingFocus('assets');
                setSupportingOpen(true);
              }}
              className={cn('grid w-full grid-cols-12 items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-left', DASHBOARD_INTERACTIVE_BUTTON_CLASS, emphasizedIds.has(feeder.id) && 'border-primary/50 bg-primary/5')}
            >
              <div className="col-span-4">
                <p className="text-xs font-medium text-foreground">{feeder.name}</p>
                <p className="text-[11px] text-muted-foreground">{feeder.feederId}</p>
              </div>
              <div className="col-span-2"><Badge variant="outline">{feeder.risk}</Badge></div>
              <div className="col-span-2 text-xs tabular-nums">{feeder.customersImpacted.toLocaleString()} impacted</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div tabIndex={0} className="col-span-2 flex items-center gap-1 text-xs"><Users className="h-3.5 w-3.5" />{feeder.criticalLoads}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Critical facilities connected on this feeder and requiring continuity checks.</TooltipContent>
              </Tooltip>
              <div className="col-span-2 text-right text-xs">{feeder.etr} <Badge variant="secondary" className="ml-1 text-[10px]">{feeder.confidence}</Badge></div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filters</span>
        {activeFilters.length === 0 && <Badge variant="outline">None</Badge>}
        {activeFilters.map((filter) => (
          <button key={filter} className={cn('rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary', DASHBOARD_INTERACTIVE_BUTTON_CLASS)} onClick={() => toggleFilter(filter)}>{filter} ×</button>
        ))}
      </div>

      <div className="grid grid-cols-12 items-start gap-5 lg:gap-6">
        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <OperationalWorkQueue scenarios={filteredScenarios} />
            <OperationalTimeline scenarios={filteredScenarios} />
          </div>
        )}

        <div className={cn('col-span-12', boardroomMode ? 'lg:col-span-12' : 'lg:col-span-6')}>
          <ExecutiveSignalCard
            scenarios={filteredScenarios}
            dataUpdatedAt={dataUpdatedAt}
            briefing={briefingState.briefing}
            isLoading={briefingState.isLoading}
            error={briefingState.error}
            boardroomMode={boardroomMode}
            onOpenSupportingSignals={() => {
              setSupportingFocus('provenance');
              setSupportingOpen(true);
            }}
          />
          <div className={cn('grid gap-4 lg:gap-5', boardroomMode ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 xl:grid-cols-3')}>
            {kpiCards.slice(0, boardroomMode ? 4 : 5).map((card) => {
              const config = KPI_CONFIG[card.key];
              return (
                <FlippableKPICard
                  key={card.key}
                  label={config.title}
                  subtitle={boardroomMode ? undefined : config.subtitle}
                  value={card.value}
                  icon={card.icon}
                  tooltip={config.tooltip}
                  breakdown={card.breakdown}
                  scenarios={card.scenarios}
                  emphasis={card.emphasis}
                  boardroomMode={boardroomMode}
                  selected={card.filterKey ? activeFilters.includes(card.filterKey) : false}
                  onClick={() => card.filterKey && toggleFilter(card.filterKey)}
                  onBreakdownClick={(type) => navigate(`/events?outage_type=${encodeURIComponent(type)}`)}
                />
              );
            })}
            <CustomerImpactKPICard scenarios={scenarios} onClick={() => toggleFilter('Customer Impact')} boardroomMode={boardroomMode} />
          </div>
          {!boardroomMode && <ReadinessStrip scenarios={filteredScenarios} />}
        </div>

        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <SafetyRiskPanel scenarios={filteredScenarios} />
            <CrewWorkloadPanel scenarios={filteredScenarios} />
          </div>
        )}
      </div>

      <SupportingSignalsSheet
        open={supportingOpen}
        onOpenChange={setSupportingOpen}
        title={briefingState.briefing?.insights?.[0] ?? 'Executive supporting signal unavailable'}
        summary={briefingState.briefing?.insights?.[1] ?? 'Fallback to deterministic summary due to unavailable AI output.'}
        highlights={briefingState.briefing?.insights ?? ['No highlights available']}
        actions={briefingState.briefing?.actions ?? ['No actions available']}
        confidence={briefingState.briefing?.confidence ?? 'Low'}
        sourceLabel={briefingState.briefing?.source === 'nemotron' ? 'Derived from AI Briefing' : 'Deterministic fallback'}
        timestamp={briefingState.briefing?.updatedTime ?? dataUpdatedAt}
        compactMetrics={compactMetrics}
        modelMode={modelMode}
        keyDrivers={keyDrivers}
        uncertainty={uncertainty}
        tradeoffs={[
          'Accelerating switching can reduce customer impact but may increase crew safety holds in lightning corridors.',
          'Holding for field validation improves restoration certainty but delays public ETR confidence.',
          'Earlier customer communication lowers escalation risk but can widen perceived uncertainty if weather shifts.',
        ]}
        recommendedActions={[
          { tag: 'Ops', text: 'Pre-stage crews near top two feeder clusters before next weather cell arrival.' },
          { tag: 'Comms', text: 'Issue interval-based update cadence for high-impact feeder groups with P50/P90 framing.' },
          { tag: 'Safety', text: 'Enforce lightning hold thresholds before remote switching on critical-load circuits.' },
        ]}
        focusSection={supportingFocus}
      />
      </div>
    </motion.div>
  );
}
