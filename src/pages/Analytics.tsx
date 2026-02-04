import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useScenarios } from '@/hooks/useScenarios';
import type { Scenario } from '@/types/scenario';

interface ScenarioListProps {
  scenarios: Scenario[];
  title: string;
  emptyMessage?: string;
}

function ScenarioList({ scenarios, title, emptyMessage = "No scenarios" }: ScenarioListProps) {
  return (
    <div className="w-72">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <Badge variant="secondary" className="text-xs">
          {scenarios.length}
        </Badge>
      </div>
      {scenarios.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
      ) : (
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-2.5 rounded-md bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-tight truncate flex-1">
                    {scenario.name}
                  </p>
                  {scenario.priority && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${
                        scenario.priority === 'high'
                          ? 'border-destructive/50 text-destructive'
                          : scenario.priority === 'medium'
                          ? 'border-warning/50 text-warning'
                          : 'border-muted-foreground/50 text-muted-foreground'
                      }`}
                    >
                      {scenario.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {scenario.lifecycle_stage}
                  </span>
                  {scenario.customers_impacted && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs text-muted-foreground">
                        {scenario.customers_impacted.toLocaleString()} affected
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function Analytics() {
  const { data: scenarios = [] } = useScenarios();

  // Group by lifecycle stage
  const byLifecycle = {
    'Pre-Event': scenarios.filter(s => s.lifecycle_stage === 'Pre-Event'),
    'Event': scenarios.filter(s => s.lifecycle_stage === 'Event'),
    'Post-Event': scenarios.filter(s => s.lifecycle_stage === 'Post-Event'),
  };

  // Group by priority
  const byPriority = {
    high: scenarios.filter(s => s.priority === 'high'),
    medium: scenarios.filter(s => s.priority === 'medium'),
    low: scenarios.filter(s => s.priority === 'low'),
  };

  // Summary metrics data
  const operatorScenarios = scenarios.filter(s => s.operator_role);
  const uniqueOperatorCount = new Set(operatorScenarios.map(s => s.operator_role)).size;
  
  const summaryMetrics: Array<{
    key: string;
    scenarios: Scenario[];
    label: string;
    displayValue: number;
  }> = [
    { key: 'total', scenarios, label: 'Total Scenarios', displayValue: scenarios.length },
    { key: 'active', scenarios: scenarios.filter(s => s.stage), label: 'Active Scenarios', displayValue: scenarios.filter(s => s.stage).length },
    { key: 'operators', scenarios: operatorScenarios, label: 'Unique Operators', displayValue: uniqueOperatorCount },
    { key: 'highPriority', scenarios: scenarios.filter(s => s.priority === 'high'), label: 'High Priority', displayValue: scenarios.filter(s => s.priority === 'high').length },
  ];

  const lifecycleColors: Record<string, string> = {
    'Pre-Event': 'bg-warning',
    'Event': 'bg-primary',
    'Post-Event': 'bg-accent',
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive',
    medium: 'bg-warning',
    low: 'bg-muted-foreground',
  };

  const metricColors = [
    'text-primary',
    'text-green-600 dark:text-green-500',
    'text-warning',
    'text-destructive',
  ];

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-1 text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Insights and metrics for your scenarios</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Lifecycle Stage Distribution
              </CardTitle>
              <CardDescription>Scenarios grouped by their current lifecycle stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {Object.entries(byLifecycle).map(([stage, stageScenarios]) => (
                  <Popover key={stage}>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer group">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {stage}
                          </span>
                          <span className="text-muted-foreground">
                            {stageScenarios.length} scenarios
                          </span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden group-hover:ring-2 ring-primary/20 transition-all">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scenarios.length ? (stageScenarios.length / scenarios.length) * 100 : 0}%` }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className={`h-full rounded-full ${lifecycleColors[stage]} group-hover:opacity-90 transition-opacity`}
                          />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="p-3">
                      <ScenarioList
                        scenarios={stageScenarios}
                        title={`${stage} Scenarios`}
                        emptyMessage={`No ${stage.toLowerCase()} scenarios`}
                      />
                    </PopoverContent>
                  </Popover>
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
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                Priority Distribution
              </CardTitle>
              <CardDescription>Scenarios grouped by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {Object.entries(byPriority).map(([priority, priorityScenarios]) => (
                  <Popover key={priority}>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer group">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium capitalize text-foreground group-hover:text-primary transition-colors">
                            {priority}
                          </span>
                          <span className="text-muted-foreground">
                            {priorityScenarios.length} scenarios
                          </span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden group-hover:ring-2 ring-primary/20 transition-all">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scenarios.length ? (priorityScenarios.length / scenarios.length) * 100 : 0}%` }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className={`h-full rounded-full ${priorityColors[priority]} group-hover:opacity-90 transition-opacity`}
                          />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="p-3">
                      <ScenarioList
                        scenarios={priorityScenarios}
                        title={`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
                        emptyMessage={`No ${priority} priority scenarios`}
                      />
                    </PopoverContent>
                  </Popover>
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
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                Summary Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryMetrics.map((metric, index) => (
                  <Popover key={metric.key}>
                    <PopoverTrigger asChild>
                      <div className="text-center p-5 rounded-lg bg-muted/40 border border-border/50 cursor-pointer hover:bg-muted/60 hover:border-border transition-all group">
                        <p className={`text-3xl font-bold ${metricColors[index]} group-hover:scale-105 transition-transform`}>
                          {metric.displayValue}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                          {metric.label}
                        </p>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="center" className="p-3">
                      <ScenarioList
                        scenarios={metric.scenarios}
                        title={metric.label}
                        emptyMessage="No scenarios in this category"
                      />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
