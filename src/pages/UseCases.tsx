import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Zap, Building2, Users, AlertTriangle, FileText,
  ChevronRight, ChevronDown, BookOpen, X, ArrowRight, CheckCircle2,
  Activity, Eye, Lock, Server, Brain, ClipboardList, Radio,
  Flame, Droplets, CloudLightning as StormIcon, Gauge, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const SECTION_IDS = [
  { id: 'overview', label: 'Overview' },
  { id: 'problems', label: 'Problems' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'differentiators', label: 'Differentiators' },
  { id: 'walkthroughs', label: 'Walkthroughs' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'policy', label: 'Policy' },
];

const PILLS = [
  'Advisory-Only',
  'Human Approval Required',
  'Deterministic Rule Gate',
  'Phase-1 Demo (Synthetic)',
];

const PROBLEMS = [
  {
    icon: StormIcon,
    title: 'Severe Storm Feeder Impact',
    why: 'Escalating outages, uncertain ETR, cascading downstream effects.',
    limitation: 'Manual correlation across weather, events, and constraints.',
  },
  {
    icon: Building2,
    title: 'Critical Infrastructure Continuity',
    why: 'Hospital / water backup runtime threshold breach risk.',
    limitation: 'Critical load runway not visible in a unified view.',
  },
  {
    icon: Users,
    title: 'Crew Constraints Under Escalation',
    why: 'Skill mismatch, dispatch delays, increased safety exposure.',
    limitation: 'Allocation reasoning is manual under stress.',
  },
  {
    icon: Flame,
    title: 'Hazard Zone Correlation (Wildfire / Flood / Storm)',
    why: 'Secondary faults, public safety exposure, access constraints.',
    limitation: 'Hazards and outages are not fused into decision context.',
  },
  {
    icon: FileText,
    title: 'Regulatory / Executive Communication',
    why: 'Inconsistent updates and audit exposure.',
    limitation: 'Drafting updates is slow and not standardized.',
  },
];

const CAPABILITIES = [
  {
    title: 'ETR Confidence Banding',
    outputs: ['Earliest / latest ETR', 'Confidence level', 'Uncertainty drivers'],
    guardrail: 'Advisory-only; no calibrated prediction claims in Phase-1.',
  },
  {
    title: 'Critical Load Runway Monitoring',
    outputs: ['Remaining runtime', 'Escalation threshold flag', 'Continuity notes'],
    guardrail: 'Operator approval required for any escalation messaging.',
  },
  {
    title: 'Deterministic Operational Rule Gate',
    outputs: ['Allowed / blocked advisories', 'Explicit reason codes'],
    guardrail: 'Maintenance / lockout / policy constraints enforced first.',
  },
  {
    title: 'Hazard-Aware Situational Overlay',
    outputs: ['Event-in-hazard visibility', 'Exposure flags', 'Correlated risk notes'],
    guardrail: 'No automated de-energization or switching actions.',
  },
  {
    title: 'Structured Situation Report Generator',
    outputs: ['Operator-approved SitRep', 'Executive summary', 'Customer update draft'],
    guardrail: 'No auto-send without approval.',
  },
];

const COMPARISON_ROWS = [
  ['Manual correlation', 'Structured context synthesis'],
  ['Single-point ETR', 'Confidence band + uncertainty drivers'],
  ['Implicit tribal knowledge', 'Explicit rule enforcement + reason codes'],
  ['Reactive comms drafting', 'Operator-approved standardized drafts'],
  ['Limited explainability', 'Decision trace: inputs → constraints → rationale'],
];

const ARCH_BLOCKS = [
  { label: 'Event Context', icon: Activity },
  { label: 'Retrieval / Context', icon: Server },
  { label: 'Rule Gate (Deterministic)', icon: Lock },
  { label: 'NVIDIA Nemotron Reasoning', icon: Brain },
  { label: 'Structured Output Contract', icon: ClipboardList },
  { label: 'Audit / Observability', icon: Eye },
];

const PHASE1_ITEMS = [
  'Governed decision support (advisory only)',
  'Rule-constrained reasoning + reason codes',
  'ETR confidence banding (non-calibrated demo logic)',
  'Critical load runway indicators',
  'Hazard overlays (weather / wildfire / flood)',
  'Operator-approved comms draft + approval gate',
  'Synthetic scenario playback',
];

const PHASE2_ITEMS = [
  'Historical backtesting + calibration for ETR uncertainty',
  'Predictive feeder risk scoring (validated datasets)',
  'Crew allocation optimization modeling (constraints-based)',
  'Asset health + vegetation / wildfire risk modeling',
  'Enterprise data integration (OMS / asset registry / GIS as permitted)',
  'Observability: drift monitoring + evaluation harness',
  'Governance expansion: policies + approvals + audit workflows',
];

