import {
  FileText, Shield, ClipboardList, CheckCircle2, XCircle, AlertTriangle,
  Target, Users, Activity, Gauge, Eye, Lock, Printer, BookOpen,
  ArrowRight, Zap, Radio, HardHat,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ── Section nav ── */
const SECTIONS = [
  { id: 'purpose', label: 'Purpose', num: '1' },
  { id: 'scope', label: 'Scope', num: '2' },
  { id: 'preconditions', label: 'Preconditions', num: '3' },
  { id: 'workflow', label: 'Standard Workflow', num: '4' },
  { id: 'escalation', label: 'Escalation Protocol', num: '5' },
  { id: 'context-integrity', label: 'Context Integrity', num: '6' },
  { id: 'failure', label: 'Failure Handling', num: '7' },
  { id: 'safety', label: 'Safety & Compliance', num: '8' },
  { id: 'example', label: 'Example Scenario', num: '9' },
  { id: 'limitations', label: 'Limitations (Phase-1)', num: '10' },
  { id: 'training', label: 'Training Requirements', num: '11' },
  { id: 'revision', label: 'Revision History', num: '12' },
];

/* ── Reusable components ── */
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
  return <div className={cn('rounded-lg border p-4 text-[13px] text-muted-foreground leading-relaxed', border)}>{children}</div>;
}

