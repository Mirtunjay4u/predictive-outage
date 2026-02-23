import {
  FileText, Shield, CheckCircle2, XCircle, AlertTriangle, Lock, Printer,
  BookOpen, Eye, Scale, Gauge, Activity, GitBranch, Users, Cpu, Server,
  Fingerprint, Crosshair,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'purpose', label: 'Purpose', num: '1' },
  { id: 'classification', label: 'System Classification', num: '2' },
  { id: 'boundary', label: 'Operational Boundary', num: '3' },
  { id: 'governance', label: 'Governance Alignment', num: '4' },
  { id: 'uncertainty', label: 'Uncertainty Management', num: '5' },
  { id: 'audit', label: 'Audit & Traceability', num: '6' },
  { id: 'data-gov', label: 'Data Governance', num: '7' },
  { id: 'ai-risk', label: 'AI Risk Mitigation', num: '8' },
  { id: 'failure', label: 'Failure Handling', num: '9' },
  { id: 'escalation', label: 'Escalation Awareness', num: '10' },
  { id: 'limitations', label: 'Phase-1 Limitations', num: '11' },
  { id: 'alignment', label: 'Regulatory Alignment', num: '12' },
  { id: 'ethical', label: 'Ethical AI Alignment', num: '13' },
  { id: 'risk-assessment', label: 'Risk Assessment', num: '14' },
  { id: 'phase2', label: 'Phase-2 Enhancements', num: '15' },
  { id: 'conclusion', label: 'Conclusion', num: '16' },
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

