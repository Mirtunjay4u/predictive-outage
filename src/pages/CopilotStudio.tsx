import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Sparkles, AlertTriangle, ShieldAlert, FileText, Copy, Check,
  Clock, Zap, Shield, Ban, ClipboardCheck, Activity, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useScenariosWithIntelligence } from '@/hooks/useScenarios';
import { useCrews } from '@/hooks/useCrews';
import { useEventAssets, useAssets } from '@/hooks/useAssets';
import type { CopilotMode, CopilotRequest, CopilotResponse, OperatorOutputContract } from '@/types/copilot';
import { mapToOperatorContract } from '@/types/copilot';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { Crew } from '@/types/crew';
import type { Asset } from '@/types/asset';
import { formatEtrPrimary } from '@/lib/etr-format';
import { DecisionTrace } from '@/components/copilot/DecisionTrace';
import { getEventSeverity } from '@/lib/severity';
import { DefensibilityPanels } from '@/components/copilot/DefensibilityPanels';
import { OperatorApprovalGate } from '@/components/copilot/OperatorApprovalGate';
import { EventDecisionTimeline } from '@/components/copilot/EventDecisionTimeline';
import { useInsertDecisionLog } from '@/hooks/useDecisionLog';
import { SystemScopePanel } from '@/components/copilot/SystemScopePanel';
import type { PolicyEvalResult } from '@/hooks/usePolicyEvaluation';

// ─── Response history entry ──────────────────────────────────────────────────
interface HistoryEntry {
  contract: OperatorOutputContract;
  raw: CopilotResponse;
  eventName: string;
  timestamp: Date;
  eventSnapshot: ScenarioWithIntelligence;
  crewsSnapshot: Crew[];
  assetsSnapshot: Asset[];
  hazardOverlap: string | null;
  policyEval: PolicyEvalResult | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CopilotStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Data
  const { data: scenarios, isLoading: scenariosLoading } = useScenariosWithIntelligence();
  const { data: crews } = useCrews();
  const { data: allAssets } = useAssets();

  // State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mode, setMode] = useState<CopilotMode>('DEMO');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const autoRunTriggered = useRef(false);
  const insertLog = useInsertDecisionLog();

  // Selected event from scenarios
  const selectedEvent = useMemo(
    () => scenarios?.find(s => s.id === selectedEventId) ?? null,
    [scenarios, selectedEventId],
  );

  // Linked assets for selected event
  const { data: linkedAssetIds } = useEventAssets(selectedEventId);

  // Assigned crews
  const assignedCrews = useMemo(
    () => (crews ?? []).filter(c => c.assigned_event_id === selectedEventId),
    [crews, selectedEventId],
  );

  // Full asset objects for linked asset IDs
  const linkedAssets = useMemo(
    () => (allAssets ?? []).filter(a => (linkedAssetIds ?? []).includes(a.id)),
    [allAssets, linkedAssetIds],
  );

