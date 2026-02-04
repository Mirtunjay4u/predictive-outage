import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';
import { format } from 'date-fns';
import { KPICard } from '@/components/dashboard/KPICard';
import { HighPriorityAlert } from '@/components/dashboard/HighPriorityAlert';
import { cn } from '@/lib/utils';

const KPI_TOOLTIPS: Record<string, string> = {
  'Total Events': 'All tracked outage and risk events across their lifecycle.',
  'Pre-Event': 'Events under monitoring or preparedness before outages occur.',
  'Active Events': 'Ongoing outage or incident events requiring operational attention.',
  'High Priority': 'Critical active events impacting safety, hospitals, or large customer counts.',
  'Post-Event': 'Completed events under review or analysis.',
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

const HIGH_PRIORITY_THRESHOLD = 3;

export default function Dashboard() {
  const navigate = useNavigate();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { data: scenarios = [], dataUpdatedAt, refetch, isFetching } = useScenarios({ 
    refetchInterval: 30000
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
    if (lifecycle) {
      params.set('lifecycle', lifecycle);
    }
    params.set('outage_type', outageType);
    navigate(`/events?${params.toString()}`);
  };

  const getOperationalSummary = () => {
    if (stats.highPriority > 0) {
      return {
        emphasis: `${stats.highPriority} high priority event${stats.highPriority > 1 ? 's' : ''}`,
        detail: 'require attention',
      };
    }
    if (stats.active > 0) {
      return {
        emphasis: `${stats.active} active event${stats.active > 1 ? 's' : ''}`,
        detail: 'in progress',
      };
    }
    if (stats.preEvent > 0) {
      return {
        emphasis: `${stats.preEvent} event${stats.preEvent > 1 ? 's' : ''}`,
        detail: 'under monitoring',
      };
    }
    return {
      emphasis: 'No active events',
      detail: 'at this time',
    };
  };

  const summary = getOperationalSummary();

  const kpiCards = [
    {
      label: 'Total Events',
      value: stats.total,
      icon: FileText,
      tooltip: KPI_TOOLTIPS['Total Events'],
      breakdown: undefined,
      filter: null,
      emphasis: 'low' as const,
    },
    {
      label: 'Pre-Event',
      value: stats.preEvent,
      icon: Clock,
      tooltip: KPI_TOOLTIPS['Pre-Event'],
      breakdown: getOutageBreakdown(preEventScenarios),
      filter: 'Pre-Event',
      emphasis: 'medium' as const,
    },
    {
      label: 'Active Events',
      value: stats.active,
      icon: Activity,
      tooltip: KPI_TOOLTIPS['Active Events'],
      breakdown: getOutageBreakdown(activeScenarios),
      filter: 'Event',
      emphasis: 'high' as const,
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      icon: AlertTriangle,
      tooltip: KPI_TOOLTIPS['High Priority'],
      breakdown: getOutageBreakdown(highPriorityScenarios),
      filter: 'Event&priority=high',
      emphasis: 'critical' as const,
    },
    {
      label: 'Post-Event',
      value: stats.postEvent,
      icon: CheckCircle,
      tooltip: KPI_TOOLTIPS['Post-Event'],
      breakdown: getOutageBreakdown(postEventScenarios),
      filter: 'Post-Event',
      emphasis: 'low' as const,
    },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Operations Dashboard
            </h1>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="font-medium text-foreground">{summary.emphasis}</span>
              {' '}
              <span className="text-muted-foreground">{summary.detail}</span>
              <span className="mx-2 text-border">•</span>
              <span className="text-muted-foreground/70">
                {stats.total} total event{stats.total !== 1 ? 's' : ''} tracked
              </span>
            </p>
          </div>

          <div
            className="flex items-center gap-3 text-xs text-muted-foreground/70"
            aria-live="polite"
            aria-atomic="true"
          >
            {dataUpdatedAt > 0 && (
              <span
                className="tabular-nums"
                aria-label={`Data last updated at ${format(new Date(dataUpdatedAt), 'h:mm a')}`}
              >
                Updated {format(new Date(dataUpdatedAt), 'h:mm a')}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-muted-foreground hover:text-foreground',
                'hover:bg-muted/50 transition-colors'
              )}
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh data"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </header>

      {/* High Priority Alert Banner */}
      {stats.highPriority >= HIGH_PRIORITY_THRESHOLD && !alertDismissed && (
        <HighPriorityAlert
          count={stats.highPriority}
          onView={() => navigate('/events?lifecycle=Event&priority=high')}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      {/* KPI Cards Grid */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {kpiCards.map((card) => (
            <KPICard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tooltip={card.tooltip}
              breakdown={card.breakdown}
              emphasis={card.emphasis}
              onClick={() => handleTileClick(card.filter)}
              onBreakdownClick={(type) => handleTypeClick(card.filter, type)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