/* ── Workflow step card ── */
function WorkflowStep({ step, title, icon: Icon, children }: { step: number; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-border/30 bg-card/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">{step}</div>
          <Icon className="h-4 w-4 text-primary/70" strokeWidth={1.6} />
          <h4 className="text-[13px] font-semibold text-foreground/85">{title}</h4>
        </div>
        <div className="pl-10 space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

/* ── Confidence band table ── */
function ConfidenceTable() {
  const rows = [
    { level: 'High', color: 'text-success', desc: 'Stable restoration estimate' },
    { level: 'Medium', color: 'text-warning', desc: 'Moderate uncertainty' },
    { level: 'Low', color: 'text-destructive', desc: 'Elevated uncertainty' },
  ];
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <table className="w-full text-[12px]">
        <thead><tr className="bg-muted/30 text-muted-foreground/70">
          <th className="text-left px-4 py-2 font-medium">Confidence</th>
          <th className="text-left px-4 py-2 font-medium">Interpretation</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.level} className="border-t border-border/20">
              <td className={cn('px-4 py-2 font-semibold', r.color)}>{r.level}</td>
              <td className="px-4 py-2 text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OperatorSOP() {
  const [activeSection, setActiveSection] = useState('purpose');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] gap-0">
      {/* ── Sticky TOC ── */}
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

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-14 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DocBadge>v1.0.0</DocBadge>
            <DocBadge variant="success">Approved</DocBadge>
            <DocBadge>Demonstration Mode</DocBadge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/95 mb-1.5">Operator Standard Operating Procedure</h1>
          <p className="text-[13px] text-muted-foreground/70">Operator Copilot — Phase-1 &nbsp;·&nbsp; Owner: Grid Operations Lead</p>
          <Separator className="mt-5 bg-border/30" />
        </div>

        {/* ── 1. Purpose ── */}
        <SectionTitle id="purpose" num="1" title="Purpose" icon={FileText} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
          This SOP defines the operational procedure for using Operator Copilot during outage events. The system provides structured advisory support to assist in:
        </p>
        <BulletList icon="check" items={['Prioritization', 'Escalation awareness', 'ETR interpretation', 'Hazard correlation', 'Situation reporting']} />
        <InfoCard variant="warning">
          <strong className="text-warning">Important:</strong> The system does NOT execute grid control actions. All outputs are advisory only.
        </InfoCard>

        {/* ── 2. Scope ── */}
        <SectionTitle id="scope" num="2" title="Scope" icon={Target} />
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-success mb-2 uppercase tracking-wider">Applies To</h4>
              <BulletList icon="check" items={['Distribution outage scenarios', 'Multi-event storm conditions', 'Critical load exposure events', 'Hazard-driven outage escalation']} />
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-destructive mb-2 uppercase tracking-wider">Does NOT Authorize</h4>
              <BulletList icon="x" items={['Switching operations', 'Breaker control', 'Field dispatch automation']} />
            </CardContent>
          </Card>
        </div>
        <InfoCard>All operational control remains with the operator.</InfoCard>

        {/* ── 3. Preconditions ── */}
        <SectionTitle id="preconditions" num="3" title="Preconditions" icon={ClipboardList} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Before using Operator Copilot, confirm:</p>
        <BulletList icon="check" items={['Outage event is logged', 'Event context is available', 'Asset status flags are current', 'Hazard overlay is updated']} />
        <InfoCard variant="warning">
          If critical context is missing: Proceed with caution and interpret advisory as partial.
        </InfoCard>

        {/* ── 4. Standard Workflow ── */}
        <SectionTitle id="workflow" num="4" title="Standard Workflow" icon={Activity} />
        <div className="space-y-4">
          <WorkflowStep step={1} title="Access Event" icon={FileText}>
            <p className="text-[13px] text-muted-foreground">Navigate to <strong>Events → Select Active Event</strong>. Review affected customers, feeder context, critical load indicator, and ETR band.</p>
          </WorkflowStep>

          <WorkflowStep step={2} title="Review ETR Confidence Band" icon={Gauge}>
            <p className="text-[13px] text-muted-foreground mb-2">Interpret ETR as: <strong>Earliest – Latest</strong> (confidence level)</p>
            <ConfidenceTable />
            <InfoCard variant="warning">Do not interpret single-point time as absolute.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={3} title="Evaluate Critical Load Runway" icon={Zap}>
            <p className="text-[13px] text-muted-foreground mb-2">If event includes critical loads, review backup runtime remaining and escalation threshold.</p>
            <InfoCard variant="destructive">If remaining runtime &lt; threshold: Escalation advisory must be considered.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={4} title="Review Hazard Correlation" icon={AlertTriangle}>
            <p className="text-[13px] text-muted-foreground mb-2">Navigate to Outage Map. Enable hazard overlays, identify feeder exposure, review exposure index.</p>
            <InfoCard variant="warning">If hazard risk increasing: Escalation priority increases.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={5} title="Execute Copilot Advisory" icon={Radio}>
            <p className="text-[13px] text-muted-foreground mb-2">In Copilot Studio: Select event → Click "Generate Advisory". Review structured output:</p>
            <BulletList items={['Mode', 'Summary', 'Rationale', 'Trade-offs', 'Escalation triggers', 'Assumptions']} />
            <InfoCard variant="destructive"><strong>Do NOT</strong> act solely on summary. Review rationale and assumptions carefully.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={6} title="Validate Rule Enforcement" icon={Shield}>
            <p className="text-[13px] text-muted-foreground mb-2">Check policy block indicators, maintenance lock flags, and crew qualification match.</p>
            <InfoCard variant="warning">If recommendation blocked: Follow rule precedence. Do not override safety flags.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={7} title="Generate Situation Report" icon={FileText}>
            <p className="text-[13px] text-muted-foreground mb-2">Navigate to SitRep: Generate report → Review content → Approve manually.</p>
            <InfoCard>Reports must be reviewed before distribution.</InfoCard>
          </WorkflowStep>

          <WorkflowStep step={8} title="Log Operator Decision" icon={ClipboardList}>
            <p className="text-[13px] text-muted-foreground">Record: Advisory accepted / modified / rejected, and reason for deviation (if applicable). Maintain operational traceability.</p>
          </WorkflowStep>
        </div>

        {/* ── 5. Escalation Protocol ── */}
        <SectionTitle id="escalation" num="5" title="Escalation Protocol" icon={AlertTriangle} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Escalation conditions include:</p>
        <BulletList items={['Critical load runway breach', 'Hazard exposure increase', 'ETR confidence low + high customer impact', 'Crew mismatch with required qualification']} />
        <InfoCard>
          Escalation actions must follow existing utility governance processes. Operator Copilot does not enforce escalation — it signals.
        </InfoCard>

        {/* ── 6. Context Integrity ── */}
        <SectionTitle id="context-integrity" num="6" title="Context Integrity Handling" icon={Eye} />
        <InfoCard variant="warning">
          <p className="mb-2"><strong>If context completeness score = Low:</strong></p>
          <BulletList items={['Verify hazard feed', 'Verify crew availability', 'Verify asset metadata']} />
          <p className="mt-2 font-medium text-warning">Do not treat advisory as final.</p>
        </InfoCard>

        {/* ── 7. Failure Handling ── */}
        <SectionTitle id="failure" num="7" title="Failure Handling" icon={AlertTriangle} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">If AI advisory fails to generate:</p>
        <BulletList items={['Review rule summary', 'Check network connectivity', 'Reattempt invocation', 'Escalate to engineering if persistent']} />
        <InfoCard variant="destructive">Never bypass rule layer.</InfoCard>

        {/* ── 8. Safety & Compliance ── */}
        <SectionTitle id="safety" num="8" title="Safety & Compliance Notice" icon={Shield} />
        <BulletList icon="x" items={['Does not execute grid control', 'Does not dispatch crews', 'Does not replace OMS']} />
        <InfoCard><strong>Human operator retains full responsibility.</strong></InfoCard>

        {/* ── 9. Example Scenario ── */}
        <SectionTitle id="example" num="9" title="Example Use Case Scenario" icon={Zap} />
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-3">Storm Impact — 33kV Feeder</h4>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-muted-foreground mb-4">
              <span>5 downstream feeders affected</span>
              <span>2 hospitals impacted</span>
              <span>14,000 customers</span>
            </div>
            <Separator className="bg-border/30 mb-3" />
            <p className="text-[12px] text-muted-foreground mb-2 font-medium">Operator Copilot assists by:</p>
            <BulletList icon="check" items={['Highlighting critical loads', 'Presenting ETR band', 'Identifying hazard exposure', 'Suggesting structured escalation', 'Drafting compliant communication']} />
            <InfoCard variant="warning" >Final decision remains with operator.</InfoCard>
          </CardContent>
        </Card>

        {/* ── 10. Limitations ── */}
        <SectionTitle id="limitations" num="10" title="Limitations (Phase-1)" icon={Lock} />
        <BulletList icon="x" items={['Perform load flow modeling', 'Integrate live SCADA telemetry', 'Automatically optimize crew dispatch', 'Provide predictive calibration']} />
        <InfoCard>These are Phase-2 enhancements.</InfoCard>

        {/* ── 11. Training ── */}
        <SectionTitle id="training" num="11" title="Training Requirements" icon={HardHat} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Operators must:</p>
        <BulletList icon="check" items={['Understand escalation ladder', 'Understand ETR band interpretation', 'Understand advisory-only nature', 'Understand deterministic rule precedence']} />
        <InfoCard>Training materials available in the Resources section.</InfoCard>

        {/* ── 12. Revision History ── */}
        <SectionTitle id="revision" num="12" title="Revision History" icon={BookOpen} />
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-muted/30 text-muted-foreground/70">
              <th className="text-left px-4 py-2 font-medium">Version</th>
              <th className="text-left px-4 py-2 font-medium">Description</th>
            </tr></thead>
            <tbody>
              <tr className="border-t border-border/20">
                <td className="px-4 py-2 font-semibold text-primary">v1.0.0</td>
                <td className="px-4 py-2 text-muted-foreground">Initial Phase-1 SOP release for GTC demonstration</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print button */}
        <div className="mt-10 flex justify-end">
          <Button variant="outline" size="sm" className="gap-2 text-[12px]" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print / Export
          </Button>
        </div>
      </main>
    </div>
  );
}
