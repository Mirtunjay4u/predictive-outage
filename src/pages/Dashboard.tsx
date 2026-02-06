import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';
import { format } from 'date-fns';
import { FlippableKPICard } from '@/components/dashboard/FlippableKPICard';
import { ImmediateAttentionStrip } from '@/components/dashboard/ImmediateAttentionStrip';
import { OperationalWorkQueue } from '@/components/dashboard/OperationalWorkQueue';
import { SafetyRiskPanel } from '@/components/dashboard/SafetyRiskPanel';
import { CrewWorkloadPanel } from '@/components/dashboard/CrewWorkloadPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

// KPI card configuration
const KPI_CONFIG: Record<string, { title: string; subtitle: string; tooltip: string }> = {
  'Total Events': {
    title: 'All Tracked Events',
    subtitle: 'All outage-related events currently monitored',
    tooltip: 'Complete inventory of events across all lifecycle stages.',
  },
  'Pre-Event': {
    title: 'Upcoming Risk Events',
    subtitle: 'Forecasted events with outage potential',
    tooltip: 'Events under monitoring or preparedness before outages occur.',
  },
  'Active Events': {
    title: 'Ongoing Outages',
    subtitle: 'Events currently impacting service',
    tooltip: 'Ongoing outage or incident events requiring operational attention.',
  },
  'High Priority': {
    title: 'Immediate Attention',
    subtitle: 'Critical load, uncertainty, or elevated risk detected',
    tooltip: 'Critical active events impacting safety, hospitals, or large customer counts.',
  },
  'Post-Event': {
    title: 'Recently Resolved',
    subtitle: 'Events pending review or reporting',
    tooltip: 'Completed events under review or analysis.',
  },
  'Restoration': {
    title: 'Restoration Readiness',
    subtitle: 'Operational readiness metrics',
    tooltip: 'Metrics tracking ETR validation, communications, and closure readiness.',
  },
};

const OUTAGE_TYPE_TOOLTIPS: Record<string, string> = {
  'Storm': 'Weather-driven events influenced by wind, rain, or lightning.',
  'Flood': 'Events where access, safety, or restoration is constrained by flooding.',
  'Heavy Rain': 'Events caused by excessive rainfall affecting infrastructure.',
  'Heatwave': 'Events triggered by extreme heat affecting equipment or demand.',
  'Wildfire': 'Events related to fire risk or active wildfire conditions.',
  'Lightning': 'Events caused by lightning strikes or electrical surges.',
  'Ice/Snow': 'Events involving ice accumulation or snow-related damage.',
  'High Wind': 'Events caused by sustained high winds or gusts.',
  'Equipment Failure': 'Events caused by mechanical or electrical equipment issues.',
  'Vegetation': 'Events caused by tree or vegetation contact with infrastructure.',
  'Unknown': 'Events with undetermined or unclassified cause.',
};

