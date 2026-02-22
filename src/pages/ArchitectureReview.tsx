import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, ChevronRight, ArrowLeft, Target, Lock, Brain, Database, Layers, ServerCrash, DollarSign, Zap, Network, Eye, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import tcsLogo from '@/assets/tcs-logo.png';

/* ─── data ─── */

interface ReviewSection {
  number: number;
  icon: React.ElementType;
  title: string;
  challenge: string;
  testing: string;
  answerBlocks: { label: string; items: string[] }[];
  verdict: 'pass' | 'conditional' | 'phase2';
  verdictNote: string;
}

const sections: ReviewSection[] = [
  {
    number: 1, icon: Target, title: 'Problem Definition',
    challenge: '"Why do we need this? OMS already manages outages."',
    testing: 'Are you duplicating OMS functionality?',
    answerBlocks: [
      { label: 'OMS Manages', items: ['Outage logging', 'Ticket routing', 'Crew dispatch', 'Status updates'] },
      { label: 'OMS Does NOT', items: ['Evaluate ETR uncertainty bands', 'Model critical load runway impact', 'Correlate hazard overlays with operational priority', 'Enforce structured policy reasoning', 'Generate governance-compliant advisories'] },
      { label: 'This System', items: ['Decision intelligence overlay — not OMS replacement', 'Solves operator cognitive overload during multi-variable outage scenarios'] },
    ],
    verdict: 'pass', verdictNote: 'Clear overlay positioning. No functional overlap with OMS.',
  },
  {
    number: 2, icon: Shield, title: 'Safety & Control Risk',
    challenge: '"Can this system operate breakers or change switching states?"',
    testing: 'Operational risk liability.',
    answerBlocks: [
      { label: 'Explicit Boundaries', items: ['No SCADA integration', 'No switching automation', 'No breaker control', 'Advisory-only architecture'] },
      { label: 'Deterministic Rule Layer', items: ['Prevents unsafe suggestion under maintenance lock', 'Blocks on missing asset flags', 'Halts on insufficient data'] },
    ],
    verdict: 'pass', verdictNote: 'No operational risk. Advisory-only with deterministic enforcement.',
  },
  {
    number: 3, icon: Brain, title: 'AI Reliability',
    challenge: '"What happens if the model hallucinates?"',
    testing: 'AI trustworthiness.',
    answerBlocks: [
      { label: 'Three Prevention Layers', items: ['1. Deterministic Rule Engine (hard constraints)', '2. Structured Output Schema (no free-form generation)', '3. Assumption Disclosure (transparent reasoning)'] },
      { label: 'Model Cannot Override', items: ['Maintenance lock flags', 'Critical load flags', 'Crew skill mismatch constraints'] },
    ],
    verdict: 'pass', verdictNote: 'AI reasoning occurs only within allowed domain envelope.',
  },
  {
    number: 4, icon: Database, title: 'Data Dependency',
    challenge: '"You don\'t have live integration yet. So what is real here?"',
    testing: 'Credibility.',
    answerBlocks: [
      { label: 'Phase-1 State', items: ['Structured simulation using realistic outage patterns', 'Synthetic data explicitly labeled throughout UI'] },
      { label: 'Architecture Supports', items: ['Dataverse integration', 'OMS feed ingestion', 'GIS integration', 'Hazard feed ingestion'] },
      { label: 'Core Innovation', items: ['Reasoning framework — not data source', 'Value is in decision structuring, not data display'] },
    ],
    verdict: 'conditional', verdictNote: 'Honest and credible. No overclaim on data.',
  },
  {
    number: 5, icon: Layers, title: 'Domain Depth',
    challenge: '"Do you understand feeder hierarchy, voltage tiers, protection coordination?"',
    testing: 'Domain superficiality.',
    answerBlocks: [
      { label: 'Phase-1 Focus', items: ['Decision support under outage prioritization', 'Feeder hierarchy represented contextually for prioritization'] },
      { label: 'Not In Scope', items: ['Load flow modeling', 'Protection relay logic', 'Switching automation', 'Electrical simulation'] },
    ],
    verdict: 'pass', verdictNote: 'Scope discipline maintained. No false depth claims.',
  },
  {
    number: 6, icon: Network, title: 'Enterprise Architecture',
    challenge: '"Where does this sit in our stack?"',
    testing: 'Stack positioning clarity.',
    answerBlocks: [
      { label: 'Positioning', items: ['OMS / ADMS / GIS / Asset Registry → Operator Copilot (Decision Intelligence Layer)', 'Overlay model — not system-of-record replacement', 'Stateless advisory generation'] },
    ],
    verdict: 'pass', verdictNote: 'Correct overlay positioning. No system replacement claims.',
  },
  {
    number: 7, icon: Lock, title: 'Cybersecurity',
    challenge: '"What prevents data leakage via LLM?"',
    testing: 'Data security posture.',
    answerBlocks: [
      { label: 'Current Controls', items: ['Backend proxy via Edge Functions', 'API keys secured server-side', 'No direct frontend LLM exposure', 'Guardrails + structured outputs'] },
      { label: 'Phase-2', items: ['Enterprise isolation possible', 'Full enterprise hardening not yet claimed'] },
    ],
    verdict: 'conditional', verdictNote: 'Adequate for Phase-1. Enterprise isolation deferred to Phase-2.',
  },
  {
    number: 8, icon: ServerCrash, title: 'Performance',
    challenge: '"What happens during a 100-event storm?"',
    testing: 'Scalability readiness.',
    answerBlocks: [
      { label: 'Current State', items: ['Phase-1 is conceptual prototype', 'Not yet stress-tested'] },
      { label: 'Architecture Supports', items: ['Horizontal scaling of Edge Functions', 'Stateless reasoning (no session affinity)', 'Model API scaling via gateway'] },
    ],
    verdict: 'phase2', verdictNote: 'Architecture supports scale. Validation required in Phase-2.',
  },
  {
    number: 9, icon: DollarSign, title: 'ROI Challenge',
    challenge: '"Show tangible operational improvement."',
    testing: 'Business value justification.',
    answerBlocks: [
      { label: 'Reduces', items: ['Operator cognitive overload', 'Escalation ambiguity', 'Unstructured communication drafting', 'Decision inconsistency during stress'] },
      { label: 'Improves', items: ['Structured escalation workflows', 'Critical load prioritization accuracy', 'Governance traceability'] },
    ],
    verdict: 'conditional', verdictNote: 'Measurable in Phase-2 with operational datasets.',
  },
  {
    number: 10, icon: Zap, title: 'Real Problem Solving',
    challenge: '"Walk us through a storm event scenario."',
    testing: 'Does it solve a real problem?',
    answerBlocks: [
      { label: 'Without This System', items: ['Manual cross-reference of hazard map', 'Manual feeder hierarchy identification', 'Manual maintenance flag checks', 'Manual crew availability assessment', 'Manual ETR estimation', 'Cognitive load extremely high'] },
      { label: 'With This System', items: ['Rule engine checks safety constraints', 'Hazard overlay identifies exposed feeders', 'Critical load runway triggers escalation', 'Crew skill mismatch blocks unsafe redeployment', 'Structured SitRep auto-drafted', 'Advisory logged for audit trail'] },
    ],
    verdict: 'pass', verdictNote: 'Real operational assistance. Not cosmetic.',
  },
];

