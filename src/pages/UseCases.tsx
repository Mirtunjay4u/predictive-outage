import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck, Zap, Building2, Users, AlertTriangle, FileText,
  ChevronRight, ChevronDown, BookOpen, X, ArrowRight, CheckCircle2,
  Activity, Eye, Lock, Server, Brain, ClipboardList, Radio,
  Flame, Droplets, CloudLightning as StormIcon, Gauge, UserCheck,
  Target, Layers, Network, Shield, CircleDot, ChevronUp,
  Shrink, BarChart3, FileSearch, Fingerprint, Snowflake, TreePine,
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
  { id: 'impact', label: 'Impact' },
  { id: 'pressure', label: 'Decision Pressure' },
  { id: 'pillars', label: 'Differentiation' },
  { id: 'hero-flow', label: 'Decision Flow' },
  { id: 'differentiation', label: 'OMS vs Copilot' },
  { id: 'trust-flow', label: 'Trust Flow' },
  { id: 'cognitive', label: 'Cognitive Load' },
  { id: 'walkthroughs', label: 'Use Cases' },
  { id: 'phases', label: 'Phase Clarity' },
  { id: 'policy', label: 'Policy & Safety' },
];

const IMPACT_METRICS = [
  {
    icon: Shrink,
    label: 'Context Compression',
    value: '5–7 → 1',
    detail: '5–7 manual context streams compressed into 1 governed advisory surface',
    accent: 'primary' as const,
  },
  {
    icon: BarChart3,
    label: 'ETR Clarity',
    value: 'Band + Confidence',
    detail: 'Earliest/latest + confidence + drivers. Phase-1 demo logic; Phase-2 calibrated.',
    accent: 'gold' as const,
  },
  {
    icon: Shield,
    label: 'Safety Enforcement',
    value: 'Pre-Model',
    detail: 'Deterministic constraints enforced before model response — never after.',
    accent: 'accent' as const,
  },
  {
    icon: Fingerprint,
    label: 'Audit Traceability',
    value: 'Full Trace',
    detail: 'Decision trace + operator approval checkpoints on every advisory.',
    accent: 'primary' as const,
  },
];

const DIFFERENTIATION_PILLARS = [
  {
    icon: Lock,
    title: 'Governed Reasoning',
    subtitle: 'Deterministic-First',
    desc: 'Rule gates evaluate constraints before any AI model inference. Every advisory is policy-bounded.',
  },
  {
    icon: Gauge,
    title: 'Uncertainty-First ETR',
    subtitle: 'Band + Drivers',
    desc: 'ETR is a confidence band (earliest–latest) with explicit uncertainty drivers — not a single-point guess.',
  },
  {
    icon: FileSearch,
    title: 'Audit-Ready Approvals',
    subtitle: 'Full Traceability',
    desc: 'Every output carries a decision trace: inputs → constraints → rationale → operator sign-off.',
  },
];

const HERO_FLOW_INPUTS = [
  { icon: StormIcon, label: 'Storm / Weather' },
  { icon: Flame, label: 'Wildfire / Hazard' },
  { icon: Building2, label: 'Critical Load' },
  { icon: Users, label: 'Crew Safety' },
  { icon: Radio, label: 'Comms Pressure' },
];

const HERO_FLOW_DISCIPLINE = [
  { label: 'Constraints', color: 'text-accent' },
  { label: 'Rule Gate', color: 'text-warning' },
  { label: 'NIM Inference', color: 'text-primary' },
  { label: 'Structured Output', color: 'text-primary' },
  { label: 'Operator Approval', color: 'text-gold' },
  { label: 'Audit Trail', color: 'text-accent' },
];

