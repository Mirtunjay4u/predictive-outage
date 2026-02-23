import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Shield, BarChart3, Search, BookOpen, ExternalLink,
  Download, ChevronDown, ChevronRight, Cpu, Server, Lock,
  ClipboardList, Gauge, Briefcase, CheckCircle2, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ── Document Card ── */
function DocCard({
  icon: Icon,
  title,
  description,
  viewPath,
  downloadable,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  viewPath?: string;
  downloadable?: boolean;
}) {
  return (
    <Card className="group/doc border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/50 hover:shadow-[0_0_12px_hsl(217,70%,50%,0.06)]">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary/70">
            <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold leading-snug text-foreground/90">{title}</h4>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground/80">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {viewPath && (
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium" asChild>
              <a href={viewPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" /> View Online
              </a>
            </Button>
          )}
          {!viewPath && (
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium opacity-60 cursor-default">
              <ExternalLink className="h-3 w-3" /> View Online
            </Button>
          )}
          {downloadable && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
              <Download className="h-3 w-3" /> Download PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Collapsible Governance Panel ── */
function GovernancePanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border/30 bg-card/40 transition-colors hover:border-border/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[12.5px] font-semibold text-foreground/85">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border/20 px-4 py-3">
          <div className="text-[11.5px] leading-relaxed text-muted-foreground/80">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 pt-1">
      <Icon className="h-4 w-4 text-primary/60" strokeWidth={1.6} />
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{title}</h3>
      <div className="h-px flex-1 bg-border/30" />
    </div>
  );
}

/* ── Phase Timeline ── */
function PhaseTimeline() {
  const phases = [
    { label: 'Phase 1', subtitle: 'Decision Intelligence Overlay', status: 'active' as const },
    { label: 'Phase 2', subtitle: 'Predictive Modeling & Validation', status: 'planned' as const },
  ];
  return (
    <div className="flex items-center gap-0">
      {phases.map((phase, i) => (
        <div key={phase.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                phase.status === 'active'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border/50 bg-card text-muted-foreground/60',
              )}
            >
              {phase.status === 'active' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            <div className="text-center">
              <p className={cn('text-[11px] font-semibold', phase.status === 'active' ? 'text-primary' : 'text-muted-foreground/60')}>
                {phase.label}
              </p>
              <p className="max-w-[140px] text-[10px] leading-tight text-muted-foreground/60">{phase.subtitle}</p>
            </div>
          </div>
          {i < phases.length - 1 && (
            <div className="mx-4 mb-6 h-px w-16 bg-gradient-to-r from-primary/40 to-border/30" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function Resources() {
  const navigate = useNavigate();
  const [glossarySearch, setGlossarySearch] = useState('');

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground">
            Resources & Documentation Center
          </h1>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
            Phase-1
          </Badge>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground/70">
          Technical architecture, operational guidance, and governance reference for Operator Copilot.
        </p>
      </div>

      <Separator className="bg-border/30" />

      {/* SECTION 1 — Technical Documentation */}
      <section>
        <SectionHeader icon={Cpu} title="Technical Documentation" />
        <div className="grid gap-3 sm:grid-cols-2">
          <DocCard
            icon={Server}
            title="System Architecture Document"
            description="Logical architecture, component design, data flow, and deployment model."
            downloadable
          />
          <DocCard
            icon={Shield}
            title="AI Governance & Control Model"
            description="Rule engine precedence, advisory boundaries, structured output enforcement, and assumption disclosure framework."
            downloadable
          />
          <DocCard
            icon={FileText}
            title="API & Data Schema Specification"
            description="Event, crew, asset, hazard, and advisory data structures used in Phase-1."
          />
          <DocCard
            icon={Lock}
            title="Deployment & Runtime Guide"
            description="Edge function configuration, NIM integration, environment security model."
          />
        </div>
      </section>

      {/* SECTION 2 — Operational Documentation */}
      <section>
        <SectionHeader icon={ClipboardList} title="Operational & SOP Documentation" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DocCard
            icon={ClipboardList}
            title="Operator Standard Operating Procedure"
            description="Step-by-step usage guide for outage evaluation, escalation handling, and advisory validation."
          />
          <DocCard
            icon={Gauge}
            title="Control Room Quick Reference"
            description="Definitions of KPIs, ETR band interpretation, escalation ladder, context integrity scoring."
          />
          <DocCard
            icon={Briefcase}
            title="Executive Operational Overview"
            description="Phase-1 capability scope, advisory-only boundary, and decision intelligence positioning."
          />
        </div>
      </section>

      {/* SECTION 3 — Advisory Scope & Compliance */}
      <section>
        <SectionHeader icon={Shield} title="Advisory Scope & Compliance" />
        <div className="space-y-2">
          <GovernancePanel title="System Boundary Definition">
            Operator Copilot is a decision intelligence overlay positioned above OMS, ADMS, and GIS systems.
            It does not replace any system of record and operates as a stateless advisory generation layer.
            All outputs require explicit operator review and approval before any operational action is taken.
          </GovernancePanel>
          <GovernancePanel title="What the System Does NOT Do">
            No SCADA integration or actuation. No breaker control or switching automation. No autonomous crew dispatch.
            No load flow modeling or protection coordination. No direct OMS ticket modification. No predictive grid modeling (Phase-1).
          </GovernancePanel>
          <GovernancePanel title="Advisory-Only Notice">
            All insights generated by this system are advisory in nature. They are intended to support
            operator decision-making under uncertainty, not to replace human judgment.
            Deterministic rule engine constraints are enforced before any AI inference output is presented.
          </GovernancePanel>
          <GovernancePanel title="Data Governance & Privacy">
            Phase-1 operates on synthetic and illustrative data. No live SCADA, OMS, or customer PII is ingested.
            API keys are secured via backend proxy. AI model calls are routed through backend edge functions
            with no direct frontend exposure. Enterprise data isolation is planned for Phase-2.
          </GovernancePanel>
        </div>
      </section>

      {/* SECTION 4 — Roadmap */}
      <section>
        <SectionHeader icon={BarChart3} title="Roadmap & Phase Progression" />
        <Card className="border-border/30 bg-card/40 p-6">
          <PhaseTimeline />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold text-primary/80">Phase 1 — Current</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
                Decision intelligence overlay with rule engine, structured advisories, ETR confidence bands,
                critical load runway monitoring, and governance-constrained AI reasoning.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground/60">Phase 2 — Planned</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/50">
                Historical backtesting, calibration curves, probabilistic feeder risk scoring, crew optimization
                under constraints, model drift monitoring, and enterprise integration governance.
                <span className="ml-1 italic">Requires validated operational datasets.</span>
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 5 — Glossary */}
      <section>
        <SectionHeader icon={BookOpen} title="Glossary & Definitions" />
        <Card className="border-border/30 bg-card/40 p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search glossary…"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                className="h-8 pl-8 text-[12px] bg-background/50 border-border/30"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[11px] font-medium"
              onClick={() => navigate('/glossary')}
            >
              <BookOpen className="h-3 w-3" /> Open Full Glossary
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/60">
            Quick access to standardized terminology — ETR Confidence Band, Critical Load Runway, Decision Trace, and more.
          </p>
        </Card>
      </section>

      {/* Footer note */}
      <div className="pt-2 text-center text-[10px] text-muted-foreground/40">
        Conceptual Prototype — Structured Demonstration Environment
      </div>
    </div>
  );
}
