import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Zap, Building2, Users, AlertTriangle, FileText,
  ChevronRight, ChevronDown, BookOpen, X, ArrowRight, CheckCircle2,
  Activity, Eye, Lock, Server, Brain, ClipboardList, Radio,
  Flame, Droplets, CloudLightning as StormIcon, Gauge, UserCheck,
  Target, Layers, Network, Shield, CircleDot, ChevronUp,
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
  { id: 'pressure', label: 'Decision Pressure' },
  { id: 'differentiation', label: 'Differentiation' },
  { id: 'trust-flow', label: 'Trust Flow' },
  { id: 'cognitive', label: 'Cognitive Load' },
  { id: 'walkthroughs', label: 'Use Cases' },
  { id: 'phases', label: 'Phase Clarity' },
  { id: 'policy', label: 'Policy & Safety' },
];

const PRESSURE_CARDS = [
  {
    icon: StormIcon,
    title: 'Severe Storm Escalation',
    stats: [
      { label: 'Customers affected', value: '14,000' },
      { label: 'ETR uncertainty', value: '±2 hours' },
      { label: 'Cascading feeders', value: '3 dependent' },
    ],
    subtext: 'Manual correlation across weather, crew, and asset context.',
    accent: 'amber',
  },
  {
    icon: Building2,
    title: 'Critical Infrastructure Continuity',
    stats: [
      { label: 'Hospital backup', value: '3 hours' },
      { label: 'Escalation threshold', value: '2 hours' },
      { label: 'Regulatory sensitivity', value: 'High' },
    ],
    subtext: 'Runway monitoring often fragmented across systems.',
    accent: 'destructive',
  },
  {
    icon: Users,
    title: 'Crew Constraints Under Stress',
    stats: [
      { label: 'Qualified crews', value: 'Limited' },
      { label: 'Hazard exposure', value: 'Active' },
      { label: 'Dispatch latency', value: 'Elevated' },
    ],
    subtext: 'Allocation reasoning becomes manual under pressure.',
    accent: 'warning',
  },
  {
    icon: Flame,
    title: 'Hazard Zone Correlation',
    stats: [
      { label: 'Overlay types', value: 'Fire / Flood / Storm' },
      { label: 'Secondary risk', value: 'Asset exposure' },
      { label: 'Public safety', value: 'Elevated' },
    ],
    subtext: 'Hazards and outages rarely fused into structured reasoning.',
    accent: 'destructive',
  },
];

const COMPARISON_ROWS = [
  { left: 'Event Tracking', right: 'Structured Context Synthesis', icon: Activity },
  { left: 'Single-Point ETR', right: 'Confidence Band + Uncertainty Drivers', icon: Gauge },
  { left: 'Manual Escalation Monitoring', right: 'Critical Load Runway + Threshold Alerts', icon: AlertTriangle },
  { left: 'Implicit Tribal Knowledge', right: 'Deterministic Rule Enforcement + Reason Codes', icon: Lock },
  { left: 'Reactive Communication Drafting', right: 'Structured Operator-Approved Situation Reports', icon: FileText },
  { left: 'Limited Explainability', right: 'Decision Trace: Inputs → Constraints → Rationale', icon: Eye },
];

const TRUST_FLOW_STEPS = [
  { label: 'Event Context', icon: Activity, desc: 'Outage data ingestion' },
  { label: 'Constraint Enrichment', icon: Layers, desc: 'Weather, crew, asset overlay' },
  { label: 'Deterministic Rule Gate', icon: Lock, desc: 'Policy constraints enforced' },
  { label: 'NVIDIA Nemotron Reasoning', icon: Brain, desc: 'Structured AI inference' },
  { label: 'Schema-Enforced Output', icon: ClipboardList, desc: 'Typed advisory contract' },
  { label: 'Operator Approval', icon: UserCheck, desc: 'Human sign-off required' },
  { label: 'Audit & Observability', icon: Eye, desc: 'Full decision trace' },
];

const COGNITIVE_LEFT = [
  { icon: StormIcon, label: 'Weather feeds' },
  { icon: Users, label: 'Crew constraints' },
  { icon: Building2, label: 'Critical load status' },
  { icon: AlertTriangle, label: 'Escalation policy' },
  { icon: FileText, label: 'Communication updates' },
];

const COGNITIVE_RIGHT = [
  { icon: Target, label: 'Unified context panel' },
  { icon: Gauge, label: 'Runway tracking' },
  { icon: Flame, label: 'Hazard-aware prioritization' },
  { icon: ClipboardList, label: 'Structured advisory output' },
  { icon: Shield, label: 'Audit-ready draft communications' },
];

