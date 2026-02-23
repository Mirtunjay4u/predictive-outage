import { useState } from 'react';
import { 
  FileText, Shield, Cpu, Layers, ArrowRight, Lock, AlertTriangle,
  Server, Database, Eye, Activity, GitBranch, Gauge, Target,
  CheckCircle2, XCircle, ChevronDown, ChevronRight, Printer,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ── Section navigation items ── */
const SECTIONS = [
  { id: 'executive', label: 'Executive Overview', num: '1' },
  { id: 'scope', label: 'Scope & Boundaries', num: '2' },
  { id: 'logical', label: 'Logical Architecture', num: '3' },
  { id: 'lifecycle', label: 'Request Lifecycle', num: '4' },
  { id: 'rules', label: 'Rule Engine', num: '5' },
  { id: 'ai', label: 'AI Invocation Layer', num: '6' },
  { id: 'data', label: 'Data Model', num: '7' },
  { id: 'context', label: 'Context Completeness', num: '8' },
  { id: 'security', label: 'Security Architecture', num: '9' },
  { id: 'failure', label: 'Failure Modes', num: '10' },
  { id: 'scalability', label: 'Scalability', num: '11' },
  { id: 'observability', label: 'Observability & Logging', num: '12' },
  { id: 'roadmap', label: 'Integration Roadmap', num: '13' },
  { id: 'nfr', label: 'Non-Functional Requirements', num: '14' },
  { id: 'positioning', label: 'Architectural Positioning', num: '15' },
  { id: 'conclusion', label: 'Conclusion', num: '16' },
];

/* ── Reusable Components ── */
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-semibold text-foreground/80 mb-2">{title}</h3>
      {children}
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

function FlowStep({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {num}
      </div>
      <span className="text-[11.5px] text-muted-foreground/80">{label}</span>
    </div>
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-md border border-border/30 bg-muted/30 p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto">
      {children}
    </pre>
  );
}

/* ── Collapsible nav ── */
function NavItem({ id, num, label, active }: { id: string; num: string; label: string; active: boolean }) {
  return (
    <a
      href={`#${id}`}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30',
      )}
    >
      <span className="font-mono text-[10px] text-muted-foreground/40 w-4">{num}</span>
      {label}
    </a>
  );
}