function getOutageBreakdown(scenarios: Scenario[]): { type: string; count: number; tooltip: string }[] {
  const breakdown: Record<string, number> = {};
  scenarios.forEach(s => {
    const type = s.outage_type || 'Unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return Object.entries(breakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      tooltip: OUTAGE_TYPE_TOOLTIPS[type] || `Events categorized as ${type}.`,
    }));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: scenarios = [], dataUpdatedAt, refetch, isFetching } = useScenarios({
    refetchInterval: 30000,
  });

  const preEventScenarios = scenarios.filter(s => s.lifecycle_stage === 'Pre-Event');
  const activeScenarios = scenarios.filter(s => s.lifecycle_stage === 'Event');
  const highPriorityScenarios = scenarios.filter(s => s.lifecycle_stage === 'Event' && s.priority === 'high');
  const postEventScenarios = scenarios.filter(s => s.lifecycle_stage === 'Post-Event');

  const stats = {
    total: scenarios.length,
    preEvent: preEventScenarios.length,
    active: activeScenarios.length,
    highPriority: highPriorityScenarios.length,
    postEvent: postEventScenarios.length,
  };

  const handleTileClick = (filter: string | null) => {
    if (filter) {
      navigate(`/events?lifecycle=${encodeURIComponent(filter)}`);
    } else {
      navigate('/events');
    }
  };

  const handleTypeClick = (lifecycle: string | null, outageType: string) => {
    const params = new URLSearchParams();
    if (lifecycle) params.set('lifecycle', lifecycle);
    params.set('outage_type', outageType);
    navigate(`/events?${params.toString()}`);
  };

  const getOperationalSummary = () => {
    if (stats.highPriority > 0) {
      return { emphasis: `${stats.highPriority} high priority event${stats.highPriority > 1 ? 's' : ''}`, detail: 'require attention' };
    }
    if (stats.active > 0) {
      return { emphasis: `${stats.active} active event${stats.active > 1 ? 's' : ''}`, detail: 'in progress' };
    }
    if (stats.preEvent > 0) {
      return { emphasis: `${stats.preEvent} event${stats.preEvent > 1 ? 's' : ''}`, detail: 'under monitoring' };
    }
    return { emphasis: 'No active events', detail: 'at this time' };
  };

  const summary = getOperationalSummary();

  const kpiCards = [
    { key: 'Total Events', value: stats.total, icon: FileText, breakdown: undefined, scenarios, filter: null, emphasis: 'low' as const },
    { key: 'Pre-Event', value: stats.preEvent, icon: Clock, breakdown: getOutageBreakdown(preEventScenarios), scenarios: preEventScenarios, filter: 'Pre-Event', emphasis: 'medium' as const },
    { key: 'Active Events', value: stats.active, icon: Activity, breakdown: getOutageBreakdown(activeScenarios), scenarios: activeScenarios, filter: 'Event', emphasis: 'high' as const },
    { key: 'High Priority', value: stats.highPriority, icon: AlertTriangle, breakdown: getOutageBreakdown(highPriorityScenarios), scenarios: highPriorityScenarios, filter: 'Event&priority=high', emphasis: 'critical' as const },
    { key: 'Post-Event', value: stats.postEvent, icon: CheckCircle, breakdown: getOutageBreakdown(postEventScenarios), scenarios: postEventScenarios, filter: 'Post-Event', emphasis: 'low' as const },
  ];

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* Header - Compact */}
      <header className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Grid Resilience Command Center
            </h1>
            <p className="text-[11px] text-muted-foreground/70">
              <span className="font-medium text-foreground">{summary.emphasis}</span>
              {' '}
              <span>{summary.detail}</span>
              <span className="mx-1.5 text-muted-foreground/40">•</span>
              <span>{stats.total} total event{stats.total !== 1 ? 's' : ''} tracked</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 shrink-0">
            {dataUpdatedAt > 0 && (
              <span className="tabular-nums">
                Updated {format(new Date(dataUpdatedAt), 'h:mm a')}
              </span>
            )}
            <div className="flex items-center gap-1 border-l border-border/40 pl-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh data"
              >
                <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Immediate Attention Strip */}
      <ImmediateAttentionStrip
        scenarios={highPriorityScenarios}
        onViewAll={() => navigate('/events?lifecycle=Event&priority=high')}
        onEventClick={(id) => navigate(`/events/${id}`)}
      />

      {/* 3-6-3 Grid Layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left Column - 3 cols: Operational Work Queue */}
        <div className="col-span-12 lg:col-span-3">
          <OperationalWorkQueue scenarios={scenarios} />
        </div>

        {/* Center Column - 6 cols: KPI Cards Grid */}
        <div className="col-span-12 lg:col-span-6">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {kpiCards.map((card) => {
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
                  onClick={() => handleTileClick(card.filter)}
                  onBreakdownClick={(type) => handleTypeClick(card.filter, type)}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column - 3 cols: Safety & Risk + Crew & Workload stacked */}
        <div className="col-span-12 lg:col-span-3 grid grid-rows-2 gap-3">
          <SafetyRiskPanel scenarios={scenarios} />
          <CrewWorkloadPanel scenarios={scenarios} />
        </div>
      </div>
    </div>
  );
}
