import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScenarios } from '@/hooks/useScenarios';

export default function Dashboard() {
  const { data: scenarios = [] } = useScenarios();

  const stats = {
    total: scenarios.length,
    active: scenarios.filter(s => s.stage).length,
    preEvent: scenarios.filter(s => s.lifecycle_stage === 'Pre-Event').length,
    event: scenarios.filter(s => s.lifecycle_stage === 'Event').length,
    postEvent: scenarios.filter(s => s.lifecycle_stage === 'Post-Event').length,
    highPriority: scenarios.filter(s => s.priority === 'high').length,
  };

  const statCards = [
    { label: 'Total Scenarios', value: stats.total, icon: FileText, color: 'text-primary' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-success' },
    { label: 'Pre-Event', value: stats.preEvent, icon: Clock, color: 'text-warning' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your scenario operations</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Lifecycle Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pre-Event</span>
                    <span className="text-muted-foreground">{stats.preEvent}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning rounded-full transition-all"
                      style={{ width: `${stats.total ? (stats.preEvent / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Event</span>
                    <span className="text-muted-foreground">{stats.event}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${stats.total ? (stats.event / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Post-Event</span>
                    <span className="text-muted-foreground">{stats.postEvent}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${stats.total ? (stats.postEvent / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-medium">Activation Rate</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">Unique Operators</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {new Set(scenarios.filter(s => s.operator_role).map(s => s.operator_role)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
