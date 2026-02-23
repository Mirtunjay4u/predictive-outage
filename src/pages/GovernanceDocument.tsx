import { motion } from 'framer-motion';
import {
  Shield, Cpu, Lock, AlertTriangle, CheckCircle2, XCircle,
  Users, Eye, FileText, Scale, Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/* ── Data ── */
const CORE_CONTROLS = [
  {
    icon: Shield,
    title: 'Deterministic Rule Enforcement',
    desc: 'Maintenance flags, lockouts, safety thresholds evaluated before AI invocation.',
  },
  {
    icon: Lock,
    title: 'Structured Prompt Control',
    desc: 'AI receives schema-bound structured context only.',
  },
  {
    icon: FileText,
    title: 'Structured Output Schema',
    desc: 'Responses constrained to defined advisory format.',
  },
  {
    icon: Users,
    title: 'Human Approval Mandatory',
    desc: 'No automated switching or dispatch actions.',
  },
  {
    icon: Eye,
    title: 'Full Decision Trace Logging',
    desc: 'Inputs, rules, advisory outputs logged for audit.',
  },
];

const AI_PROHIBITIONS = [
  'Execute SCADA commands',
  'Modify switching schedules',
  'Override lockouts',
  'Auto-dispatch crews',
  'Bypass safety thresholds',
];

const MODEL_CONTROLS = [
  { label: 'Primary Model', value: 'NVIDIA Nemotron' },
  { label: 'Fallback', value: 'Controlled routing logic' },
  { label: 'Invocation Mode', value: 'Structured context only' },
  { label: 'Hallucination Mitigation', value: 'Rule gate + output schema validation' },
];

const FAILURE_STEPS = [
  'Output rejected',
  'Fallback advisory applied',
  'Operator notified',
  'Trace logged',
];

const COMPLIANCE_ITEMS = [
  'Explainable AI principles',
  'Infrastructure safety governance',
  'Audit traceability requirements',
  'Operator-in-loop system design',
];

const PYRAMID_LAYERS = [
  {
    label: 'Operator Authority',
    sub: 'Final decision always human',
    accent: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400',
    width: 'max-w-[280px]',
  },
  {
    label: 'Deterministic Rule Gate',
    sub: 'Constraint enforcement before AI',
    accent: 'border-blue-500/40 bg-blue-500/8 text-blue-400',
    width: 'max-w-[380px]',
  },
  {
    label: 'AI Reasoning Layer (Nemotron)',
    sub: 'Governed advisory generation',
    accent: 'border-amber-500/40 bg-amber-500/8 text-amber-400',
    width: 'max-w-[480px]',
  },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.3, delay },
});

export default function GovernanceDocument() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.header {...fade(0)}>
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          AI Governance & Operational Safety Framework
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Deterministic constraint enforcement before AI-assisted reasoning.
        </p>
      </motion.header>

      {/* ── Governance Pyramid ── */}
      <motion.section {...fade(0.05)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Governance Hierarchy</h2>
            </div>
            <div className="flex flex-col items-center gap-2">
              {PYRAMID_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  {...fade(0.08 + i * 0.06)}
                  className={cn(
                    'w-full rounded-lg border px-4 py-3 text-center',
                    layer.accent,
                    layer.width,
                    'mx-auto',
                  )}
                >
                  <p className="text-[12px] font-bold">{layer.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{layer.sub}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
              AI operates within bounded decision envelopes.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Five Core Controls ── */}
      <motion.section {...fade(0.15)}>
        <SectionHeading icon={Shield} title="Five Core Controls" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CORE_CONTROLS.map((ctrl, i) => (
            <motion.div key={ctrl.title} {...fade(0.17 + i * 0.03)}>
              <Card className="border border-border/30 h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ctrl.icon className="h-4 w-4 text-primary/70" strokeWidth={1.75} />
                    <h3 className="text-[12px] font-semibold text-foreground/90">{ctrl.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{ctrl.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── AI Boundary Conditions ── */}
      <motion.section {...fade(0.25)}>
        <Card className="border border-destructive/15 bg-destructive/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-destructive/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">
                What AI Is Explicitly Not Allowed To Do
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_PROHIBITIONS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-[11px] font-medium text-destructive/70"
                >
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Model Governance Controls ── */}
      <motion.section {...fade(0.3)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Model Governance Controls</h2>
            </div>
            <div className="rounded-lg border border-border/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/20 bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 w-[200px]">
                      Control
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      Configuration
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODEL_CONTROLS.map((row) => (
                    <TableRow key={row.label} className="border-border/10 hover:bg-muted/20">
                      <TableCell className="text-[12px] font-semibold text-foreground/80">{row.label}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground/80">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-3">
              Model output is advisory, not authoritative.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Failure Mode Containment ── */}
      <motion.section {...fade(0.35)}>
        <Card className="border border-amber-500/20 bg-amber-500/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-400/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Failure Mode Containment</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mb-3">
              If AI output fails validation:
            </p>
            <div className="flex flex-col gap-2">
              {FAILURE_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400 flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-foreground/80 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Compliance Alignment ── */}
      <motion.section {...fade(0.4)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-4 w-4 text-primary/70" />
              <h2 className="text-[14px] font-bold text-foreground/90">Compliance Alignment</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPLIANCE_ITEMS.map((item) => (
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

      {/* ── Footer ── */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · No autonomous control · Human authority retained · Full trace logging
        </p>
      </footer>
    </div>
  );
}

/* ── Section heading helper ── */
function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary/70" />
      <h2 className="text-[14px] font-bold text-foreground/90">{title}</h2>
    </div>
  );
}
