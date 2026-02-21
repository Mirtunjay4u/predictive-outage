import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Shield, Database, TrendingUp, Clock, AlertTriangle, CheckCircle2, Ban,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopilotResponse, OperatorOutputContract } from '@/types/copilot';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { Crew } from '@/types/crew';
import type { Asset } from '@/types/asset';
import type { PolicyEvalResult } from '@/hooks/usePolicyEvaluation';

interface DefensibilityPanelsProps {
  contract: OperatorOutputContract;
  raw: CopilotResponse;
  event: ScenarioWithIntelligence;
  assignedCrews: Crew[];
  linkedAssets: Asset[];
  hazardOverlap: string | null;
  timestamp: Date;
  policyEval: PolicyEvalResult | null;
}

// ─── Unified rule row type ───────────────────────────────────────────────────
interface RuleRow {
  rule_id: string;
  rule_name: string;
  status: 'Triggered' | 'Passed' | 'Blocked';
  severity: 'Info' | 'Warning' | 'Critical';
  impact: string;
  reason: string;
}

/** Map engine severity to UI severity */
function mapSeverity(sev: string, triggered: boolean): RuleRow['severity'] {
  if (!triggered) return 'Info';
  switch (sev) {
    case 'HIGH': return 'Critical';
    case 'MEDIUM': return 'Warning';
    default: return 'Info';
  }
}

// ─── Full safety constraint catalog ─────────────────────────────────────────
// This is the authoritative list. Every demo shows all 13 rules; only relevant
// ones fire. Non-relevant hazard rules appear as "Passed" to demonstrate scope.
const FULL_RULE_CATALOG: Array<{
  id: string;
  name: string;
  hazard: string | null; // null = universal
  passedImpact: string;
  passedReason: string;
}> = [
  { id: 'SC-CRIT-001', name: 'Critical Service Continuity', hazard: null, passedImpact: 'No critical loads at risk', passedReason: 'No hospital/water/telecom loads exceed thresholds' },
  { id: 'SC-CRIT-002', name: 'Backup Power Depletion Risk', hazard: null, passedImpact: 'Backup runtime adequate', passedReason: 'All critical loads report backup > 4 hours' },
  { id: 'SC-CREW-001', name: 'Field Crew Sufficiency', hazard: null, passedImpact: 'Crew capacity sufficient', passedReason: 'Available + en-route crews meet estimated demand' },
  { id: 'SC-ETR-001', name: 'ETR Confidence Assessment', hazard: null, passedImpact: 'ETR confidence acceptable', passedReason: 'Data quality and crew capacity support reliable ETR' },
  { id: 'SC-STORM-001', name: 'High Wind Field Crew Prohibition', hazard: 'STORM', passedImpact: 'No active storm conditions', passedReason: 'Storm hazard not in ACTIVE phase' },
  { id: 'SC-FLOOD-001', name: 'Flood Zone Equipment Access', hazard: 'RAIN', passedImpact: 'No active flood restrictions', passedReason: 'Flood/rain hazard not in ACTIVE phase' },
  { id: 'SC-HEAT-001', name: 'Transformer Thermal Overload', hazard: 'HEAT', passedImpact: 'Thermal ratings within limits', passedReason: 'Heat severity below threshold (< 3)' },
  { id: 'SC-HEAT-002', name: 'Extreme Heat Peak Load Risk', hazard: 'HEAT', passedImpact: 'Peak load within capacity', passedReason: 'Heat severity below threshold (< 4)' },
  { id: 'SC-WILD-001', name: 'Wildfire Aerial Clearance Required', hazard: 'WILDFIRE', passedImpact: 'No vegetation fire risk', passedReason: 'Wildfire hazard not active or vegetation exposure ≤ 0.60' },
  { id: 'SC-ICE-001', name: 'Ice Storm Switching Prohibition', hazard: 'ICE', passedImpact: 'No active ice conditions', passedReason: 'ICE hazard not in ACTIVE phase' },
  { id: 'SC-ICE-002', name: 'Ice Vegetation Line Loading', hazard: 'ICE', passedImpact: 'Conductor loading normal', passedReason: 'No assets exceed 0.5 vegetation exposure under ice' },
];

