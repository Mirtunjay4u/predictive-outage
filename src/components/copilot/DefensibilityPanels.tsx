import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Shield, Database, TrendingUp, Clock, AlertTriangle, CheckCircle2, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopilotResponse, OperatorOutputContract } from '@/types/copilot';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { Crew } from '@/types/crew';
import type { Asset } from '@/types/asset';

interface DefensibilityPanelsProps {
  contract: OperatorOutputContract;
  raw: CopilotResponse;
  event: ScenarioWithIntelligence;
  assignedCrews: Crew[];
  linkedAssets: Asset[];
  hazardOverlap: string | null;
  timestamp: Date;
}

// ─── Rule inference from response ────────────────────────────────────────────
interface InferredRule {
  rule_id: string;
  rule_name: string;
  status: 'Triggered' | 'Passed' | 'Blocked';
  severity: 'Info' | 'Warning' | 'Critical';
  impact: string;
  reason: string;
}

function inferRulesFromResponse(
  contract: OperatorOutputContract,
  raw: CopilotResponse,
  event: ScenarioWithIntelligence,
): InferredRule[] {
  const rules: InferredRule[] = [];
  const outage = event.outage_type?.toLowerCase() || '';

  // Blocked actions → Blocked rules
  contract.blocked_actions.forEach((b, i) => {
    rules.push({
      rule_id: `SC-BLOCK-${String(i + 1).padStart(3, '0')}`,
      rule_name: b.action.slice(0, 60),
      status: 'Blocked',
      severity: 'Critical',
      impact: 'Action prevented',
      reason: b.reason,
    });
  });

  // Critical load rules
  if (event.has_critical_load) {
    const isAtRisk = event.critical_runway_status === 'AT_RISK' || event.critical_runway_status === 'BREACH';
    rules.push({
      rule_id: 'SC-CRIT-001',
      rule_name: 'Critical Service Continuity',
      status: isAtRisk ? 'Triggered' : 'Passed',
      severity: isAtRisk ? 'Critical' : 'Info',
      impact: isAtRisk
        ? `Runway ${event.critical_runway_status} — ${event.backup_runtime_remaining_hours ?? '?'}h remaining`
        : 'Backup runtime within safe limits',
      reason: isAtRisk
        ? 'Backup runtime approaching or below escalation threshold'
        : 'Critical loads have adequate backup runway',
    });
  }

  // ETR risk
  if (event.etr_risk_level) {
    const isHigh = event.etr_risk_level === 'HIGH';
    rules.push({
      rule_id: 'SC-ETR-001',
      rule_name: 'ETR Uncertainty Monitor',
      status: isHigh ? 'Triggered' : 'Passed',
      severity: isHigh ? 'Warning' : 'Info',
      impact: `ETR band ${event.etr_band_hours ?? '?'}h, confidence ${event.etr_confidence ?? 'N/A'}`,
      reason: isHigh ? 'Wide ETR band or low confidence increases operational uncertainty' : 'ETR within acceptable uncertainty range',
    });
  }

  // Outage-specific hazard rules
  if (outage.includes('storm') || outage.includes('wind')) {
    rules.push({
      rule_id: 'SC-STORM-001',
      rule_name: 'High Wind Crew Safety',
      status: 'Triggered',
      severity: 'Warning',
      impact: 'Crew dispatch gated on wind speed thresholds',
      reason: 'Storm/wind conditions require safety clearance before field deployment',
    });
  }
  if (outage.includes('flood') || outage.includes('rain')) {
    rules.push({
      rule_id: 'SC-FLOOD-001',
      rule_name: 'Equipment Access Safety',
      status: 'Triggered',
      severity: 'Warning',
      impact: 'Substation access may be restricted',
      reason: 'Flood/rain conditions affect ground-level equipment access',
    });
  }
  if (outage.includes('heat')) {
    rules.push({
      rule_id: 'SC-HEAT-001',
      rule_name: 'Thermal / Peak Load Risk',
      status: 'Triggered',
      severity: 'Warning',
      impact: 'Transformer overload risk elevated',
      reason: 'Heatwave conditions increase peak demand and conductor sag risk',
    });
  }
  if (outage.includes('wildfire') || outage.includes('fire')) {
    rules.push({
      rule_id: 'SC-WILD-001',
      rule_name: 'Wildfire Switching Protocol',
      status: 'Triggered',
      severity: 'Critical',
      impact: 'De-energization may be required in fire path',
      reason: 'Active fire zones require proactive line de-energization',
    });
  }
  if (outage.includes('ice') || outage.includes('snow')) {
    rules.push({
      rule_id: 'SC-ICE-001',
      rule_name: 'Ice Loading Assessment',
      status: 'Triggered',
      severity: 'Warning',
      impact: 'Conductor and pole loading risks',
      reason: 'Ice/snow accumulation increases structural failure probability',
    });
  }

  // Crew sufficiency
  const assignedCount = contract.operator_notes.some(n => n.toLowerCase().includes('crew'));
  rules.push({
    rule_id: 'SC-CREW-001',
    rule_name: 'Crew Sufficiency Check',
    status: assignedCount ? 'Triggered' : 'Passed',
    severity: assignedCount ? 'Info' : 'Info',
    impact: 'Crew allocation noted in operator notes',
    reason: 'Crew availability and assignment verified against event scope',
  });

  // Escalation
  if (event.requires_escalation) {
    rules.push({
      rule_id: 'SC-ESC-001',
      rule_name: 'Escalation Required',
      status: 'Triggered',
      severity: 'Critical',
      impact: 'Event flagged for management escalation',
      reason: 'Event metrics exceed escalation thresholds',
    });
  }

  // Fallback rule
  if (raw.fallback_used) {
    rules.push({
      rule_id: 'SC-FALL-001',
      rule_name: 'Model Fallback Activated',
      status: 'Triggered',
      severity: 'Warning',
      impact: `Primary engine unavailable`,
      reason: raw.fallback_reason || 'Primary model did not respond in time',
    });
  }

  return rules;
}

