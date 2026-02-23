import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Cpu,
  Layers,
  Eye,
  ArrowRight,
  Minus,
  CircleDot,
  TrendingUp,
  Network,
  Users,
  FileCheck,
  Scale,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/* ── Phase definitions ── */
const PHASES = [
  {
    id: 'p1',
    num: 1,
    label: 'Phase 1',
    title: 'Advisory Intelligence',
    tag: 'Current',
    active: true,
  },
  {
    id: 'p2',
    num: 2,
    label: 'Phase 2',
    title: 'Predictive & Scenario Intelligence',
    tag: 'Planned',
    active: false,
  },
  {
    id: 'p3',
    num: 3,
    label: 'Phase 3',
    title: 'Adaptive Operational Optimization',
    tag: 'Future',
    active: false,
  },
];

/* ── Phase detail sections ── */
const PHASE_DETAILS = [
  {
    title: 'Phase 1 — Governed Advisory Intelligence',
    capabilities: [
      'Deterministic rule enforcement',
      'Critical load runway monitoring',
      'ETR band reasoning',
      'Hazard-aware advisory',
      'Structured output + traceability',
      'Human validation mandatory',
    ],
    technical: [
      'Nemotron governed invocation',
      'Supabase orchestration',
      'Rule-first gating',
      'Synthetic ingestion feeds',
    ],
    notIncluded: [
      'SCADA integration',
      'Load-flow simulation',
      'Automated switching',
      'Live DER dispatch',
    ],
    accent: 'emerald',
  },
  {
    title: 'Phase 2 — Predictive & Scenario Intelligence',
    capabilities: [
      'Probabilistic ETR modeling',
      'Asset failure likelihood modeling',
      'Vegetation risk forecasting',
      'Storm path impact simulation',
      'Crew routing optimization',
      'Predictive hazard overlays',
    ],
    technical: [
      'OMS integration',
      'Enterprise data ingestion',
      'GIS topology modeling',
      'Vector retrieval',
      'ML predictive modules',
    ],
    notIncluded: null,
    accent: 'blue',
  },
  {
    title: 'Phase 3 — Adaptive Operational Optimization',
    capabilities: [
      'Dynamic restoration sequencing advisory',
      'DER coordination advisory',
      'Risk-adjusted switching simulation',
      'Autonomous suggestion scoring (operator-approved)',
    ],
    technical: null,
    notIncluded: null,
    accent: 'amber',
    note: 'Human authority retained across all operational actions.',
  },
];

/* ── Evolution comparison matrix ── */
const EVOLUTION_MATRIX = [
  { capability: 'Rule Enforcement', p1: '✓', p2: '✓', p3: '✓' },
  { capability: 'ETR Band', p1: '✓', p2: '✓ (Probabilistic)', p3: '✓ (Dynamic)' },
  { capability: 'Hazard Correlation', p1: '✓', p2: '✓ (Predictive)', p3: '✓' },
  { capability: 'Simulation', p1: '—', p2: 'Partial', p3: 'Advanced' },
  { capability: 'Autonomous Action', p1: '—', p2: '—', p3: '— (Advisory only)' },
];

/* ── Strategic alignment ── */
const STRATEGIC_ITEMS = [
  { icon: Network, text: 'Enhances OMS (does not replace)' },
  { icon: Scale, text: 'Supports regulatory transparency' },
  { icon: Users, text: 'Reduces operator cognitive load' },
  { icon: ShieldCheck, text: 'Enables controlled AI adoption' },
  { icon: Zap, text: 'Scales across hazard types' },
];

const accentStyles = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    chip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    icon: 'text-emerald-400',
    heading: 'text-emerald-400',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    chip: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    icon: 'text-blue-400',
    heading: 'text-blue-400',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    chip: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    icon: 'text-amber-400',
    heading: 'text-amber-400',
  },
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

