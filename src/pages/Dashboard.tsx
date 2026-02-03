import { FileText, Clock, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useScenarios } from '@/hooks/useScenarios';

export default function Dashboard() {
  const { data: scenarios = [] } = useScenarios();

  const stats = {
    total: scenarios.length,
    preEvent: scenarios.filter(s => s.lifecycle_stage === 'Pre-Event').length,
    active: scenarios.filter(s => s.lifecycle_stage === 'Event').length,
    highPriority: scenarios.filter(s => s.lifecycle_stage === 'Event' && s.priority === 'high').length,
    postEvent: scenarios.filter(s => s.lifecycle_stage === 'Post-Event').length,
  };

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: FileText },
    { label: 'Pre-Event', value: stats.preEvent, icon: Clock },
    { label: 'Active Events', value: stats.active, icon: Activity },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle },
    { label: 'Post-Event', value: stats.postEvent, icon: CheckCircle },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your event operations</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}