import { motion } from 'framer-motion';
import {
  Layers, XCircle, CheckCircle2, Shield, HelpCircle,
  TrendingUp, Network, Cpu, Zap, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ── Technology Landscape ── */
const LANDSCAPE = [
  {
    title: 'Traditional OMS',
    items: ['Outage tracking', 'Crew dispatch', 'Event lifecycle'],
    accent: 'border-border/30',
  },
  {
    title: 'ADMS',
    items: ['Network modeling', 'Switching analysis', 'Operational optimization'],
    accent: 'border-border/30',
  },
  {
    title: 'DERMS',
    items: ['Distributed energy coordination', 'Resource balancing'],
    accent: 'border-border/30',
  },
  {
    title: 'Operator Copilot',
    items: [
      'Constraint-aware advisory reasoning',
      'ETR uncertainty framing',
      'Critical load runway monitoring',
      'Structured decision trace',
    ],
    accent: 'border-emerald-500/30 bg-emerald-500/[0.03]',
    highlight: true,
  },
];

const NOT_LIST = [
  'Replace OMS lifecycle management',
  'Replace ADMS switching analysis',
  'Replace DERMS control functions',
  'Perform autonomous grid control',
];

const PILLARS = [
  'Deterministic rule gate before AI',
  'Structured advisory output',
  'Human-in-loop enforcement',
  'Hazard-agnostic decision framework',
  'Governance-first architecture',
];

const FAQ = [
  {
    q: 'Why not enhance OMS directly?',
    a: 'OMS tracks lifecycle; Copilot structures constraint-aware reasoning above event management.',
  },
  {
    q: 'Why not embed AI into ADMS?',
    a: 'Copilot operates above control systems to preserve operational authority boundaries.',
  },
  {
    q: 'Is this automation?',
    a: 'No. Advisory-only. Human authority retained across all operational actions.',
  },
];

const STRATEGIC_VALUE = [
  'Reduces operator cognitive compression',
  'Improves regulatory defensibility',
  'Makes uncertainty explicit',
  'Enables safe AI adoption roadmap',
  'Preserves existing system investment',
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.3, delay },
});

export default function MarketPositioning() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.header {...fade(0)}>
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Strategic Positioning & Market Context
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Where Operator Copilot fits within the utility technology ecosystem.
        </p>
      </motion.header>

      {/* ── Technology Landscape Grid ── */}
      <motion.section {...fade(0.05)}>
        <SectionHeading icon={Network} title="Technology Landscape" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LANDSCAPE.map((col, i) => (
            <motion.div key={col.title} {...fade(0.07 + i * 0.03)}>
              <Card className={cn('border h-full', col.accent)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {col.highlight && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                    <h3 className={cn(
                      'text-[12px] font-bold',
                      col.highlight ? 'text-emerald-400' : 'text-foreground/80',
                    )}>
                      {col.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground/70 leading-relaxed">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/30" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-3">
          Overlay intelligence layer — not infrastructure replacement.
        </p>
      </motion.section>

      {/* ── What We Are Not ── */}
      <motion.section {...fade(0.2)}>
        <Card className="border border-amber-500/15 bg-amber-500/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-amber-400/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">
                What Operator Copilot Does Not Do
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NOT_LIST.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[11px] font-medium text-amber-400/70"
                >
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Category Differentiation ── */}
      <motion.section {...fade(0.25)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Category Differentiation</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PILLARS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 rounded-lg border border-border/20 bg-card/30 px-3.5 py-2.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Anticipated Questions ── */}
      <motion.section {...fade(0.3)}>
        <SectionHeading icon={HelpCircle} title="Anticipated Questions" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FAQ.map((faq, i) => (
            <motion.div key={i} {...fade(0.32 + i * 0.03)}>
              <Card className="border border-border/30 h-full">
                <CardContent className="p-4">
                  <p className="text-[12px] font-semibold text-foreground/90 mb-2">{faq.q}</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Strategic Value ── */}
      <motion.section {...fade(0.4)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Strategic Value</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {STRATEGIC_VALUE.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/80"
                >
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                  {v}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · Overlay intelligence · No infrastructure replacement · Human authority retained
        </p>
      </footer>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary/70" />
      <h2 className="text-[14px] font-bold text-foreground/90">{title}</h2>
    </div>
  );
}
