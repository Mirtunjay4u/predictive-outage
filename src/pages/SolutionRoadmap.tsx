import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Brain,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Download,
  Zap,
  Radio,
  Users,
  Eye,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    colBorder: 'border-[hsl(217,60%,35%)]',
    colBg: 'bg-[hsl(217,60%,35%,0.04)]',
    headerBg: 'bg-[hsl(217,60%,35%,0.10)]',
    headerText: 'text-[hsl(217,60%,75%)]',
  },
  {
    id: 'p2a',
    label: 'Phase 2A',
    title: 'Predictive MVP',
    tag: 'Committed',
    status: 'In Design',
    statusColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    colBorder: 'border-[hsl(210,50%,42%)]',
    colBg: 'bg-[hsl(210,50%,42%,0.04)]',
    headerBg: 'bg-[hsl(210,50%,42%,0.10)]',
    headerText: 'text-[hsl(210,50%,78%)]',
  },
  {
    id: 'p2b',
    label: 'Phase 2B',
    title: 'Utility-Grade Predictive Platform',
    tag: 'Planned',
    status: 'Strategic Planning',
    statusColor: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    colBorder: 'border-[hsl(205,45%,50%)]',
    colBg: 'bg-[hsl(205,45%,50%,0.04)]',
    headerBg: 'bg-[hsl(205,45%,50%,0.10)]',
    headerText: 'text-[hsl(205,45%,80%)]',
  },
];

/* ── Lane data ── */
const lanes: {
  title: string;
  icon: typeof Database;
  phases: { items: string[]; acceptance?: string; scopeNote?: string }[];
}[] = [
  {
    title: 'Data & Integration',
    icon: Database,
    phases: [
      {
        items: [
          'Structured event modeling (demo/simulated)',
          'Hazard overlay correlation',
          'Crew visibility abstraction',
          'Asset metadata abstraction',
          'Dataverse integration placeholder (pending governance approval)',
        ],
      },
      {
        items: [
          'OMS read-only event ingestion',
          'Weather feed integration (NWS/NOAA API)',
          'Asset registry ingestion (feeder/substation metadata)',
          'Crew status ingestion',
          'Historical outage archive ingestion',
        ],
        acceptance: 'Integrated structured event feature store established',
      },
      {
        items: [
          'Topology-aware feeder modeling',
          'Vegetation risk layers',
          'Work management integration',
          'Data freshness monitoring',
          'Drift detection on input features',
        ],
        acceptance: 'Production-grade data pipeline with monitoring',
      },
    ],
  },
  {
    title: 'AI & Analytics Layer',
    icon: Brain,
    phases: [
      {
        items: [
          'Deterministic Rule Engine',
          'Advisory-only AI reasoning (Nemotron NIM)',
          'ETR confidence band display',
          'Critical load runway modeling',
          'Operational risk posture synthesis',
          'Decision Trace explainability',
        ],
        scopeNote: 'No autonomous switching. No predictive calibration claims.',
      },
      {
        items: [
          'Calibrated outage risk scoring (probabilistic)',
          'ETR distribution modeling (P50/P80)',
          'Historical backtesting',
          'Model card documentation',
          'Reliability curve validation',
          'Explainability driver attribution',
        ],
        acceptance: 'Predictive outputs calibrated and validated on historical data',
      },
      {
        items: [
          'Topology-aware propagation modeling',
          'Crew-aware ETR adjustments',
          'What-if scenario simulation',
          'Optimization-based crew allocation (advisory only)',
          'Continuous model performance monitoring',
        ],
        acceptance: 'Validated predictive performance with drift governance',
      },
    ],
  },
  {
    title: 'Governance & Production Hardening',
    icon: ShieldCheck,
    phases: [
      {
        items: [
          'Advisory-only boundary',
          'System Status transparency',
          'Decision Trace',
          'Glossary standardization',
          'Knowledge & Policy alignment',
        ],
      },
      {
        items: [
          'Model versioning',
          'Prompt/version audit trail',
          'Structured output contracts',
          'Latency monitoring',
          'Role-based access control planning',
        ],
        acceptance: 'AI outputs auditable and traceable',
      },
      {
        items: [
          'Drift detection (data + model)',
          'Fallback strategy automation',
          'Feature flag control for predictive features',
          'SLO definition',
          'Security review & compliance alignment',
        ],
        acceptance: 'Enterprise production readiness posture achieved',
      },
    ],
  },
];

const impactAreas = [
  { icon: Zap, text: 'Transmission and distribution outage response' },
  { icon: Radio, text: 'Severe weather resilience' },
  { icon: Target, text: 'Critical load continuity planning' },
  { icon: Users, text: 'Operator cognitive load reduction' },
  { icon: Eye, text: 'Executive situational awareness' },
];

const nonClaims = [
  'No autonomous grid control',
  'No SCADA command execution',
  'No unvalidated predictive accuracy',
  'No replacement of OMS/ADMS platforms',
  'No production data integration without governance approval',
];

