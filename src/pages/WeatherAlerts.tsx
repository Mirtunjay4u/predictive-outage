import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CloudLightning, Flame, Droplets, Thermometer, ShieldAlert, Wind,
  TreePine, AlertTriangle, Users, CheckCircle2, XCircle, Activity,
  ExternalLink, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useScenariosWithIntelligence } from '@/hooks/useScenarios';
import { useCrews } from '@/hooks/useCrews';
import { useWeatherData, weatherCodeToDescription } from '@/hooks/useWeatherData';
import { getEventSeverity } from '@/lib/severity';
import { outageToHazard } from '@/lib/severity';
import type { ScenarioWithIntelligence } from '@/types/scenario';
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CloudLightning className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">Hazard Intelligence</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Operational hazard impacts derived from event data and rule-engine outputs • Advisory only
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
      <div className="px-6 py-2 border-b border-border/30 bg-muted/20 shrink-0">
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

      <div className="p-6 space-y-5">
        {/* ── KPI Strip ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
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
        </motion.div>

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
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', sev.color)} />
                        <span className="text-[10px] font-medium text-muted-foreground">{sev.text}</span>
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
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/50 text-center pb-4 px-6">
        Hazard intelligence derived from event classification and rule-engine outputs. Advisory only — not for operational control.
      </p>
    </div>
  );
}