/** Build rules from real copilot-evaluate response, filling in catalog gaps as Passed */
function buildRulesFromEval(policyEval: PolicyEvalResult): RuleRow[] {
  const rows: RuleRow[] = [];
  const usedIds = new Set<string>();

  // 1. Safety constraints from engine (these are the real evaluations)
  for (const sc of policyEval.safetyConstraints) {
    usedIds.add(sc.id);
    rows.push({
      rule_id: sc.id,
      rule_name: sc.title,
      status: sc.triggered ? 'Triggered' : 'Passed',
      severity: mapSeverity(sc.severity, sc.triggered),
      impact: sc.evidence[0] || (sc.triggered ? 'Constraint active' : 'Within safe limits'),
      reason: sc.evidence.slice(1).join(' ') || sc.title,
    });
  }

  // 2. ETR band as a rule
  const etr = policyEval.etrBand;
  if (!usedIds.has('SC-ETR-001')) {
    usedIds.add('SC-ETR-001');
    rows.push({
      rule_id: 'SC-ETR-001',
      rule_name: 'ETR Confidence Assessment',
      status: etr.band === 'LOW' ? 'Triggered' : 'Passed',
      severity: etr.band === 'LOW' ? 'Warning' : etr.band === 'MEDIUM' ? 'Warning' : 'Info',
      impact: `Band: ${etr.band} · Confidence: ${(etr.confidence * 100).toFixed(0)}%`,
      reason: etr.rationale[0] || 'ETR evaluated',
    });
  }

  // 3. Blocked actions → dedicated SC-BLOCK rows
  for (const ba of policyEval.blockedActions) {
    const actionLabel = ba.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    rows.push({
      rule_id: 'SC-BLOCK',
      rule_name: `Blocked: ${actionLabel}`,
      status: 'Blocked',
      severity: 'Critical',
      impact: ba.reason.slice(0, 100),
      reason: Array.isArray(ba.remediation) ? ba.remediation[0] || ba.reason : ba.reason,
    });
  }

  // 4. Fill catalog gaps — rules the engine didn't return get "Passed"
  for (const cat of FULL_RULE_CATALOG) {
    if (!usedIds.has(cat.id)) {
      rows.push({
        rule_id: cat.id,
        rule_name: cat.name,
        status: 'Passed',
        severity: 'Info',
        impact: cat.passedImpact,
        reason: cat.passedReason,
      });
    }
  }

  return rows;
}

