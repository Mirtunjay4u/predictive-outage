import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  Brain,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Zap,
  Radio,
  Target,
  Users,
  Eye,
  ArrowRight,
  Circle,
  Sparkles,
  Columns2,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ── Phase definitions ── */
const phases = [
  {
    id: 'p1',
    idx: 0,
    label: 'Phase 1',
    title: 'Governed Decision Intelligence',
    tag: 'Current',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    accent: 'emerald',
    summary: 'Advisory decision-support layer with deterministic rules, explainable AI reasoning, and full governance transparency.',
    progress: 100,
  },
  {
    id: 'p2a',
    idx: 1,
    label: 'Phase 2A',
    title: 'Predictive MVP',
    tag: 'Committed',
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    accent: 'blue',
    summary: 'Calibrated probabilistic predictions with live data ingestion, historical backtesting, and auditable model outputs.',
    progress: 25,
  },
  {
    id: 'p2b',
    idx: 2,
    label: 'Phase 2B',
    title: 'Utility-Grade Platform',
    tag: 'Planned',
    tagColor: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    accent: 'slate',
    summary: 'Enterprise production hardening with topology-aware modeling, drift governance, and continuous performance monitoring.',
    progress: 0,
  },
];

/* ── Lane data per phase ── */
type LaneDef = {
  title: string;
  icon: typeof Database;
  phases: { items: string[]; gate?: string; warn?: string }[];
};

const lanes: LaneDef[] = [
  {
    title: 'Data & Integration',
    icon: Database,
    phases: [
      { items: ['Structured event modeling', 'Hazard overlay correlation', 'Crew & asset abstraction', 'Dataverse placeholder'] },
      { items: ['OMS event ingestion', 'Weather feed (NWS/NOAA)', 'Asset registry ingestion', 'Crew status + history archive'], gate: 'Feature store established' },
      { items: ['Topology-aware feeders', 'Vegetation risk layers', 'Work mgmt integration', 'Drift detection'], gate: 'Production pipeline w/ monitoring' },
    ],
  },
  {
    title: 'AI & Analytics',
    icon: Brain,
    phases: [
      { items: ['Deterministic rule engine', 'Advisory AI (Nemotron NIM)', 'ETR confidence bands', 'Risk posture synthesis', 'Decision Trace'], warn: 'No autonomous switching or predictive calibration' },
      { items: ['Probabilistic risk scoring', 'ETR distribution (P50/P80)', 'Historical backtesting', 'Explainability attribution'], gate: 'Predictions calibrated on historical data' },
      { items: ['Propagation modeling', 'Crew-aware ETR', 'What-if simulation', 'Advisory crew allocation'], gate: 'Validated performance w/ drift governance' },
    ],
  },
  {
    title: 'Governance & Hardening',
    icon: ShieldCheck,
    phases: [
      { items: ['Advisory-only boundary', 'System status transparency', 'Decision Trace', 'Glossary & policy alignment'] },
      { items: ['Model versioning', 'Audit trail', 'Output contracts', 'Latency monitoring', 'RBAC planning'], gate: 'AI outputs auditable & traceable' },
      { items: ['Drift detection (data + model)', 'Fallback automation', 'Feature flags', 'SLO + compliance review'], gate: 'Enterprise production readiness' },
    ],
  },
];

const impactAreas = [
  { icon: Zap, text: 'Outage response' },
  { icon: Radio, text: 'Weather resilience' },
  { icon: Target, text: 'Critical load continuity' },
  { icon: Users, text: 'Operator cognitive load' },
  { icon: Eye, text: 'Executive awareness' },
];

const nonClaims = [
  'No autonomous grid control',
  'No SCADA execution',
  'No unvalidated predictions',
  'No OMS/ADMS replacement',
  'No ungoverned data integration',
];

