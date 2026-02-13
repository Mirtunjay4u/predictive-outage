import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DASHBOARD_TIMESTAMP_CLASS, formatDashboardTime } from '@/lib/dashboard';

const KPI_CONFIG: Record<string, { title: string; subtitle: string; tooltip: string }> = {
  'Total Events': { title: 'All Tracked Events', subtitle: 'All outage-related events currently monitored', tooltip: 'Complete inventory of events across all lifecycle stages.' },
  'Pre-Event': { title: 'Upcoming Risk Events', subtitle: 'Forecasted events with outage potential', tooltip: 'Events under monitoring or preparedness before outages occur.' },
  'Active Events': { title: 'Ongoing Outages', subtitle: 'Events currently impacting service', tooltip: 'Ongoing outage or incident events requiring operational attention.' },
  'High Priority': { title: 'Immediate Attention', subtitle: 'Critical load, uncertainty, or elevated risk detected', tooltip: 'Critical active events impacting safety, hospitals, or large customer counts.' },
  'Post-Event': { title: 'Recently Resolved', subtitle: 'Events pending review or reporting', tooltip: 'Completed events under review or analysis.' },
};

function getOutageBreakdown(scenarios: Scenario[]) {
  const breakdown = scenarios.reduce<Record<string, number>>((acc, s) => {
    const type = s.outage_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(breakdown).map(([type, count]) => ({ type, count, tooltip: `${count} events for ${type}` })).sort((a, b) => b.count - a.count);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { boardroomMode } = useDashboardUi();
  const prefersReducedMotion = useReducedMotion();
  const { data: scenarios = [], dataUpdatedAt, refetch, isFetching } = useScenarios({ refetchInterval: 30000 });

  const [briefingState, setBriefingState] = useState<{ briefing: BriefingData | null; isLoading: boolean; error: string | null }>({ briefing: null, isLoading: false, error: null });
  const [supportingOpen, setSupportingOpen] = useState(false);

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

  const kpiCards = [
    { key: 'Total Events', value: stats.total, icon: FileText, breakdown: undefined, scenarios, filter: null, emphasis: 'low' as const },
    { key: 'Pre-Event', value: stats.preEvent, icon: Clock, breakdown: getOutageBreakdown(preEventScenarios), scenarios: preEventScenarios, filter: 'Pre-Event', emphasis: 'medium' as const },
    { key: 'Active Events', value: stats.active, icon: Activity, breakdown: getOutageBreakdown(activeScenarios), scenarios: activeScenarios, filter: 'Event', emphasis: 'high' as const },
    { key: 'High Priority', value: stats.highPriority, icon: AlertTriangle, breakdown: getOutageBreakdown(highPriorityScenarios), scenarios: highPriorityScenarios, filter: 'Event&priority=high', emphasis: 'critical' as const },
    { key: 'Post-Event', value: stats.postEvent, icon: CheckCircle, breakdown: getOutageBreakdown(postEventScenarios), scenarios: postEventScenarios, filter: 'Post-Event', emphasis: 'low' as const },
  ];

  const compactMetrics = [
    { label: 'Active Events', value: stats.active.toString() },
    { label: 'High Priority', value: stats.highPriority.toString() },
    { label: 'Critical Load', value: activeScenarios.filter((s) => s.has_critical_load).length.toString() },
    { label: 'Tracked Total', value: stats.total.toString() },
  ];

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
            <h1 className={cn('font-semibold tracking-tight text-foreground', boardroomMode ? 'text-2xl' : 'text-xl')}>Predictive Outage Management</h1>
            <p className={cn('mt-1 text-muted-foreground', boardroomMode ? 'text-sm' : 'text-xs')}><span className="font-medium text-foreground">{summary}</span> · {stats.total} total tracked</p>
          </div>
          <div className="flex items-center gap-2">
            {boardroomMode && <Badge variant="outline" className="text-[10px]">Boardroom mode</Badge>}
            <span className={DASHBOARD_TIMESTAMP_CLASS}>Updated {formatDashboardTime(dataUpdatedAt)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh data"><RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {!boardroomMode && <ImmediateAttentionStrip scenarios={highPriorityScenarios} onViewAll={() => navigate('/events?lifecycle=Event&priority=high')} onEventClick={(id) => navigate(`/events/${id}`)} />}

      <AIExecutiveBriefingPanel
        scenarios={scenarios}
        dataUpdatedAt={dataUpdatedAt}
        boardroomMode={boardroomMode}
        onOpenSupportingSignals={() => setSupportingOpen(true)}
        onBriefingStateChange={({ briefing, isLoading, error }) => setBriefingState({ briefing, isLoading, error })}
      />

      <div className="grid grid-cols-12 items-start gap-5 lg:gap-6">
        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <OperationalWorkQueue scenarios={scenarios} />
            <OperationalTimeline scenarios={scenarios} />
          </div>
        )}

        <div className={cn('col-span-12', boardroomMode ? 'lg:col-span-12' : 'lg:col-span-6')}>
          <ExecutiveSignalCard
            scenarios={scenarios}
            dataUpdatedAt={dataUpdatedAt}
            briefing={briefingState.briefing}
            isLoading={briefingState.isLoading}
            error={briefingState.error}
            boardroomMode={boardroomMode}
            onOpenSupportingSignals={() => setSupportingOpen(true)}
          />
          <div className={cn('grid gap-4 lg:gap-5', boardroomMode ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 xl:grid-cols-3')}>
            {kpiCards.slice(0, boardroomMode ? 4 : 5).map((card) => {
              const config = KPI_CONFIG[card.key];
              return (
                <FlippableKPICard
                  key={card.key}
                  label={config.title}
                  subtitle={config.subtitle}
                  value={card.value}
                  icon={card.icon}
                  tooltip={config.tooltip}
                  breakdown={card.breakdown}
                  scenarios={card.scenarios}
                  emphasis={card.emphasis}
                  boardroomMode={boardroomMode}
                  onClick={() => navigate(card.filter ? `/events?lifecycle=${encodeURIComponent(card.filter)}` : '/events')}
                  onBreakdownClick={(type) => navigate(`/events?outage_type=${encodeURIComponent(type)}`)}
                />
              );
            })}
            <CustomerImpactKPICard scenarios={scenarios} onClick={() => navigate('/events?lifecycle=Event')} boardroomMode={boardroomMode} />
          </div>
          {!boardroomMode && <ReadinessStrip scenarios={scenarios} />}
        </div>

        {!boardroomMode && (
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
            <SafetyRiskPanel scenarios={scenarios} />
            <CrewWorkloadPanel scenarios={scenarios} />
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
      />
      </div>
    </motion.div>
  );
}
