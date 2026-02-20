import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Activity, ShieldAlert, Clock, ShieldOff, Users, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScenariosWithIntelligence } from '@/hooks/useScenarios';
import { useCrews } from '@/hooks/useCrews';
import { getEventSeverity } from '@/lib/severity';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Small reusable KPI card                                           */
/* ------------------------------------------------------------------ */

interface AnalyticsKPIProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: 'red' | 'amber' | 'sky' | 'blue' | 'violet' | 'emerald';
  onClick?: () => void;
  drillLabel?: string;
}

const ACCENT = {
  red:     'border-red-300/40 bg-red-50/40 dark:border-red-500/25 dark:bg-red-500/[0.04]',
  amber:   'border-amber-300/40 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-500/[0.04]',
  sky:     'border-sky-300/40 bg-sky-50/40 dark:border-sky-500/25 dark:bg-sky-500/[0.04]',
  blue:    'border-blue-300/40 bg-blue-50/40 dark:border-blue-500/25 dark:bg-blue-500/[0.04]',
  violet:  'border-violet-300/40 bg-violet-50/40 dark:border-violet-500/25 dark:bg-violet-500/[0.04]',
  emerald: 'border-emerald-300/40 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-500/[0.04]',
} as const;

const ICON_ACCENT = {
  red:     'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  amber:   'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  sky:     'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
  blue:    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  violet:  'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
} as const;

const VALUE_ACCENT = {
  red:     'text-red-600 dark:text-red-400',
  amber:   'text-amber-600 dark:text-amber-400',
  sky:     'text-sky-600 dark:text-sky-400',
  blue:    'text-blue-600 dark:text-blue-400',
  violet:  'text-violet-600 dark:text-violet-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
} as const;