/* ── Main Component ── */
export default function ArchitectureDocument() {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Document Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 mb-3">
          <FileText className="h-3 w-3" />
          System Architecture Document
        </div>
        <h1 className="text-[1.5rem] font-bold tracking-tight text-foreground">
          Operator Copilot – Predictive Outage Management
        </h1>
        <p className="mt-1 text-[14px] text-primary/70 font-medium">
          Phase-1: Decision Intelligence Overlay
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DocBadge>v1.0.0</DocBadge>
          <DocBadge variant="success">Stable</DocBadge>
          <DocBadge>Architecture Freeze</DocBadge>
          <DocBadge>GTC Demonstration</DocBadge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground/60">
          <span><strong className="text-foreground/70">Owner:</strong> Solution Architect</span>
          <span><strong className="text-foreground/70">Status:</strong> Approved</span>
          <span><strong className="text-foreground/70">Release:</strong> Stable</span>
        </div>

        <div className="mt-4 flex gap-2">
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
              <NavItem key={s.id} id={s.id} num={s.num} label={s.label} active={false} />
            ))}
          </div>
        </aside>

        {/* Document Body */}
        <div className="min-w-0 flex-1 space-y-2">

          {/* 1. Executive Technical Overview */}
          <SectionTitle id="executive" num="1" title="Executive Technical Overview" icon={Target} />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground/80">
            Operator Copilot is a deterministic, rule-gated AI advisory system designed to provide structured decision intelligence during utility outage events.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCard title="The System Does NOT">
              <BulletList icon="x" items={[
                'Perform grid control',
                'Execute switching',
                'Simulate load flow',
                'Replace OMS or ADMS',
              ]} />
            </InfoCard>
            <InfoCard title="It Operates As">
              <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
                An <strong className="text-foreground/80">advisory decision-intelligence overlay layer</strong> positioned above existing outage systems.
              </p>
              <Separator className="my-3 bg-border/20" />
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                <strong className="text-foreground/70">Primary Objective:</strong> Reduce operator cognitive overload during multi-variable outage scenarios by synthesizing structured context into governed advisory outputs.
              </p>
            </InfoCard>
          </div>

          {/* 2. System Scope & Boundaries */}
          <SectionTitle id="scope" num="2" title="System Scope & Boundaries" icon={Shield} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard title="2.1 In Scope (Phase-1)" className="border-success/15">
              <BulletList icon="check" items={[
                'Event context aggregation',
                'Deterministic rule evaluation',
                'Critical load runway modeling',
                'ETR confidence band presentation',
                'Hazard correlation awareness',
                'Structured advisory generation via NVIDIA Nemotron',
                'Advisory logging',
              ]} />
            </InfoCard>
            <InfoCard title="2.2 Explicitly Out of Scope" className="border-destructive/15">
              <BulletList icon="x" items={[
                'SCADA integration',
                'Breaker switching',
                'Load flow simulation',
                'Protection coordination',
                'Real-time OMS control',
                'Automated dispatch',
              ]} />
              <p className="mt-3 text-[11px] font-medium text-warning/80 bg-warning/5 border border-warning/15 rounded-md px-3 py-2">
                System outputs are advisory-only.
              </p>
            </InfoCard>
          </div>

          {/* 3. Logical Architecture */}
          <SectionTitle id="logical" num="3" title="Logical Architecture Overview" icon={Layers} />
          <SubSection title="3.1 Layered Model">
            <div className="space-y-2">
              {[
                { num: '1', label: 'Presentation Layer', desc: 'Dashboard, Events, Outage Map, Copilot Studio, Analytics, Resources', color: 'bg-primary/10 text-primary' },
                { num: '2', label: 'Orchestration Layer', desc: 'Context assembler, Deterministic rule engine, Invocation controller, Output schema validator, Advisory logger', color: 'bg-accent/10 text-accent' },
                { num: '3', label: 'AI Layer', desc: 'NVIDIA NIM endpoint, Nemotron LLM, Structured reasoning prompts', color: 'bg-warning/10 text-warning' },
                { num: '4', label: 'Data Layer (Phase-1)', desc: 'Synthetic event data, Scenario packs (storm, wildfire, heavy rain), Static hazard overlays', color: 'bg-success/10 text-success' },
                { num: '5', label: 'Observability', desc: 'Invocation logs, Advisory records, Debug mode (internal)', color: 'bg-muted-foreground/10 text-muted-foreground' },
              ].map(layer => (
                <Card key={layer.num} className="border-border/20 bg-card/40">
                  <CardContent className="flex items-start gap-3 p-3">
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold flex-shrink-0', layer.color)}>
                      {layer.num}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-semibold text-foreground/80">{layer.label}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">{layer.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SubSection>

          {/* 4. Request Lifecycle */}
          <SectionTitle id="lifecycle" num="4" title="Request Lifecycle (End-to-End Flow)" icon={ArrowRight} />
          <Card className="border-border/30 bg-card/40">
            <CardContent className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  'Operator selects event',
                  'Event context assembled',
                  'Context completeness evaluated',
                  'Deterministic rules executed',
                  'If rule pass → structured prompt created',
                  'Nemotron invoked via secure backend proxy',
                  'Structured JSON output returned',
                  'Schema validation enforced',
                  'Advisory rendered in UI',
                  'Advisory log entry created',
                ].map((step, i) => (
                  <FlowStep key={i} num={i + 1} label={step} />
                ))}
              </div>
              <p className="mt-4 text-[11px] font-medium text-destructive/70 bg-destructive/5 border border-destructive/15 rounded-md px-3 py-2">
                No output bypasses rule engine.
              </p>
            </CardContent>
          </Card>

          {/* 5. Deterministic Rule Engine */}
          <SectionTitle id="rules" num="5" title="Deterministic Rule Engine" icon={Shield} />
          <p className="text-[12px] text-muted-foreground/80 mb-3">
            The rule engine is executed <strong className="text-foreground/80">before</strong> AI invocation.
          </p>
          <SubSection title="5.1 Rule Categories">
            <BulletList items={[
              'Asset Status Rules',
              'Maintenance Lock Rules',
              'Critical Load Escalation Rules',
              'Crew Qualification Rules',
              'Hazard Escalation Rules',
            ]} />
          </SubSection>
          <SubSection title="5.2 Precedence Model">
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <p className="text-[13px] font-bold text-warning">Rules {'>'} AI</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground/70">If rule blocks: AI suggestion suppressed.</p>
              </CardContent>
            </Card>
          </SubSection>
          <SubSection title="5.3 Example Rule">
            <CodeBlock>{`IF asset.lock_flag = TRUE
THEN prohibit operational recommendation.`}</CodeBlock>
          </SubSection>

          {/* 6. AI Invocation Layer */}
          <SectionTitle id="ai" num="6" title="AI Invocation Layer" icon={Cpu} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard title="6.1 Model Used">
              <p className="text-[12px] text-muted-foreground/80">NVIDIA Nemotron via NIM endpoint.</p>
            </InfoCard>
            <InfoCard title="6.2 Invocation Control">
              <BulletList icon="check" items={[
                'Backend proxy only',
                'API key stored in environment variable',
                'No frontend exposure',
                'Strict structured output contract',
              ]} />
            </InfoCard>
          </div>
          <SubSection title="6.3 Structured Output Schema">
            <CodeBlock>{`Output must include:
  mode
  summary
  rationale[]
  tradeoffs[]
  escalationTriggers[]
  assumptions[]
  sourceContext[]

Free-form responses are not allowed.`}</CodeBlock>
          </SubSection>

          {/* 7. Data Model */}
          <SectionTitle id="data" num="7" title="Data Model Overview" icon={Database} />
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard title="7.1 Event Object">
              <div className="space-y-0.5 font-mono text-[10.5px] text-muted-foreground/70">
                {['event_id', 'feeder_id', 'affected_customers', 'etr_estimate', 'etr_earliest', 'etr_latest', 'etr_confidence', 'has_critical_load', 'backup_runtime_remaining_hours'].map(f => (
                  <div key={f}>{f}</div>
                ))}
              </div>
            </InfoCard>
            <InfoCard title="7.2 Crew Object">
              <div className="space-y-0.5 font-mono text-[10.5px] text-muted-foreground/70">
                {['crew_id', 'qualification', 'availability', 'location'].map(f => (
                  <div key={f}>{f}</div>
                ))}
              </div>
            </InfoCard>
            <InfoCard title="7.3 Hazard Object">
              <div className="space-y-0.5 font-mono text-[10.5px] text-muted-foreground/70">
                {['hazard_type', 'exposure_score', 'timestamp'].map(f => (
                  <div key={f}>{f}</div>
                ))}
              </div>
            </InfoCard>
          </div>

          {/* 8. Context Completeness */}
          <SectionTitle id="context" num="8" title="Context Completeness Scoring" icon={Activity} />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { level: 'High', color: 'border-success/30 bg-success/5', dot: 'bg-success' },
              { level: 'Medium', color: 'border-warning/30 bg-warning/5', dot: 'bg-warning' },
              { level: 'Low', color: 'border-destructive/30 bg-destructive/5', dot: 'bg-destructive' },
            ].map(ctx => (
              <Card key={ctx.level} className={cn('border', ctx.color)}>
                <CardContent className="flex items-center gap-2 p-3">
                  <span className={cn('h-2 w-2 rounded-full', ctx.dot)} />
                  <span className="text-[12px] font-medium text-foreground/80">{ctx.level}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3">
            <BulletList items={[
              'Hazard data present',
              'Crew data present',
              'Asset metadata present',
            ]} />
            <p className="mt-3 text-[11px] text-warning/80 bg-warning/5 border border-warning/15 rounded-md px-3 py-2">
              If critical context missing: advisory flagged accordingly.
            </p>
          </div>

          {/* 9. Security Architecture */}
          <SectionTitle id="security" num="9" title="Security Architecture" icon={Lock} />
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard title="9.1 API Key Security">
              <BulletList items={[
                'Stored as NVAPI_KEY',
                'Backend environment variable',
                'Never exposed to client',
              ]} />
            </InfoCard>
            <InfoCard title="9.2 Advisory-only Safeguard">
              <p className="text-[12px] text-muted-foreground/80">System never triggers external control calls.</p>
            </InfoCard>
            <InfoCard title="9.3 Data Sensitivity">
              <p className="text-[12px] text-muted-foreground/80">Phase-1 uses synthetic data only.</p>
            </InfoCard>
          </div>

          {/* 10. Failure Modes */}
          <SectionTitle id="failure" num="10" title="Failure Modes" icon={AlertTriangle} />
          <BulletList items={[
            'LLM timeout',
            'Rule misconfiguration',
            'Missing context',
            'Hazard feed unavailable',
            'Schema validation failure',
          ]} />
          <p className="mt-3 text-[11px] font-medium text-success/80 bg-success/5 border border-success/15 rounded-md px-3 py-2">
            In all cases: system returns structured safe response.
          </p>

          {/* 11. Scalability */}
          <SectionTitle id="scalability" num="11" title="Scalability Model" icon={Server} />
          <BulletList items={[
            'Edge Functions are stateless — supports horizontal scaling',
            'Phase-1 not stress-tested at high concurrency',
            'Phase-2 includes load benchmarking',
          ]} />

          {/* 12. Observability */}
          <SectionTitle id="observability" num="12" title="Observability & Logging" icon={Eye} />
          <InfoCard title="Advisory Log Records">
            <BulletList icon="check" items={[
              'Event ID',
              'Timestamp',
              'Rule evaluation summary',
              'AI invocation ID',
              'Operator action',
            ]} />
            <p className="mt-3 text-[11px] text-muted-foreground/60 italic">
              Provides audit trail for governance.
            </p>
          </InfoCard>

          {/* 13. Integration Roadmap */}
          <SectionTitle id="roadmap" num="13" title="Integration Roadmap (Phase-2)" icon={GitBranch} />
          <InfoCard title="Planned Integrations">
            <BulletList items={[
              'OMS ingestion',
              'Historical outage datasets',
              'Backtesting validation',
              'Predictive calibration',
              'Drift monitoring',
              'Performance benchmarking',
            ]} />
          </InfoCard>

          {/* 14. Non-Functional Requirements */}
          <SectionTitle id="nfr" num="14" title="Non-Functional Requirements" icon={Gauge} />
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard title="Performance (Phase-1)">
              <p className="text-[12px] text-muted-foreground/80">Advisory response {'<'} 3–5 seconds (network dependent).</p>
            </InfoCard>
            <InfoCard title="Availability">
              <p className="text-[12px] text-muted-foreground/80">Dependent on NVIDIA endpoint availability.</p>
            </InfoCard>
            <InfoCard title="Reliability">
              <p className="text-[12px] text-muted-foreground/80">Structured fallback behavior implemented.</p>
            </InfoCard>
          </div>

          {/* 15. Architectural Positioning */}
          <SectionTitle id="positioning" num="15" title="Architectural Positioning" icon={Target} />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard title="Operator Copilot Is NOT" className="border-destructive/15">
              <BulletList icon="x" items={['OMS', 'ADMS', 'Predictive engine']} />
            </InfoCard>
            <InfoCard title="It IS" className="border-success/15">
              <p className="text-[13px] font-semibold text-success/80">A governed decision-intelligence overlay.</p>
            </InfoCard>
          </div>

          {/* 16. Conclusion */}
          <SectionTitle id="conclusion" num="16" title="Conclusion" icon={CheckCircle2} />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-[12.5px] font-medium text-foreground/80 mb-3">Phase-1 demonstrates:</p>
              <BulletList icon="check" items={[
                'Deterministic constraint enforcement',
                'Structured advisory generation',
                'Domain-aligned escalation modeling',
                'Secure AI orchestration',
              ]} />
              <Separator className="my-4 bg-border/20" />
              <p className="text-[11.5px] text-muted-foreground/70 italic">
                Production hardening requires Phase-2 integration and validation.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="pt-8 pb-4 text-center text-[10px] text-muted-foreground/40">
            Operator Copilot · System Architecture Document v1.0.0 · Phase-1 Architecture Freeze · Conceptual Prototype
          </div>
        </div>
      </div>
    </div>
  );
}
