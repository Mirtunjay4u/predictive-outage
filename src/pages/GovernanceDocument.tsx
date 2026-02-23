import {
  FileText, Shield, Cpu, Lock, AlertTriangle, Eye, Activity,
  CheckCircle2, XCircle, Target, Users, Scale, GitBranch,
  Gauge, Printer, ChevronDown, ChevronRight, BookOpen,
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
  { id: 'positioning', label: 'AI System Positioning', num: '2' },
  { id: 'governance-arch', label: 'Governance Architecture', num: '3' },
  { id: 'rule-precedence', label: 'Rule Precedence Model', num: '4' },
  { id: 'advisory-boundary', label: 'Advisory-Only Boundary', num: '5' },
  { id: 'output-contract', label: 'Structured Output Contract', num: '6' },
  { id: 'assumptions', label: 'Assumption Disclosure', num: '7' },
  { id: 'context-scoring', label: 'Context Completeness', num: '8' },
  { id: 'invocation', label: 'Model Invocation Controls', num: '9' },
  { id: 'failure', label: 'Failure Mode Handling', num: '10' },
  { id: 'human-oversight', label: 'Human Oversight Model', num: '11' },
  { id: 'audit', label: 'Audit & Traceability', num: '12' },
  { id: 'ethical', label: 'Ethical Safeguards', num: '13' },
  { id: 'phase2', label: 'Phase-2 Enhancements', num: '14' },
  { id: 'compliance', label: 'Compliance Alignment', num: '15' },
  { id: 'conclusion', label: 'Conclusion', num: '16' },
];

/* ── Reusable ── */
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
  const iconColor = icon === 'check' ? 'text-success/70' : icon === 'x' ? 'text-destructive/60' : '';
  return (
    <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted-foreground/80">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          {IconEl ? (
            <IconEl className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', iconColor)} />
          ) : (
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/40" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('border-border/30 bg-card/50', className)}>
      <CardContent className="p-4">
        {title && <h4 className="text-[12px] font-semibold text-foreground/80 mb-2">{title}</h4>}
        {children}
      </CardContent>
    </Card>
  );
}

function Callout({ children, variant = 'warning' }: { children: React.ReactNode; variant?: 'warning' | 'destructive' | 'success' }) {
  const styles = {
    warning: 'text-warning/80 bg-warning/5 border-warning/15',
    destructive: 'text-destructive/70 bg-destructive/5 border-destructive/15',
    success: 'text-success/80 bg-success/5 border-success/15',
  };
  return (
    <p className={cn('text-[11px] font-medium border rounded-md px-3 py-2', styles[variant])}>
      {children}
    </p>
  );
}

function NavItem({ id, num, label }: { id: string; num: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
    >
      <span className="font-mono text-[10px] text-muted-foreground/40 w-4">{num}</span>
      {label}
    </a>
  );
}

function FlowStep({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{num}</div>
      <span className="text-[11.5px] text-muted-foreground/80">{label}</span>
    </div>
  );
}

