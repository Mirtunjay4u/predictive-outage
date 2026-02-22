import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  Brain,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Radio,
  Target,
  Users,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/* ── Phase definitions ── */
const phases = [
  {
    id: 'p1',
    label: 'Phase 1',
    title: 'Governed Decision Intelligence',
    tag: 'Current',
    status: 'Complete',
    progress: 100,
    statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    barColor: 'from-emerald-600 to-emerald-400',
  },
  {
    id: 'p2a',
    label: 'Phase 2A',
    title: 'Predictive MVP',
    tag: 'Committed',
    status: 'In Design',
    progress: 25,
    statusColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-500',
    barColor: 'from-blue-600 to-blue-400',
  },
  {
    id: 'p2b',
    label: 'Phase 2B',
    title: 'Utility-Grade Platform',
    tag: 'Planned',
    status: 'Strategic Planning',
    progress: 0,
    statusColor: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotColor: 'bg-slate-500',
    barColor: 'from-slate-600 to-slate-400',
  },
];

/* ── Condensed lane data with short labels ── */
const lanes: {
  title: string;
  icon: typeof Database;
  defaultOpen: boolean;
  phases: { items: string[]; gate?: string; warn?: string }[];
}[] = [
  {
    title: 'Data & Integration',
    icon: Database,
    defaultOpen: true,
    phases: [
      {
        items: [
          'Structured event modeling',
          'Hazard overlay correlation',
          'Crew & asset abstraction',
          'Dataverse placeholder',
        ],
      },
      {
        items: [
          'OMS event ingestion',
          'Weather feed (NWS/NOAA)',
          'Asset registry ingestion',
          'Crew status + history archive',
        ],
        gate: 'Feature store established',
      },
      {
        items: [
          'Topology-aware feeders',
          'Vegetation risk layers',
          'Work mgmt integration',
          'Drift detection',
        ],
        gate: 'Production pipeline w/ monitoring',
      },
    ],
  },
  {
    title: 'AI & Analytics',
    icon: Brain,
    defaultOpen: true,
    phases: [
      {
        items: [
          'Deterministic rule engine',
          'Advisory AI (Nemotron NIM)',
          'ETR confidence bands',
          'Risk posture synthesis',
          'Decision Trace',
        ],
        warn: 'No autonomous switching or predictive calibration',
      },
      {
        items: [
          'Probabilistic risk scoring',
          'ETR distribution (P50/P80)',
          'Historical backtesting',
          'Explainability attribution',
        ],
        gate: 'Predictions calibrated on historical data',
      },
      {
        items: [
          'Propagation modeling',
          'Crew-aware ETR',
          'What-if simulation',
          'Advisory crew allocation',
        ],
        gate: 'Validated performance w/ drift governance',
      },
    ],
  },
  {
    title: 'Governance & Hardening',
    icon: ShieldCheck,
    defaultOpen: false,
    phases: [
      {
        items: [
          'Advisory-only boundary',
          'System status transparency',
          'Decision Trace',
          'Glossary & policy alignment',
        ],
      },
      {
        items: [
          'Model versioning',
          'Audit trail',
          'Output contracts',
          'Latency monitoring',
          'RBAC planning',
        ],
        gate: 'AI outputs auditable & traceable',
      },
      {
        items: [
          'Drift detection (data + model)',
          'Fallback automation',
          'Feature flags',
          'SLO + compliance review',
        ],
        gate: 'Enterprise production readiness',
      },
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

function CollapsibleLane({
  lane,
  defaultOpen,
}: {
  lane: (typeof lanes)[0];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = lane.icon;

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-1 w-full group cursor-pointer"
      >
        <Icon className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.75} />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
          {lane.title}
        </h3>
        <div className="h-px flex-1 bg-border/30" />
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {lane.phases.map((phaseData, pi) => (
                <div
                  key={pi}
                  className={cn(
                    'rounded-lg border border-border/30 bg-card/40 px-3 py-2.5 space-y-2',
                    pi === 0 && 'border-emerald-500/20',
                    pi === 1 && 'border-blue-500/15',
                    pi === 2 && 'border-slate-500/15',
                  )}
                >
                  {/* Compact chip list */}
                  <div className="flex flex-wrap gap-1">
                    {phaseData.items.map((item, i) => (
                      <span
                        key={i}
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight',
                          pi === 0
                            ? 'bg-emerald-500/8 text-emerald-300/90 border border-emerald-500/15'
                            : pi === 1
                              ? 'bg-blue-500/8 text-blue-300/90 border border-blue-500/15'
                              : 'bg-slate-500/8 text-slate-300/90 border border-slate-500/15',
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {phaseData.warn && (
                    <div className="flex items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1">
                      <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      <span className="text-[9px] font-medium text-amber-400/80">{phaseData.warn}</span>
                    </div>
                  )}

                  {phaseData.gate && (
                    <div className="flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-[9px] font-semibold text-emerald-400/80">{phaseData.gate}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SolutionRoadmap() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Compact Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Solution Evolution Blueprint
        </h1>
        <p className="text-sm text-muted-foreground/80 max-w-2xl">
          From governed decision support → calibrated predictive operations
        </p>
      </motion.header>

      {/* ── Visual Phase Timeline ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border border-border/30 bg-card/50 p-4"
      >
        <div className="flex items-center gap-0">
          {phases.map((p, i) => (
            <div key={p.id} className="flex items-center flex-1 last:flex-none">
              {/* Phase node */}
              <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                {/* Circle + progress */}
                <div className="relative">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full border-2 flex items-center justify-center',
                      p.progress === 100
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : p.progress > 0
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : 'border-slate-500/40 bg-slate-500/5',
                    )}
                  >
                    {p.progress === 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] font-bold text-muted-foreground/70">
                        {p.progress}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
                    {p.label}
                  </span>
                  <p className="text-[12px] font-semibold text-foreground/90 leading-tight mt-0.5">
                    {p.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn('mt-1 text-[9px] border', p.statusColor)}
                  >
                    {p.tag}
                  </Badge>
                </div>
              </div>
              {/* Connector arrow */}
              {i < phases.length - 1 && (
                <div className="flex-1 flex items-center px-2 -mt-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10" />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/25 -ml-0.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Collapsible Capability Lanes ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="space-y-3"
      >
        {lanes.map((lane) => (
          <CollapsibleLane key={lane.title} lane={lane} defaultOpen={lane.defaultOpen} />
        ))}
      </motion.section>

      {/* ── Bottom strip: Impact + Non-Claims side by side ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {/* Impact */}
        <div className="rounded-lg border border-border/30 bg-card/50 px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
            Impact Domains
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {impactAreas.map((a) => (
              <span
                key={a.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary/80"
              >
                <a.icon className="h-3 w-3" strokeWidth={1.75} />
                {a.text}
              </span>
            ))}
          </div>
        </div>

        {/* Non-claims */}
        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-400/60 mb-2">
            Explicit Non-Claims
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {nonClaims.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-400/70"
              >
                <XCircle className="h-3 w-3 flex-shrink-0" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Governance footer ── */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · No autonomous control · No live SCADA/OMS/ADMS in Phase 1
        </p>
      </footer>
    </div>
  );
}