  // Default to highest-severity active event or URL param
  useEffect(() => {
    const paramEventId = searchParams.get('event_id');
    if (paramEventId) {
      setSelectedEventId(paramEventId);
      return;
    }
    if (!selectedEventId && scenarios && scenarios.length > 0) {
      const active = scenarios
        .filter(s => s.lifecycle_stage === 'Event')
        .sort((a, b) => (b.customers_impacted ?? 0) - (a.customers_impacted ?? 0));
      if (active.length > 0) setSelectedEventId(active[0].id);
      else setSelectedEventId(scenarios[0].id);
    }
  }, [scenarios, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL param: auto-run & mode
  useEffect(() => {
    const autoRun = searchParams.get('auto_run') === 'true';
    const hazardOverlap = searchParams.get('hazard_overlap');
    if (hazardOverlap) setMode('ACTIVE_EVENT');

    if (autoRun && !autoRunTriggered.current && selectedEventId && selectedEvent) {
      autoRunTriggered.current = true;
      // Delay to let all derived state settle
      setTimeout(() => handleRun(), 800);
    }
  }, [selectedEventId, selectedEvent, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Run Copilot ────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!selectedEvent) return;

    setIsLoading(true);
    setError(null);

    const hazardOverlap = searchParams.get('hazard_overlap');

    const contextDescription = [
      `Event: ${selectedEvent.name}`,
      `Outage Type: ${selectedEvent.outage_type || 'Unknown'}`,
      `Lifecycle: ${selectedEvent.lifecycle_stage}`,
      `Customers impacted: ${selectedEvent.customers_impacted ?? 'N/A'}`,
      selectedEvent.location_name ? `Location: ${selectedEvent.location_name}` : null,
      linkedAssetIds && linkedAssetIds.length > 0 ? `Linked asset IDs: ${linkedAssetIds.join(', ')}` : null,
      assignedCrews.length > 0 ? `Assigned crews: ${assignedCrews.map(c => `${c.crew_name} (${c.status})`).join(', ')}` : null,
      hazardOverlap ? `Hazard overlay overlap: ${hazardOverlap}` : null,
    ].filter(Boolean).join('. ');

    const request: CopilotRequest = {
      mode,
      user_message: `Provide a full operator analysis for this event. ${contextDescription}`,
      scenario_id: selectedEvent.id,
      scenario: {
        scenario_name: selectedEvent.name,
        outage_type: selectedEvent.outage_type ?? undefined,
        lifecycle_stage: selectedEvent.lifecycle_stage,
        stage: selectedEvent.stage,
        operator_role: selectedEvent.operator_role ?? undefined,
        scenario_time: selectedEvent.scenario_time ?? undefined,
        notes: selectedEvent.notes ?? undefined,
        description: selectedEvent.description ?? undefined,
      },
      retrieved_knowledge: [],
      constraints: [],
    };

    try {
      // Build policy engine payload
      const hazardMap: Record<string, string> = {
        'Storm': 'STORM', 'High Wind': 'STORM', 'Lightning': 'STORM', 'Snow Storm': 'ICE',
        'Wildfire': 'WILDFIRE', 'Vegetation': 'WILDFIRE',
        'Flood': 'RAIN', 'Heavy Rain': 'RAIN',
        'Heatwave': 'HEAT', 'Ice/Snow': 'ICE',
        'Equipment Failure': 'UNKNOWN',
      };
      const phaseMap: Record<string, string> = {
        'Pre-Event': 'PRE_EVENT', 'Event': 'ACTIVE', 'Post-Event': 'POST_EVENT',
      };
      const policyPayload = {
        scenarioId: selectedEvent.id,
        hazardType: hazardMap[selectedEvent.outage_type || ''] || 'UNKNOWN',
        phase: phaseMap[selectedEvent.lifecycle_stage] || 'UNKNOWN',
        severity: getEventSeverity(selectedEvent),
        customersAffected: selectedEvent.customers_impacted || 0,
        assets: linkedAssets.map(a => ({
          id: a.id,
          type: a.asset_type,
          ageYears: (a.meta as Record<string, unknown>)?.age_years as number | undefined,
          vegetationExposure: (a.meta as Record<string, unknown>)?.vegetation_exposure as number | undefined,
          loadCriticality: (a.meta as Record<string, unknown>)?.load_criticality as number | undefined,
        })),
        criticalLoads: ((selectedEvent.critical_load_types || []) as string[]).map(t => ({ type: t, name: t })),
        crews: {
          available: assignedCrews.filter(c => c.status === 'available').length,
          enRoute: assignedCrews.filter(c => c.status === 'en_route').length,
        },
        lastUpdated: selectedEvent.event_last_update_time || undefined,
        dataQuality: { completeness: linkedAssets.length > 0 ? 0.8 : 0.4, freshnessMinutes: 15 },
      };

      // Fire both calls in parallel
      const [copilotResult, policyResult] = await Promise.all([
        supabase.functions.invoke('copilot', { body: request }),
        supabase.functions.invoke('copilot-evaluate', { body: policyPayload }),
      ]);

      if (copilotResult.error) throw copilotResult.error;

      const raw = copilotResult.data as CopilotResponse;
      const contract = mapToOperatorContract(raw);
      const policyEval = policyResult.error ? null : (policyResult.data as PolicyEvalResult);

      // ── Log Copilot run ──
      insertLog.mutate({
        event_id: selectedEvent.id,
        source: 'Copilot',
        trigger: `${mode} analysis requested`,
        action_taken: `Copilot generated operator analysis (${contract.recommendations.length} recommendations, ${contract.blocked_actions.length} blocked actions)`,
        rule_impact: contract.blocked_actions.length > 0
          ? `Blocked: ${contract.blocked_actions.map(b => b.action).join(', ')}`
          : null,
        metadata: { mode, model: raw.model_engine },
      });

      // ── Log Rule Engine eval ──
      if (policyEval) {
        const triggered = policyEval.safetyConstraints.filter(sc => sc.triggered);
        insertLog.mutate({
          event_id: selectedEvent.id,
          source: 'Rule Engine',
          trigger: 'Policy engine evaluation',
          action_taken: `${triggered.length} constraints triggered, ${policyEval.blockedActions.length} actions blocked`,
          rule_impact: triggered.map(t => t.id).join(', ') || null,
          metadata: { engineVersion: policyEval.meta?.engineVersion, hash: policyEval.meta?.deterministicHash },
        });
      }

      setHistory(prev => [
        {
          contract,
          raw,
          eventName: selectedEvent.name,
          timestamp: new Date(),
          eventSnapshot: { ...selectedEvent },
          crewsSnapshot: [...assignedCrews],
          assetsSnapshot: [...linkedAssets],
          hazardOverlap: searchParams.get('hazard_overlap'),
          policyEval,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Copilot error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from Copilot');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent, mode, linkedAssetIds, assignedCrews, linkedAssets, searchParams]);

  // ─── Copy ───────────────────────────────────────────────────────────────────
  const latestEntry = history[0] ?? null;

  const handleCopy = async () => {
    if (!latestEntry) return;
    const c = latestEntry.contract;
    const text = [
      `[${c.mode}]`,
      '',
      `SITUATION SUMMARY: ${c.situation_summary}`,
      `ETR BAND + CONFIDENCE: ${c.etr_band_confidence}`,
      `CRITICAL LOAD RUNWAY: ${c.critical_load_runway}`,
      '',
      'RECOMMENDATIONS (ADVISORY):',
      ...c.recommendations.map(r => `  • ${r}`),
      '',
      'BLOCKED ACTIONS:',
      ...c.blocked_actions.map(b => `  ✕ ${b.action} — ${b.reason}`),
      '',
      'OPERATOR NOTES / APPROVAL REQUIRED:',
      ...c.operator_notes.map(n => `  • ${n}`),
      '',
      'SOURCE NOTES:',
      ...c.source_notes.map(s => `  • ${s}`),
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── ETR from selected event ────────────────────────────────────────────────
  const etrDisplay = useMemo(() => {
    if (!selectedEvent) return null;
    return formatEtrPrimary(selectedEvent.etr_earliest, selectedEvent.etr_latest, selectedEvent.etr_confidence);
  }, [selectedEvent]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div data-tour-section="copilot-studio" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Operator Copilot</h1>
              <p className="text-[11px] text-muted-foreground">Strict Output Contract — Decision Support Only</p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] bg-muted/30 text-muted-foreground border-border/50">
              Advisory Only
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-5 py-6">
        <div className="grid lg:grid-cols-[360px_1fr] gap-6 max-w-7xl mx-auto">
          {/* ─── Left: Controls ──────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Event Selector */}
            <Card className="border-border/40 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Selected Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedEventId ?? ''}
                  onValueChange={(v) => setSelectedEventId(v)}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder={scenariosLoading ? 'Loading events…' : 'Select event'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(scenarios ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${s.lifecycle_stage === 'Event' ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Event quick-info */}
                {selectedEvent && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Outage</span>
                      <Badge variant="outline" className="text-xs h-5">{selectedEvent.outage_type ?? '—'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Customers</span>
                      <span className="font-medium text-foreground">{selectedEvent.customers_impacted?.toLocaleString() ?? '—'}</span>
                    </div>
                    {etrDisplay && (
                      <div className="flex justify-between">
                        <span>ETR</span>
                        <span className="font-medium text-foreground">{etrDisplay.band}</span>
                      </div>
                    )}
                    {assignedCrews.length > 0 && (
                      <div className="flex justify-between">
                        <span>Crews</span>
                        <span className="font-medium text-foreground">{assignedCrews.length} assigned</span>
                      </div>
                    )}
                    {linkedAssetIds && linkedAssetIds.length > 0 && (
                      <div className="flex justify-between">
                        <span>Assets</span>
                        <span className="font-medium text-foreground">{linkedAssetIds.length} linked</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mode + Run */}
            <Card className="border-border/40 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Analysis Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={mode} onValueChange={(v) => setMode(v as CopilotMode)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEMO">🎯 Demo Mode</SelectItem>
                    <SelectItem value="ACTIVE_EVENT">🔴 Active Event</SelectItem>
                    <SelectItem value="PLANNING">📋 Planning</SelectItem>
                    <SelectItem value="POST_EVENT_REVIEW">📊 Post-Event Review</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleRun}
                  disabled={!selectedEventId || isLoading}
                  className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Running Analysis…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Operator Copilot
                    </>
                  )}
                </Button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">Analysis failed</p>
                        <p className="text-xs mt-0.5">{error}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5 text-xs h-7"
                        onClick={() => { setError(null); handleRun(); }}
                      >
                        <Play className="w-3 h-3" />
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => { setError(null); setMode('DEMO'); handleRun(); }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Use Fallback Model
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* History count */}
            {history.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                {history.length} analyses in session history
              </p>
            )}
          </div>

          {/* ─── Right: Strict Section Renderer ────────────────────────── */}
          <Card className="border-border/40 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Operator Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  {latestEntry && !isLoading && selectedEventId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => navigate(`/event/${selectedEventId}/situation-report`)}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Generate Report
                    </Button>
                  )}
                  {latestEntry && !isLoading && (
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleCopy}>
                      {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </Button>
                  )}
                </div>
              </div>
              {/* Model attribution — always visible */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[11px] h-5 gap-1 font-normal border-[hsl(80,100%,36%)]/40 text-[hsl(80,100%,36%)] bg-[hsl(80,100%,36%)]/10">
                  <Zap className="w-3 h-3" />
                  {latestEntry?.raw.model_engine || 'Model: NVIDIA Nemotron (NIM)'}
                </Badge>
                {latestEntry?.raw.fallback_used && (
                  <Badge variant="outline" className="text-[11px] h-5 gap-1 font-normal border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {latestEntry.raw.model_engine?.includes('Model Router') ? 'Model Router (Gemini)' : 'Model Router (Domain Context)'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {/* Empty state */}
                {!latestEntry && !isLoading && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-2">Select an event and run the Operator Copilot.</p>
                    <p className="text-xs">Results render into fixed operator sections — no free-form chat.</p>
                  </motion.div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ))}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-4 h-4 text-primary" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">Generating operator analysis…</span>
                    </div>
                  </motion.div>
                )}

                {/* Rendered contract */}
                {latestEntry && !isLoading && (
                  <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    {/* Section 1: Mode */}
                    <Section icon={<Zap className="w-4 h-4" />} label="Mode">
                      <Badge className="bg-primary/90 text-primary-foreground text-sm font-bold px-4 py-1.5 rounded-full">
                        {latestEntry.contract.mode}
                      </Badge>
                    </Section>

                    <Separator />

                    {/* Section 2: Situation Summary */}
                    <Section icon={<Activity className="w-4 h-4" />} label="Situation Summary">
                      <p className="text-sm text-foreground leading-relaxed">{latestEntry.contract.situation_summary}</p>
                    </Section>

                    <Separator />

                    {/* Section 3: ETR Band + Confidence */}
                    <Section icon={<Clock className="w-4 h-4" />} label="ETR Band + Confidence">
                      <p className="text-sm text-foreground">{latestEntry.contract.etr_band_confidence}</p>
                    </Section>

                    <Separator />

                    {/* Section 4: Critical Load Runway */}
                    <Section icon={<AlertTriangle className="w-4 h-4" />} label="Critical Load Runway">
                      <p className="text-sm text-foreground">{latestEntry.contract.critical_load_runway}</p>
                    </Section>

                    <Separator />

                    {/* Section 5: Recommendations (Advisory) */}
                    <Section icon={<Sparkles className="w-4 h-4" />} label="Recommendations (Advisory)">
                      {latestEntry.contract.recommendations.length > 0 ? (
                        <ul className="space-y-1.5">
                          {latestEntry.contract.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/60 mt-0.5">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recommendations.</p>
                      )}
                    </Section>

                    <Separator />

                    {/* Section 6: Blocked Actions + Reason */}
                    <Section icon={<Ban className="w-4 h-4" />} label="Blocked Actions + Reason">
                      <div className="space-y-2">
                        {latestEntry.contract.blocked_actions.map((b, i) => (
                          <div key={i} className="p-2 rounded-md bg-destructive/5 border border-destructive/20 text-sm">
                            <span className="font-medium text-destructive">✕ {b.action}</span>
                            <span className="text-muted-foreground"> — {b.reason}</span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Separator />

                    {/* Section 7: Operator Notes / Approval Required */}
                    <Section icon={<ClipboardCheck className="w-4 h-4" />} label="Operator Notes / Approval Required">
                      <ul className="space-y-1.5">
                        {latestEntry.contract.operator_notes.map((n, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">⚑</span>
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Separator />

                    {/* Section 8: Source Notes */}
                    <Section icon={<FileText className="w-4 h-4" />} label="Source Notes">
                      <ul className="space-y-1">
                        {latestEntry.contract.source_notes.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    {/* AI Confidence Statement */}
                    <div className="pt-4 border-t border-border">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">AI Confidence Statement</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Confidence: Structured</span> — Analysis generated from validated event data + deterministic policy compliance. All AI outputs are structured and validated against rule constraints prior to display.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Flow Micro-Diagram */}
                    <div className="pt-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Decision Flow</p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {['Event Data', 'Rule Engine', 'Guardrails', 'AI Inference', 'Validation', 'Advisory Output'].map((step, i) => (
                            <span key={step} className="flex items-center gap-1.5">
                              <span className="rounded border border-border/60 bg-card px-2 py-0.5 font-medium text-foreground/80">{step}</span>
                              {i < 5 && <span className="text-muted-foreground/40">→</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="pt-3">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Disclaimer</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {latestEntry.raw.disclaimer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Trace */}
                    <DecisionTrace
                      modelUsed={latestEntry.raw.model_engine || 'NVIDIA Nemotron (NIM)'}
                      fallbackUsed={latestEntry.raw.fallback_used}
                    />

                    {/* Model + Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/60">
                      <span className="font-medium text-[hsl(80,100%,36%)]">{latestEntry.raw.model_engine || 'NVIDIA Nemotron (NIM)'}</span>
                      <span>Generated {latestEntry.timestamp.toLocaleTimeString()} for "{latestEntry.eventName}"</span>
                    </div>

                    {/* Defensibility Panels */}
                    <DefensibilityPanels
                      contract={latestEntry.contract}
                      raw={latestEntry.raw}
                      event={latestEntry.eventSnapshot}
                      assignedCrews={latestEntry.crewsSnapshot}
                      linkedAssets={latestEntry.assetsSnapshot}
                      hazardOverlap={latestEntry.hazardOverlap}
                      timestamp={latestEntry.timestamp}
                      policyEval={latestEntry.policyEval}
                    />

                    {/* Event Decision Timeline */}
                    <EventDecisionTimeline eventId={selectedEventId} maxHeight="300px" />

                    {/* Operator Approval Gate */}
                    <OperatorApprovalGate
                      contract={latestEntry.contract}
                      eventName={latestEntry.eventName}
                      eventId={selectedEventId}
                      timestamp={latestEntry.timestamp}
                      modelEngine={latestEntry.raw.model_engine || 'NVIDIA Nemotron (NIM)'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
        {/* System Scope Panel */}
        <SystemScopePanel className="max-w-7xl mx-auto mt-6" />
      </main>
    </div>
  );
}

// ─── Section helper component ─────────────────────────────────────────────────
function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