const HERO_FLOW_OUTCOMES = [
  { icon: Target, label: 'Safe Prioritization' },
  { icon: FileText, label: 'Comms Consistency' },
  { icon: Eye, label: 'Executive Visibility' },
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

const LIFECYCLE_STAGES = ['Pre-Event', 'Event', 'Post-Event'] as const;

const USE_CASES = [
  {
    id: 'a',
    label: 'Use Case A: Storm Escalation — Hospital Backup Threshold Risk',
    lifecycleStage: 'Event' as const,
    inputs: {
      Stage: 'During Outage',
      'Event Type': 'Severe Storm',
      'Feeder Impact': 'High',
      'ETR Earliest / Latest': '2.5 h / {{4.0 h}}',
      'ETR Confidence': 'Medium',
      'Critical Load': 'Hospital',
      'Backup Remaining': '{{amber}}1.8 h',
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
    operatorActions: [
      'Dispatch crew with safety hold acknowledgment',
      'Delay dispatch until lightning clears (monitor runway)',
      'Escalate to emergency coordinator',
      'Request mobile generator for hospital',
    ],
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
    lifecycleStage: 'Pre-Event' as const,
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
    operatorActions: [
      'Reroute crew via alternate access road',
      'Request maintenance release on tie asset',
      'Deploy mobile backup to water station',
      'Hold and monitor until hazard clears',
    ],
    trace: [
      'Inputs: wildfire zone, maintenance constraint, crew limits, backup runtime',
      'Constraints applied: asset-lockout → tie blocked; wildfire proximity → access restriction',
      'Recommendation: hazard-constrained advisory with alternate routing option',
      'Status: Operator approval required',
    ],
  },
  {
    id: 'c',
    label: 'Use Case C: Ice Storm — Cascading Feeder & Access Constraint Risk',
    lifecycleStage: 'Event' as const,
    inputs: {
      Stage: 'During Event',
      'Event Type': 'Ice Storm',
      'Feeder Impact': 'Moderate → escalating',
      'Customers Affected': '6,500',
      'ETR Earliest / Latest': '4 h / {{14 h}}',
      'ETR Confidence': 'Low',
      'Critical Load': 'Regional Heating Shelter',
      'Backup Remaining': '{{amber}}3.2 h',
      'Escalation Threshold': '3.0 h',
      'Crew Availability': '2 qualified / access delayed',
      Hazards: 'Iced roads / falling limbs',
      'Vegetation Exposure': 'High',
      'Secondary Risk': 'Feeder sag & conductor stress',
    },
    output: {
      mode: 'Escalation Advisory',
      rationale: [
        'Ice accumulation increases secondary failure probability.',
        'ETR band (4–14 h) exceeds critical load runway window (3.2 h).',
        'Road icing increases dispatch latency and limits crew access.',
        'Vegetation loading risk suggests cascading feeder exposure.',
      ],
      tradeoffs: [
        'Immediate dispatch may reduce ETR but exposes crews to unsafe road and limb-fall conditions.',
        'Delay reduces crew risk but increases heating shelter exposure window beyond runway.',
      ],
      escalation: 'Critical facility runway at threshold — pre-emptive executive notification advised.',
      assumptions: 'Ice load severity synthetic; no live SCADA telemetry integration.',
      source: 'Rule gate evaluated: ice-severity-index, critical-runway, vegetation-loading, crew-access-safety.',
    },
    operatorActions: [
      'Dispatch crew with ice-rated vehicle and safety escort',
      'Delay until road treatment crews clear access route',
      'Escalate to emergency coordinator for shelter backup',
      'Request mobile heating unit for shelter',
      'Initiate feeder sectionalizing to isolate cascading risk',
    ],
    trace: [
      'Inputs: ice severity index, feeder load, backup runtime, crew status, vegetation flags',
      'Constraints applied: safety stand-down threshold; critical runway < threshold → escalation',
      'Recommendation: structured escalation advisory with cascading risk flag',
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
  return <div id={id} className="scroll-mt-20 rounded-lg transition-shadow" />;
}

function GlowCard({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <Card className={cn(
      'relative overflow-hidden border-border/40 bg-card/90 backdrop-blur-sm',
      'hover:border-border/60 transition-all duration-300',
      glow && 'border-primary/25 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.2)]',
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
  return <p className="text-sm text-muted-foreground/90 mb-6 max-w-2xl leading-relaxed">{children}</p>;
}

/** Reusable Phase-1 Demo callout — single source for all disclaimers */
function PhaseDemoCallout({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-gold/25 bg-gold/[0.06] px-2 py-0.5 text-[10px] font-semibold text-gold">
        <CircleDot className="h-2.5 w-2.5" />
        Phase-1 Demo
      </span>
    );
  }
  return (
    <div className="rounded-lg border border-gold/25 bg-gold/[0.04] px-4 py-3 flex items-start gap-2.5">
      <CircleDot className="h-4 w-4 shrink-0 text-gold mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-gold mb-0.5">Phase-1 Demo Environment</p>
        <p className="text-[11px] text-foreground/70 leading-relaxed">
          Synthetic data · Non-calibrated ETR logic · Advisory-only outputs · No live system integration
        </p>
      </div>
    </div>
  );
}

/** Lifecycle timeline ribbon */
function LifecycleTimeline({ active }: { active: typeof LIFECYCLE_STAGES[number] }) {
  return (
    <div className="flex items-center gap-0">
      {LIFECYCLE_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center">
          <div className={cn(
            'rounded-full px-3 py-1 text-[10px] font-semibold transition-all',
            active === stage
              ? 'bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]'
              : 'bg-muted/40 text-muted-foreground/60',
          )}>
            {stage}
          </div>
          {i < LIFECYCLE_STAGES.length - 1 && (
            <div className={cn(
              'h-px w-6',
              active === stage || active === LIFECYCLE_STAGES[i + 1]
                ? 'bg-primary/40'
                : 'bg-border/30',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

/* Animated grid background with parallax */
function GridBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
      <motion.div style={{ y }} className="absolute inset-0">
        <svg width="100%" height="130%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-use-cases" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-use-cases)" className="text-primary" />
        </svg>
      </motion.div>
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
  const [activeUseCase, setActiveUseCase] = useState<'a' | 'b' | 'c' | null>(null);
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('impact');

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
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
    el.classList.remove('section-pulse');
    void el.offsetWidth;
    el.classList.add('section-pulse');
    el.addEventListener('animationend', () => el.classList.remove('section-pulse'), { once: true });
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
      <div className="flex-1 min-w-0 px-6 pb-20 pt-6 space-y-14 max-w-6xl mx-auto">

        {/* ════════════════ HEADER ════════════════ */}
        <section className="relative">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 text-center">
            Conceptual Prototype — Structured Demonstration Environment
          </p>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Operator Copilot</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Use Cases & Differentiation</h1>
            <p className="mt-2.5 text-[13px] text-foreground/80 max-w-2xl mx-auto leading-relaxed font-medium">
              Operator Copilot is a governed reasoning overlay that structures outage decision context before it reaches the operator.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {['Advisory-Only', 'Human Approval Required', 'Deterministic Rule Gate'].map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-medium border-primary/25 text-primary/90 bg-primary/[0.06]">
                  {p}
                </Badge>
              ))}
              <PhaseDemoCallout compact />
            </div>
          </div>
        </section>

        {/* ════════════════ A. IMPACT ROW ════════════════ */}
        <section>
          <SectionAnchor id="impact" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {IMPACT_METRICS.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <GlowCard className={cn(
                  'h-full',
                  m.accent === 'gold' && 'border-gold/20',
                  m.accent === 'accent' && 'border-accent/20',
                  m.accent === 'primary' && 'border-primary/20',
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        m.accent === 'gold' ? 'bg-gold/10 text-gold' :
                        m.accent === 'accent' ? 'bg-accent/10 text-accent' :
                        'bg-primary/10 text-primary',
                      )}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{m.label}</p>
                    </div>
                    <p className={cn(
                      'text-lg font-bold tracking-tight mb-1',
                      m.accent === 'gold' ? 'text-gold' :
                      m.accent === 'accent' ? 'text-accent' :
                      'text-primary',
                    )}>
                      {m.value}
                    </p>
                    <p className="text-[11px] text-foreground/70 leading-relaxed">{m.detail}</p>
                  </CardContent>
                </GlowCard>
              </motion.div>
            ))}
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
                    card.accent === 'destructive' && 'border-destructive/20 hover:border-destructive/30',
                    card.accent === 'amber' && 'border-warning/20 hover:border-warning/30',
                    card.accent === 'warning' && 'border-warning/20 hover:border-warning/30',
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
                      <div className="space-y-2.5 mb-4">
                        {card.stats.map((s, j) => (
                          <div key={j} className="flex items-center justify-between text-xs">
                            <span className="text-foreground/60">{s.label}</span>
                            <span className="font-semibold text-foreground tabular-nums">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-foreground/50 italic border-t border-border/25 pt-3">{card.subtext}</p>
                    </CardContent>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ F. DIFFERENTIATION PILLARS ════════════════ */}
        <section>
          <SectionAnchor id="pillars" />
          <SectionTitle>Differentiation Pillars</SectionTitle>
          <SectionSubtitle>Three measurable capabilities that separate Operator Copilot from traditional OMS/ADMS.</SectionSubtitle>
          <div className="grid md:grid-cols-3 gap-4">
            {DIFFERENTIATION_PILLARS.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlowCard className="h-full border-primary/15" glow>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <pillar.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pillar.title}</p>
                        <p className="text-[10px] font-medium text-primary/70">{pillar.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">{pillar.desc}</p>
                  </CardContent>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════ C. HERO GRAPHIC — DECISION FLOW ════════════════ */}
        <section className="relative">
          <SectionAnchor id="hero-flow" />
          <GridBackground />
          <div className="relative">
            <SectionTitle>From Outage Pressure → Structured Decision Discipline</SectionTitle>
            <SectionSubtitle>How unstructured operational pressure is transformed into governed advisory output.</SectionSubtitle>
            <GlowCard glow>
              <CardContent className="py-6 px-5">
                <div className="grid md:grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-4 items-center">
                  {/* Pressure Inputs */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/70 mb-3 text-center">Pressure Inputs</p>
                    <div className="space-y-2">
                      {HERO_FLOW_INPUTS.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2.5 rounded-md border border-destructive/15 bg-destructive/[0.04] px-3 py-2 text-xs text-foreground/80"
                        >
                          <item.icon className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                          {item.label}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  </div>

                  {/* Copilot Discipline */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-3 text-center">Copilot Discipline</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {HERO_FLOW_DISCIPLINE.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06 }}
                          className={cn(
                            'rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-[10px] font-semibold',
                            step.color,
                          )}
                        >
                          {step.label}
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-md border border-primary/15 bg-primary/[0.04] px-3 py-2 text-center">
                      <p className="text-[10px] text-primary/70 font-medium">Constraints → Rule Gate → NIM → Structured Output → Approval → Audit</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
                  </div>

                  {/* Outcomes */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-accent/70 mb-3 text-center">Outcomes</p>
                    <div className="space-y-2">
                      {HERO_FLOW_OUTCOMES.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2.5 rounded-md border border-accent/15 bg-accent/[0.04] px-3 py-2 text-xs font-medium text-foreground/80"
                        >
                          <item.icon className="h-3.5 w-3.5 text-accent/60 shrink-0" />
                          {item.label}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </GlowCard>
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
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Traditional OMS / ADMS</span>
                </div>
                <div className="px-5 py-3 bg-gold/[0.06] border-l border-gold/20">
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
                    i % 2 === 0 ? 'bg-muted/20' : '',
                    i < COMPARISON_ROWS.length - 1 && 'border-b border-border/20',
                  )}
                >
                  <div className="px-5 py-3 text-xs text-foreground/60 flex items-center gap-2">
                    <row.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    {row.left}
                  </div>
                  <div className="px-5 py-3 text-xs text-foreground/90 font-medium flex items-center gap-2 bg-gold/[0.03] border-l border-gold/10">
                    <ArrowRight className="h-3 w-3 text-gold/60 shrink-0" />
                    {row.right}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </GlowCard>
          {/* Insight statement */}
          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/[0.04] px-5 py-4">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-semibold text-foreground/60">OMS answers:</span>{' '}
              <span className="italic">"What is happening?"</span>
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed mt-1">
              <span className="font-semibold text-gold">Operator Copilot structures:</span>{' '}
              <span className="italic">"Given constraints, what is the safest reasoning path?"</span>
            </p>
          </div>

          {/* Decision Layer Separation */}
          <Separator className="mt-5 bg-border/20" />
          <div className="mt-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Decision Layer Separation</p>
            <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground/80">OMS</span> = Event lifecycle management</p>
            <p className="text-xs text-foreground/70"><span className="font-semibold text-gold">Operator Copilot</span> = Constraint-structured reasoning</p>
          </div>
        </section>

        {/* ════════════════ 3. TRUST FLOW ════════════════ */}
        <section className="relative">
          <SectionAnchor id="trust-flow" />
          <GridBackground />
          <div className="relative">
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
                        i === 2 ? 'border-warning/30 bg-warning/[0.05]'
                          : i === 5 ? 'border-gold/30 bg-gold/[0.05]'
                          : 'border-border/30 bg-muted/20',
                      )}
                    >
                      <step.icon className={cn(
                        'h-5 w-5',
                        i === 2 ? 'text-warning' : i === 5 ? 'text-gold' : 'text-primary/70',
                      )} />
                      <span className="text-[10px] font-semibold text-foreground/90 leading-tight">{step.label}</span>
                      <span className="text-[9px] text-foreground/50 leading-snug">{step.desc}</span>
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
              <div className="mt-6 flex flex-wrap gap-6 text-xs text-foreground/60">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-primary/60" />
                  Rules constrain reasoning before model response
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-primary/60" />
                  No autonomous switching or dispatch actions
                </span>
              </div>
            </CardContent>
          </GlowCard>
          </div>
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Manual Correlation Required</p>
                  </div>
                  <p className="text-xs text-foreground/70 mb-4">During high-risk events, operators must manually correlate:</p>
                  <div className="space-y-3">
                    {COGNITIVE_LEFT.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 text-xs text-foreground/70"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground/70">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        {item.label}
                      </motion.div>
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Operator Copilot Synthesizes</p>
                  </div>
                  <p className="text-xs text-foreground/70 mb-4">Structured context delivered as a unified advisory surface:</p>
                  <div className="space-y-3">
                    {COGNITIVE_RIGHT.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 text-xs text-foreground/80 font-medium"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary/70">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        {item.label}
                      </motion.div>
                    ))}
                  </div>
                 </CardContent>
               </GlowCard>
             </motion.div>
           </div>
          {/* Metric line */}
          <div className="mt-5 rounded-md border border-border/30 bg-muted/20 px-5 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-xs">
            <span className="text-foreground/70">Manual correlation streams: <span className="font-semibold text-warning tabular-nums">5–7 systems</span></span>
            <span className="text-foreground/70">Structured advisory surface: <span className="font-semibold text-primary tabular-nums">1 governed output</span></span>
          </div>
         </section>

        {/* ════════════════ 5. USE CASE WALKTHROUGHS ════════════════ */}
        <section>
          <SectionAnchor id="walkthroughs" />
          <SectionTitle>Extreme Event Decision Patterns</SectionTitle>
          <SectionSubtitle>Demonstrating structured reasoning across multiple hazard types under governed constraints.</SectionSubtitle>

          {/* Hazard-type color legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-[10px] font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-foreground/60">Storm</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="text-foreground/60">Wildfire</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-sky-400" /><span className="text-foreground/60">Ice</span></div>
          </div>

          {/* Selector */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            {USE_CASES.map((u) => (
              <Button
                key={u.id}
                variant={activeUseCase === u.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs justify-start"
                onClick={() => setActiveUseCase(activeUseCase === u.id ? null : u.id as 'a' | 'b' | 'c')}
              >
                {u.id === 'c' ? <Snowflake className="h-3.5 w-3.5 mr-1.5 shrink-0" /> : <Zap className="h-3.5 w-3.5 mr-1.5 shrink-0" />}
                {u.label}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {uc && (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Lifecycle Timeline + Phase callout row */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <LifecycleTimeline active={uc.lifecycleStage} />
                  <PhaseDemoCallout compact />
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Inputs */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                  <GlowCard>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Inputs (Synthetic)</p>
                       <div className="space-y-2.5">
                         {Object.entries(uc.inputs).map(([k, v]) => {
                           let displayValue = v as string;
                           let valueClass = 'text-foreground/90 font-medium text-right tabular-nums';
                           if (displayValue.startsWith('{{amber}}')) {
                             displayValue = displayValue.replace('{{amber}}', '');
                             valueClass = 'text-warning font-semibold text-right tabular-nums';
                           } else if (displayValue.includes('{{') && displayValue.includes('}}')) {
                             displayValue = displayValue.replace(/\{\{(.+?)\}\}/g, '$1');
                             const parts = (v as string).split('{{');
                             const before = parts[0];
                             const highlighted = parts[1]?.replace('}}', '') || '';
                             return (
                               <div key={k} className="flex justify-between gap-2 text-xs leading-relaxed">
                                 <span className="text-foreground/60 shrink-0">{k}</span>
                                 <span className="font-medium text-right tabular-nums">
                                   <span className="text-foreground/90">{before}</span>
                                   <span className="text-warning font-semibold">{highlighted}</span>
                                 </span>
                               </div>
                             );
                           }
                           return (
                             <div key={k} className="flex justify-between gap-2 text-xs leading-relaxed">
                               <span className="text-foreground/60 shrink-0">{k}</span>
                               <span className={valueClass}>{displayValue}</span>
                             </div>
                           );
                         })}
                       </div>
                    </CardContent>
                  </GlowCard>
                  </motion.div>

                  {/* Output + Operator Action */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                  <GlowCard>
                    <CardContent className="p-4">
                       <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Advisory Output (Structured)</p>
                       <div className="flex flex-wrap items-center gap-1.5 mb-3">
                         <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/90">{uc.output.mode}</Badge>
                         <Badge variant="outline" className="text-[9px] border-gold/30 text-gold bg-gold/[0.06]">Constraint-Validated</Badge>
                         {uc.id === 'c' && (
                           <Badge variant="outline" className="text-[9px] border-sky-400/30 text-sky-400 bg-sky-500/[0.06]">
                             <Snowflake className="h-2.5 w-2.5 mr-1" />Cascading Risk
                           </Badge>
                         )}
                       </div>
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <p className="font-medium text-foreground/80 mb-1">Rationale</p>
                          <ul className="space-y-1.5">
                            {uc.output.rationale.map((r, i) => (
                              <li key={i} className="text-foreground/70 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-primary/60 mt-0.5">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-foreground/80 mb-1">Trade-offs</p>
                          <ul className="space-y-1.5">
                            {uc.output.tradeoffs.map((t, i) => (
                              <li key={i} className="text-foreground/70 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-warning/60 mt-0.5">•</span> {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-destructive/[0.07] rounded-md px-2.5 py-2 text-destructive/90 text-[11px]">
                          <span className="font-semibold">Escalation:</span> {uc.output.escalation}
                        </div>
                      </div>

                      {/* Operator Action Box */}
                      <div className="mt-4 pt-3 border-t border-gold/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <UserCheck className="h-3.5 w-3.5 text-gold" />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Operator Decision Options</p>
                        </div>
                        <div className="space-y-1.5">
                          {uc.operatorActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/70 leading-relaxed">
                              <span className="text-gold/60 mt-0.5 font-bold text-[10px]">{i + 1}.</span>
                              {action}
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-foreground/40 italic mt-2">All actions require explicit operator approval.</p>
                      </div>
                    </CardContent>
                  </GlowCard>
                  </motion.div>

                  {/* Decision Trace */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                  <GlowCard>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Decision Trace</p>
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
                            <p className="text-xs text-foreground/70 pt-0.5 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/20">
                        <p className="text-[10px] text-foreground/50 italic">
                          Source: {uc.output.source}
                        </p>
                      </div>
                    </CardContent>
                  </GlowCard>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!uc && (
            <div className="rounded-lg border border-dashed border-border/30 py-10 text-center text-xs text-foreground/50">
              Select a use case above to load the interactive walkthrough.
            </div>
          )}
        </section>

        {/* ════════════════ 6. PHASE CLARITY ════════════════ */}
        <section className="relative">
          <SectionAnchor id="phases" />
          <GridBackground />
          <div className="relative">
          <SectionTitle>Phase-1 vs Phase-2 Clarity</SectionTitle>
          <SectionSubtitle>Clear boundary between current advisory capabilities and future predictive intelligence.</SectionSubtitle>
           <div className="grid md:grid-cols-2 gap-5">
             {/* Phase 1 */}
             <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
             <GlowCard className="border-primary/20 h-full" glow>
               <CardContent className="p-5">
                 <div className="flex items-center gap-2 mb-4">
                   <Badge className="text-[10px] bg-gold/20 text-gold border-gold/30 hover:bg-gold/20">Phase-1</Badge>
                   <span className="text-xs font-semibold text-foreground/90">Governed Advisory Intelligence</span>
                 </div>
                 <ul className="space-y-2.5">
                   {PHASE1_ITEMS.map((item, i) => (
                     <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                       <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                       {item}
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </GlowCard>
             </motion.div>
             {/* Phase 2 */}
             <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
             <GlowCard className="h-full">
               <CardContent className="p-5">
                 <div className="flex items-center gap-2 mb-4">
                   <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Phase-2</Badge>
                   <span className="text-xs font-semibold text-foreground/90">Validated Predictive Intelligence</span>
                 </div>
                 <ul className="space-y-2.5">
                   {PHASE2_ITEMS.map((item, i) => (
                     <li key={i} className="flex items-start gap-2 text-xs text-foreground/60 leading-relaxed">
                       <CircleDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
                       {item}
                     </li>
                   ))}
                 </ul>
               </CardContent>
             </GlowCard>
             </motion.div>
           </div>
          {/* Phase-2 trust line */}
          <p className="mt-3 text-[11px] text-foreground/50 italic text-center">
            Requires validated historical datasets, calibration workflows, and governance approval.
          </p>
          {/* Exclusion band */}
          <div className="mt-4 rounded-md border border-warning/25 bg-warning/[0.05] px-4 py-2.5 text-[11px] text-warning/90">
            <strong>Phase-1 excludes:</strong> load-flow simulation, switching automation, protection coordination, and real-time SCADA control.
          </div>
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
                    <AccordionTrigger className="px-5 py-3 text-xs font-semibold text-foreground/90 hover:no-underline">
                      {s.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <ul className="space-y-2">
                        {s.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed">
                            <span className="text-primary/50 mt-0.5">•</span> {b}
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

        {/* ════════════════ "WHAT THIS IS NOT" PANEL ════════════════ */}
        <section>
          <GlowCard className="border-muted-foreground/15">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">This Solution Does Not</p>
               <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  'Perform load-flow simulation',
                  'Execute switching commands',
                  'Replace OMS or ADMS',
                  'Bypass operator approval',
                  'Generate autonomous dispatch actions',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-2 text-xs text-foreground/60"
                  >
                    <X className="h-3 w-3 shrink-0 text-destructive/60" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </GlowCard>
        </section>

        {/* ── Phase-1 Demo callout — single source ── */}
        <PhaseDemoCallout />

        {/* ── Closing statement ── */}
        <p className="text-sm font-medium text-center text-foreground/70 tracking-tight">
          Structured intelligence before action. Human authority preserved.
        </p>

        {/* ── Footer ── */}
        <Separator className="bg-border/20" />
        <p className="text-[10px] text-center text-muted-foreground/50">
          No SCADA actuation · No breaker control · No autonomous dispatch · Human-in-the-loop only
        </p>
      </div>
    </div>
  );
}
