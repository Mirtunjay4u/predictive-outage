import {
  FileText, Database, Server, Shield, Cpu, CheckCircle2, XCircle,
  AlertTriangle, Layers, GitBranch, Lock, Printer, BookOpen, Code2,
  Braces, Users, Zap, CloudLightning,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'purpose', label: 'Purpose', num: '1' },
  { id: 'data-model', label: 'Data Model Overview', num: '2' },
  { id: 'event-schema', label: 'Event Schema', num: '3' },
  { id: 'crew-schema', label: 'Crew Schema', num: '4' },
  { id: 'asset-schema', label: 'Asset Schema', num: '5' },
  { id: 'hazard-schema', label: 'Hazard Schema', num: '6' },
  { id: 'advisory-schema', label: 'Advisory Output Schema', num: '7' },
  { id: 'api-contracts', label: 'API Contracts', num: '8' },
  { id: 'context-logic', label: 'Context Completeness', num: '9' },
  { id: 'versioning', label: 'Versioning Strategy', num: '10' },
  { id: 'integration', label: 'Integration Readiness', num: '11' },
  { id: 'security', label: 'Security Controls', num: '12' },
  { id: 'limitations', label: 'Limitations (Phase-1)', num: '13' },
  { id: 'conclusion', label: 'Conclusion', num: '14' },
];

function DocBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'destructive' }) {
  const styles = {
    default: 'border-primary/20 bg-primary/5 text-primary/80',
    success: 'border-success/20 bg-success/5 text-success',
    warning: 'border-warning/20 bg-warning/5 text-warning',
    destructive: 'border-destructive/20 bg-destructive/5 text-destructive',
  };
  return <Badge variant="outline" className={cn('text-[9px] font-semibold uppercase tracking-wider', styles[variant])}>{children}</Badge>;
}

function SectionTitle({ id, num, title, icon: Icon }: { id: string; num: string; title: string; icon: React.ElementType }) {
  return (
    <div id={id} className="scroll-mt-24 flex items-center gap-3 pt-8 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-muted-foreground/50">{num}.</span>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">{title}</h2>
      </div>
      <div className="h-px flex-1 bg-border/30" />
    </div>
  );
}

function BulletList({ items, icon }: { items: string[]; icon?: 'check' | 'x' | 'dot' }) {
  const IconEl = icon === 'check' ? CheckCircle2 : icon === 'x' ? XCircle : null;
  return (
    <ul className="space-y-1.5 text-[13px] text-muted-foreground leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          {IconEl ? <IconEl className={cn('mt-0.5 h-3.5 w-3.5 flex-shrink-0', icon === 'check' ? 'text-success' : 'text-destructive')} /> : <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/40" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'warning' | 'destructive' }) {
  const border = variant === 'warning' ? 'border-warning/30 bg-warning/5' : variant === 'destructive' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5';
  return <div className={cn('rounded-lg border p-4 text-[13px] text-muted-foreground leading-relaxed mt-3', border)}>{children}</div>;
}

function JsonBlock({ title, json }: { title: string; json: string }) {
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
      <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 border-b border-border/20">
        <Braces className="h-3.5 w-3.5 text-primary/60" />
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{title}</span>
      </div>
      <pre className="p-4 text-[11px] leading-relaxed text-muted-foreground overflow-x-auto font-mono bg-card/30">{json}</pre>
    </div>
  );
}

function FieldTable({ fields }: { fields: { field: string; type: string; desc: string }[] }) {
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
      <table className="w-full text-[11px]">
        <thead><tr className="bg-muted/30 text-muted-foreground/70">
          <th className="text-left px-4 py-2 font-medium">Field</th>
          <th className="text-left px-4 py-2 font-medium">Type</th>
          <th className="text-left px-4 py-2 font-medium">Description</th>
        </tr></thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.field} className="border-t border-border/20">
              <td className="px-4 py-1.5 font-mono text-primary/80">{f.field}</td>
              <td className="px-4 py-1.5 text-muted-foreground/60">{f.type}</td>
              <td className="px-4 py-1.5 text-muted-foreground">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EVENT_JSON = `{
  "event_id": "EVT-2026-001",
  "event_type": "Storm",
  "feeder_id": "FDR-33KV-07",
  "voltage_level": "33kV",
  "affected_customers": 14000,
  "downstream_feeders": ["FDR-11KV-12", "FDR-11KV-13"],
  "has_critical_load": true,
  "critical_load_count": 2,
  "etr_earliest": "2026-03-12T14:00:00Z",
  "etr_latest": "2026-03-12T17:00:00Z",
  "etr_confidence": "Medium",
  "backup_runtime_remaining_hours": 3,
  "critical_escalation_threshold_hours": 2,
  "hazard_exposure_score": 78,
  "asset_lock_flag": false,
  "maintenance_flag": false,
  "created_at": "2026-03-12T10:00:00Z"
}`;

