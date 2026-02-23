import {
  FileText, Shield, Cpu, Target, Users, Layers, Activity, Gauge,
  CheckCircle2, XCircle, AlertTriangle, Lock, Printer, BookOpen,
  Zap, CloudLightning, BarChart3, Server, Eye, GitBranch, Crosshair,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'exec-summary', label: 'Executive Summary', num: '1' },
  { id: 'problem', label: 'Problem Statement', num: '2' },
  { id: 'positioning', label: 'Solution Positioning', num: '3' },
  { id: 'capabilities', label: 'Core Capabilities', num: '4' },
  { id: 'safety', label: 'Safety & Boundaries', num: '5' },
  { id: 'business-value', label: 'Business Value', num: '6' },
  { id: 'tech-stack', label: 'Technology Stack', num: '7' },
  { id: 'maturity', label: 'Phase-1 Maturity', num: '8' },
  { id: 'roadmap', label: 'Phase-2 Roadmap', num: '9' },
  { id: 'risk', label: 'Risk Mitigation', num: '10' },
  { id: 'strategic', label: 'Strategic Positioning', num: '11' },
  { id: 'conclusion', label: 'Executive Conclusion', num: '12' },
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

function CapabilityCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/30 bg-card/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" strokeWidth={1.6} /></div>
          <h4 className="text-[13px] font-semibold text-foreground/85">{title}</h4>
        </div>
        <div className="text-[13px] text-muted-foreground leading-relaxed space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveOverview() {
  const [activeSection, setActiveSection] = useState('exec-summary');

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
            <DocBadge>Executive & Strategy Review</DocBadge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/95 mb-1.5">Executive Operational Overview</h1>
          <p className="text-[13px] text-muted-foreground/70">Operator Copilot — Predictive Outage Management &nbsp;·&nbsp; Phase-1 Demonstration Architecture</p>
          <Separator className="mt-5 bg-border/30" />
        </div>

        {/* 1. Executive Summary */}
        <SectionTitle id="exec-summary" num="1" title="Executive Summary" icon={FileText} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
          Operator Copilot is a governed decision-intelligence overlay designed to assist utility operators during outage events. It enhances operational awareness by:
        </p>
        <BulletList icon="check" items={[
          'Structuring decision reasoning',
          'Highlighting critical load exposure',
          'Presenting ETR uncertainty bands',
          'Correlating hazard data',
          'Enforcing deterministic safety rules',
          'Generating governance-ready situation reports',
        ]} />
        <InfoCard>
          The system does not replace OMS or ADMS. It does not execute switching. It provides <strong>advisory support only</strong>. Phase-1 demonstrates a controlled, scalable framework for AI-assisted outage prioritization.
        </InfoCard>

        {/* 2. Problem Statement */}
        <SectionTitle id="problem" num="2" title="Operational Problem Statement" icon={AlertTriangle} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">During large-scale outages, operators must manually synthesize:</p>
        <BulletList items={[
          'Feeder hierarchy',
          'Customer impact',
          'Critical infrastructure exposure',
          'Crew availability',
          'Weather hazard data',
          'Regulatory communication requirements',
        ]} />
        <InfoCard variant="warning">
          This creates <strong>cognitive overload</strong> under time pressure. Existing systems track data but do not structure reasoning. Operator Copilot addresses this gap.
        </InfoCard>

        {/* 3. Solution Positioning */}
        <SectionTitle id="positioning" num="3" title="Solution Positioning" icon={Layers} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
          Operator Copilot is positioned as a <strong>decision-intelligence overlay layer</strong>. It sits above:
        </p>
        <div className="space-y-1.5 mt-3">
          {['OMS', 'ADMS', 'GIS', 'Asset Registry'].map((sys) => (
            <div key={sys} className="flex items-center gap-2 rounded-md border border-border/20 bg-muted/10 px-4 py-2">
              <Layers className="h-3.5 w-3.5 text-primary/50" />
              <span className="text-[12px] font-medium text-muted-foreground">{sys}</span>
            </div>
          ))}
        </div>
        <InfoCard>It does not replace these systems. It structures reasoning across them.</InfoCard>

        {/* 4. Core Capabilities */}
        <SectionTitle id="capabilities" num="4" title="Core Phase-1 Capabilities" icon={Cpu} />
        <div className="grid gap-4 mt-3">
          <CapabilityCard icon={Shield} title="4.1 — Deterministic Rule Enforcement">
            <p>All AI reasoning is gated by hard operational rules:</p>
            <BulletList items={['Maintenance locks', 'Asset flags', 'Crew qualification checks', 'Escalation thresholds']} />
            <InfoCard><strong>Rules take precedence over AI.</strong></InfoCard>
          </CapabilityCard>

          <CapabilityCard icon={Gauge} title="4.2 — ETR Confidence Band Modeling">
            <p>Instead of single-point estimates, the system presents an <strong>Earliest – Latest</strong> restoration window with a confidence level (High / Medium / Low).</p>
            <InfoCard>This improves uncertainty awareness for operational decisions.</InfoCard>
          </CapabilityCard>

          <CapabilityCard icon={Zap} title="4.3 — Critical Load Runway Awareness">
            <p>For hospitals, water plants, or critical facilities, the system tracks remaining backup runtime and escalation thresholds.</p>
            <InfoCard>Supports structured escalation decisions for critical infrastructure.</InfoCard>
          </CapabilityCard>

          <CapabilityCard icon={CloudLightning} title="4.4 — Hazard Correlation Overlay">
            <p>Storm, wildfire, and heavy rain exposure is correlated to feeder context. Operators can visualize exposure impact on restoration priority.</p>
          </CapabilityCard>

          <CapabilityCard icon={Cpu} title="4.5 — Structured AI Advisory">
            <p>Using NVIDIA Nemotron, the system generates structured outputs including summary, rationale, trade-offs, escalation triggers, and assumptions.</p>
            <InfoCard variant="warning">No free-form output is permitted.</InfoCard>
          </CapabilityCard>

          <CapabilityCard icon={BookOpen} title="4.6 — Governance & Audit Logging">
            <p>Each advisory is logged with rule evaluation summary, invocation ID, and context integrity score.</p>
            <InfoCard>Enables full operational traceability.</InfoCard>
          </CapabilityCard>
        </div>

        {/* 5. Safety */}
        <SectionTitle id="safety" num="5" title="Safety & Boundary Declaration" icon={Shield} />
        <BulletList icon="x" items={[
          'Does not perform load flow modeling',
          'Does not automate switching',
          'Does not dispatch crews',
          'Does not execute SCADA control',
          'Does not override human operators',
        ]} />
        <InfoCard variant="destructive"><strong>It is advisory-only.</strong> Human operator retains full responsibility.</InfoCard>

        {/* 6. Business Value */}
        <SectionTitle id="business-value" num="6" title="Business Value (Phase-1)" icon={BarChart3} />
        <BulletList icon="check" items={[
          'Structured escalation discipline',
          'Reduced cognitive overload',
          'Improved transparency in decision reasoning',
          'Faster preparation of situation reports',
          'Reduced risk of inconsistent decision-making',
        ]} />
        <InfoCard>Quantitative ROI validation is planned in Phase-2.</InfoCard>

        {/* 7. Tech Stack */}
        <SectionTitle id="tech-stack" num="7" title="Technology Stack" icon={Server} />
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { label: 'Edge Orchestration', desc: 'Stateless backend functions' },
            { label: 'NVIDIA NIM', desc: 'Nemotron model inference' },
            { label: 'Rule Engine', desc: 'Deterministic constraint evaluation' },
            { label: 'Schema Enforcement', desc: 'Structured output validation' },
            { label: 'Enterprise UI', desc: 'Dark-mode operational interface' },
          ].map((t) => (
            <Card key={t.label} className="border-border/30 bg-card/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Server className="h-4 w-4 text-primary/50 flex-shrink-0" />
                <div><p className="text-[12px] font-semibold text-foreground/85">{t.label}</p><p className="text-[10px] text-muted-foreground/60">{t.desc}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <InfoCard>Designed for scalability and future integration.</InfoCard>

        {/* 8. Maturity */}
        <SectionTitle id="maturity" num="8" title="Phase-1 Maturity Level" icon={Activity} />
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-success mb-2 uppercase tracking-wider">Current State</h4>
              <p className="text-[13px] text-muted-foreground">Conceptual demonstration of governed AI overlay with deterministic rule enforcement and structured advisory generation.</p>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-warning mb-2 uppercase tracking-wider">Not Yet</h4>
              <BulletList icon="x" items={['Integrated with live OMS', 'Backtested against historical data', 'Load-tested under storm-scale concurrency']} />
            </CardContent>
          </Card>
        </div>

        {/* 9. Roadmap */}
        <SectionTitle id="roadmap" num="9" title="Phase-2 Roadmap Highlights" icon={GitBranch} />
        <BulletList icon="check" items={[
          'OMS data ingestion',
          'Historical outage backtesting',
          'ETR predictive calibration',
          'Model drift monitoring',
          'Performance benchmarking',
          'Enhanced integration governance',
        ]} />
        <InfoCard>Phase-2 transitions from structured advisory framework to <strong>validated predictive augmentation</strong>.</InfoCard>

        {/* 10. Risk */}
        <SectionTitle id="risk" num="10" title="Risk Mitigation" icon={AlertTriangle} />
        <div className="rounded-lg border border-border/30 overflow-hidden mt-3">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-muted/30 text-muted-foreground/70">
              <th className="text-left px-4 py-2 font-medium">Risk</th>
              <th className="text-left px-4 py-2 font-medium">Mitigation</th>
            </tr></thead>
            <tbody>
              {[
                ['AI hallucination', 'Rule precedence enforcement'],
                ['Unsafe automation', 'Advisory-only boundary'],
                ['Data incompleteness', 'Context completeness scoring'],
                ['Security risk', 'Backend-only LLM invocation'],
              ].map(([risk, mitigation]) => (
                <tr key={risk} className="border-t border-border/20">
                  <td className="px-4 py-2 font-medium text-destructive/80">{risk}</td>
                  <td className="px-4 py-2 text-muted-foreground">{mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 11. Strategic */}
        <SectionTitle id="strategic" num="11" title="Strategic Positioning" icon={Crosshair} />
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-destructive mb-2 uppercase tracking-wider">It Is NOT</h4>
              <p className="text-[13px] text-muted-foreground">A generic AI chatbot.</p>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <h4 className="text-[12px] font-semibold text-success mb-2 uppercase tracking-wider">It IS</h4>
              <p className="text-[13px] text-muted-foreground">A governed decision-intelligence layer for outage management. Its innovation lies in <strong>structured reasoning under constraint</strong>.</p>
            </CardContent>
          </Card>
        </div>

        {/* 12. Conclusion */}
        <SectionTitle id="conclusion" num="12" title="Executive Conclusion" icon={BookOpen} />
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">Phase-1 demonstrates:</p>
        <BulletList icon="check" items={[
          'Controlled AI reasoning',
          'Operational alignment',
          'Governance transparency',
          'Clear boundary discipline',
        ]} />
        <InfoCard>
          It establishes a foundation for enterprise-scale AI-assisted outage management. <strong>Phase-2 will validate performance impact and integration maturity.</strong>
        </InfoCard>

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
