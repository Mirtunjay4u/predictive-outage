import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';

type OutageType = Scenario['outage_type'];

function getOutageBreakdown(scenarios: Scenario[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  scenarios.forEach(s => {
    const type = s.outage_type || 'Unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return breakdown;
}

function BreakdownList({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <div className="max-h-24 overflow-y-auto space-y-1">
        {entries.map(([type, count]) => (
          <p key={type} className="text-xs text-muted-foreground/70">
            • {type}: {count}
          </p>
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
      navigate(`/scenarios?lifecycle=${encodeURIComponent(filter)}`);
    } else {
      navigate('/scenarios');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your event operations</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.label} 
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
              {stat.breakdown && <BreakdownList breakdown={stat.breakdown} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}