export default function RegulatoryCompliance() {
  const [activeSection, setActiveSection] = useState('purpose');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] gap-0">
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

      <main className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-14 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DocBadge>v1.0.0</DocBadge>
            <DocBadge variant="success">Approved</DocBadge>
            <DocBadge>Regulatory & Compliance Review</DocBadge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/95 mb-1.5">Regulator & Compliance Alignment</h1>
          <p className="text-[13px] text-muted-foreground/70">Operator Copilot — Predictive Outage Management &nbsp;·&nbsp; Phase-1 Demonstration Architecture</p>
          <Separator className="mt-5 bg-border/30" />
        </div>

        {/* 1 */}
        <SectionTitle id="purpose" num="1" title="Purpose" icon={FileText} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">This document outlines how Operator Copilot aligns with:</p>
        <BulletList icon="check" items={['Utility operational governance expectations', 'Critical infrastructure safeguards', 'Advisory accountability requirements', 'AI transparency principles', 'Risk management best practices']} />
        <InfoCard>Operator Copilot is a decision-support overlay and does not replace or override existing regulated systems.</InfoCard>

        {/* 2 */}
        <SectionTitle id="classification" num="2" title="System Classification" icon={Scale} />
        <Card className="border-primary/20 bg-primary/5 mt-3"><CardContent className="p-4">
          <h4 className="text-[13px] font-semibold text-primary mb-2">Advisory Decision-Intelligence Support Tool</h4>
        </CardContent></Card>
        <div className="mt-3"><BulletList icon="x" items={['A control system', 'A SCADA-integrated platform', 'A switching automation engine', 'A predictive dispatch controller', 'A system-of-record']} /></div>
        <InfoCard>All operational authority remains with licensed operators.</InfoCard>

        {/* 3 */}
        <SectionTitle id="boundary" num="3" title="Operational Boundary Declaration" icon={Shield} />
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <Card className="border-success/20 bg-success/5"><CardContent className="p-4">
            <h4 className="text-[12px] font-semibold text-success mb-2 uppercase tracking-wider">The System Does</h4>
            <BulletList icon="check" items={['Provides structured recommendations', 'Highlights escalation triggers', 'Surfaces uncertainty and assumptions']} />
          </CardContent></Card>
          <Card className="border-destructive/20 bg-destructive/5"><CardContent className="p-4">
            <h4 className="text-[12px] font-semibold text-destructive mb-2 uppercase tracking-wider">The System Does NOT</h4>
            <BulletList icon="x" items={['Execute switching', 'Dispatch field crews', 'Alter device states', 'Modify outage records', 'Interact with protection systems']} />
          </CardContent></Card>
        </div>
        <InfoCard>This boundary ensures no direct impact on grid operations.</InfoCard>

        {/* 4 */}
        <SectionTitle id="governance" num="4" title="Alignment with Utility Governance Principles" icon={Eye} />
        <div className="space-y-4 mt-3">
          <Card className="border-border/30 bg-card/50"><CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-2">4.1 — Human Oversight</h4>
            <p className="text-[13px] text-muted-foreground">All advisories require human review. No autonomous decision-making exists.</p>
            <InfoCard><strong>Operator retains full responsibility.</strong></InfoCard>
          </CardContent></Card>
          <Card className="border-border/30 bg-card/50"><CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-2">4.2 — Deterministic Rule Precedence</h4>
            <p className="text-[13px] text-muted-foreground mb-2">Operational rules override AI reasoning. Examples:</p>
            <BulletList items={['Maintenance lock → blocks advisory', 'Asset flagged → blocks action suggestion', 'Qualification mismatch → flagged']} />
            <InfoCard variant="warning">AI cannot override rule constraints.</InfoCard>
          </CardContent></Card>
          <Card className="border-border/30 bg-card/50"><CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-2">4.3 — Transparency of Reasoning</h4>
            <p className="text-[13px] text-muted-foreground mb-2">Each advisory includes:</p>
            <BulletList icon="check" items={['Summary', 'Rationale', 'Trade-offs', 'Escalation triggers', 'Assumptions']} />
            <InfoCard>This prevents opaque recommendations.</InfoCard>
          </CardContent></Card>
        </div>

        {/* 5 */}
        <SectionTitle id="uncertainty" num="5" title="Uncertainty Management" icon={Gauge} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">The system explicitly presents ETR as a <strong>confidence band</strong> (Earliest–Latest), not a single-point estimate.</p>
        <InfoCard>Context completeness score indicates advisory reliability level. This reduces overconfidence risk.</InfoCard>

        {/* 6 */}
        <SectionTitle id="audit" num="6" title="Audit & Traceability" icon={BookOpen} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Each advisory log records:</p>
        <BulletList icon="check" items={['Event ID', 'Timestamp', 'Rule evaluation summary', 'Invocation ID', 'Context completeness score']} />
        <InfoCard>Enables review of advisory generation process.</InfoCard>

        {/* 7 */}
        <SectionTitle id="data-gov" num="7" title="Data Governance (Phase-1)" icon={Fingerprint} />
        <InfoCard variant="warning">Phase-1 operates on synthetic demonstration data. No live grid telemetry is processed.</InfoCard>
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-3 mb-2">Phase-2 integration will include:</p>
        <BulletList icon="check" items={['Data source validation', 'Access control enforcement', 'Encryption at rest and in transit', 'Identity integration']} />

        {/* 8 */}
        <SectionTitle id="ai-risk" num="8" title="AI Risk Mitigation Controls" icon={AlertTriangle} />
        <div className="space-y-4 mt-3">
          <Card className="border-border/30 bg-card/50"><CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-2">8.1 — Hallucination Mitigation</h4>
            <p className="text-[13px] text-muted-foreground mb-2">Mitigation layers:</p>
            <div className="space-y-1.5">
              {['Deterministic rule engine', 'Structured output contract', 'Assumption disclosure', 'Advisory-only boundary'].map((l, i) => (
                <div key={l} className="flex items-center gap-2 rounded border border-border/20 bg-muted/10 px-3 py-1.5">
                  <span className="text-[10px] font-bold text-primary/60">{i + 1}</span>
                  <span className="text-[12px] text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
            <InfoCard variant="destructive">No free-form or uncontrolled output.</InfoCard>
          </CardContent></Card>
          <Card className="border-border/30 bg-card/50"><CardContent className="p-5">
            <h4 className="text-[13px] font-semibold text-foreground/85 mb-2">8.2 — Model Invocation Control</h4>
            <p className="text-[13px] text-muted-foreground mb-2">LLM accessed via backend proxy:</p>
            <BulletList icon="check" items={['API keys secured', 'No client-side exposure', 'Invocation logged']} />
          </CardContent></Card>
        </div>

        {/* 9 */}
        <SectionTitle id="failure" num="9" title="Failure Handling & Safe States" icon={Lock} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">If model unavailable, context incomplete, or rule conflict detected:</p>
        <InfoCard variant="warning">System returns controlled advisory state. <strong>No unsafe recommendation displayed.</strong></InfoCard>

        {/* 10 */}
        <SectionTitle id="escalation" num="10" title="Escalation & Critical Infrastructure Awareness" icon={Activity} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">System tracks:</p>
        <BulletList items={['Critical load runway', 'Escalation thresholds', 'Hazard exposure index']} />
        <InfoCard>It <strong>signals</strong> escalation — it does not <strong>execute</strong> escalation.</InfoCard>

        {/* 11 */}
        <SectionTitle id="limitations" num="11" title="Phase-1 Limitations" icon={Lock} />
        <BulletList icon="x" items={['Integrate live OMS feeds', 'Process real-time SCADA telemetry', 'Perform load flow modeling', 'Conduct predictive outage modeling', 'Benchmark restoration time improvement']} />
        <InfoCard>These are Phase-2 roadmap items.</InfoCard>

        {/* 12 */}
        <SectionTitle id="alignment" num="12" title="Regulatory Alignment Summary" icon={Shield} />
        <BulletList icon="check" items={['Preserves operator authority', 'Maintains advisory-only posture', 'Enforces deterministic rule precedence', 'Surfaces uncertainty transparently', 'Provides auditable advisory logs', 'Avoids operational automation']} />
        <InfoCard>It supports structured reasoning without altering regulated control systems.</InfoCard>

        {/* 13 */}
        <SectionTitle id="ethical" num="13" title="Ethical & Responsible AI Alignment" icon={Users} />
        <BulletList icon="check" items={['Human-in-the-loop', 'Explainable outputs', 'Bounded autonomy', 'Transparent assumptions', 'Explicit limitations']} />
        <InfoCard>No autonomous decision execution exists.</InfoCard>

        {/* 14 */}
        <SectionTitle id="risk-assessment" num="14" title="Risk Assessment Summary" icon={AlertTriangle} />
        <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-muted/30 text-muted-foreground/70">
              <th className="text-left px-4 py-2 font-medium">Risk</th>
              <th className="text-left px-4 py-2 font-medium">Mitigation</th>
            </tr></thead>
            <tbody>
              {[
                ['AI misinterpretation', 'Structured output enforcement'],
                ['Operator over-reliance', 'Advisory-only boundary'],
                ['Context incompleteness', 'Integrity scoring & flagging'],
                ['Model outage', 'Safe failure state'],
              ].map(([risk, mitigation]) => (
                <tr key={risk} className="border-t border-border/20">
                  <td className="px-4 py-2 font-medium text-destructive/80">{risk}</td>
                  <td className="px-4 py-2 text-muted-foreground">{mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoCard>Residual risk is operationally controlled.</InfoCard>

        {/* 15 */}
        <SectionTitle id="phase2" num="15" title="Phase-2 Compliance Enhancements" icon={GitBranch} />
        <BulletList icon="check" items={['Model validation metrics', 'Historical outage backtesting', 'Drift detection monitoring', 'Security audit certification', 'Integration governance controls']} />

        {/* 16 */}
        <SectionTitle id="conclusion" num="16" title="Conclusion" icon={BookOpen} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Operator Copilot is designed as a <strong>governed, advisory-only decision-intelligence overlay</strong>.</p>
        <BulletList icon="check" items={['Enhances operator reasoning', 'Without interfering with regulated grid control systems', 'Demonstrates structural compliance discipline']} />
        <InfoCard>Further integration will proceed under standard utility governance review.</InfoCard>

        <div className="mt-10 flex justify-end">
          <Button variant="outline" size="sm" className="gap-2 text-[12px]" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print / Export
          </Button>
        </div>
      </main>
    </div>
  );
}