const CREW_JSON = `{
  "crew_id": "CRW-12",
  "qualification": "Distribution",
  "current_assignment": "EVT-2026-001",
  "availability_status": "Available",
  "location": "Zone-4"
}`;

const ASSET_JSON = `{
  "asset_id": "AST-3321",
  "asset_type": "Transformer",
  "status": "Operational",
  "maintenance_flag": false,
  "lock_flag": false,
  "associated_feeder": "FDR-33KV-07"
}`;

const HAZARD_JSON = `{
  "hazard_id": "HZ-2026-77",
  "hazard_type": "High Wind",
  "severity_level": "Severe",
  "exposure_score": 78,
  "timestamp": "2026-03-12T09:45:00Z"
}`;

const ADVISORY_JSON = `{
  "mode": "Escalation Advisory",
  "summary": "Structured executive summary.",
  "rationale": [
    "Critical load runway approaching threshold.",
    "Hazard exposure remains elevated."
  ],
  "tradeoffs": [
    "Reassigning crew may delay secondary restoration."
  ],
  "escalationTriggers": [
    "Runtime remaining < 2 hours"
  ],
  "assumptions": [
    "Hazard data current as of timestamp.",
    "No secondary asset failure."
  ],
  "sourceContext": [
    "Event EVT-2026-001",
    "Feeder FDR-33KV-07"
  ]
}`;

const EVENT_FIELDS = [
  { field: 'event_id', type: 'string', desc: 'Unique outage event identifier' },
  { field: 'event_type', type: 'string', desc: 'Storm, Wildfire, Flood' },
  { field: 'feeder_id', type: 'string', desc: 'Primary feeder ID' },
  { field: 'voltage_level', type: 'string', desc: 'Voltage classification' },
  { field: 'affected_customers', type: 'integer', desc: 'Total impacted customers' },
  { field: 'downstream_feeders', type: 'array', desc: 'Feeder hierarchy reference' },
  { field: 'has_critical_load', type: 'boolean', desc: 'Critical infrastructure presence' },
  { field: 'etr_earliest', type: 'datetime', desc: 'Earliest restoration estimate' },
  { field: 'etr_latest', type: 'datetime', desc: 'Latest restoration estimate' },
  { field: 'etr_confidence', type: 'enum', desc: 'High, Medium, Low' },
  { field: 'hazard_exposure_score', type: 'integer', desc: '0–100 exposure index' },
];