const POLICY_SECTIONS = [
  {
    title: 'Advisory-only boundaries',
    bullets: [
      'System outputs are non-binding recommendations pending operator review.',
      'No switching, breaker, or load-transfer commands are issued.',
      'All advisories carry explicit confidence and uncertainty labels.',
      'Phase-1 outputs reflect synthetic scenario logic, not live telemetry.',
    ],
  },
  {
    title: 'Operator approval checkpoints',
    bullets: [
      'Situation reports require explicit operator sign-off before distribution.',
      'Escalation messaging must pass the approval gate.',
      'Crew dispatch advisories are surfaced but not auto-executed.',
      'Executive summaries are staged for review, never auto-sent.',
    ],
  },
  {
    title: 'Safety escalation triggers',
    bullets: [
      'Downed wires or arcing detected → immediate safety flag.',
      'Critical facility backup runtime < escalation threshold → escalation.',
      'Wildfire proximity within configured radius → hazard flag.',
      'Multiple cascading feeder outages → supervisor escalation.',
    ],
  },
  {
    title: 'Blocked recommendation reasons',
    bullets: [
      'Asset under active maintenance / lockout-tagout.',
      'Policy constraint: manual isolation required before energization.',
      'Crew qualification mismatch for required task.',
      'Regulatory hold on specific feeder or zone.',
      'Insufficient confidence for advisory issuance.',
    ],
  },
  {
    title: 'Synthetic data disclaimer',
    bullets: [
      'All events, assets, and geography are illustrative for demonstration.',
      'No live OMS, SCADA, ADMS, or GIS data is consumed in Phase-1.',
      'ETR calculations use demo logic, not calibrated forecasting models.',
      'Crew and asset records are synthetic and do not reflect operational rosters.',
    ],
  },
];

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'ETR', definition: 'Estimated Time to Restoration — projected time until service is restored.' },
  { term: 'ETR Band', definition: 'Range between earliest and latest ETR expressing restoration uncertainty.' },
  { term: 'Confidence Band', definition: 'Qualitative rating (Low / Medium / High) of ETR estimate reliability.' },
  { term: 'Critical Load', definition: 'Facility with life-safety or essential-service dependency (hospital, water, shelter).' },
  { term: 'Runway', definition: 'Remaining backup power duration before a critical facility loses supply.' },
  { term: 'Escalation Threshold', definition: 'Configured runway limit that triggers operator escalation when breached.' },
  { term: 'Hazard Overlay', definition: 'Map layer fusing weather, wildfire, or flood zones with outage geography.' },
  { term: 'Rule Gate', definition: 'Deterministic filter that constrains AI output before it reaches the operator.' },
  { term: 'Advisory', definition: 'Non-binding recommendation surfaced for operator review and approval.' },
  { term: 'Reason Code', definition: 'Explicit tag explaining why a recommendation was allowed or blocked.' },
  { term: 'Operator Approval', definition: 'Human sign-off required before any advisory is acted upon or distributed.' },
  { term: 'Situational Awareness', definition: 'Unified view of events, assets, crews, hazards, and constraints.' },
];