/* ── Accent color helpers ── */
const accentMap = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    chipBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    glow: 'shadow-emerald-500/10',
    stepBorder: 'border-emerald-400',
    stepBg: 'bg-emerald-500/15',
    icon: 'text-emerald-400',
    gateBorder: 'border-emerald-500/25',
    gateBg: 'bg-emerald-500/8',
    gateText: 'text-emerald-400/90',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    chipBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    glow: 'shadow-blue-500/10',
    stepBorder: 'border-blue-400',
    stepBg: 'bg-blue-500/15',
    icon: 'text-blue-400',
    gateBorder: 'border-blue-500/25',
    gateBg: 'bg-blue-500/8',
    gateText: 'text-blue-400/90',
  },
  slate: {
    border: 'border-slate-500/25',
    bg: 'bg-slate-500/5',
    chipBg: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
    glow: 'shadow-slate-500/10',
    stepBorder: 'border-slate-500',
    stepBg: 'bg-slate-500/15',
    icon: 'text-slate-400',
    gateBorder: 'border-slate-500/20',
    gateBg: 'bg-slate-500/8',
    gateText: 'text-slate-400/90',
  },
};

export default function SolutionRoadmap() {
  const [activePhase, setActivePhase] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const phase = phases[activePhase];
  const colors = accentMap[phase.accent as keyof typeof accentMap];

  return (
    <div className="min-h-screen space-y-5 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Solution Evolution Blueprint
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          From governed decision support → calibrated predictive operations
        </p>
      </motion.header>

      {/* ── Phase Stepper (horizontal) ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-stretch gap-2">
          {phases.map((p, i) => {
            const c = accentMap[p.accent as keyof typeof accentMap];
            const isActive = i === activePhase;
            const isComplete = p.progress === 100;

            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(i)}
                className={cn(
                  'relative flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 cursor-pointer',
                  isActive
                    ? cn(c.border, c.bg, 'shadow-lg', c.glow, 'ring-1 ring-inset', c.border)
                    : 'border-border/20 bg-card/30 hover:bg-card/50 hover:border-border/40',
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      isActive ? cn(c.stepBorder, c.stepBg) : 'border-border/30 bg-card/40',
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className={cn('h-5 w-5', isActive ? 'text-emerald-400' : 'text-emerald-500/50')} />
                    ) : p.progress > 0 ? (
                      <Sparkles className={cn('h-4 w-4', isActive ? 'text-blue-400' : 'text-blue-400/40')} />
                    ) : (
                      <Circle className={cn('h-4 w-4', isActive ? 'text-slate-400' : 'text-slate-500/40')} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', isActive ? c.icon : 'text-muted-foreground/50')}>
                        {p.label}
                      </span>
                      <Badge variant="outline" className={cn('text-[8px] border', isActive ? p.tagColor : 'border-border/20 text-muted-foreground/40')}>
                        {p.tag}
                      </Badge>
                    </div>
                    <p className={cn('text-[12px] font-semibold leading-tight mt-0.5 truncate', isActive ? 'text-foreground/90' : 'text-muted-foreground/50')}>
                      {p.title}
                    </p>
                  </div>
                </div>

                {/* "YOU ARE HERE" pulse for Phase 1 */}
                {i === 0 && isActive && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-emerald-400/50" />
                    </span>
                  </div>
                )}

                {/* Connector arrow between cards */}
                {i < phases.length - 1 && (
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/20" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ── View Mode Toggle ── */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer',
            compareMode
              ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
              : 'border-border/30 bg-card/30 text-muted-foreground/60 hover:text-muted-foreground/80 hover:bg-card/50',
          )}
        >
          <Columns2 className="h-3.5 w-3.5" />
          {compareMode ? 'Exit Compare' : 'Compare Phase 1 → 2A'}
        </button>
      </div>

      {/* ── Compare Mode: Side-by-side ── */}
      <AnimatePresence mode="wait">
        {compareMode ? (
          <motion.section
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Compare header */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400/70">Phase 1</span>
                  <p className="text-[12px] font-semibold text-foreground/90">Governed Decision Intelligence</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[8px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Delivered</Badge>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-2.5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400/70">Phase 2A</span>
                  <p className="text-[12px] font-semibold text-foreground/90">Predictive MVP</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[8px] bg-blue-500/15 text-blue-400 border-blue-500/30">Committed</Badge>
              </div>
            </div>

            {/* Compare lanes */}
            {lanes.map((lane) => {
              const Icon = lane.icon;
              const p1 = lane.phases[0];
              const p2 = lane.phases[1];
              return (
                <div key={lane.title} className="rounded-lg border border-border/20 bg-background/30 px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.75} />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                      {lane.title}
                    </h3>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Phase 1 column */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {p1.items.map((item, i) => (
                          <motion.span
                            key={item}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-400/70 flex-shrink-0" />
                            {item}
                          </motion.span>
                        ))}
                      </div>
                      {p1.warn && (
                        <div className="flex items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1">
                          <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                          <span className="text-[9px] font-medium text-amber-400/80">{p1.warn}</span>
                        </div>
                      )}
                    </div>

                    {/* Phase 2A column */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {p2.items.map((item, i) => (
                          <motion.span
                            key={item}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium bg-blue-500/10 border-blue-500/20 text-blue-300"
                          >
                            <Plus className="h-3 w-3 text-blue-400/70 flex-shrink-0" />
                            {item}
                          </motion.span>
                        ))}
                      </div>
                      {p2.gate && (
                        <div className="flex items-center gap-1.5 rounded border border-blue-500/25 bg-blue-500/8 px-2 py-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-400/90 flex-shrink-0" />
                          <span className="text-[9px] font-semibold text-blue-400/80">Gate: {p2.gate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400/70" />
                <span className="text-[10px] text-muted-foreground/60">Delivered in Phase 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Plus className="h-3 w-3 text-blue-400/70" />
                <span className="text-[10px] text-muted-foreground/60">New in Phase 2A</span>
              </div>
            </div>
          </motion.section>
        ) : (
          /* ── Single Phase Detail Panel ── */
          <motion.section
            key={activePhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={cn('rounded-xl border p-5 space-y-4', colors.border, colors.bg)}
          >
            {/* Phase summary */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-bold text-foreground/90 flex items-center gap-2">
                  {phase.label}: {phase.title}
                  {phase.progress === 100 && (
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      ✓ Delivered
                    </Badge>
                  )}
                </h2>
                <p className="text-[12px] text-muted-foreground/70 mt-1 max-w-2xl leading-relaxed">
                  {phase.summary}
                </p>
              </div>

              {/* Progress ring */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="relative h-12 w-12">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border/20" />
                    <circle
                      cx="18" cy="18" r="14" fill="none" strokeWidth="2.5"
                      strokeDasharray={`${phase.progress * 0.88} 88`}
                      strokeLinecap="round"
                      className={cn(
                        phase.progress === 100 ? 'text-emerald-400' : phase.progress > 0 ? 'text-blue-400' : 'text-slate-500',
                      )}
                      stroke="currentColor"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground/70">
                    {phase.progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Capability lanes for this phase */}
            <div className="space-y-3">
              {lanes.map((lane) => {
                const Icon = lane.icon;
                const phaseData = lane.phases[activePhase];
                return (
                  <div key={lane.title} className="rounded-lg border border-border/20 bg-background/30 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className={cn('h-4 w-4', colors.icon)} strokeWidth={1.75} />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                        {lane.title}
                      </h3>
                      <div className="h-px flex-1 bg-border/20" />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {phaseData.items.map((item, i) => (
                        <motion.span
                          key={item}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                            colors.chipBg,
                          )}
                        >
                          {phase.progress === 100 && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400/70 flex-shrink-0" />
                          )}
                          {item}
                        </motion.span>
                      ))}
                    </div>

                    {phaseData.warn && (
                      <div className="flex items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 mt-2.5">
                        <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-amber-400/80">{phaseData.warn}</span>
                      </div>
                    )}

                    {phaseData.gate && (
                      <div className={cn('flex items-center gap-1.5 rounded border px-2.5 py-1.5 mt-2.5', colors.gateBorder, colors.gateBg)}>
                        <CheckCircle2 className={cn('h-3 w-3 flex-shrink-0', colors.gateText)} />
                        <span className={cn('text-[10px] font-semibold', colors.gateText)}>Gate: {phaseData.gate}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <div className="rounded-lg border border-border/30 bg-card/50 px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
            Impact Domains
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {impactAreas.map((a) => (
              <span key={a.text} className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary/80">
                <a.icon className="h-3 w-3" strokeWidth={1.75} />
                {a.text}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-400/60 mb-2">
            Explicit Non-Claims
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {nonClaims.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-400/70">
                <XCircle className="h-3 w-3 flex-shrink-0" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · No autonomous control · No live SCADA/OMS/ADMS in Phase 1
        </p>
      </footer>
    </div>
  );
}
