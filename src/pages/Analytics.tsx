import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useScenarios } from '@/hooks/useScenarios';

export default function Analytics() {
  const { data: scenarios = [] } = useScenarios();

  // Group by lifecycle stage
  const byLifecycle = {
    'Pre-Event': scenarios.filter(s => s.lifecycle_stage === 'Pre-Event').length,
    'Event': scenarios.filter(s => s.lifecycle_stage === 'Event').length,
    'Post-Event': scenarios.filter(s => s.lifecycle_stage === 'Post-Event').length,
  };

  // Group by priority
  const byPriority = {
    high: scenarios.filter(s => s.priority === 'high').length,
    medium: scenarios.filter(s => s.priority === 'medium').length,
    low: scenarios.filter(s => s.priority === 'low').length,
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground">Insights and metrics for your scenarios</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Lifecycle Stage Distribution
              </CardTitle>
              <CardDescription>Scenarios grouped by their current lifecycle stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(byLifecycle).map(([stage, count]) => (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{stage}</span>
                      <span className="text-muted-foreground">{count} scenarios</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scenarios.length ? (count / scenarios.length) * 100 : 0}%` }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          stage === 'Pre-Event' ? 'bg-warning' :
                          stage === 'Event' ? 'bg-primary' : 'bg-accent'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Priority Distribution
              </CardTitle>
              <CardDescription>Scenarios grouped by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(byPriority).map(([priority, count]) => (
                  <div key={priority}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium capitalize">{priority}</span>
                      <span className="text-muted-foreground">{count} scenarios</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scenarios.length ? (count / scenarios.length) * 100 : 0}%` }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          priority === 'high' ? 'bg-destructive' :
                          priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Summary Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">{scenarios.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Scenarios</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-success">
                    {scenarios.filter(s => s.stage).length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Active Scenarios</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-warning">
                    {new Set(scenarios.filter(s => s.operator_role).map(s => s.operator_role)).size}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Unique Operators</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-destructive">
                    {scenarios.filter(s => s.priority === 'high').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">High Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