// ─── Status badge styling ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InferredRule['status'] }) {
  const styles = {
    Triggered: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Passed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
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

function SeverityBadge({ severity }: { severity: InferredRule['severity'] }) {
  const styles = {
    Info: 'bg-muted text-muted-foreground border-border',
    Warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
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
}: DefensibilityPanelsProps) {
  const rules = useMemo(
    () => inferRulesFromResponse(contract, raw, event),
    [contract, raw, event],
  );

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

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="rules" className="text-xs gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Rules Fired
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
                {rules.map((rule) => (
                  <TableRow key={rule.rule_id} className="text-xs">
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{rule.rule_id}</TableCell>
                    <TableCell className="font-medium text-foreground">{rule.rule_name}</TableCell>
                    <TableCell><StatusBadge status={rule.status} /></TableCell>
                    <TableCell><SeverityBadge severity={rule.severity} /></TableCell>
                    <TableCell className="text-muted-foreground">{rule.impact}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={rule.reason}>{rule.reason}</TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No rules evaluated.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {rules.filter(r => r.status === 'Triggered').length} triggered · {rules.filter(r => r.status === 'Blocked').length} blocked · {rules.filter(r => r.status === 'Passed').length} passed
          </p>
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
                <ConfidenceIndicator level={event.etr_confidence} />
                <div className="text-xs text-muted-foreground">
                  {event.etr_confidence
                    ? `Confidence: ${event.etr_confidence}`
                    : 'ETR confidence not available'}
                  {event.etr_risk_level && ` · Risk: ${event.etr_risk_level}`}
                  {event.etr_band_hours != null && ` · Band: ${event.etr_band_hours}h`}
                </div>
              </div>
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

            {/* Assumptions from AI response */}
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
              {raw.model_engine || 'NVIDIA Nemotron (NIM)'}
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