function AnalyticsKPI({ label, value, sub, icon, accent, onClick, drillLabel }: AnalyticsKPIProps) {
  return (
    <Card
      className={cn(
        'shadow-sm',
        ACCENT[accent],
        onClick && 'cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md group'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">
              {label}
            </p>
            <p className={cn('text-2xl font-semibold tabular-nums tracking-tight', VALUE_ACCENT[accent])}>
              {value}
            </p>
            {sub && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">{sub}</p>
            )}
          </div>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', ICON_ACCENT[accent])}>
            {icon}
          </div>
        </div>
        {onClick && drillLabel && (
          <div className="mt-2 pt-2 border-t border-border/20 flex items-center gap-1 text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            <ExternalLink className="w-3 h-3" />
            <span>{drillLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared chart tooltip                                              */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} events</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function computeAvgEtrUncertaintyHours(events: ScenarioWithIntelligence[]): number | null {
  const withBoth = events.filter(e => e.etr_earliest && e.etr_latest);
  if (withBoth.length === 0) return null;
  const totalMs = withBoth.reduce((sum, e) => {
    const diff = new Date(e.etr_latest!).getTime() - new Date(e.etr_earliest!).getTime();
    return sum + Math.max(0, diff);
  }, 0);
  return totalMs / withBoth.length / (1000 * 60 * 60);
}

function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ------------------------------------------------------------------ */
/*  Outage type chart colors                                          */
/* ------------------------------------------------------------------ */

const OUTAGE_TYPE_COLORS: Record<string, string> = {
  'Storm': 'hsl(199, 89%, 48%)',
  'High Wind': 'hsl(199, 70%, 55%)',
  'Lightning': 'hsl(270, 60%, 55%)',
  'Snow Storm': 'hsl(200, 50%, 70%)',
  'Wildfire': 'hsl(0, 72%, 51%)',
  'Vegetation': 'hsl(25, 80%, 50%)',
  'Flood': 'hsl(190, 90%, 40%)',
  'Heavy Rain': 'hsl(190, 60%, 55%)',
  'Heatwave': 'hsl(30, 95%, 52%)',
  'Equipment Failure': 'hsl(45, 93%, 47%)',
  'Ice/Snow': 'hsl(200, 50%, 70%)',
  'Unknown': 'hsl(215, 20%, 65%)',
  'Others': 'hsl(215, 15%, 55%)',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  'HIGH': 'hsl(142, 71%, 45%)',
  'MEDIUM': 'hsl(45, 93%, 47%)',
  'LOW': 'hsl(0, 84%, 60%)',
  'N/A': 'hsl(215, 20%, 65%)',
};

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default function Analytics() {
  const navigate = useNavigate();
  const { data: events = [] } = useScenariosWithIntelligence();
  const { data: crews = [] } = useCrews();

  // --- KPI computations ---
  const activeEvents = events.filter(e => e.lifecycle_stage === 'Event');
  const highPriorityEvents = events.filter(e => getEventSeverity(e) >= 4);
  const criticalAtRisk = events.filter(e =>
    e.has_critical_load &&
    e.backup_runtime_remaining_hours != null &&
    e.critical_escalation_threshold_hours != null &&
    e.backup_runtime_remaining_hours < e.critical_escalation_threshold_hours
  );
  const avgUncertainty = computeAvgEtrUncertaintyHours(events);

  // Policy blocks: events that have blocked actions flagged by rule engine (requires_escalation as proxy)
  const policyBlockedCount = events.filter(e => e.requires_escalation).length;

  // Crew constraints: active events with no assigned crew (crew shortage proxy)
  const activeEventIds = new Set(activeEvents.map(e => e.id));
  const assignedEventIds = new Set(crews.filter(c => c.assigned_event_id).map(c => c.assigned_event_id));
  const crewConstraintCount = activeEvents.filter(e => !assignedEventIds.has(e.id)).length;

  // --- Chart data: Events by outage type (active only) ---
  const outageTypeCounts: Record<string, number> = {};
  events.forEach(e => {
    const t = e.outage_type || 'Unknown';
    outageTypeCounts[t] = (outageTypeCounts[t] || 0) + 1;
  });
  const outageTypeData = Object.entries(outageTypeCounts)
    .map(([name, count]) => ({ name, count, fill: OUTAGE_TYPE_COLORS[name] || 'hsl(215, 20%, 65%)' }))
    .sort((a, b) => b.count - a.count);

  // --- Chart data: Active events by ETR confidence ---
  const confidenceCounts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, 'N/A': 0 };
  activeEvents.forEach(e => {
    const c = e.etr_confidence || 'N/A';
    if (c in confidenceCounts) confidenceCounts[c]++;
    else confidenceCounts['N/A']++;
  });
  const confidenceData = Object.entries(confidenceCounts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count, fill: CONFIDENCE_COLORS[name] || 'hsl(215, 20%, 65%)' }));

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-semibold mb-1 text-foreground">Operational Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Rule-engine-driven KPIs derived from live event data and safety policy evaluation
        </p>
      </motion.div>

      {/* ── 6 KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <AnalyticsKPI
            label="Active Events"
            value={activeEvents.length}
            sub={`${events.length} total across all stages`}
            icon={<Activity className="w-4 h-4" strokeWidth={1.75} />}
            accent="sky"
            onClick={() => navigate('/events?lifecycle=Event')}
            drillLabel="View active events"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AnalyticsKPI
            label="High Priority"
            value={highPriorityEvents.length}
            sub="Severity 4–5 events"
            icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.75} />}
            accent="red"
            onClick={() => navigate('/events?priority=high')}
            drillLabel="View high priority events"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AnalyticsKPI
            label="Critical Load at Risk"
            value={criticalAtRisk.length}
            sub="Backup below escalation threshold"
            icon={<ShieldAlert className="w-4 h-4" strokeWidth={1.75} />}
            accent="amber"
            onClick={() => navigate('/outage-map?filter=critical_load')}
            drillLabel="View on map"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <AnalyticsKPI
            label="Avg ETR Uncertainty"
            value={avgUncertainty != null ? formatHoursMinutes(avgUncertainty) : '—'}
            sub="Avg spread (latest − earliest)"
            icon={<Clock className="w-4 h-4" strokeWidth={1.75} />}
            accent="blue"
            onClick={() => navigate('/events?lifecycle=Event')}
            drillLabel="View active ETR details"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <AnalyticsKPI
            label="Policy Blocks"
            value={policyBlockedCount}
            sub="Events flagged for escalation"
            icon={<ShieldOff className="w-4 h-4" strokeWidth={1.75} />}
            accent="violet"
            onClick={() => navigate('/copilot-studio')}
            drillLabel="Open Copilot Studio"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AnalyticsKPI
            label="Crew Constraints"
            value={crewConstraintCount}
            sub="Active events without assigned crew"
            icon={<Users className="w-4 h-4" strokeWidth={1.75} />}
            accent="emerald"
            onClick={() => navigate('/outage-map?filter=crew_constraint')}
            drillLabel="View on map"
          />
        </motion.div>
      </div>

      {/* ── 2 Compact Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Events by Outage Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[13px] font-medium">Events by Outage Type</CardTitle>
              <CardDescription className="text-xs">All events grouped by classification</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outageTypeData} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false} tickLine={false} allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {outageTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/30 flex-wrap">
                {outageTypeData.slice(0, 6).map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                    {item.name} ({item.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Events by ETR Confidence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[13px] font-medium">Active Events by ETR Confidence</CardTitle>
              <CardDescription className="text-xs">Confidence distribution of restoration estimates</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false} tickLine={false} allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {confidenceData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 mt-2 pt-2 border-t border-border/30">
                {confidenceData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                    {item.name} ({item.count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer disclaimer */}
      <p className="text-[10px] text-muted-foreground/50 mt-6 text-center">
        Metrics derived from demo event data and deterministic rule-engine outputs. Advisory only — not for operational control.
      </p>
    </div>
  );
}