/* ── Use-case walkthrough data ── */
const USE_CASES = [
  {
    id: 'a',
    label: 'Use Case A: Storm Escalation + Critical Load Runway',
    inputs: {
      Stage: 'During Outage',
      'Event Type': 'Severe Storm',
      'Feeder Impact': 'High',
      'ETR Earliest / Latest': '2.5 h / 4.0 h',
      'ETR Confidence': 'Medium',
      'Critical Load': 'Hospital',
      'Backup Remaining': '1.8 h',
      'Escalation Threshold': '2.0 h',
      'Crew Availability': '1 qualified nearby, 1 delayed',
      Hazards: 'Lightning — high',
    },
    output: {
      mode: 'Escalation Advisory',
      rationale: [
        'Hospital backup runway (1.8 h) is below the escalation threshold (2.0 h).',
        'ETR band (2.5–4.0 h) extends beyond runway — continuity risk is elevated.',
        'Lightning hazard constrains outdoor crew operations.',
      ],
      tradeoffs: [
        'Dispatching the nearby crew reduces ETR but exposes crew to active lightning zone.',
        'Delaying until hazard clears protects crew safety but risks runway breach.',
      ],
      escalation: 'Critical facility runway breach imminent — operator escalation required.',
      assumptions: 'ETR band is based on synthetic demo logic; not calibrated.',
      source: 'Rule gate evaluated: critical-load-runway, hazard-zone-safety.',
    },
    trace: [
      'Inputs: storm severity, feeder load, backup runtime, crew status, hazard flags',
      'Constraints applied: runway < threshold → escalation flag; lightning zone → crew safety hold',
      'Recommendation: escalation advisory with crew-dispatch trade-off',
      'Status: Operator approval required',
    ],
  },
  {
    id: 'b',
    label: 'Use Case B: Wildfire Hazard Overlay + Safety Constraints',
    inputs: {
      Stage: 'Pre-Event / Storm Onset',
      'Event Type': 'Wildfire',
      'Hazard Overlay': 'Red Flag Warning zone',
      'ETR Earliest / Latest': '6 h / 12 h',
      'ETR Confidence': 'Low',
      'Critical Load': 'Water Pumping Station',
      'Backup Remaining': '5.0 h',
      'Escalation Threshold': '4.0 h',
      Constraint: 'Asset under maintenance on one tie option',
      'Crew Availability': 'Limited',
      Hazards: 'Smoke / road closures',
    },
    output: {
      mode: 'Hazard-Constrained Advisory',
      rationale: [
        'Red Flag Warning zone limits crew access and introduces secondary fault risk.',
        'One tie option is blocked by active maintenance / lockout.',
        'Water station runway (5.0 h) is above threshold but ETR band extends to 12 h.',
      ],
      tradeoffs: [
        'Rerouting crew via alternate access adds transit time but avoids smoke exposure.',
        'Requesting maintenance release on the tie asset accelerates restoration but requires coordination.',
      ],
      escalation: 'Monitor runway; if ETR shifts past 5 h, an operator would consider escalation.',
      assumptions: 'Hazard zones are synthetic overlays; no live fire perimeter integration.',
      source: 'Rule gate evaluated: asset-lockout, wildfire-proximity, crew-safety.',
    },
    trace: [
      'Inputs: wildfire zone, maintenance constraint, crew limits, backup runtime',
      'Constraints applied: asset-lockout → tie blocked; wildfire proximity → access restriction',
      'Recommendation: hazard-constrained advisory with alternate routing option',
      'Status: Operator approval required',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   SMALL SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-20" />;
}

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn(
      'relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm',
      'before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:border before:border-primary/[0.06]',
      'hover:border-border/50 transition-colors',
      className,
    )}>
      {children}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function UseCases() {
  const [activeUseCase, setActiveUseCase] = useState<'a' | 'b' | null>(null);
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const mainRef = useRef<HTMLDivElement>(null);

  /* scroll-spy */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    SECTION_IDS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const uc = activeUseCase ? USE_CASES.find((u) => u.id === activeUseCase)! : null;

  return (
    <div className="flex min-h-screen">
      {/* ── Section side-nav ── */}
      <AnimatePresence>
        {sideNavOpen && (
          <motion.nav
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 180, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-0 h-screen shrink-0 border-r border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden"
          >
            <div className="px-3 pt-5 pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Sections</span>
            </div>
            <div className="space-y-0.5 px-2">
              {SECTION_IDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                    activeSection === s.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setSideNavOpen((v) => !v)}
        className="sticky top-4 z-10 -ml-px mt-4 flex h-6 w-5 items-center justify-center rounded-r-md border border-l-0 border-border/40 bg-card text-muted-foreground hover:text-foreground transition-colors"
        aria-label={sideNavOpen ? 'Collapse section nav' : 'Expand section nav'}
      >
        {sideNavOpen ? <ChevronDown className="h-3 w-3 -rotate-90" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {/* ── Main content ── */}
      <div ref={mainRef} className="flex-1 min-w-0 px-6 pb-20 pt-6 space-y-14 max-w-6xl mx-auto">

        {/* ════════════════ 1. HEADER ════════════════ */}
        <section>
          <SectionAnchor id="overview" />
          {/* Watermark */}
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/30 mb-4 text-center">
            Conceptual Prototype — Structured Demonstration Environment
          </p>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Operator Copilot</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Grid Resilience Command Center</h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
              AI-assisted outage awareness, prioritization, and operator-approved communications.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PILLS.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-medium border-primary/20 text-primary/80 bg-primary/[0.04]">
                  {p}
                </Badge>
              ))}
              {/* Glossary trigger — inline with pills */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/40 ml-2">
                    <BookOpen className="h-3.5 w-3.5" /> Glossary
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[360px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-base">Domain Glossary</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-80px)] mt-4 pr-3">
                    <div className="space-y-4">
                      {GLOSSARY.map((g) => (
                        <div key={g.term}>
                          <p className="text-sm font-semibold text-foreground">{g.term}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{g.definition}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground/60 max-w-lg border-l-2 border-amber-500/30 pl-3">
              Decision-support only. No switching execution. No live SCADA / OMS / ADMS integration in Phase-1 demo.
            </p>
          </div>
        </section>

        {/* ════════════════ 2. PROBLEMS + CAPABILITIES ════════════════ */}
        <section>
          <SectionAnchor id="problems" />
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT — Problems */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Operational Reality During High-Risk Outages
              </h2>
              <div className="space-y-3">
                {PROBLEMS.map((p, i) => (
                  <GlowCard key={i}>
                    <CardContent className="p-4 flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
                        <p.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.why}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1 italic">Limitation: {p.limitation}</p>
                      </div>
                    </CardContent>
                  </GlowCard>
                ))}
              </div>
            </div>

            {/* RIGHT — Capabilities */}
            <div>
              <SectionAnchor id="capabilities" />
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                How Operator Copilot Responds (Phase-1 Capabilities)
              </h2>
              <div className="space-y-3">
                {CAPABILITIES.map((c, i) => (
                  <GlowCard key={i}>
                    <CardContent className="p-4">
                      <p className="text-[13px] font-semibold text-foreground mb-1.5">{c.title}</p>
                      <ul className="space-y-1 mb-2">
                        {c.outputs.map((o, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/70" />
                            {o}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 bg-amber-500/[0.06] rounded px-2 py-1">
                        <Lock className="h-3 w-3 shrink-0" />
                        {c.guardrail}
                      </div>
                    </CardContent>
                  </GlowCard>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground/50 italic">
                Phase-1 runs on synthetic demo events and configured rules; outputs are traceable to shown inputs.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════ 3. COMPARISON STRIP ════════════════ */}
        <section>
          <SectionAnchor id="differentiators" />
          <h2 className="text-sm font-semibold text-foreground mb-4">What Makes It Different</h2>
          <GlowCard>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 border-b border-border/30 px-5 py-2.5">
                <span>Traditional OMS Workflow</span>
                <span>Operator Copilot (Phase-1)</span>
              </div>
              {COMPARISON_ROWS.map(([left, right], i) => (
                <div key={i} className={cn(
                  'grid grid-cols-2 px-5 py-3 text-xs',
                  i % 2 === 0 ? 'bg-muted/20' : '',
                  i < COMPARISON_ROWS.length - 1 && 'border-b border-border/20',
                )}>
                  <span className="text-muted-foreground/70">{left}</span>
                  <span className="text-foreground/90 font-medium flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-primary/60 shrink-0" />
                    {right}
                  </span>
                </div>
              ))}
            </CardContent>
          </GlowCard>
        </section>

        {/* ════════════════ 4. ARCHITECTURE TRUST FLOW ════════════════ */}
        <section>
          <SectionAnchor id="architecture" />
          <h2 className="text-sm font-semibold text-foreground mb-4">Architectural Trust Flow</h2>
          <GlowCard>
            <CardContent className="py-6 px-5 overflow-x-auto">
              <div className="flex items-center gap-1 min-w-[640px]">
                {ARCH_BLOCKS.map((b, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-muted/30 px-3 py-3 min-w-[100px] text-center">
                      <b.icon className="h-4 w-4 text-primary/80" />
                      <span className="text-[10px] font-medium text-foreground/80 leading-tight">{b.label}</span>
                    </div>
                    {i < ARCH_BLOCKS.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-1.5 text-xs text-muted-foreground/70">
                <p className="flex items-start gap-2"><Lock className="h-3 w-3 mt-0.5 text-primary/50 shrink-0" /> Rules constrain recommendations before LLM response (domain safety).</p>
                <p className="flex items-start gap-2"><Eye className="h-3 w-3 mt-0.5 text-primary/50 shrink-0" /> Outputs are structured for operator review (no hidden actions).</p>
              </div>
            </CardContent>
          </GlowCard>
        </section>

        {/* ════════════════ 5. USE CASE WALKTHROUGHS ════════════════ */}
        <section>
          <SectionAnchor id="walkthroughs" />
          <h2 className="text-sm font-semibold text-foreground mb-4">Use Case Walkthroughs (Interactive Examples)</h2>

          {/* Selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {USE_CASES.map((u) => (
              <Button
                key={u.id}
                variant={activeUseCase === u.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setActiveUseCase(activeUseCase === u.id ? null : u.id as 'a' | 'b')}
              >
                {u.label}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {uc && (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid lg:grid-cols-3 gap-4"
              >
                {/* Inputs */}
                <GlowCard>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Inputs (Synthetic)</p>
                    <div className="space-y-2">
                      {Object.entries(uc.inputs).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 text-xs">
                          <span className="text-muted-foreground/70 shrink-0">{k}</span>
                          <span className="text-foreground/90 font-medium text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </GlowCard>

                {/* Output */}
                <GlowCard>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Copilot Output (Structured)</p>
                    <Badge variant="outline" className="mb-2 text-[10px] border-primary/30 text-primary/80">{uc.output.mode}</Badge>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <p className="font-medium text-foreground/80 mb-1">Rationale</p>
                        <ul className="space-y-1">
                          {uc.output.rationale.map((r, i) => (
                            <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary/50 mt-0.5">•</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80 mb-1">Trade-offs</p>
                        <ul className="space-y-1">
                          {uc.output.tradeoffs.map((t, i) => (
                            <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                              <span className="text-amber-400/50 mt-0.5">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-destructive/[0.06] rounded px-2 py-1.5 text-destructive/80 text-[11px]">
                        <span className="font-semibold">Escalation:</span> {uc.output.escalation}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 italic">Assumptions: {uc.output.assumptions}</p>
                      <p className="text-[10px] text-muted-foreground/50 italic">Source: {uc.output.source}</p>
                    </div>
                  </CardContent>
                </GlowCard>

                {/* Decision Trace */}
                <GlowCard>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Operator Decision Trace</p>
                    <div className="space-y-3">
                      {uc.trace.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                              i === uc.trace.length - 1
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-primary/10 text-primary/80',
                            )}>
                              {i + 1}
                            </div>
                            {i < uc.trace.length - 1 && <div className="w-px flex-1 bg-border/30 mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {!uc && (
            <div className="rounded-lg border border-dashed border-border/30 py-10 text-center text-xs text-muted-foreground/50">
              Select a use case above to load the interactive walkthrough.
            </div>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground/50 italic">
            Examples are synthetic for demonstration and do not represent live system integrations.
          </p>
        </section>

        {/* ════════════════ 6. ROADMAP ════════════════ */}
        <section>
          <SectionAnchor id="roadmap" />
          <h2 className="text-sm font-semibold text-foreground mb-4">Roadmap: Phase-1 (Today) → Phase-2 (Next)</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Phase 1 */}
            <GlowCard className="border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">Phase-1 • Current</Badge>
                  <span className="text-[10px] text-muted-foreground/50">GTC Demo</span>
                </div>
                <ul className="space-y-2">
                  {PHASE1_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GlowCard>
            {/* Phase 2 */}
            <GlowCard>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Phase-2 • Planned</Badge>
                </div>
                <ul className="space-y-2">
                  {PHASE2_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Radio className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-border/20">
                  <p className="text-[10px] text-amber-400/60 italic">Requires validated operational datasets.</p>
                </div>
              </CardContent>
            </GlowCard>
          </div>
          <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/[0.04] px-4 py-2.5 text-[11px] text-amber-400/80">
            <strong>Phase-1 excludes:</strong> load-flow simulation, switching automation, protection coordination, and real-time SCADA control.
          </div>

          {/* Boundary banner */}
          <div className="mt-3 rounded-md border border-border/20 bg-muted/20 px-4 py-2 text-center text-[10px] text-muted-foreground/50">
            Decision-support layer. No switching automation. No SCADA control.
          </div>
        </section>

        {/* ════════════════ 7. POLICY ════════════════ */}
        <section>
          <SectionAnchor id="policy" />
          <h2 className="text-sm font-semibold text-foreground mb-4">Operational Policy & Safety (Phase-1 Demonstration Rules)</h2>
          <GlowCard>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {POLICY_SECTIONS.map((s, i) => (
                  <AccordionItem key={i} value={`policy-${i}`} className="border-border/20">
                    <AccordionTrigger className="px-5 py-3 text-xs font-semibold text-foreground/80 hover:no-underline">
                      {s.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <ul className="space-y-1.5">
                        {s.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-primary/40 mt-0.5">•</span> {b}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </GlowCard>
        </section>

        {/* ── Global footer disclaimer ── */}
        <Separator className="bg-border/20" />
        <p className="text-[10px] text-center text-muted-foreground/40">
          No SCADA actuation · No breaker control · No autonomous dispatch · Human-in-the-loop only
        </p>
      </div>
    </div>
  );
}
