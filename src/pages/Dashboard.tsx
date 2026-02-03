import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';

type OutageType = Scenario['outage_type'];

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

function getOutageBreakdown(scenarios: Scenario[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  scenarios.forEach(s => {
    const type = s.outage_type || 'Unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return breakdown;
}

interface BreakdownListProps {
  breakdown: Record<string, number>;
  lifecycleFilter: string | null;
  onTypeClick: (lifecycle: string | null, outageType: string) => void;
}

function BreakdownList({ breakdown, lifecycleFilter, onTypeClick }: BreakdownListProps) {
  const entries = Object.entries(breakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <div className="max-h-24 overflow-y-auto space-y-1">
        {entries.map(([type, count]) => (
          <Tooltip key={type} delayDuration={300}>
            <TooltipTrigger asChild>
              <p 
                className="text-xs text-muted-foreground/70 cursor-pointer hover:text-foreground hover:underline transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeClick(lifecycleFilter, type);
                }}
              >
                • {type}: {count}
              </p>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              className="max-w-[200px] text-xs bg-popover/95 text-popover-foreground border-border/50"
            >
              {OUTAGE_TYPE_TOOLTIPS[type] || `Events categorized as ${type}.`}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: scenarios = [] } = useScenarios();

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

  const breakdowns = {
    preEvent: getOutageBreakdown(preEventScenarios),
    active: getOutageBreakdown(activeScenarios),
    highPriority: getOutageBreakdown(highPriorityScenarios),
    postEvent: getOutageBreakdown(postEventScenarios),
  };

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: FileText, breakdown: null, filter: null },
    { label: 'Pre-Event', value: stats.preEvent, icon: Clock, breakdown: breakdowns.preEvent, filter: 'Pre-Event' },
    { label: 'Active Events', value: stats.active, icon: Activity, breakdown: breakdowns.active, filter: 'Event' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, breakdown: breakdowns.highPriority, filter: 'Event&priority=high' },
    { label: 'Post-Event', value: stats.postEvent, icon: CheckCircle, breakdown: breakdowns.postEvent, filter: 'Post-Event' },
  ];

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

  // Generate operational summary
  const getOperationalSummary = () => {
    if (stats.highPriority > 0) {
      return `${stats.highPriority} high priority event${stats.highPriority > 1 ? 's' : ''} requiring attention`;
    }
    if (stats.active > 0) {
      return `${stats.active} active event${stats.active > 1 ? 's' : ''} in progress`;
    }
    if (stats.preEvent > 0) {
      return `${stats.preEvent} event${stats.preEvent > 1 ? 's' : ''} under monitoring`;
    }
    return 'No active events at this time';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold mb-2">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {getOperationalSummary()} • {stats.total} total event{stats.total !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Tooltip key={stat.label} delayDuration={400}>
            <TooltipTrigger asChild>
              <Card 
                className="border-border/50 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
                onClick={() => handleTileClick(stat.filter)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  {stat.breakdown && (
                    <BreakdownList 
                      breakdown={stat.breakdown} 
                      lifecycleFilter={stat.filter} 
                      onTypeClick={handleTypeClick}
                    />
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="max-w-[220px] text-xs bg-popover/95 text-popover-foreground border-border/50"
            >
              {KPI_TOOLTIPS[stat.label]}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}