import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudLightning, Flame, Droplets, Thermometer, ShieldAlert, Wind,
  TreePine, AlertTriangle, Users, CheckCircle2, XCircle, Activity,
  ExternalLink, RefreshCw, ChevronDown, ChevronUp, Radio, BarChart3,
  Zap, OctagonAlert, TrendingUp, TrendingDown, Minus, Clock, Info,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useScenariosWithIntelligence } from '@/hooks/useScenarios';
import { useCrews } from '@/hooks/useCrews';
import { useWeatherData, weatherCodeToDescription } from '@/hooks/useWeatherData';
import { getEventSeverity } from '@/lib/severity';
import { outageToHazard } from '@/lib/severity';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

type HazardKey = 'storm' | 'wildfire' | 'flood' | 'extreme-heat' | 'extreme-cold';

interface HazardMeta {
  key: HazardKey;
  label: string;
  icon: React.ReactNode;
  outageTypes: string[];
  accentCard: string;
  accentBadge: string;
  operationalImpacts: { label: string; icon: React.ReactNode }[];
}

const HAZARDS: HazardMeta[] = [
  {
    key: 'storm',
    label: 'Severe Storm',
    icon: <CloudLightning className="w-4.5 h-4.5" />,
    outageTypes: ['Storm', 'Lightning', 'High Wind', 'Snow Storm'],
    accentCard: 'border-sky-300/40 bg-sky-50/30 dark:border-sky-500/25 dark:bg-sky-500/[0.03]',
    accentBadge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    operationalImpacts: [
      { label: 'High wind crew prohibition (SC-STORM-001)', icon: <Wind className="w-3.5 h-3.5" /> },
      { label: 'Conductor damage / downed wires risk', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { label: 'Vegetation debris & access road blockage', icon: <TreePine className="w-3.5 h-3.5" /> },
      { label: 'Crew safety stand-down evaluation', icon: <Users className="w-3.5 h-3.5" /> },
    ],
  },
  {
    key: 'wildfire',
    label: 'Wildfire',
    icon: <Flame className="w-4.5 h-4.5" />,
    outageTypes: ['Wildfire', 'Vegetation'],
    accentCard: 'border-red-300/40 bg-red-50/30 dark:border-red-500/25 dark:bg-red-500/[0.03]',
    accentBadge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    operationalImpacts: [
      { label: 'PSPS / de-energization evaluation (SC-WILD-001)', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: 'Vegetation exposure > 60% trigger', icon: <TreePine className="w-3.5 h-3.5" /> },
      { label: 'Fire perimeter overlap with feeders', icon: <Flame className="w-3.5 h-3.5" /> },
      { label: 'Crew deployment restriction in burn zone', icon: <Users className="w-3.5 h-3.5" /> },
    ],
  },
  {
    key: 'flood',
    label: 'Flood / Heavy Rain',
    icon: <Droplets className="w-4.5 h-4.5" />,
    outageTypes: ['Flood', 'Heavy Rain'],
    accentCard: 'border-cyan-300/40 bg-cyan-50/30 dark:border-cyan-500/25 dark:bg-cyan-500/[0.03]',
    accentBadge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    operationalImpacts: [
      { label: 'Ground access prohibition (SC-FLOOD-001)', icon: <Droplets className="w-3.5 h-3.5" /> },
      { label: 'Substation flood-plain exposure', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { label: 'Equipment isolation / switching restriction', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: 'Extended ETR due to access constraints', icon: <Activity className="w-3.5 h-3.5" /> },
    ],
  },
  {
    key: 'extreme-heat',
    label: 'Extreme Heat',
    icon: <Thermometer className="w-4.5 h-4.5" />,
    outageTypes: ['Heatwave'],
    accentCard: 'border-orange-300/40 bg-orange-50/30 dark:border-orange-500/25 dark:bg-orange-500/[0.03]',
    accentBadge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    operationalImpacts: [
      { label: 'Thermal overload risk (SC-HEAT-001)', icon: <Thermometer className="w-3.5 h-3.5" /> },
      { label: 'Peak load / cascading trip risk (SC-HEAT-002)', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { label: 'Critical cooling load escalation', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: 'Crew heat-stress rotation', icon: <Users className="w-3.5 h-3.5" /> },
    ],
  },
  {
    key: 'extreme-cold',
    label: 'Ice Storm',
    icon: <CloudLightning className="w-4.5 h-4.5" />,
    outageTypes: ['Ice/Snow'],
    accentCard: 'border-indigo-300/40 bg-indigo-50/30 dark:border-indigo-500/25 dark:bg-indigo-500/[0.03]',
    accentBadge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    operationalImpacts: [
      { label: 'Ice loading / switching prohibition (SC-ICE-001)', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      { label: 'Conductor galloping risk (SC-ICE-002)', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { label: 'Road access constraint / crew mobility', icon: <Users className="w-3.5 h-3.5" /> },
      { label: 'Extended restoration timeline', icon: <Activity className="w-3.5 h-3.5" /> },
    ],
  },
];

const HAZARD_TO_KEY: Record<string, HazardKey> = {};
HAZARDS.forEach(h => h.outageTypes.forEach(ot => { HAZARD_TO_KEY[ot] = h.key; }));

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function severityLabel(count: number, highCount: number): { text: string; color: string } {
  if (highCount > 0 || count >= 3) return { text: 'Severe', color: 'bg-red-500' };
  if (count >= 1) return { text: 'Moderate', color: 'bg-amber-500' };
  return { text: 'Low', color: 'bg-emerald-500' };
}

/* ------------------------------------------------------------------ */
/*  Severity dot for grid conditions strip                            */
/* ------------------------------------------------------------------ */

const severityFromCode = (code: number): 'green' | 'amber' | 'red' => {
  if (code >= 95) return 'red';
  if (code >= 61 || code === 45 || code === 48) return 'amber';
  return 'green';
};
const dotColor = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };

/* ------------------------------------------------------------------ */
/*  Crew Safety Status Banner                                         */
/* ------------------------------------------------------------------ */

function CrewSafetyBanner({ hazardGroups }: { hazardGroups: Record<HazardKey, ScenarioWithIntelligence[]> }) {
  const stormEvents = hazardGroups.storm.length;
  const floodEvents = hazardGroups.flood.length;
  const wildfireEvents = hazardGroups.wildfire.length;
  const iceEvents = hazardGroups['extreme-cold'].length;

  const lightningRisk = stormEvents >= 3 ? 'high' : stormEvents >= 1 ? 'elevated' : 'low';
  const hasHighSevStorm = hazardGroups.storm.some(e => getEventSeverity(e) >= 4);
  const hasHighSevIce = hazardGroups['extreme-cold'].some(e => getEventSeverity(e) >= 4);
  const standDown = hasHighSevStorm || hasHighSevIce ? 'likely' : stormEvents > 0 || iceEvents > 0 ? 'possible' : 'unlikely';
  const accessRisk = floodEvents >= 2 || wildfireEvents >= 2 ? 'restricted' : floodEvents >= 1 || wildfireEvents >= 1 ? 'limited' : 'normal';

  const indicators = [
    {
      label: 'Lightning Risk',
      value: lightningRisk === 'high' ? 'High' : lightningRisk === 'elevated' ? 'Elevated' : 'Low',
      icon: <Zap className="w-3.5 h-3.5" />,
      status: lightningRisk === 'high' ? 'block' : lightningRisk === 'elevated' ? 'warn' : 'pass',
      constraint: 'SC-STORM-001',
    },
    {
      label: 'Stand-Down',
      value: standDown === 'likely' ? 'Likely' : standDown === 'possible' ? 'Possible' : 'Unlikely',
      icon: <OctagonAlert className="w-3.5 h-3.5" />,
      status: standDown === 'likely' ? 'block' : standDown === 'possible' ? 'warn' : 'pass',
      constraint: 'SC-CREW-001',
    },
    {
      label: 'Access Risk',
      value: accessRisk === 'restricted' ? 'Restricted' : accessRisk === 'limited' ? 'Limited' : 'Normal',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      status: accessRisk === 'restricted' ? 'block' : accessRisk === 'limited' ? 'warn' : 'pass',
      constraint: 'SC-FLOOD-001',
    },
  ] as const;

  type StatusKey = 'pass' | 'warn' | 'block';
  const tokenStyles: Record<StatusKey, string> = {
    pass: 'text-emerald-700 bg-emerald-50 border-emerald-300/50 dark:text-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-400/30',
    warn: 'text-amber-700 bg-amber-50 border-amber-300/50 dark:text-amber-200 dark:bg-amber-500/15 dark:border-amber-400/30',
    block: 'text-red-700 bg-red-50 border-red-300/50 dark:text-red-200 dark:bg-red-500/20 dark:border-red-400/35 dark:shadow-[0_0_12px_rgba(248,113,113,0.20)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-2.5 border-b border-border/30 bg-muted/10 shrink-0"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground/70" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Crew Safety Status</span>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto">
        {indicators.map(ind => (
          <div
            key={ind.label}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-1.5 min-w-0 shrink-0',
              tokenStyles[ind.status],
            )}
          >
            {ind.status === 'block' && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <span className="shrink-0 opacity-80">{ind.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">{ind.label}</span>
              <span className="text-[11px] font-semibold leading-tight">{ind.value}</span>
            </div>
            <span className="text-[8px] opacity-50 ml-1 shrink-0">{ind.constraint}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Next 2 Hours Risk Window Card                                     */
/* ------------------------------------------------------------------ */

function RiskWindowCard({
  hazardExposureScore,
  eventsInHazardZones,
  criticalInHazard,
}: {
  hazardExposureScore: number;
  eventsInHazardZones: number;
  criticalInHazard: number;
}) {
  const trend = hazardExposureScore >= 60 ? 'rising' : hazardExposureScore >= 25 ? 'stable' : 'improving';
  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'improving' ? TrendingDown : Minus;
  const trendColor = trend === 'rising'
    ? 'text-red-500 dark:text-red-400'
    : trend === 'stable'
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-emerald-500 dark:text-emerald-400';
  const trendLabel = trend === 'rising' ? 'Rising' : trend === 'stable' ? 'Stable' : 'Improving';

  const impact = hazardExposureScore >= 60
    ? 'Crew dispatch restrictions likely; ETR extensions expected'
    : hazardExposureScore >= 25
    ? 'Monitoring active; selective crew constraints possible'
    : 'Normal operations; no anticipated constraints';

  const confidence = eventsInHazardZones >= 5 ? 'High' : eventsInHazardZones >= 2 ? 'Moderate' : 'Low';
  const confidenceNote = eventsInHazardZones >= 5
    ? 'Multiple correlated events support assessment'
    : eventsInHazardZones >= 2
    ? 'Limited event correlation — moderate certainty'
    : 'Insufficient data for strong projection';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground leading-tight">Next 2 Hours — Risk Window</p>
              <p className="text-[9px] text-muted-foreground">Projected from current hazard state and rule-engine outputs</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Risk Trend</p>
              <div className="flex items-center gap-1.5">
                <motion.span key={trend} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
                  <TrendIcon className={cn('w-4 h-4', trendColor)} />
                </motion.span>
                <span className={cn('text-sm font-semibold', trendColor)}>{trendLabel}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/60">Score: {hazardExposureScore}/100</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Expected Impact</p>
              <p className="text-[11px] text-foreground leading-snug">{impact}</p>
              {criticalInHazard > 0 && (
                <p className="text-[9px] text-red-500 dark:text-red-400 font-medium">
                  {criticalInHazard} critical load{criticalInHazard !== 1 ? 's' : ''} at risk
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Confidence Band</p>
              <Badge variant="outline" className={cn(
                'text-[10px]',
                confidence === 'High' && 'border-emerald-400/50 text-emerald-600 dark:text-emerald-400',
                confidence === 'Moderate' && 'border-amber-400/50 text-amber-600 dark:text-amber-400',
                confidence === 'Low' && 'border-muted-foreground/30 text-muted-foreground',
              )}>
                {confidence}
              </Badge>
              <p className="text-[9px] text-muted-foreground/60 leading-snug">{confidenceNote}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hazard Timeline Chart                                             */
/* ------------------------------------------------------------------ */

const HAZARD_COLORS: Record<HazardKey, string> = {
  storm: 'hsl(199, 89%, 48%)',
  wildfire: 'hsl(0, 72%, 51%)',
  flood: 'hsl(187, 72%, 48%)',
  'extreme-heat': 'hsl(25, 95%, 53%)',
  'extreme-cold': 'hsl(239, 84%, 67%)',
};

const HAZARD_LABELS: Record<HazardKey, string> = {
  storm: 'Storm',
  wildfire: 'Wildfire',
  flood: 'Flood',
  'extreme-heat': 'Heat',
  'extreme-cold': 'Ice',
};

function HazardTimelineChart({ events }: { events: ScenarioWithIntelligence[] }) {
  const data = useMemo(() => {
    const now = new Date();
    const days: { label: string; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        date: d,
      });
    }

    return days.map(({ label, date }) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const row: Record<string, string | number> = { day: label };
      (Object.keys(HAZARD_LABELS) as HazardKey[]).forEach(key => {
        row[key] = events.filter(e => {
          const hk = HAZARD_TO_KEY[e.outage_type || ''];
          if (hk !== key) return false;
          const start = e.event_start_time ? new Date(e.event_start_time) : e.created_at ? new Date(e.created_at) : null;
          if (!start) return false;
          return start >= date && start < nextDay;
        }).length;
      });
      return row;
    });
  }, [events]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
            <BarChart3 className="w-4 h-4 text-primary" />
            Hazard Event Timeline — Past 7 Days
          </CardTitle>
          <CardDescription className="text-xs">
            Daily event counts by hazard family based on event start times
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                  }}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                />
                {(Object.keys(HAZARD_LABELS) as HazardKey[]).map(key => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={HAZARD_LABELS[key]}
                    fill={HAZARD_COLORS[key]}
                    radius={[3, 3, 0, 0]}
                    stackId="hazards"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Illustrative — counts derived from event start times within each 24-hour window.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Radar Map                                             */
/* ------------------------------------------------------------------ */

function RadarMapSection() {
  const [open, setOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-medium text-sm text-foreground">Live Radar</span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">External</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:block">Windy.com embed — illustrative reference only</span>
            {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="radar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="relative w-full" style={{ height: 380 }}>
                <iframe
                  src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=5&overlay=radar&product=radar&level=surface&lat=33.5&lon=-84.4&detailLat=33.5&detailLon=-84.4&marker=true"
                  className="absolute inset-0 w-full h-full border-0"
                  title="Live weather radar"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <div className="px-5 py-2 border-t border-border/30 bg-muted/10">
                <p className="text-[10px] text-muted-foreground/60">
                  External radar feed via Windy.com. For situational awareness only — not connected to operational systems.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function WeatherAlerts() {
  const navigate = useNavigate();
  const { data: events = [] } = useScenariosWithIntelligence();
  const { data: crews = [] } = useCrews();
  const { data: weather, isLoading: weatherLoading, refetch, dataUpdatedAt } = useWeatherData(true);

  // Compute per-hazard event groups
  const hazardGroups = useMemo(() => {
    const groups: Record<HazardKey, ScenarioWithIntelligence[]> = {
      storm: [], wildfire: [], flood: [], 'extreme-heat': [], 'extreme-cold': [],
    };
    events.forEach(e => {
      const key = HAZARD_TO_KEY[e.outage_type || ''];
      if (key) groups[key].push(e);
    });
    return groups;
  }, [events]);

  // 7-day sparkline data per hazard
  const hazardSparklines = useMemo(() => {
    const now = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    const result: Record<HazardKey, { v: number; day: string }[]> = {} as any;
    (Object.keys(HAZARD_LABELS) as HazardKey[]).forEach(key => {
      result[key] = days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          day: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          v: events.filter(e => {
            if (HAZARD_TO_KEY[e.outage_type || ''] !== key) return false;
            const start = e.event_start_time ? new Date(e.event_start_time) : e.created_at ? new Date(e.created_at) : null;
            return start ? start >= date && start < nextDay : false;
          }).length,
        };
      });
    });
    return result;
  }, [events]);

  // KPIs
  const eventsInHazardZones = useMemo(() =>
    events.filter(e => HAZARD_TO_KEY[e.outage_type || '']).length
  , [events]);

  const criticalInHazard = useMemo(() =>
    events.filter(e =>
      HAZARD_TO_KEY[e.outage_type || ''] &&
      e.has_critical_load &&
      e.backup_runtime_remaining_hours != null &&
      e.critical_escalation_threshold_hours != null &&
      e.backup_runtime_remaining_hours < e.critical_escalation_threshold_hours
    ).length
  , [events]);

  // Composite Hazard Exposure Score (0–100) with per-hazard breakdown
  const { hazardExposureScore, hazardBreakdown } = useMemo(() => {
    const hazardKeys = Object.keys(HAZARD_LABELS) as HazardKey[];
    if (eventsInHazardZones === 0) return { hazardExposureScore: 0, hazardBreakdown: [] as { key: HazardKey; label: string; score: number; events: number }[] };

    let total = 0;
    const breakdown: { key: HazardKey; label: string; score: number; events: number }[] = [];
    hazardKeys.forEach(key => {
      const group = hazardGroups[key];
      if (group.length === 0) {
        breakdown.push({ key, label: HAZARD_LABELS[key], score: 0, events: 0 });
        return;
      }
      const avgSev = group.reduce((sum, e) => sum + getEventSeverity(e), 0) / group.length / 5;
      const densityFactor = Math.min(1, group.length / 5);
      const criticalCount = group.filter(e => e.has_critical_load).length;
      const criticalBoost = criticalCount > 0 ? 0.15 : 0;
      const escalationCount = group.filter(e => e.requires_escalation).length;
      const escalationBoost = escalationCount > 0 ? 0.1 : 0;
      const contribution = Math.min(20, Math.round((avgSev * 0.5 + densityFactor * 0.25 + criticalBoost + escalationBoost) * 20));
      total += contribution;
      breakdown.push({ key, label: HAZARD_LABELS[key], score: contribution, events: group.length });
    });

    return { hazardExposureScore: Math.min(100, Math.round(total)), hazardBreakdown: breakdown };
  }, [hazardGroups, eventsInHazardZones]);

  const exposureBand = hazardExposureScore >= 75
    ? { label: 'Severe', accent: 'text-red-600 dark:text-red-400' }
    : hazardExposureScore >= 30
    ? { label: 'Moderate', accent: 'text-amber-600 dark:text-amber-400' }
    : { label: 'Low', accent: 'text-emerald-600 dark:text-emerald-400' };

  const animatedScore = useAnimatedNumber(hazardExposureScore, 600);

  // Correlation table rows
  const correlationRows = useMemo(() =>
    events
      .filter(e => HAZARD_TO_KEY[e.outage_type || ''])
      .map(e => {
        const sev = getEventSeverity(e);
        const hazardKey = HAZARD_TO_KEY[e.outage_type || ''] || 'storm';
        const hazard = HAZARDS.find(h => h.key === hazardKey)!;
        const escalation = e.requires_escalation ?? false;
        let reason = 'Within normal parameters';
        if (escalation && sev >= 4) reason = 'High severity + safety constraint triggered';
        else if (escalation) reason = 'Safety constraint active';
        else if (sev >= 4) reason = 'Elevated severity — monitoring';
        else if (e.has_critical_load) reason = 'Critical load present — monitoring';
        return {
          id: e.id,
          name: e.name || '—',
          hazardLabel: hazard.label,
          hazardBadge: hazard.accentBadge,
          overlap: e.lifecycle_stage === 'Event' ? 'Active' : e.lifecycle_stage === 'Pre-Event' ? 'Approaching' : 'Resolved',
          escalation,
          reason,
          severity: sev,
        };
      })
      .sort((a, b) => b.severity - a.severity)
  , [events]);

  const updatedLabel = dataUpdatedAt
    ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
    : '';

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CloudLightning className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">Hazard Intelligence</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Operational hazard impacts derived from event data and rule-engine outputs · Advisory only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updatedLabel && (
            <span className="text-[10px] text-muted-foreground">{updatedLabel}</span>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', weatherLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid conditions strip */}
      <div className="px-5 py-2 border-b border-border/20 bg-surface-2/50 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-medium text-muted-foreground/80 whitespace-nowrap mr-1">
            Grid Conditions
          </span>
          {weatherLoading ? (
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          ) : (
            weather?.points.map((pt, i) => {
              const info = weatherCodeToDescription[pt.weatherCode] ?? { label: 'Unknown', icon: '❓' };
              const sev = severityFromCode(pt.weatherCode);
              return (
                <div key={i} className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card px-2.5 py-1 min-w-0 shrink-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[sev])} />
                  <span className="text-[10px] font-medium text-foreground truncate max-w-[90px]">
                    {info.icon} {Math.round(pt.temperature)}°F
                  </span>
                  <span className="text-[9px] text-muted-foreground">{Math.round(pt.windSpeed)}mph</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Crew Safety Status Banner ── */}
      <CrewSafetyBanner hazardGroups={hazardGroups} />

      <div className="p-5 space-y-4">
        {/* ── KPI Strip ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 items-stretch">
          <Card className="border-amber-300/40 bg-amber-50/30 dark:border-amber-500/25 dark:bg-amber-500/[0.03] shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Events in Hazard Zones</p>
                <p className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">{eventsInHazardZones}</p>
                <p className="text-[10px] text-muted-foreground/60">Matched to active hazard overlays</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-300/40 bg-red-50/30 dark:border-red-500/25 dark:bg-red-500/[0.03] shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Critical Loads in Hazard Zones</p>
                <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">{criticalInHazard}</p>
                <p className="text-[10px] text-muted-foreground/60">Backup below escalation threshold</p>
              </div>
            </CardContent>
          </Card>
          <Popover>
            <PopoverTrigger asChild>
              <Card className="border-primary/30 bg-primary/[0.03] shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke={animatedScore >= 75 ? 'hsl(0, 72%, 51%)' : animatedScore >= 30 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 71%, 45%)'}
                        strokeWidth="3"
                        strokeDasharray={`${animatedScore * 0.9738} 97.38`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.3s ease' }}
                      />
                    </svg>
                    <span className={cn('absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums', exposureBand.accent)}>
                      {animatedScore}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Hazard Exposure Score</p>
                    <p className={cn('text-2xl font-semibold tabular-nums', exposureBand.accent)}>{exposureBand.label}</p>
                    <p className="text-[10px] text-muted-foreground/60">Click for per-hazard breakdown</p>
                  </div>
                </CardContent>
              </Card>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-xs font-semibold text-foreground">Score Breakdown by Hazard</p>
                <p className="text-[10px] text-muted-foreground">Max 20 pts per family · {hazardExposureScore}/100 total</p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {hazardBreakdown.map(h => {
                  const pct = (h.score / 20) * 100;
                  return (
                    <div key={h.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground">{h.label}</span>
                        <span className="text-muted-foreground tabular-nums">{h.score}/20 · {h.events} event{h.events !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: HAZARD_COLORS[h.key] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-border/30 bg-muted/20">
                <p className="text-[9px] text-muted-foreground/60">
                  Drivers: avg severity (50%), event density (25%), critical load (15%), escalation (10%)
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* ── Next 2 Hours Risk Window ── */}
        <RiskWindowCard hazardExposureScore={hazardExposureScore} eventsInHazardZones={eventsInHazardZones} criticalInHazard={criticalInHazard} />

        {/* ── Hazard Overview Cards + Operational Translation ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {HAZARDS.map((hazard, idx) => {
            const group = hazardGroups[hazard.key];
            const highCount = group.filter(e => getEventSeverity(e) >= 4).length;
            const sev = severityLabel(group.length, highCount);
            const earliest = group
              .filter(e => e.event_start_time)
              .sort((a, b) => new Date(a.event_start_time!).getTime() - new Date(b.event_start_time!).getTime())[0];
            const startLabel = earliest?.event_start_time
              ? new Date(earliest.event_start_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—';
            const regions = [...new Set(group.map(e => e.service_area).filter(Boolean))];

            return (
              <motion.div
                key={hazard.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Card
                  className={cn('shadow-sm h-full cursor-pointer hover:shadow-md transition-shadow', hazard.accentCard)}
                  onClick={() => navigate(`/events?outage_types=${hazard.outageTypes.join(',')}`)}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
                        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', hazard.accentBadge)}>
                          {hazard.icon}
                        </span>
                        {hazard.label}
                      </CardTitle>
                      <div className="flex items-center gap-2.5">
                        {/* 7-day sparkline */}
                        <div className="w-[80px] h-[24px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hazardSparklines[hazard.key]}>
                              <defs>
                                <linearGradient id={`sparkFill-${hazard.key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={HAZARD_COLORS[hazard.key]} stopOpacity={0.25} />
                                  <stop offset="100%" stopColor={HAZARD_COLORS[hazard.key]} stopOpacity={0.02} />
                                </linearGradient>
                              </defs>
                              <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0].payload as { day: string; v: number };
                                  return (
                                    <div className="rounded-md border border-border/50 bg-background px-2 py-1 text-[10px] shadow-lg">
                                      <p className="font-medium text-foreground">{d.day}</p>
                                      <p className="text-muted-foreground">{d.v} event{d.v !== 1 ? 's' : ''}</p>
                                    </div>
                                  );
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke={HAZARD_COLORS[hazard.key]}
                                strokeWidth={1.5}
                                fill={`url(#sparkFill-${hazard.key})`}
                                dot={false}
                                activeDot={{ r: 2.5, strokeWidth: 0, fill: HAZARD_COLORS[hazard.key] }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', sev.color)} />
                          <span className="text-[10px] font-medium text-muted-foreground">{sev.text}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {/* Summary row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Events</p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{group.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Region</p>
                        <p className="text-[10px] font-medium text-foreground truncate">{regions[0] || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Start</p>
                        <p className="text-[10px] font-medium text-foreground">{startLabel}</p>
                      </div>
                    </div>

                    <Separator className="mb-3 opacity-30" />

                    {/* Operational Translation */}
                    <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-2">
                      Operational Impacts
                    </p>
                    <div className="space-y-1.5">
                      {hazard.operationalImpacts.map((impact, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-muted-foreground/50">{impact.icon}</span>
                          <span className="leading-tight">{impact.label}</span>
                        </div>
                      ))}
                    </div>

                    {group.length > 0 && (
                      <>
                        <Separator className="my-3 opacity-30" />
                        <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
                          <ExternalLink className="w-3 h-3" />
                          View {group.length} event{group.length !== 1 ? 's' : ''} →
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ── Hazard ↔ Event Correlation Table ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-[13px] font-medium">Hazard ↔ Event Correlation</CardTitle>
              <CardDescription className="text-xs">
                Events mapped to hazard overlays with rule-engine escalation status
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {correlationRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No events matched to hazard overlays</p>
              ) : (
                <ScrollArea className="max-h-[320px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground/70 text-[10px] uppercase tracking-wider">Event</th>
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground/70 text-[10px] uppercase tracking-wider">Hazard</th>
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground/70 text-[10px] uppercase tracking-wider">Overlap</th>
                        <th className="text-center py-2 pr-3 font-medium text-muted-foreground/70 text-[10px] uppercase tracking-wider">Escalation</th>
                        <th className="text-left py-2 font-medium text-muted-foreground/70 text-[10px] uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correlationRows.map(row => (
                        <tr
                          key={row.id}
                          className="border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/event/${row.id}?from=hazards`)}
                        >
                          <td className="py-2 pr-3">
                            <span className="font-medium text-foreground truncate block max-w-[180px] flex items-center gap-1.5">
                              {row.name}
                              <ExternalLink className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant="secondary" className={cn('text-[10px] font-medium', row.hazardBadge)}>
                              {row.hazardLabel}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              row.overlap === 'Active' && 'border-sky-400/50 text-sky-600 dark:text-sky-400',
                              row.overlap === 'Approaching' && 'border-amber-400/50 text-amber-600 dark:text-amber-400',
                              row.overlap === 'Resolved' && 'border-emerald-400/50 text-emerald-600 dark:text-emerald-400',
                            )}>
                              {row.overlap}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-center">
                            {row.escalation ? (
                              <XCircle className="w-4 h-4 text-red-500 inline-block" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground leading-tight max-w-[220px]">
                            {row.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
              <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-4 text-[10px] text-muted-foreground/60">
                <span>{correlationRows.length} events correlated</span>
                <span>•</span>
                <span>{correlationRows.filter(r => r.escalation).length} escalations triggered</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Hazard Timeline Chart ── */}
        <HazardTimelineChart events={events} />

        {/* ── Collapsible Live Radar Map ── */}
        <RadarMapSection />
      </div>

      {/* ── Operator Note Disclaimer ── */}
      <div className="mx-6 mb-4 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-foreground/80">Operator Advisory Notice</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              This page provides decision-support information only. No live weather feed, SCADA, OMS, or ADMS integration is active.
              All hazard assessments, crew safety indicators, and risk projections are derived from event classification and rule-engine outputs.
              Operator review and explicit approval are required before any operational action is taken.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