export default function ApiDataSchema() {
  const [activeSection, setActiveSection] = useState('purpose');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] gap-0">
      {/* Sticky TOC */}
      <aside className="hidden xl:flex w-56 flex-shrink-0 flex-col border-r border-border/30 bg-card/30 px-3 py-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <span className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Contents</span>
        <nav className="space-y-0.5">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors',
              activeSection === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30',
            )}>
              <span className="font-mono text-[9px] text-muted-foreground/40 w-4">{s.num}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-14 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DocBadge>v1.0.0</DocBadge>
            <DocBadge variant="success">Approved</DocBadge>
            <DocBadge>Demonstration Architecture</DocBadge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/95 mb-1.5">API & Data Schema Specification</h1>
          <p className="text-[13px] text-muted-foreground/70">Operator Copilot — Phase-1 &nbsp;·&nbsp; Owner: Platform Engineering</p>
          <Separator className="mt-5 bg-border/30" />
        </div>

        {/* 1. Purpose */}
        <SectionTitle id="purpose" num="1" title="Purpose" icon={FileText} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">This document defines the data schemas, API interaction contracts, and validation rules for Operator Copilot Phase-1.</p>
        <BulletList icon="check" items={['Event data schema', 'Asset data schema', 'Crew data schema', 'Hazard data schema', 'Advisory output schema', 'API interaction contracts', 'Phase-2 integration alignment']} />
        <InfoCard>Phase-1 uses synthetic structured data. Schemas are designed to be forward-compatible with OMS integration.</InfoCard>

        {/* 2. Data Model */}
        <SectionTitle id="data-model" num="2" title="System Data Model Overview" icon={Database} />
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          {[
            { icon: Zap, label: 'Event', desc: 'Outage context & impact' },
            { icon: Layers, label: 'Asset', desc: 'Grid infrastructure' },
            { icon: Users, label: 'Crew', desc: 'Field workforce' },
            { icon: CloudLightning, label: 'Hazard', desc: 'Weather & exposure' },
            { icon: Cpu, label: 'Advisory', desc: 'AI structured output' },
            { icon: BookOpen, label: 'Advisory Log', desc: 'Audit trail' },
          ].map((e) => (
            <Card key={e.label} className="border-border/30 bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><e.icon className="h-4 w-4" /></div>
                <div><p className="text-[12px] font-semibold text-foreground/85">{e.label}</p><p className="text-[10px] text-muted-foreground/60">{e.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 3. Event Schema */}
        <SectionTitle id="event-schema" num="3" title="Event Schema" icon={Zap} />
        <JsonBlock title="Event Object" json={EVENT_JSON} />
        <h4 className="text-[12px] font-semibold text-foreground/80 mt-5 mb-1">Field Definitions</h4>
        <FieldTable fields={EVENT_FIELDS} />

        {/* 4. Crew Schema */}
        <SectionTitle id="crew-schema" num="4" title="Crew Schema" icon={Users} />
        <JsonBlock title="Crew Object" json={CREW_JSON} />

        {/* 5. Asset Schema */}
        <SectionTitle id="asset-schema" num="5" title="Asset Schema" icon={Layers} />
        <JsonBlock title="Asset Object" json={ASSET_JSON} />

        {/* 6. Hazard Schema */}
        <SectionTitle id="hazard-schema" num="6" title="Hazard Schema" icon={CloudLightning} />
        <JsonBlock title="Hazard Object" json={HAZARD_JSON} />

        {/* 7. Advisory Output Schema */}
        <SectionTitle id="advisory-schema" num="7" title="Advisory Output Schema (Strict Contract)" icon={Code2} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">All LLM outputs must match this strict structured schema:</p>
        <JsonBlock title="Advisory Output" json={ADVISORY_JSON} />
        <h4 className="text-[12px] font-semibold text-foreground/80 mt-5 mb-2">Validation Rules</h4>
        <BulletList icon="check" items={['Must be valid JSON', 'All top-level keys required', 'No additional uncontrolled fields']} />
        <InfoCard variant="destructive">If schema invalid → response is rejected. No free-form responses are allowed.</InfoCard>

        {/* 8. API Contracts */}
        <SectionTitle id="api-contracts" num="8" title="API Interaction Contracts" icon={Server} />
        <div className="space-y-4 mt-3">
          {[
            { method: 'POST', path: '/api/generate-advisory', desc: 'Advisory Generation', req: '{ "event_id": "EVT-2026-001" }', res: 'Advisory Output Schema (Section 7)' },
            { method: 'POST', path: '/api/evaluate-rules', desc: 'Rule Evaluation', req: '{ "event_context": { ... } }', res: '{ "rules_passed": true, "blocked_conditions": [] }' },
            { method: 'GET', path: '/api/advisory-log/{event_id}', desc: 'Advisory Log', req: 'Path parameter: event_id', res: 'Structured audit history array' },
          ].map((api) => (
            <Card key={api.path} className="border-border/30 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn('text-[9px] font-bold', api.method === 'POST' ? 'border-warning/30 text-warning' : 'border-success/30 text-success')}>{api.method}</Badge>
                  <code className="text-[11px] font-mono text-primary/80">{api.path}</code>
                </div>
                <p className="text-[12px] text-muted-foreground/70 mb-2">{api.desc}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded border border-border/20 p-2.5 bg-muted/10">
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground/50 tracking-wider">Request</span>
                    <pre className="text-[10px] font-mono text-muted-foreground mt-1">{api.req}</pre>
                  </div>
                  <div className="rounded border border-border/20 p-2.5 bg-muted/10">
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground/50 tracking-wider">Response</span>
                    <pre className="text-[10px] font-mono text-muted-foreground mt-1 whitespace-pre-wrap">{api.res}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 9. Context Completeness */}
        <SectionTitle id="context-logic" num="9" title="Context Completeness Logic" icon={CheckCircle2} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Context integrity score derived from:</p>
        <BulletList items={['Hazard presence', 'Crew data availability', 'Asset metadata completeness', 'ETR band presence']} />
        <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-muted/30 text-muted-foreground/70">
              <th className="text-left px-4 py-2 font-medium">Score</th>
              <th className="text-left px-4 py-2 font-medium">Criteria</th>
            </tr></thead>
            <tbody>
              <tr className="border-t border-border/20"><td className="px-4 py-2 font-semibold text-success">High</td><td className="px-4 py-2 text-muted-foreground">4/4 context sources present</td></tr>
              <tr className="border-t border-border/20"><td className="px-4 py-2 font-semibold text-warning">Medium</td><td className="px-4 py-2 text-muted-foreground">3/4 context sources present</td></tr>
              <tr className="border-t border-border/20"><td className="px-4 py-2 font-semibold text-destructive">Low</td><td className="px-4 py-2 text-muted-foreground">&lt;3 context sources present</td></tr>
            </tbody>
          </table>
        </div>

        {/* 10. Versioning */}
        <SectionTitle id="versioning" num="10" title="Versioning Strategy" icon={GitBranch} />
        <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-muted/30 text-muted-foreground/70">
              <th className="text-left px-4 py-2 font-medium">Version</th>
              <th className="text-left px-4 py-2 font-medium">Scope</th>
            </tr></thead>
            <tbody>
              <tr className="border-t border-border/20"><td className="px-4 py-2 font-semibold text-primary">v1.0.0</td><td className="px-4 py-2 text-muted-foreground">Phase-1 demonstration</td></tr>
              <tr className="border-t border-border/20"><td className="px-4 py-2 font-semibold text-primary/60">v2.0.0</td><td className="px-4 py-2 text-muted-foreground">OMS integration extension</td></tr>
            </tbody>
          </table>
        </div>
        <InfoCard>Backward compatibility maintained across versions.</InfoCard>

        {/* 11. Integration */}
        <SectionTitle id="integration" num="11" title="Integration Readiness (Phase-2)" icon={Layers} />
        <BulletList icon="check" items={['OMS feed ingestion', 'GIS feeder topology', 'Real hazard API', 'Historical outage dataset', 'Crew dispatch integration']} />
        <InfoCard>Minimal schema redesign required for Phase-2 integration.</InfoCard>

        {/* 12. Security */}
        <SectionTitle id="security" num="12" title="Security Controls" icon={Shield} />
        <BulletList icon="check" items={['All API calls authenticated via backend', 'No direct LLM invocation from frontend', 'Input validation before rule evaluation', 'JSON schema enforcement on all outputs']} />

        {/* 13. Limitations */}
        <SectionTitle id="limitations" num="13" title="Limitations (Phase-1)" icon={Lock} />
        <BulletList icon="x" items={['No real-time OMS ingestion', 'No telemetry stream', 'No predictive calibration', 'No batch event processing']} />

        {/* 14. Conclusion */}
        <SectionTitle id="conclusion" num="14" title="Conclusion" icon={BookOpen} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">This schema design:</p>
        <BulletList icon="check" items={['Enforces deterministic governance', 'Enables structured AI reasoning', 'Supports forward integration', 'Prevents uncontrolled output']} />
        <InfoCard>It forms the foundation for Phase-2 predictive expansion.</InfoCard>

        {/* Print */}
        <div className="mt-10 flex justify-end">
          <Button variant="outline" size="sm" className="gap-2 text-[12px]" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print / Export
          </Button>
        </div>
      </main>
    </div>
  );
}