export default function SolutionRoadmap() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.header {...fade(0)}>
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Product Evolution Blueprint
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Structured progression from advisory intelligence to predictive operational optimization.
        </p>
      </motion.header>

      {/* ── Evolution Maturity Band ── */}
      <motion.section {...fade(0.05)}>
        <div className="flex items-stretch gap-2">
          {PHASES.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                'relative flex-1 rounded-xl border px-4 py-3.5 transition-all',
                p.active
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'border-border/20 bg-card/30',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    p.active
                      ? 'border-emerald-400 bg-emerald-500/15'
                      : 'border-border/30 bg-card/40',
                  )}
                >
                  <span className={cn('text-xs font-bold', p.active ? 'text-emerald-400' : 'text-muted-foreground/50')}>
                    {p.num}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', p.active ? 'text-emerald-400' : 'text-muted-foreground/50')}>
                      {p.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[8px] border',
                        p.active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'border-border/20 text-muted-foreground/40',
                      )}
                    >
                      {p.tag}
                    </Badge>
                  </div>
                  <p className={cn('text-[12px] font-semibold leading-tight mt-0.5 truncate', p.active ? 'text-foreground/90' : 'text-muted-foreground/50')}>
                    {p.title}
                  </p>
                </div>
              </div>

              {/* Active pulse */}
              {p.active && (
                <div className="absolute -top-1.5 -right-1.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-emerald-400/50" />
                  </span>
                </div>
              )}

              {/* Connector */}
              {i < PHASES.length - 1 && (
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Phase Detail Cards ── */}
      {PHASE_DETAILS.map((phase, idx) => {
        const s = accentStyles[phase.accent as keyof typeof accentStyles];
        return (
          <motion.section key={phase.title} {...fade(0.08 + idx * 0.05)}>
            <Card className={cn('border', s.border, s.bg)}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  {idx === 0 ? (
                    <ShieldCheck className={cn('h-4.5 w-4.5', s.icon)} />
                  ) : idx === 1 ? (
                    <Cpu className={cn('h-4.5 w-4.5', s.icon)} />
                  ) : (
                    <TrendingUp className={cn('h-4.5 w-4.5', s.icon)} />
                  )}
                  <h2 className="text-[14px] font-bold text-foreground/90">
                    {phase.title}
                  </h2>
                  {idx === 0 && (
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ml-1">
                      Active
                    </Badge>
                  )}
                </div>

                {/* Capabilities */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 mb-2">
                    Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.capabilities.map((c) => (
                      <span
                        key={c}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                          s.chip,
                        )}
                      >
                        <CheckCircle2 className={cn('h-3 w-3 flex-shrink-0', s.icon + '/70')} />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technical Characteristics */}
                {phase.technical && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 mb-2">
                      {idx === 0 ? 'Technical Characteristics' : 'Technical Additions'}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {phase.technical.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/80"
                        >
                          <CircleDot className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Included */}
                {phase.notIncluded && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] px-4 py-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400/60 mb-2">
                      Not Included in This Phase
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {phase.notIncluded.map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-400/70"
                        >
                          <XCircle className="h-3 w-3 flex-shrink-0" />
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phase note */}
                {phase.note && (
                  <div className="flex items-center gap-2 rounded border border-amber-500/20 bg-amber-500/[0.03] px-3 py-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-amber-400/80">{phase.note}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        );
      })}

      {/* ── Evolution Comparison Matrix ── */}
      <motion.section {...fade(0.25)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">
                Evolution Comparison Matrix
              </h2>
            </div>
            <div className="rounded-lg border border-border/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/20 bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 w-[200px]">
                      Capability
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/70 text-center">
                      Phase 1
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-blue-400/70 text-center">
                      Phase 2
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-amber-400/70 text-center">
                      Phase 3
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVOLUTION_MATRIX.map((row) => (
                    <TableRow key={row.capability} className="border-border/10 hover:bg-muted/20">
                      <TableCell className="text-[12px] font-semibold text-foreground/80">
                        {row.capability}
                      </TableCell>
                      <TableCell className="text-center">
                        <MatrixCell value={row.p1} />
                      </TableCell>
                      <TableCell className="text-center">
                        <MatrixCell value={row.p2} />
                      </TableCell>
                      <TableCell className="text-center">
                        <MatrixCell value={row.p3} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Strategic Alignment ── */}
      <motion.section {...fade(0.3)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">
                Strategic Alignment
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {STRATEGIC_ITEMS.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 rounded-lg border border-border/20 bg-card/30 px-3.5 py-2.5"
                >
                  <item.icon className="h-4 w-4 text-primary/60 flex-shrink-0" strokeWidth={1.75} />
                  <span className="text-[12px] font-medium text-foreground/80">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Phase-1 Boundary ── */}
      <motion.section {...fade(0.35)}>
        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-amber-400/70" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-400/60">
              Phase-1 Boundary — Not Included
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              'SCADA execution',
              'Automatic switching',
              'Load-flow simulation',
              'Protection coordination',
              'Autonomous dispatch',
              'Live DER control',
              'OMS/ADMS replacement',
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-400/70"
              >
                <XCircle className="h-3 w-3 flex-shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · No autonomous control · Human authority retained across all phases
        </p>
      </footer>
    </div>
  );
}

/* ── Matrix cell renderer ── */
function MatrixCell({ value }: { value: string }) {
  if (value === '—') {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />;
  }
  if (value === '✓') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 mx-auto" />;
  }
  return (
    <span className="text-[11px] font-medium text-foreground/70">{value}</span>
  );
}
