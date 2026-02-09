import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useScenarios } from '@/hooks/useScenarios';
import { useCrews } from '@/hooks/useCrews';
import type { Scenario } from '@/types/scenario';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

const LIFECYCLE_COLORS: Record<string, string> = {
  'Pre-Event': 'hsl(45, 93%, 47%)',
  'Event': 'hsl(199, 89%, 48%)',
  'Post-Event': 'hsl(160, 84%, 39%)',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'hsl(0, 84%, 60%)',
  Medium: 'hsl(45, 93%, 47%)',
  Low: 'hsl(215, 20%, 65%)',
};

const SUMMARY_COLORS = [
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 84%, 60%)',
];

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} scenarios</p>
    </div>
  );
}

export default function Analytics() {
  const { data: scenarios = [] } = useScenarios();
  const { data: crews = [] } = useCrews();

  const byLifecycle = {
    'Pre-Event': scenarios.filter(s => s.lifecycle_stage === 'Pre-Event'),
    'Event': scenarios.filter(s => s.lifecycle_stage === 'Event'),
    'Post-Event': scenarios.filter(s => s.lifecycle_stage === 'Post-Event'),
  };

  const byPriority = {
    high: scenarios.filter(s => s.priority === 'high'),
    medium: scenarios.filter(s => s.priority === 'medium'),
    low: scenarios.filter(s => s.priority === 'low'),
  };

  const operatorScenarios = scenarios.filter(s => s.operator_role);
  const uniqueOperatorCount = new Set(operatorScenarios.map(s => s.operator_role)).size;

  const lifecycleData = Object.entries(byLifecycle).map(([stage, s]) => ({
    name: stage,
    count: s.length,
    scenarios: s,
    fill: LIFECYCLE_COLORS[stage],
  }));

  const priorityData = Object.entries(byPriority).map(([p, s]) => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    count: s.length,
    scenarios: s,
    fill: PRIORITY_COLORS[p.charAt(0).toUpperCase() + p.slice(1)],
  }));

  const summaryData = [
    { name: 'Total', count: scenarios.length, scenarios, fill: SUMMARY_COLORS[0] },
    { name: 'Active', count: scenarios.filter(s => s.stage).length, scenarios: scenarios.filter(s => s.stage), fill: SUMMARY_COLORS[1] },
    { name: 'Operators', count: uniqueOperatorCount, scenarios: operatorScenarios, fill: SUMMARY_COLORS[2] },
    { name: 'High Priority', count: byPriority.high.length, scenarios: byPriority.high, fill: SUMMARY_COLORS[3] },
  ];

  // Crew metrics
  const CREW_COLORS: Record<string, string> = {
    'Available': 'hsl(142, 71%, 45%)',
    'Dispatched': 'hsl(45, 93%, 47%)',
    'En Route': 'hsl(199, 89%, 48%)',
    'On Site': 'hsl(280, 67%, 55%)',
    'Returning': 'hsl(215, 20%, 65%)',
  };

  const crewByStatus = {
    'Available': crews.filter(c => c.status === 'available'),
    'Dispatched': crews.filter(c => c.status === 'dispatched'),
    'En Route': crews.filter(c => c.status === 'en_route'),
    'On Site': crews.filter(c => c.status === 'on_site'),
    'Returning': crews.filter(c => c.status === 'returning'),
  };

  const crewData = Object.entries(crewByStatus).map(([status, c]) => ({
    name: status,
    count: c.length,
    fill: CREW_COLORS[status],
  }));

  const crewSummaryData = [
    { name: 'Total Crews', count: crews.length, fill: 'hsl(199, 89%, 48%)' },
    { name: 'Active', count: crews.filter(c => c.status !== 'available').length, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Avg Team Size', count: crews.length ? Math.round(crews.reduce((sum, c) => sum + c.team_size, 0) / crews.length) : 0, fill: 'hsl(160, 84%, 39%)' },
    { name: 'Assigned', count: crews.filter(c => c.assigned_event_id).length, fill: 'hsl(280, 67%, 55%)' },
  ];

  const maxLifecycle = Math.max(...lifecycleData.map(d => d.count), 1);
  const maxPriority = Math.max(...priorityData.map(d => d.count), 1);
  const maxSummary = Math.max(...summaryData.map(d => d.count), 1);
  const maxCrewStatus = Math.max(...crewData.map(d => d.count), 1);
  const maxCrewSummary = Math.max(...crewSummaryData.map(d => d.count), 1);

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-semibold mb-1 text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights and metrics for your scenarios</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lifecycle Distribution - Vertical Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Lifecycle Stage Distribution
              </CardTitle>
              <CardDescription className="text-xs">Scenarios by lifecycle stage</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lifecycleData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxLifecycle * 1.2)]}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {lifecycleData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Clickable legend with popover drill-down */}
              <div className="flex items-center justify-center gap-5 mt-3 pt-2 border-t border-border/30">
                {lifecycleData.map((item) => (
                  <Popover key={item.name}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                        {item.name} ({item.count})
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="center" className="p-3">
                      <ScenarioList scenarios={item.scenarios} title={`${item.name} Scenarios`} />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution - Vertical Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Priority Distribution
              </CardTitle>
              <CardDescription className="text-xs">Scenarios by priority level</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxPriority * 1.2)]}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-3 pt-2 border-t border-border/30">
                {priorityData.map((item) => (
                  <Popover key={item.name}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                        {item.name} ({item.count})
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="center" className="p-3">
                      <ScenarioList scenarios={item.scenarios} title={`${item.name} Priority`} />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Metrics - Vertical Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Summary Metrics
              </CardTitle>
              <CardDescription className="text-xs">Key operational indicators at a glance</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxSummary * 1.2)]}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {summaryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-3 pt-2 border-t border-border/30">
                {summaryData.map((item) => (
                  <Popover key={item.name}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                        {item.name}: {item.count}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="center" className="p-3">
                      <ScenarioList scenarios={item.scenarios} title={item.name} />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Crew Detail Metrics - Vertical Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                <Users className="w-4 h-4 text-muted-foreground" />
                Crew Status Distribution
              </CardTitle>
              <CardDescription className="text-xs">Field crew deployment overview</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crewData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxCrewStatus * 1.2)]}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {crewData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border/30 flex-wrap">
                {crewData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                    {item.name} ({item.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Crew Summary Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Crew Summary
              </CardTitle>
              <CardDescription className="text-xs">Aggregate crew operational indicators</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crewSummaryData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, Math.ceil(maxCrewSummary * 1.2)]}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {crewSummaryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-3 pt-2 border-t border-border/30">
                {crewSummaryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                    {item.name}: {item.count}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