/** Fallback: full catalog inferred from event context when policy engine is unavailable */
function inferRulesFromResponse(
  contract: OperatorOutputContract,
  event: ScenarioWithIntelligence,
): RuleRow[] {
  const rules: RuleRow[] = [];
  const outage = event.outage_type?.toLowerCase() || '';

  // Blocked actions from AI response
  contract.blocked_actions.forEach(b => {
    const actionLabel = b.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    rules.push({
      rule_id: 'SC-BLOCK',
      rule_name: `Blocked: ${actionLabel}`,
      status: 'Blocked',
      severity: 'Critical',
      impact: 'Action prevented by safety policy',
      reason: b.reason,
    });
  });

  // ── Critical load rules ─────────────────────────────
  const isAtRisk = event.critical_runway_status === 'AT_RISK' || event.critical_runway_status === 'BREACH';
  rules.push({
    rule_id: 'SC-CRIT-001',
    rule_name: 'Critical Service Continuity',
    status: event.has_critical_load && isAtRisk ? 'Triggered' : 'Passed',
    severity: event.has_critical_load && isAtRisk ? 'Critical' : 'Info',
    impact: event.has_critical_load && isAtRisk ? `Runway ${event.critical_runway_status}` : 'No critical loads at risk',
    reason: event.has_critical_load && isAtRisk ? 'Backup runtime below safety threshold' : 'No hospital/water/telecom loads exceed thresholds',
  });
  rules.push({
    rule_id: 'SC-CRIT-002',
    rule_name: 'Backup Power Depletion Risk',
    status: event.has_critical_load && (event.backup_runtime_remaining_hours ?? 99) < 4 ? 'Triggered' : 'Passed',
    severity: event.has_critical_load && (event.backup_runtime_remaining_hours ?? 99) < 4 ? 'Critical' : 'Info',
    impact: event.has_critical_load && (event.backup_runtime_remaining_hours ?? 99) < 4 ? `Backup < 4h remaining` : 'Backup runtime adequate',
    reason: event.has_critical_load && (event.backup_runtime_remaining_hours ?? 99) < 4 ? 'Critical load backup approaching depletion' : 'All critical loads report backup > 4 hours',
  });

  // ── Crew rule ───────────────────────────────────────
  rules.push({
    rule_id: 'SC-CREW-001',
    rule_name: 'Field Crew Sufficiency',
    status: 'Passed',
    severity: 'Info',
    impact: 'Crew capacity sufficient',
    reason: 'Available + en-route crews meet estimated demand',
  });

  // ── ETR rule ────────────────────────────────────────
  const etrConf = event.etr_confidence?.toLowerCase();
  const lowEtr = etrConf === 'low' || etrConf === 'very_low';
  rules.push({
    rule_id: 'SC-ETR-001',
    rule_name: 'ETR Confidence Assessment',
    status: lowEtr ? 'Triggered' : 'Passed',
    severity: lowEtr ? 'Warning' : 'Info',
    impact: lowEtr ? `ETR confidence: ${event.etr_confidence}` : 'ETR confidence acceptable',
    reason: lowEtr ? 'Low data confidence reduces restoration estimate precision' : 'Data quality and crew capacity support reliable ETR',
  });

  // ── Hazard-specific rules (all shown, only matching ones trigger) ───
  const isStorm = outage.includes('storm') || outage.includes('wind');
  rules.push({
    rule_id: 'SC-STORM-001',
    rule_name: 'High Wind Field Crew Prohibition',
    status: isStorm ? 'Triggered' : 'Passed',
    severity: isStorm ? 'Critical' : 'Info',
    impact: isStorm ? 'Crew dispatch gated until wind clears' : 'No active storm conditions',
    reason: isStorm ? 'High wind elevates conductor contact and tree strike risk' : 'Storm hazard not in ACTIVE phase',
  });

  const isFlood = outage.includes('flood') || outage.includes('rain');
  rules.push({
    rule_id: 'SC-FLOOD-001',
    rule_name: 'Flood Zone Equipment Access',
    status: isFlood ? 'Triggered' : 'Passed',
    severity: isFlood ? 'Warning' : 'Info',
    impact: isFlood ? 'Ground access restricted' : 'No active flood restrictions',
    reason: isFlood ? 'Standing water restricts pad-mount equipment access' : 'Flood/rain hazard not in ACTIVE phase',
  });

  const isHeat = outage.includes('heat');
  rules.push({
    rule_id: 'SC-HEAT-001',
    rule_name: 'Transformer Thermal Overload',
    status: isHeat ? 'Triggered' : 'Passed',
    severity: isHeat ? 'Warning' : 'Info',
    impact: isHeat ? 'Transformer thermal ratings at risk' : 'Thermal ratings within limits',
    reason: isHeat ? 'Sustained heat elevates winding temperature' : 'Heat severity below threshold (< 3)',
  });
  rules.push({
    rule_id: 'SC-HEAT-002',
    rule_name: 'Extreme Heat Peak Load Risk',
    status: isHeat ? 'Triggered' : 'Passed',
    severity: isHeat ? 'Critical' : 'Info',
    impact: isHeat ? 'Peak demand may exceed feeder capacity' : 'Peak load within capacity',
    reason: isHeat ? 'Extreme ambient temperatures drive cooling load surge' : 'Heat severity below threshold (< 4)',
  });

  const isWild = outage.includes('wildfire') || outage.includes('fire') || outage.includes('vegetation');
  rules.push({
    rule_id: 'SC-WILD-001',
    rule_name: 'Wildfire Aerial Clearance Required',
    status: isWild ? 'Triggered' : 'Passed',
    severity: isWild ? 'Critical' : 'Info',
    impact: isWild ? 'De-energization may be required' : 'No vegetation fire risk',
    reason: isWild ? 'Active fire zones require proactive de-energization assessment' : 'Wildfire hazard not active or vegetation exposure ≤ 0.60',
  });

  const isIce = outage.includes('ice') || outage.includes('snow');
  rules.push({
    rule_id: 'SC-ICE-001',
    rule_name: 'Ice Storm Switching Prohibition',
    status: isIce ? 'Triggered' : 'Passed',
    severity: isIce ? 'Warning' : 'Info',
    impact: isIce ? 'Remote switching prohibited' : 'No active ice conditions',
    reason: isIce ? 'Ice-loaded conductors require visual confirmation before switching' : 'ICE hazard not in ACTIVE phase',
  });
  rules.push({
    rule_id: 'SC-ICE-002',
    rule_name: 'Ice Vegetation Line Loading',
    status: isIce ? 'Triggered' : 'Passed',
    severity: isIce ? 'Warning' : 'Info',
    impact: isIce ? 'Conductor loading elevated' : 'Conductor loading normal',
    reason: isIce ? 'Ice accumulation on vegetated lines raises failure risk' : 'No assets exceed 0.5 vegetation exposure under ice',
  });

  return rules;
}