/* ── Main ── */
export default function GovernanceDocument() {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
          <Shield className="h-3 w-3" />
          AI Governance Document
        </div>
        <h1 className="text-[1.5rem] font-bold tracking-tight text-foreground">
          AI Governance & Control Model
        </h1>
        <p className="mt-1 text-[14px] text-primary/70 font-medium">
          Operator Copilot – Phase-1
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DocBadge>v1.0.0</DocBadge>
          <DocBadge variant="success">Approved</DocBadge>
          <DocBadge>Demonstration Architecture</DocBadge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground/60">
          <span><strong className="text-foreground/70">Owner:</strong> AI Governance Lead</span>
          <span><strong className="text-foreground/70">Status:</strong> Approved</span>
          <span><strong className="text-foreground/70">Release:</strong> Stable</span>
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => window.print()}>
            <Printer className="h-3 w-3" /> Print / PDF
          </Button>
        </div>
      </div>

      <Separator className="bg-border/30 mb-6" />

      <div className="flex gap-8">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <button
              onClick={() => setNavOpen(v => !v)}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2"
            >
              {navOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Contents
            </button>
            {navOpen && SECTIONS.map(s => (
              <NavItem key={s.id} id={s.id} num={s.num} label={s.label} />
            ))}
          </div>
        </aside>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-2">

          {/* 1. Purpose */}
          <SectionTitle id="purpose" num="1" title="Purpose" icon={Target} />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground/80">
            This document defines the AI governance framework for Operator Copilot. It establishes the boundaries, controls, and oversight mechanisms that ensure safe, controlled, and auditable AI-assisted decision support within utility outage operations.
          </p>
          <div className="mt-3">
            <BulletList icon="check" items={[
              'Deterministic rule precedence',
              'Advisory-only boundary',
              'Structured output enforcement',
              'Assumption disclosure requirements',
              'Failure handling logic',
              'Human oversight model',
            ]} />
          </div>

          {/* 2. AI System Positioning */}
          <SectionTitle id="positioning" num="2" title="AI System Positioning" icon={Target} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard title="Operator Copilot Is NOT" className="border-destructive/15">
              <BulletList icon="x" items={[
                'An autonomous control system',
                'A switching automation engine',
                'A predictive load simulation platform',
                'A SCADA-integrated controller',
              ]} />
            </InfoCard>
            <InfoCard title="It IS" className="border-success/15">
              <p className="text-[13px] font-semibold text-success/80 mb-2">A rule-gated advisory reasoning system.</p>
              <Callout variant="warning">All outputs are recommendations only.</Callout>
            </InfoCard>
          </div>

          {/* 3. Governance Architecture Overview */}
          <SectionTitle id="governance-arch" num="3" title="Governance Architecture Overview" icon={Cpu} />
          <p className="text-[12px] text-muted-foreground/80 mb-3">
            AI reasoning is embedded within a deterministic orchestration layer.
          </p>
          <Card className="border-border/30 bg-card/40">
            <CardContent className="p-5">
              <h4 className="text-[12px] font-semibold text-foreground/80 mb-3">Governance Sequence</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  'Event context assembled',
                  'Context integrity evaluated',
                  'Deterministic rule engine executed',
                  'Only permitted advisory context passed to LLM',
                  'Structured output validated',
                  'Advisory logged',
                ].map((step, i) => (
                  <FlowStep key={i} num={i + 1} label={step} />
                ))}
              </div>
              <Separator className="my-4 bg-border/20" />
              <Callout variant="destructive">Rules always take precedence over AI reasoning.</Callout>
            </CardContent>
          </Card>

          {/* 4. Deterministic Rule Precedence */}
          <SectionTitle id="rule-precedence" num="4" title="Deterministic Rule Precedence Model" icon={Shield} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard title="4.1 Rule Categories">
              <BulletList items={[
                'Asset Safety Rules',
                'Maintenance Lock Rules',
                'Crew Qualification Rules',
                'Critical Load Escalation Rules',
                'Hazard Escalation Rules',
              ]} />
            </InfoCard>
            <InfoCard title="4.2 Enforcement Principle">
              <Card className="border-warning/20 bg-warning/5 mb-3">
                <CardContent className="p-3">
                  <p className="text-[13px] font-bold text-warning">If any rule blocks a recommendation:</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground/70">The LLM cannot override.</p>
                </CardContent>
              </Card>
              <BulletList icon="x" items={[
                'Removed from candidate options',
                'Flagged as blocked',
                'Explained in output rationale',
              ]} />
            </InfoCard>
          </div>

          {/* 5. Advisory-Only Boundary */}
          <SectionTitle id="advisory-boundary" num="5" title="Advisory-Only Boundary" icon={Lock} />
          <BulletList icon="x" items={[
            'Does not execute switching',
            'Does not issue control commands',
            'Does not alter field device state',
            'Does not dispatch crews automatically',
          ]} />
          <div className="mt-3">
            <Callout variant="warning">Human operator approval is mandatory for any action outside the system.</Callout>
          </div>

          {/* 6. Structured Output Contract */}
          <SectionTitle id="output-contract" num="6" title="Structured Output Contract" icon={FileText} />
          <p className="text-[12px] text-muted-foreground/80 mb-3">All AI outputs must follow a strict structured schema.</p>
          <InfoCard title="Required Output Sections">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {[
                'Mode (Advisory / Escalation / Monitoring)',
                'Executive Summary',
                'Rationale (bullet list)',
                'Trade-offs',
                'Escalation Triggers',
                'Assumptions Used',
                'Source Context',
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[11.5px] text-muted-foreground/80">
                  <CheckCircle2 className="h-3 w-3 text-success/60 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
            <Separator className="my-3 bg-border/20" />
            <Callout variant="destructive">Free-form responses are not allowed. If output fails schema validation: response is rejected.</Callout>
          </InfoCard>

          {/* 7. Assumption Disclosure */}
          <SectionTitle id="assumptions" num="7" title="Assumption Disclosure Policy" icon={Eye} />
          <p className="text-[12px] text-muted-foreground/80 mb-3">Every advisory must explicitly state:</p>
          <BulletList items={[
            'Data assumed current',
            'Hazard feed freshness',
            'Crew availability snapshot status',
            'No secondary failure assumption',
          ]} />
          <div className="mt-3">
            <Callout variant="success">This ensures transparency of reasoning boundaries.</Callout>
          </div>

          {/* 8. Context Completeness */}
          <SectionTitle id="context-scoring" num="8" title="Context Completeness Scoring" icon={Activity} />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { level: 'High', desc: 'All required context present', color: 'border-success/30 bg-success/5', dot: 'bg-success' },
              { level: 'Medium', desc: 'Partial context', color: 'border-warning/30 bg-warning/5', dot: 'bg-warning' },
              { level: 'Low', desc: 'Critical missing data', color: 'border-destructive/30 bg-destructive/5', dot: 'bg-destructive' },
            ].map(ctx => (
              <Card key={ctx.level} className={cn('border', ctx.color)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('h-2 w-2 rounded-full', ctx.dot)} />
                    <span className="text-[12px] font-semibold text-foreground/80">{ctx.level}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">{ctx.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3">
            <Callout variant="warning">If Low: advisory flagged with caution.</Callout>
          </div>

          {/* 9. Model Invocation Controls */}
          <SectionTitle id="invocation" num="9" title="Model Invocation Controls" icon={Cpu} />
          <BulletList icon="check" items={[
            'Backend proxy — no direct LLM access',
            'Environment-secured API keys',
            'No direct frontend invocation',
            'Rate-limit handling',
            'Invocation logging',
          ]} />

          {/* 10. Failure Mode Handling */}
          <SectionTitle id="failure" num="10" title="Failure Mode Handling" icon={AlertTriangle} />
          <BulletList items={[
            'Model timeout',
            'API rate limit',
            'Missing event data',
            'Hazard feed unavailable',
            'Rule misconfiguration',
          ]} />
          <div className="mt-3">
            <Callout variant="success">In all failure cases: system returns structured safe state. No unsafe advisory is shown.</Callout>
          </div>

          {/* 11. Human Oversight Model */}
          <SectionTitle id="human-oversight" num="11" title="Human Oversight Model" icon={Users} />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-[13px] font-semibold text-foreground/80 mb-3">Operator retains full authority.</p>
              <BulletList icon="check" items={[
                'Manual review of advisory required',
                'Manual approval for SitRep release',
                'Human interpretation of escalation ladder',
              ]} />
              <Separator className="my-3 bg-border/20" />
              <Callout variant="destructive">AI does not override human control.</Callout>
            </CardContent>
          </Card>

          {/* 12. Audit & Traceability */}
          <SectionTitle id="audit" num="12" title="Audit & Traceability" icon={BookOpen} />
          <InfoCard title="Advisory Log Contents">
            <BulletList icon="check" items={[
              'Event ID',
              'Timestamp',
              'Rule evaluation summary',
              'AI invocation ID',
              'Context completeness score',
              'Operator action',
            ]} />
            <p className="mt-3 text-[11px] text-muted-foreground/60 italic">
              Provides operational audit trail.
            </p>
          </InfoCard>

          {/* 13. Ethical Safeguards */}
          <SectionTitle id="ethical" num="13" title="Ethical & Operational Safeguards" icon={Scale} />
          <BulletList icon="check" items={[
            'Avoids operational control',
            'Avoids prescriptive switching',
            'Avoids overconfident predictions',
            'Clearly communicates uncertainty',
          ]} />
          <div className="mt-3">
            <Callout variant="success">This ensures responsible AI application in critical infrastructure.</Callout>
          </div>

          {/* 14. Phase-2 Enhancements */}
          <SectionTitle id="phase2" num="14" title="Phase-2 Governance Enhancements" icon={GitBranch} />
          <InfoCard title="Planned Additions">
            <BulletList items={[
              'Historical backtesting',
              'Performance metrics',
              'Model drift detection',
              'Calibration curves',
              'Security audit hardening',
            ]} />
          </InfoCard>

          {/* 15. Compliance Alignment */}
          <SectionTitle id="compliance" num="15" title="Compliance Alignment" icon={Gauge} />
          <p className="text-[12px] text-muted-foreground/80 mb-3">Phase-1 supports alignment with:</p>
          <BulletList icon="check" items={[
            'Utility operational governance policies',
            'Advisory transparency standards',
            'Critical infrastructure oversight expectations',
          ]} />
          <div className="mt-3">
            <Callout variant="warning">Full regulatory compliance requires Phase-2 validation.</Callout>
          </div>

          {/* 16. Conclusion */}
          <SectionTitle id="conclusion" num="16" title="Governance Conclusion" icon={CheckCircle2} />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-[12.5px] font-medium text-foreground/80 mb-3">Operator Copilot Phase-1:</p>
              <BulletList icon="check" items={[
                'Implements controlled AI reasoning',
                'Within deterministic boundaries',
                'With explicit transparency',
                'And human oversight',
              ]} />
              <Separator className="my-4 bg-border/20" />
              <p className="text-[13px] font-semibold text-primary/80">
                A governed advisory intelligence layer — not autonomous automation.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="pt-8 pb-4 text-center text-[10px] text-muted-foreground/40">
            Operator Copilot · AI Governance & Control Model v1.0.0 · Phase-1 · Decision Support Only
          </div>
        </div>
      </div>
    </div>
  );
}