const USE_CASES = [
  {
    id: 'a',
    label: 'Use Case A: Storm Escalation — Hospital Backup Threshold Risk',
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
    label: 'Use Case B: Wildfire Exposure — Crew Safety Constraint Conflict',
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

const PHASE1_ITEMS = [
  'Rule-constrained reasoning',
  'ETR confidence banding (non-calibrated demo logic)',
  'Critical load runway indicators',
  'Hazard overlays',
  'Operator-approved communication drafts',
  'Synthetic scenario playback',
];

const PHASE2_ITEMS = [
  'Historical backtesting & ETR calibration',
  'Predictive feeder risk scoring',
  'Crew optimization modeling',
  'Asset health & wildfire risk modeling',
  'Enterprise data integration (OMS/GIS/Asset registry)',
  'Drift monitoring & governance expansion',
];

const POLICY_SECTIONS = [
  {
    title: 'Advisory-Only Boundaries',
    bullets: [
      'System outputs are non-binding recommendations pending operator review.',
      'No switching, breaker, or load-transfer commands are issued.',
      'All advisories carry explicit confidence and uncertainty labels.',
    ],
  },
  {
    title: 'Operator Approval Checkpoints',
    bullets: [
      'Situation reports require explicit operator sign-off before distribution.',
      'Escalation messaging must pass the approval gate.',
      'Crew dispatch advisories are surfaced but not auto-executed.',
    ],
  },
  {
    title: 'Safety Escalation Triggers',
    bullets: [
      'Downed wires or arcing detected → immediate safety flag.',
      'Critical facility backup runtime < escalation threshold → escalation.',
      'Wildfire proximity within configured radius → hazard flag.',
    ],
  },
  {
    title: 'Blocked Recommendation Reason Codes',
    bullets: [
      'Asset under active maintenance / lockout-tagout.',
      'Policy constraint: manual isolation required before energization.',
      'Crew qualification mismatch for required task.',
    ],
  },
  {
    title: 'Synthetic Data Disclosure',
    bullets: [
      'All events, assets, and geography are illustrative for demonstration.',
      'No live OMS, SCADA, ADMS, or GIS data is consumed in Phase-1.',
      'ETR calculations use demo logic, not calibrated forecasting models.',
    ],
  },
];

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'ETR', definition: 'Estimated Time to Restoration — projected time until service is restored.' },
  { term: 'ETR Band', definition: 'Range between earliest and latest ETR expressing restoration uncertainty.' },
  { term: 'Confidence Band', definition: 'Qualitative rating (Low / Medium / High) of ETR estimate reliability.' },
  { term: 'Critical Load', definition: 'Facility with life-safety or essential-service dependency (hospital, water, shelter).' },
  { term: 'Runway', definition: 'Remaining backup power duration before a critical facility loses supply.' },
  { term: 'Rule Gate', definition: 'Deterministic filter that constrains AI output before it reaches the operator.' },
  { term: 'Advisory', definition: 'Non-binding recommendation surfaced for operator review and approval.' },
  { term: 'Reason Code', definition: 'Explicit tag explaining why a recommendation was allowed or blocked.' },
];

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-20" />;
}

