import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Ban, AlertTriangle, Info, ChevronRight,
  Users, Clock, Zap, ShieldCheck, ShieldAlert, ShieldX,
  Loader2, RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import type { Scenario } from '@/types/scenario';

// ── Derived helpers ───────────────────────────────────────────────────────────
export function deriveSeverity(scenario: Scenario): number {
  const priorityScore = scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1;
  const impactScore = Math.min(2, Math.floor((scenario.customers_impacted ?? 0) / 500));
  return Math.min(5, priorityScore + impactScore);
}

function getPriorityClass(priority: string | null) {
  if (priority === 'high') return 'bg-red-500/10 text-red-700 border-red-500/40 dark:bg-red-500/15 dark:text-red-300 dark:border-red-400/50';
  if (priority === 'medium') return 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300';
  return 'bg-muted/60 text-muted-foreground border-border/60';
}

function getEtrBandClass(band: string) {
  if (band === 'LOW') return 'bg-red-500/10 text-red-700 border-red-500/40 dark:text-red-300';
  if (band === 'MEDIUM') return 'bg-amber-500/10 text-amber-700 border-amber-500/40 dark:text-amber-300';
  return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300';
}

function getConfidenceClass(conf: string | null) {
  if (conf === 'HIGH') return 'text-emerald-600 dark:text-emerald-400';
  if (conf === 'MEDIUM') return 'text-amber-600 dark:text-amber-400';
  if (conf === 'LOW') return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

function getGateIcon(gate: string) {
  if (gate === 'BLOCK') return <ShieldX className="h-4 w-4 text-red-400" />;
  if (gate === 'WARN') return <ShieldAlert className="h-4 w-4 text-amber-400" />;
  return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
}

function getGateBg(gate: string) {
  if (gate === 'BLOCK') return 'bg-red-500/10 border-red-400/30 dark:bg-red-500/12';
  if (gate === 'WARN') return 'bg-amber-500/10 border-amber-400/30';
  return 'bg-emerald-500/10 border-emerald-400/30';
}

function humanise(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PolicyResult = {
  policyGate?: string;
  allowedActions?: Array<{ action: string; reason: string; constraints?: string[] }>;
  blockedActions?: Array<{ action: string; reason: string; remediation?: string | string[] }>;
  escalationFlags?: string[];
  etrBand?: { band: string; confidence?: number; rationale?: string[] };
  safetyConstraints?: Array<{ id: string; title: string; description: string; severity: string; triggered: boolean; evidence?: string[] }>;
  explainability?: {
    drivers?: Array<{ key: string; value: string | number | boolean; weight: number }>;
    assumptions?: string[];
    dataQualityWarnings?: string[];
  };
};

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface EventDetailPanelProps {
  scenario: Scenario | null;
  open: boolean;
  onClose: () => void;
  onEdit: (scenario: Scenario) => void;
}

export function EventDetailPanel({ scenario, open, onClose, onEdit }: EventDetailPanelProps) {
  const [policy, setPolicy] = useState<PolicyResult | null>(null);
  const [policyStatus, setPolicyStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [whyOpen, setWhyOpen] = useState(false);

  // Map scenario → copilot-evaluate payload
  const buildPayload = useCallback((s: Scenario) => {
    const priority = s.priority ?? 'medium';
    const severityNum = priority === 'high' ? 5 : priority === 'medium' ? 3 : 1;
    const hazardMap: Record<string, string> = {
      Storm: 'STORM', Lightning: 'STORM', 'High Wind': 'STORM', 'Snow Storm': 'STORM',
      Wildfire: 'WILDFIRE', Vegetation: 'WILDFIRE',
      Flood: 'RAIN', 'Heavy Rain': 'RAIN',
    };
    const hazardType = hazardMap[s.outage_type ?? ''] ?? 'UNKNOWN';
    const phase =
      s.lifecycle_stage === 'Pre-Event' ? 'PRE_EVENT'
      : s.lifecycle_stage === 'Event' ? 'ACTIVE'
      : 'POST_EVENT';

    return {
      scenarioId: s.id,
      hazardType,
      phase,
      severity: severityNum,
      customersAffected: s.customers_impacted ?? 0,
      criticalLoads: (s.critical_load_types ?? []).map((t) => ({
        type: t.toUpperCase(),
        backupHoursRemaining: s.backup_runtime_remaining_hours ?? undefined,
      })),
      crews: { available: 3, enRoute: 1 },
      dataQuality: { completeness: 0.8, freshnessMinutes: 15 },
    };
  }, []);

  const runEvaluation = useCallback(async (s: Scenario) => {
    setPolicyStatus('loading');
    setPolicy(null);
    setWhyOpen(false);
    try {
      const payload = buildPayload(s);
      const { data, error } = await supabase.functions.invoke('copilot-evaluate', { body: payload });
      if (error) throw error;
      setPolicy(data as PolicyResult);
      setPolicyStatus('done');
    } catch {
      setPolicyStatus('error');
    }
  }, [buildPayload]);

  useEffect(() => {
    if (open && scenario) {
      runEvaluation(scenario);
    } else {
      setPolicy(null);
      setPolicyStatus('idle');
      setWhyOpen(false);
    }
  }, [open, scenario, runEvaluation]);

  const severity = scenario ? deriveSeverity(scenario) : 0;
  const gate = policy?.policyGate ?? (policyStatus === 'done' ? 'PASS' : null);

  const etrWindow =
    scenario?.etr_earliest && scenario?.etr_latest
      ? `${format(new Date(scenario.etr_earliest), 'HH:mm')} – ${format(new Date(scenario.etr_latest), 'HH:mm, MMM d')}`
      : scenario?.etr_expected
      ? format(new Date(scenario.etr_expected), 'MMM d, HH:mm')
      : '—';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        {scenario && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <OutageTypeBadge type={scenario.outage_type} />
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    getPriorityClass(scenario.priority),
                  )}>
                    {(scenario.priority ?? 'medium').charAt(0).toUpperCase() + (scenario.priority ?? 'medium').slice(1)} Priority
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    Sev&nbsp;{severity}/5
                  </span>
                </div>
                <h2 className="font-semibold text-base text-foreground leading-snug line-clamp-2">{scenario.name}</h2>
                {scenario.location_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{scenario.location_name}{scenario.service_area ? ` · ${scenario.service_area}` : ''}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* ── KPI strip ── */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {/* Customers */}
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Customers</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {scenario.customers_impacted != null ? scenario.customers_impacted.toLocaleString() : '—'}
                  </p>
                </div>
                {/* Phase */}
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Phase</p>
                  <p className="text-sm font-semibold text-foreground">{scenario.lifecycle_stage}</p>
                </div>
                {/* ETR confidence */}
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">ETR Conf.</p>
                  <p className={cn('text-sm font-semibold', getConfidenceClass(scenario.etr_confidence))}>
                    {scenario.etr_confidence ?? '—'}
                  </p>
                </div>
                {/* Critical load */}
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Crit. Load</p>
                  <p className={cn('text-sm font-semibold', scenario.has_critical_load ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {scenario.has_critical_load ? 'Exposed' : 'None'}
                  </p>
                </div>
              </div>

              {/* ── ETR Band ── */}
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-1.5">
                <SectionHead icon={Clock} label="ETR Window" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground tabular-nums">{etrWindow}</p>
                  {scenario.etr_confidence && (
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                      getEtrBandClass(scenario.etr_confidence === 'HIGH' ? 'HIGH' : scenario.etr_confidence === 'MEDIUM' ? 'MEDIUM' : 'LOW'),
                    )}>
                      {scenario.etr_confidence} confidence
                    </span>
                  )}
                </div>
                {scenario.etr_uncertainty_drivers && scenario.etr_uncertainty_drivers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {scenario.etr_uncertainty_drivers.map((d) => (
                      <span key={d} className="rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Critical Load Continuity ── */}
              {scenario.has_critical_load && (
                <div className="rounded-lg border border-red-400/30 bg-red-500/5 px-4 py-3 space-y-1.5">
                  <SectionHead icon={Zap} label="Critical Load Continuity" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1">
                      {(scenario.critical_load_types ?? []).map((t) => (
                        <span key={t} className="rounded-full bg-red-500/10 border border-red-400/30 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">{t}</span>
                      ))}
                    </div>
                    {scenario.backup_runtime_remaining_hours != null && (
                      <span className="text-sm font-semibold tabular-nums text-red-700 dark:text-red-300 shrink-0">
                        {scenario.backup_runtime_remaining_hours.toFixed(1)}h remaining
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Policy Gate ── */}
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <SectionHead icon={ShieldCheck} label="Policy Evaluation" />
                  <button
                    onClick={() => scenario && runEvaluation(scenario)}
                    disabled={policyStatus === 'loading'}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', policyStatus === 'loading' && 'animate-spin')} />
                  </button>
                </div>

                {policyStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Evaluating policy rules…
                  </div>
                )}

                {policyStatus === 'error' && (
                  <p className="text-xs text-destructive">Policy evaluation unavailable.</p>
                )}

                {policyStatus === 'done' && gate && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {/* Gate badge */}
                    <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2', getGateBg(gate))}>
                      {getGateIcon(gate)}
                      <span className="text-sm font-semibold">Policy Gate: {gate}</span>
                    </div>

                    {/* Escalation flags */}
                    {(policy?.escalationFlags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {policy!.escalationFlags!.map((f) => (
                          <span key={f} className="rounded-full bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            ⚑ {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Allowed actions */}
                    {(policy?.allowedActions ?? []).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Allowed Actions</p>
                        <ul className="space-y-1.5">
                          {policy!.allowedActions!.map((a) => (
                            <li key={a.action} className="rounded-lg border border-emerald-400/25 bg-emerald-500/5 px-3 py-2">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-foreground">{humanise(a.action)}</p>
                                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{a.reason}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blocked actions */}
                    {(policy?.blockedActions ?? []).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Blocked Actions</p>
                        <ul className="space-y-1.5">
                          {policy!.blockedActions!.map((b) => {
                            const rem = Array.isArray(b.remediation)
                              ? b.remediation[0]
                              : typeof b.remediation === 'string'
                              ? b.remediation.split(/[\n•;-]/).map((s) => s.trim()).find(Boolean)
                              : null;
                            return (
                              <li key={b.action} className="rounded-lg border border-red-400/25 bg-red-500/5 px-3 py-2">
                                <div className="flex items-start gap-2">
                                  <Ban className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-foreground">{humanise(b.action)}</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{b.reason}</p>
                                    {rem && (
                                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 leading-snug">↳ {rem}</p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* "Why" explainability panel */}
                    {policy?.explainability && (
                      <div>
                        <button
                          onClick={() => setWhyOpen((v) => !v)}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Info className="h-3.5 w-3.5" />
                          Why did the policy engine decide this?
                          <ChevronRight className={cn('h-3 w-3 transition-transform', whyOpen && 'rotate-90')} />
                        </button>
                        <AnimatePresence>
                          {whyOpen && (
                            <motion.div
                              key="why"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-3 space-y-3 text-xs">
                                {/* Drivers */}
                                {(policy.explainability.drivers ?? []).length > 0 && (
                                  <div>
                                    <p className="font-semibold text-foreground mb-1.5">Decision Drivers</p>
                                    <ul className="space-y-1.5">
                                      {policy.explainability.drivers!.map((d) => (
                                        <li key={d.key} className="flex items-center justify-between gap-2">
                                          <span className="text-muted-foreground capitalize">{d.key.replace(/_/g, ' ')}</span>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="h-1.5 w-16 rounded-full bg-muted/50 overflow-hidden">
                                              <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${Math.min(100, Math.round(d.weight * 100))}%` }}
                                              />
                                            </div>
                                            <span className="w-8 text-right tabular-nums text-foreground font-medium">
                                              {String(d.value).slice(0, 6)}
                                            </span>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {/* Assumptions */}
                                {(policy.explainability.assumptions ?? []).length > 0 && (
                                  <div>
                                    <p className="font-semibold text-foreground mb-1">Assumptions</p>
                                    <ul className="space-y-0.5">
                                      {policy.explainability.assumptions!.map((a, i) => (
                                        <li key={i} className="text-muted-foreground leading-snug">· {a}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {/* Data quality warnings */}
                                {(policy.explainability.dataQualityWarnings ?? []).length > 0 && (
                                  <div>
                                    <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Data Quality Warnings</p>
                                    <ul className="space-y-0.5">
                                      {policy.explainability.dataQualityWarnings!.map((w, i) => (
                                        <li key={i} className="text-muted-foreground leading-snug">⚠ {w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* ── Crew context ── */}
              <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                <SectionHead icon={Users} label="Crew Readiness" />
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {scenario.operator_role ? `Assigned: ${scenario.operator_role}` : 'No operator assigned'}
                  </span>
                </div>
              </div>

              {/* ── Notes ── */}
              {scenario.notes && (
                <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
                  <SectionHead icon={AlertTriangle} label="Notes" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{scenario.notes}</p>
                </div>
              )}

            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 border-t border-border/50 px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Updated {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={() => { onEdit(scenario); onClose(); }}>Edit Event</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