const maturityScores = [
  { label: 'Architecture Clarity', score: '9 / 10' },
  { label: 'Governance Maturity', score: '9.5 / 10' },
  { label: 'Domain Alignment', score: '8.5 / 10' },
  { label: 'AI Innovation Depth', score: '8 / 10' },
  { label: 'Production Readiness', score: '7 / 10' },
];

const weakPoints = [
  'No real load simulation',
  'No real historical backtesting',
  'No real-time OMS ingestion',
  'No quantitative validation metrics yet',
];

const verdictConfig = {
  pass: { label: 'PASS', className: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
  conditional: { label: 'CONDITIONAL', className: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400' },
  phase2: { label: 'PHASE-2', className: 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400' },
};

/* ─── page ─── */

export default function ArchitectureReview() {
  const navigate = useNavigate();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print-only header */}
      <div className="hidden print:flex items-start justify-between border-b-2 border-primary/30 px-[0.6in] pt-[0.4in] pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-black">Hostile Architecture Review — Defense Document</h1>
          <p className="text-[9px] text-gray-500 mt-0.5">
            Operator Copilot · AI-Constrained Decision Intelligence · 10-Section Technical Defense
          </p>
        </div>
        <img src={tcsLogo} alt="TCS" className="h-7 object-contain" />
      </div>

      {/* Screen-only toolbar */}
      <div className="print:hidden border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="sm" onClick={() => { setAllOpen(true); setTimeout(() => window.print(), 300); }} className="gap-2">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Screen-only header */}
      <header className="print:hidden border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Hostile Architecture Review</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                10-Section Technical Defense Simulation · CTO / Grid Ops / Enterprise Architect / Cybersecurity · AI Governance
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] font-semibold tracking-wide">
              SCRUTINY MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6 print:max-w-none print:px-[0.6in] print:py-4 print:space-y-3">

        {/* Controls — screen only */}
        <div className="flex items-center justify-between print:hidden">
          <p className="text-xs text-muted-foreground">Click any section to expand the challenge, defense, and verdict.</p>
          <Button variant="ghost" size="sm" onClick={() => setAllOpen(v => !v)} className="text-xs">
            {allOpen ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>

        {/* Sections */}
        <div className="space-y-3 print:space-y-2">
          {sections.map(s => (
            <SectionCardControlled key={s.number} section={s} forceOpen={allOpen} />
          ))}
        </div>

        <Separator className="print:hidden" />

        {/* Maturity Score */}
        <section className="print:break-before-page">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 print:text-black print:text-[10px] print:mb-2">Architectural Maturity Score</h2>
          <div className="grid gap-3 sm:grid-cols-5 print:grid-cols-5 print:gap-2">
            {maturityScores.map(m => (
              <div key={m.label} className="rounded-lg border border-border/40 bg-card px-3 py-3 text-center print:border-gray-300 print:py-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider print:text-gray-500 print:text-[8px]">{m.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground print:text-black print:text-sm">{m.score}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weak Points */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 print:text-black print:text-[10px] print:mb-2">Acknowledged Weak Points (Phase-2)</h2>
          <div className="grid gap-2 sm:grid-cols-2 print:grid-cols-2">
            {weakPoints.map(w => (
              <div key={w} className="flex items-center gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 print:border-gray-300 print:bg-white print:py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 print:text-gray-600" />
                <span className="text-[13px] text-foreground print:text-black print:text-[10px]">{w}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final Verdict */}
        <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 print:border-gray-300 print:bg-white print:p-3">
          <div className="flex items-center gap-2 mb-3 print:mb-2">
            <Eye className="h-5 w-5 text-emerald-500 print:text-gray-700 print:h-4 print:w-4" />
            <h2 className="text-base font-semibold text-foreground print:text-black print:text-sm">Final Verdict</h2>
          </div>
          <p className="text-[13px] text-foreground/85 leading-relaxed mb-3 print:text-black print:text-[10px] print:mb-2">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 print:text-black">Does this application solve a real problem?</span>{' '}
            Yes — it solves <span className="font-semibold">decision structuring under uncertainty</span>. Not grid control. Not protection coordination. Not network simulation.
          </p>
          <div className="rounded-md border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 space-y-2 print:border-gray-300 print:bg-white print:py-2">
            <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 print:text-black print:text-[9px]">Survives hostile review when:</p>
            <ul className="space-y-1">
              {['No overclaims on capabilities', 'Rule engine emphasized as first layer', 'Advisory-only architecture maintained', 'Overlay positioning — not system replacement', 'Phase-2 boundaries clearly acknowledged'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-foreground/80 print:text-black print:text-[9px]">
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0 print:text-gray-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 rounded-md border border-red-500/15 bg-red-500/5 px-4 py-3 print:border-gray-300 print:bg-white print:py-2 print:mt-2">
            <p className="text-[12px] font-semibold text-red-600 dark:text-red-400 mb-1 print:text-black print:text-[9px]">Fails only if:</p>
            <ul className="space-y-1">
              {['Predictive grid modeling is claimed', 'Operational automation is implied', 'AI capabilities are oversold'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-foreground/80 print:text-black print:text-[9px]">
                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 print:text-gray-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Print footer */}
        <div className="hidden print:flex items-end justify-between border-t-2 border-gray-300 pt-3 mt-4">
          <div>
            <p className="text-[10px] font-semibold text-black">
              "Governed decision intelligence overlay for utility outage operations."
            </p>
            <p className="text-[8px] text-gray-500 mt-1">
              Phase 1: Decision Intelligence · Advisory Only · Human-in-the-Loop · Deterministic Rule Enforcement
            </p>
          </div>
          <p className="text-[7px] text-gray-400">
            Confidential · TCS · {new Date().getFullYear()}
          </p>
        </div>

        {/* Watermark */}
        <p className="text-center text-[10px] text-muted-foreground/40 tracking-wider py-2 print:text-gray-400 print:text-[8px]">
          Conceptual Prototype — Structured Demonstration Environment · Hostile Review Simulation
        </p>

        {/* Actions — screen only */}
        <div className="flex flex-wrap items-center gap-3 pb-8 print:hidden">
          <Button onClick={() => navigate('/executive-validation')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Validation Summary
          </Button>
          <Button variant="outline" onClick={() => navigate('/architecture')} className="gap-2">
            <Network className="h-4 w-4" />
            Architecture
          </Button>
          <Button variant="outline" onClick={() => navigate('/knowledge-policy')} className="gap-2">
            <Shield className="h-4 w-4" />
            Knowledge & Policy
          </Button>
        </div>
      </main>
    </div>
  );
}

/* Controlled wrapper for expand-all */
function SectionCardControlled({ section, forceOpen }: { section: ReviewSection; forceOpen: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = forceOpen || localOpen;
  const vconf = verdictConfig[section.verdict];

  return (
    <Card className="overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
      <button
        onClick={() => setLocalOpen(v => !v)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="pb-2 print:pb-1 print:pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 print:gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary print:h-5 print:w-5 print:text-[9px] print:bg-gray-100 print:text-black">
                {section.number}
              </span>
              <section.icon className="h-4 w-4 text-primary shrink-0 print:h-3 print:w-3 print:text-gray-700" />
              <CardTitle className="text-sm print:text-[11px] print:text-black">{section.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn('text-[10px] font-semibold tracking-wide print:text-[8px]', vconf.className)}>
                {vconf.label}
              </Badge>
              <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform print:hidden', isOpen && 'rotate-90')} />
            </div>
          </div>
          <p className="mt-2 text-[13px] italic text-muted-foreground leading-relaxed pl-[68px] print:text-[9px] print:text-gray-600 print:pl-10 print:mt-1">{section.challenge}</p>
        </CardHeader>
      </button>

      {/* Always show in print, toggle on screen */}
      <div className={cn('print:block', isOpen ? 'block' : 'hidden')}>
        <CardContent className="pt-0 pb-4 space-y-4 print:pb-2 print:space-y-1">
          <div className="pl-[68px] print:pl-10">
            <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-3 print:text-[8px] print:text-gray-500 print:mb-1">
              What They're Testing: <span className="text-foreground/80 normal-case print:text-black">{section.testing}</span>
            </p>
            <div className="space-y-3 print:space-y-1">
              {section.answerBlocks.map(block => (
                <div key={block.label}>
                  <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider mb-1.5 print:text-[8px] print:text-gray-700 print:mb-0.5">{block.label}</p>
                  <ul className="space-y-1 print:space-y-0">
                    {block.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85 leading-relaxed print:text-[9px] print:text-black print:leading-tight print:gap-1">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/30 print:bg-gray-400 print:mt-1 print:h-1 print:w-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 print:mt-1 print:border-gray-300 print:bg-white print:px-2 print:py-1">
              <p className="text-[12px] font-medium text-primary/90 leading-relaxed print:text-[9px] print:text-black">
                <span className="font-semibold">Verdict:</span> {section.verdictNote}
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