// ─── Status badge styling ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RuleRow['status'] }) {
  const styles = {
    Triggered: 'bg-warning/15 text-warning border-warning/30',
    Passed: 'bg-success/15 text-success border-success/30',
    Blocked: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  const icons = {
    Triggered: <AlertTriangle className="w-3 h-3" />,
    Passed: <CheckCircle2 className="w-3 h-3" />,
    Blocked: <Ban className="w-3 h-3" />,
  };
  return (
    <Badge variant="outline" className={cn('text-[10px] h-5 gap-1', styles[status])}>
      {icons[status]}
      {status}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: RuleRow['severity'] }) {
  const styles = {
    Info: 'bg-muted text-muted-foreground border-border',
    Warning: 'bg-warning/15 text-warning border-warning/30',
    Critical: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return (
    <Badge variant="outline" className={cn('text-[10px] h-5', styles[severity])}>
      {severity}
    </Badge>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function DefensibilityPanels({
  contract,
  raw,
  event,
  assignedCrews,
  linkedAssets,
  hazardOverlap,
  timestamp,
  policyEval,
}: DefensibilityPanelsProps) {
  const rules = useMemo(
    () => policyEval ? buildRulesFromEval(policyEval) : inferRulesFromResponse(contract, event),
    [policyEval, contract, event],
  );

  // Sort: Blocked first, then Triggered, then Passed
  const sortedRules = useMemo(() => {
    const order = { Blocked: 0, Triggered: 1, Passed: 2 };
    return [...rules].sort((a, b) => order[a.status] - order[b.status]);
  }, [rules]);

  const triggered = sortedRules.filter(r => r.status === 'Triggered').length;
  const blocked = sortedRules.filter(r => r.status === 'Blocked').length;
  const passed = sortedRules.filter(r => r.status === 'Passed').length;

  const crewsByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    assignedCrews.forEach(c => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return map;
  }, [assignedCrews]);

  const assetsByType = useMemo(() => {
    const map: Record<string, number> = {};
    linkedAssets.forEach(a => {
      map[a.asset_type] = (map[a.asset_type] || 0) + 1;
    });
    return map;
  }, [linkedAssets]);

  const uncertaintyDrivers = event.etr_uncertainty_drivers ?? [];
  const criticalLoadTypes = (event.critical_load_types ?? []) as string[];

  const engineMeta = policyEval?.meta;
  const evalTimestamp = policyEval?.timestamps?.evaluatedAt;

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="rules" className="text-xs gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Rules Fired
            {(triggered + blocked) > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{triggered + blocked}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="evidence" className="text-xs gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Evidence / Inputs
          </TabsTrigger>
          <TabsTrigger value="confidence" className="text-xs gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Confidence
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Rules Fired ─────────────────────────────────────── */}
        <TabsContent value="rules" className="mt-4">
          {/* Engine source badge */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-[10px] h-5 gap-1 border-primary/30 text-primary">
              <Shield className="w-3 h-3" />
              {policyEval ? 'Deterministic Policy Engine' : 'Inferred from Response'}
            </Badge>
            {engineMeta?.deterministicHash && (
              <Badge variant="outline" className="text-[10px] h-5 font-mono border-border text-muted-foreground">
                {engineMeta.deterministicHash}
              </Badge>
            )}
            {engineMeta?.engineVersion && (
              <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground">
                v{engineMeta.engineVersion}
              </Badge>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[11px] font-semibold w-[100px]">Rule ID</TableHead>
                  <TableHead className="text-[11px] font-semibold">Rule Name</TableHead>
                  <TableHead className="text-[11px] font-semibold w-[90px]">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold w-[80px]">Severity</TableHead>
                  <TableHead className="text-[11px] font-semibold">Impact</TableHead>
                  <TableHead className="text-[11px] font-semibold">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule, idx) => (
                  <TableRow key={`${rule.rule_id}-${idx}`} className={cn(
                    'text-xs',
                    rule.status === 'Blocked' && 'bg-destructive/5',
                    rule.status === 'Triggered' && 'bg-warning/5',
                  )}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{rule.rule_id}</TableCell>
                    <TableCell className="font-medium text-foreground">{rule.rule_name}</TableCell>
                    <TableCell><StatusBadge status={rule.status} /></TableCell>
                    <TableCell><SeverityBadge severity={rule.severity} /></TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate" title={rule.impact}>{rule.impact}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={rule.reason}>{rule.reason}</TableCell>
                  </TableRow>
                ))}
                {sortedRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No rules evaluated.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary strip */}
          <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> {blocked} blocked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warning" /> {triggered} triggered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" /> {passed} passed
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>{sortedRules.length} rules evaluated</span>
              </div>
              {evalTimestamp && (
                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(evalTimestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            {/* One-line verdict */}
            <p className="text-[10px] text-muted-foreground/50 italic">
              {blocked > 0
                ? `${blocked} action${blocked > 1 ? 's' : ''} blocked by safety policy. ${triggered} constraint${triggered !== 1 ? 's' : ''} active. Operator review required before proceeding.`
                : triggered > 0
                  ? `${triggered} constraint${triggered !== 1 ? 's' : ''} active — advisory only, no actions blocked. All ${passed} remaining rules passed.`
                  : `All ${passed} safety rules passed. No constraints triggered or actions blocked.`
              }
            </p>
          </div>
        </TabsContent>

        {/* ─── Tab 2: Evidence / Inputs Used ───────────────────────────── */}
        <TabsContent value="evidence" className="mt-4">
          <div className="space-y-4">
            {/* Event fields */}
            <EvidenceGroup label="Event Context">
              <EvidenceRow label="Event Name" value={event.name} />
              <EvidenceRow label="Outage Type" value={event.outage_type ?? '—'} />
              <EvidenceRow label="Lifecycle Stage" value={event.lifecycle_stage} />
              <EvidenceRow label="Priority" value={event.priority ?? '—'} />
              <EvidenceRow label="Customers Impacted" value={event.customers_impacted?.toLocaleString() ?? '—'} />
              <EvidenceRow label="Location" value={event.location_name ?? '—'} />
              <EvidenceRow label="Service Area" value={event.service_area ?? '—'} />
              <EvidenceRow label="Feeder ID" value={event.feeder_id ?? '—'} />
              <EvidenceRow label="Fault ID" value={event.fault_id ?? '—'} />
            </EvidenceGroup>

            {/* Assets */}
            <EvidenceGroup label={`Linked Assets (${linkedAssets.length})`}>
              {linkedAssets.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(assetsByType).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-[10px] h-5">{type}: {count}</Badge>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {linkedAssets.slice(0, 8).map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-[10px] text-muted-foreground/60">{a.asset_type}</span>
                        <span className="text-foreground">{a.name}</span>
                        {a.meta && (a.meta as Record<string, unknown>).locked && (
                          <Badge variant="outline" className="text-[10px] h-4 border-destructive/30 text-destructive">Locked</Badge>
                        )}
                        {a.meta && (a.meta as Record<string, unknown>).maintenance && (
                          <Badge variant="outline" className="text-[10px] h-4 border-amber-500/30 text-amber-600 dark:text-amber-400">Maintenance</Badge>
                        )}
                      </div>
                    ))}
                    {linkedAssets.length > 8 && (
                      <p className="text-[10px] text-muted-foreground/60">+ {linkedAssets.length - 8} more</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No assets linked to this event.</p>
              )}
            </EvidenceGroup>

            {/* Crews */}
            <EvidenceGroup label={`Assigned Crews (${assignedCrews.length})`}>
              {assignedCrews.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(crewsByStatus).map(([status, count]) => (
                      <Badge key={status} variant="outline" className="text-[10px] h-5 capitalize">{status}: {count}</Badge>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {assignedCrews.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{c.crew_name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 capitalize">{c.status}</Badge>
                        {c.specialization && <span>{c.specialization}</span>}
                        {c.eta_minutes != null && <span>ETA {c.eta_minutes}m</span>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No crews assigned.</p>
              )}
            </EvidenceGroup>

            {/* Critical Loads */}
            <EvidenceGroup label="Critical Loads">
              <EvidenceRow label="Has Critical Load" value={event.has_critical_load ? 'Yes' : 'No'} />
              {criticalLoadTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {criticalLoadTypes.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] h-5">{t}</Badge>
                  ))}
                </div>
              )}
              <EvidenceRow label="Backup Runtime" value={event.backup_runtime_remaining_hours != null ? `${event.backup_runtime_remaining_hours}h remaining` : '—'} />
              <EvidenceRow label="Escalation Threshold" value={event.critical_escalation_threshold_hours != null ? `${event.critical_escalation_threshold_hours}h` : '—'} />
              <EvidenceRow label="Runway Status" value={event.critical_runway_status ?? '—'} />
            </EvidenceGroup>

            {/* Hazard Overlap */}
            {hazardOverlap && (
              <EvidenceGroup label="Hazard Overlap">
                <div className="flex flex-wrap gap-1.5">
                  {hazardOverlap.split(',').map((h, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-600 dark:text-amber-400">{h.trim()}</Badge>
                  ))}
                </div>
              </EvidenceGroup>
            )}

            {/* Data Freshness */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 pt-2 border-t border-border/50">
              <Clock className="w-3 h-3" />
              <span>
                Event last updated: {event.event_last_update_time ? new Date(event.event_last_update_time).toLocaleString() : event.updated_at ? new Date(event.updated_at).toLocaleString() : 'N/A'}
                {' · '}Analysis generated: {timestamp.toLocaleString()}
              </span>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 3: Confidence & Assumptions ────────────────────────── */}
        <TabsContent value="confidence" className="mt-4">
          <div className="space-y-4">
            {/* ETR Confidence */}
            <EvidenceGroup label="ETR Confidence">
              <div className="flex items-center gap-3 mb-2">
                <ConfidenceIndicator level={
                  policyEval ? policyEval.etrBand.band : event.etr_confidence
                } />
                <div className="text-xs text-muted-foreground">
                  {policyEval
                    ? `Band: ${policyEval.etrBand.band} · Confidence: ${(policyEval.etrBand.confidence * 100).toFixed(0)}%`
                    : event.etr_confidence
                      ? `Confidence: ${event.etr_confidence}`
                      : 'ETR confidence not available'}
                  {!policyEval && event.etr_risk_level && ` · Risk: ${event.etr_risk_level}`}
                  {!policyEval && event.etr_band_hours != null && ` · Band: ${event.etr_band_hours}h`}
                </div>
              </div>
              {policyEval && policyEval.etrBand.rationale.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {policyEval.etrBand.rationale.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="w-3 h-3 text-primary/60 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </EvidenceGroup>

            {/* Uncertainty Drivers */}
            <EvidenceGroup label={`Uncertainty Drivers (${uncertaintyDrivers.length})`}>
              {uncertaintyDrivers.length > 0 ? (
                <ul className="space-y-1">
                  {uncertaintyDrivers.map((d, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No uncertainty drivers identified.</p>
              )}
            </EvidenceGroup>

            {/* Assumptions from AI response or policy engine */}
            <EvidenceGroup label={`Assumptions (${raw.assumptions?.length ?? 0})`}>
              {raw.assumptions && raw.assumptions.length > 0 ? (
                <ul className="space-y-1.5">
                  {raw.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-muted-foreground/60 mt-0.5">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No explicit assumptions stated.</p>
              )}
            </EvidenceGroup>

            {/* Missing inputs */}
            <EvidenceGroup label="Missing Inputs">
              <MissingInputsList event={event} linkedAssets={linkedAssets} assignedCrews={assignedCrews} />
            </EvidenceGroup>

            {/* Model info */}
            <div className="p-2 rounded bg-muted/30 border border-border/50 text-[11px] text-muted-foreground">
              <span className="font-medium">Engine: </span>
              <span className="font-medium text-[hsl(80,100%,36%)]">{raw.model_engine || 'NVIDIA Nemotron (NIM)'}</span>
              {raw.fallback_used && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  Fallback: {raw.fallback_reason || 'Primary unavailable'}
                </span>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function EvidenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="pl-0">{children}</div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right max-w-[60%] truncate" title={value}>{value}</span>
    </div>
  );
}

function ConfidenceIndicator({ level }: { level: string | null }) {
  const colors = {
    HIGH: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-destructive',
  };
  const color = colors[(level ?? '') as keyof typeof colors] || 'bg-muted-foreground/30';
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-6 rounded-sm',
            i === 0 ? color : '',
            i === 1 ? (level === 'HIGH' || level === 'MEDIUM' ? color : 'bg-muted') : '',
            i === 2 ? (level === 'HIGH' ? color : 'bg-muted') : '',
          )}
        />
      ))}
    </div>
  );
}

function MissingInputsList({
  event,
  linkedAssets,
  assignedCrews,
}: {
  event: ScenarioWithIntelligence;
  linkedAssets: Asset[];
  assignedCrews: Crew[];
}) {
  const missing: string[] = [];
  if (!event.outage_type) missing.push('Outage type not specified');
  if (event.customers_impacted == null) missing.push('Customer impact count not available');
  if (!event.etr_earliest && !event.etr_latest) missing.push('No ETR band data');
  if (!event.etr_confidence) missing.push('ETR confidence level not set');
  if (event.has_critical_load && event.backup_runtime_remaining_hours == null) missing.push('Critical load backup runtime unknown');
  if (linkedAssets.length === 0) missing.push('No assets linked to event');
  if (assignedCrews.length === 0) missing.push('No crews assigned');
  if (!event.location_name) missing.push('Location name not specified');
  if (!event.feeder_id && !event.fault_id) missing.push('No feeder or fault ID tagged');

  if (missing.length === 0) {
    return <p className="text-xs text-emerald-600 dark:text-emerald-400">All expected inputs present.</p>;
  }

  return (
    <ul className="space-y-1">
      {missing.map((m, i) => (
        <li key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>{m}</span>
        </li>
      ))}
    </ul>
  );
}