function AcceptanceMarker({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 cursor-default">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-400/90 leading-tight">{text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        Acceptance criteria that must be met before advancing to the next phase.
      </TooltipContent>
    </Tooltip>
  );
}

export default function SolutionRoadmap() {
  return (
    <div className="min-h-screen space-y-8 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Phase status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {phases.map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className={cn('text-[10px] font-semibold tracking-wide border', p.statusColor)}
            >
              {p.label}: {p.status}
            </Badge>
          ))}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button className="ml-1 flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors cursor-default">
                <Download className="h-3 w-3" />
                Whitepaper
              </button>
            </TooltipTrigger>
            <TooltipContent>Coming soon — downloadable evolution whitepaper</TooltipContent>
          </Tooltip>
        </div>

        <div>
          <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
            Solution Evolution Blueprint
          </h1>
          <p className="mt-1 text-sm text-muted-foreground/80 max-w-2xl leading-relaxed">
            From Governed Decision Support to Calibrated Predictive Operations Platform
          </p>
        </div>

        <p className="text-[13px] text-muted-foreground/70 max-w-3xl leading-relaxed">
          Operator Copilot is designed as a phased transformation platform.
          Phase 1 establishes a governed decision-support layer.
          Phase 2 introduces calibrated predictive analytics, enterprise integration, and operational production hardening.
        </p>
      </motion.header>

      {/* ── Three-Phase Timeline (3 columns × 3 lanes) ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="space-y-5"
      >
        {/* Phase column headers */}
        <div className="relative grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Connector line between phase headers (desktop only) */}
          <div className="absolute top-1/2 left-0 right-0 hidden md:block pointer-events-none" aria-hidden="true">
            <div className="mx-auto h-px w-[calc(100%-4rem)] bg-gradient-to-r from-[hsl(217,60%,35%,0.5)] via-[hsl(210,50%,42%,0.5)] to-[hsl(205,45%,50%,0.5)]" />
            {/* Phase dots on the connector */}
            <div className="absolute top-1/2 left-[16.66%] -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-[hsl(217,60%,45%)] bg-emerald-500/80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-[hsl(210,50%,50%)] bg-blue-500/60" />
            <div className="absolute top-1/2 left-[83.33%] -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-[hsl(205,45%,55%)] bg-slate-500/50" />
          </div>
          {phases.map((p) => (
            <div
              key={p.id}
              className={cn(
                'relative z-10 rounded-lg border px-4 py-3',
                p.colBorder,
                p.headerBg,
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn('text-xs font-bold uppercase tracking-[0.12em]', p.headerText)}>
                    {p.label}
                  </span>
                  <p className="mt-0.5 text-[13px] font-semibold text-foreground/90">{p.title}</p>
                </div>
                <Badge variant="outline" className={cn('text-[9px] border', p.statusColor)}>
                  {p.tag}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Capability lanes */}
        {lanes.map((lane) => (
          <div key={lane.title} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <lane.icon className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.75} />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                {lane.title}
              </h3>
              <div className="h-px flex-1 bg-border/30" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {lane.phases.map((phaseData, pi) => {
                const phase = phases[pi];
                return (
                  <Card
                    key={phase.id}
                    className={cn(
                      'border bg-card/60 backdrop-blur-sm transition-colors',
                      phase.colBorder,
                      'hover:border-opacity-80',
                    )}
                  >
                    <CardContent className="px-4 py-3.5 space-y-2">
                      <ul className="space-y-1.5">
                        {phaseData.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-[7px] h-1 w-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                            <span className="text-[12px] text-foreground/80 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>

                      {phaseData.scopeNote && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 mt-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="text-[10px] font-medium text-amber-400/90 leading-relaxed">
                            {phaseData.scopeNote}
                          </span>
                        </div>
                      )}

                      {phaseData.acceptance && (
                        <AcceptanceMarker text={phaseData.acceptance} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </motion.section>

      {/* ── AI Impact Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary/70" />
              AI Impact in Critical Utility Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {impactAreas.map((area) => (
                <div key={area.text} className="flex items-center gap-2.5 rounded-md border border-border/30 bg-muted/15 px-3 py-2.5">
                  <area.icon className="h-4 w-4 text-primary/60 flex-shrink-0" strokeWidth={1.75} />
                  <span className="text-[12px] text-foreground/80">{area.text}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/20 pt-3 space-y-1">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                It does not replace control systems.
                It augments operator decision-making under governance constraints.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Non-Claim Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <Card className="border-amber-500/20 bg-amber-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-400/80" />
              What We Do Not Claim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {nonClaims.map((claim) => (
                <li key={claim} className="flex items-center gap-2.5">
                  <XCircle className="h-3.5 w-3.5 text-amber-400/60 flex-shrink-0" />
                  <span className="text-[12px] text-foreground/75">{claim}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Governance footer ── */}
      <footer className="pb-6 pt-2 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only platform · No autonomous control actions · No live SCADA / OMS / ADMS integration in Phase 1 demo
        </p>
      </footer>
    </div>
  );
}