function GlowCard({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <Card className={cn(
      'relative overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm',
      'hover:border-border/50 transition-all duration-300',
      glow && 'border-primary/20 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.15)]',
      className,
    )}>
      {children}
    </Card>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold tracking-tight text-foreground mb-1', className)}>{children}</h2>;
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{children}</p>;
}

/* Animated grid background */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-use-cases" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-use-cases)" className="text-primary" />
      </svg>
      {/* Animated gradient sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function UseCases() {
  const [activeUseCase, setActiveUseCase] = useState<'a' | 'b' | null>(null);
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('pressure');

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
            {/* Glossary in sidebar */}
            <div className="px-3 mt-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5 text-xs text-muted-foreground">
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
      <div className="flex-1 min-w-0 px-6 pb-20 pt-6 space-y-16 max-w-6xl mx-auto">

        {/* ════════════════ HEADER ════════════════ */}
        <section className="relative">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/30 mb-4 text-center">
            Conceptual Prototype — Structured Demonstration Environment
          </p>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Operator Copilot</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Use Cases & Differentiation</h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl mx-auto">
              How structured decision intelligence augments traditional outage management under real-world pressure.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {['Advisory-Only', 'Human Approval Required', 'Deterministic Rule Gate', 'Phase-1 Demo'].map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-medium border-primary/20 text-primary/80 bg-primary/[0.04]">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ 1. DECISION PRESSURE ════════════════ */}
        <section className="relative">
          <SectionAnchor id="pressure" />
          <GridBackground />
          <div className="relative">
            <SectionTitle>High-Risk Outage Decision Pressure</SectionTitle>
            <SectionSubtitle>Scenarios that expose the limits of manual correlation during operational stress.</SectionSubtitle>
            <div className="grid sm:grid-cols-2 gap-4">
              {PRESSURE_CARDS.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <GlowCard className={cn(
                    'h-full',
                    card.accent === 'destructive' && 'border-destructive/15 hover:border-destructive/25',
                    card.accent === 'amber' && 'border-warning/15 hover:border-warning/25',
                    card.accent === 'warning' && 'border-warning/15 hover:border-warning/25',
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          card.accent === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
                        )}>
                          <card.icon className="h-4.5 w-4.5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{card.title}</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        {card.stats.map((s, j) => (
                          <div key={j} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{s.label}</span>
                            <span className="font-semibold text-foreground/90 tabular-nums">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 italic border-t border-border/20 pt-3">{card.subtext}</p>
                    </CardContent>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ 2. DIFFERENTIATION GRID ════════════════ */}
        <section>
          <SectionAnchor id="differentiation" />
          <SectionTitle>Where Traditional OMS Stops — Operator Copilot Begins</SectionTitle>
          <SectionSubtitle>Structured augmentation, not replacement.</SectionSubtitle>
          <GlowCard>
            <CardContent className="p-0">
              {/* Headers */}
              <div className="grid grid-cols-[1fr_1fr] border-b border-border/30">
                <div className="px-5 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Traditional OMS / ADMS</span>
                </div>
                <div className="px-5 py-3 bg-gold/[0.04] border-l border-gold/15">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">Operator Copilot (Phase-1 Overlay)</span>
                </div>
              </div>
              {/* Rows */}
              {COMPARISON_ROWS.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'grid grid-cols-[1fr_1fr]',
                    i % 2 === 0 ? 'bg-muted/15' : '',
                    i < COMPARISON_ROWS.length - 1 && 'border-b border-border/15',
                  )}
                >
                  <div className="px-5 py-3 text-xs text-muted-foreground/70 flex items-center gap-2">
                    <row.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    {row.left}
                  </div>
                  <div className="px-5 py-3 text-xs text-foreground/90 font-medium flex items-center gap-2 bg-gold/[0.02] border-l border-gold/10">
                    <ArrowRight className="h-3 w-3 text-gold/60 shrink-0" />
                    {row.right}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </GlowCard>
          {/* Insight statement */}
          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/[0.03] px-5 py-4">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-semibold text-muted-foreground">OMS answers:</span>{' '}
              <span className="italic">"What is happening?"</span>
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed mt-1">
              <span className="font-semibold text-gold">Operator Copilot structures:</span>{' '}
              <span className="italic">"Given constraints, what is the safest reasoning path?"</span>
            </p>
          </div>
        </section>

        {/* ════════════════ 3. TRUST FLOW ════════════════ */}
        <section>
          <SectionAnchor id="trust-flow" />
          <SectionTitle>Decision Intelligence Workflow</SectionTitle>
          <SectionSubtitle>Every advisory passes through deterministic constraints before reaching the operator.</SectionSubtitle>
          <GlowCard>
            <CardContent className="py-8 px-5 overflow-x-auto">
              <div className="flex items-stretch gap-0 min-w-[800px]">
                {TRUST_FLOW_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border px-4 py-4 min-w-[105px] text-center transition-all',
                        i === 2 ? 'border-warning/30 bg-warning/[0.04]'
                          : i === 5 ? 'border-gold/30 bg-gold/[0.04]'
                          : 'border-border/30 bg-muted/20',
                      )}
                    >
                      <step.icon className={cn(
                        'h-5 w-5',
                        i === 2 ? 'text-warning' : i === 5 ? 'text-gold' : 'text-primary/70',
                      )} />
                      <span className="text-[10px] font-semibold text-foreground/80 leading-tight">{step.label}</span>
                      <span className="text-[9px] text-muted-foreground/60 leading-snug">{step.desc}</span>
                    </motion.div>
                    {i < TRUST_FLOW_STEPS.length - 1 && (
                      <div className="flex items-center px-1">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.07 + 0.1 }}
                          className={`h-px w-6 origin-left ${step.label === 'Operator Approval' ? 'bg-gradient-to-r from-gold/40 to-gold/15' : 'bg-gradient-to-r from-primary/30 to-primary/10'}`}
                        />
                        <ChevronRight className={`h-3 w-3 -ml-0.5 ${step.label === 'Operator Approval' ? 'text-gold/40' : 'text-primary/30'}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Compliance notes */}
              <div className="mt-6 flex flex-wrap gap-6 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-primary/50" />
                  Rules constrain reasoning before model response
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-primary/50" />
                  No autonomous switching or dispatch actions
                </span>
              </div>
            </CardContent>
          </GlowCard>
        </section>

        {/* ════════════════ 4. COGNITIVE LOAD ════════════════ */}
        <section>
          <SectionAnchor id="cognitive" />
          <SectionTitle>From Cognitive Overload to Structured Decision Discipline</SectionTitle>
          <SectionSubtitle>Reducing manual correlation burden during high-risk events.</SectionSubtitle>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Left — manual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlowCard className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Manual Correlation Required</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">During high-risk events, operators must manually correlate:</p>
                  <div className="space-y-3">
                    {COGNITIVE_LEFT.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground/80">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground/60">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlowCard>
            </motion.div>
            {/* Right — copilot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlowCard className="h-full" glow>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/60">Operator Copilot Synthesizes</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Structured context delivered as a unified advisory surface:</p>
                  <div className="space-y-3">
                    {COGNITIVE_RIGHT.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-foreground/80 font-medium">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary/70">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlowCard>
            </motion.div>
          </div>
        </section>

        {/* ════════════════ 5. USE CASE WALKTHROUGHS ════════════════ */}
        <section>
          <SectionAnchor id="walkthroughs" />
          <SectionTitle>Interactive Use Cases</SectionTitle>
          <SectionSubtitle>Interactive walkthrough demonstrates structured advisory logic under constraints.</SectionSubtitle>

          {/* Selector */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            {USE_CASES.map((u) => (
              <Button
                key={u.id}
                variant={activeUseCase === u.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs justify-start"
                onClick={() => setActiveUseCase(activeUseCase === u.id ? null : u.id as 'a' | 'b')}
              >
                <Zap className="h-3.5 w-3.5 mr-1.5 shrink-0" />
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
                          <span className="text-foreground/90 font-medium text-right tabular-nums">{v}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </GlowCard>

                {/* Output */}
                <GlowCard>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Advisory Output (Structured)</p>
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
                              <span className="text-warning/50 mt-0.5">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-destructive/[0.06] rounded px-2 py-1.5 text-destructive/80 text-[11px]">
                        <span className="font-semibold">Escalation:</span> {uc.output.escalation}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 italic">Assumptions: {uc.output.assumptions}</p>
                    </div>
                  </CardContent>
                </GlowCard>

                {/* Decision Trace */}
                <GlowCard>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Decision Trace</p>
                    <div className="space-y-3">
                      {uc.trace.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                              i === uc.trace.length - 1
                                ? 'bg-warning/20 text-warning'
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

          <p className="mt-3 text-[10px] text-muted-foreground/50 italic text-center">
            Synthetic demo data — does not represent live system integrations.
          </p>
        </section>

        {/* ════════════════ 6. PHASE CLARITY ════════════════ */}
        <section>
          <SectionAnchor id="phases" />
          <SectionTitle>Phase-1 vs Phase-2 Clarity</SectionTitle>
          <SectionSubtitle>Clear boundary between current advisory capabilities and future predictive intelligence.</SectionSubtitle>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Phase 1 */}
            <GlowCard className="border-primary/20" glow>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="text-[10px] bg-gold/20 text-gold border-gold/30 hover:bg-gold/20">Phase-1</Badge>
                  <span className="text-xs font-semibold text-foreground/80">Governed Advisory Intelligence</span>
                </div>
                <ul className="space-y-2.5">
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
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Phase-2</Badge>
                  <span className="text-xs font-semibold text-foreground/80">Validated Predictive Intelligence</span>
                </div>
                <ul className="space-y-2.5">
                  {PHASE2_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CircleDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GlowCard>
          </div>
          {/* Exclusion band */}
          <div className="mt-4 rounded-md border border-warning/20 bg-warning/[0.04] px-4 py-2.5 text-[11px] text-warning/80">
            <strong>Phase-1 excludes:</strong> load-flow simulation, switching automation, protection coordination, and real-time SCADA control.
          </div>
        </section>

        {/* ════════════════ 7. POLICY & SAFETY ════════════════ */}
        <section>
          <SectionAnchor id="policy" />
          <SectionTitle>Operational Safety & Policy</SectionTitle>
          <SectionSubtitle>Expandable governance panels documenting operational boundaries.</SectionSubtitle>
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

        {/* ── Footer ── */}
        <Separator className="bg-border/20" />
        <p className="text-[10px] text-center text-muted-foreground/40">
          No SCADA actuation · No breaker control · No autonomous dispatch · Human-in-the-loop only
        </p>
      </div>
    </div>
  );
}
