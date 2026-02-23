import { motion } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Eye, AlertTriangle,
  Scale, FileText, Cpu, CloudLightning, Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const REGULATORY_AWARENESS = [
  'Reliability standard environments (e.g., NERC framework context)',
  'Outage communication reporting requirements',
  'Emergency response documentation practices',
  'Critical infrastructure protection considerations',
  'Audit trace retention expectations',
];

const TRACEABILITY = [
  'Advisory outputs logged',
  'Rule evaluation trace preserved',
  'Model confidence retained',
  'Operator confirmation required',
  'Timestamped advisory records',
];

const AI_SAFEGUARDS = [
  'Rule-first enforcement',
  'Blocked recommendations flagged',
  'Maintenance and lock constraints enforced',
  'Structured output schema',
  'No free-form AI authority',
];

const EXTREME_EVENT = [
  'Critical loads prioritized',
  'ETR uncertainty framed',
  'Hazard-exposed assets flagged',
  'Advisory boundary maintained',
];

const PHASE1_LIMITS = [
  'Synthetic ingestion',
  'No live SCADA integration',
  'No switching automation',
  'Advisory-only design',
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.3, delay },
});

export default function RegulatoryAlignment() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.header {...fade(0)}>
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Regulatory & Operational Governance Alignment
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Supporting safe, auditable decision intelligence within regulated utility environments.
        </p>
      </motion.header>

      {/* 1. Operational Authority */}
      <motion.section {...fade(0.05)}>
        <Card className="border border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-5">
            <SectionHeading icon={Shield} title="Operational Authority Preserved" />
            <div className="space-y-2 text-[12px] leading-relaxed text-foreground/85">
              <p>Operator Copilot does not execute grid control actions. All recommendations are advisory.</p>
              <p><strong>Operational authority remains with certified control room personnel.</strong></p>
              <p className="text-muted-foreground/70">
                No breaker, switching, dispatch, or DER command execution is automated.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 2. Regulatory Context Awareness */}
      <motion.section {...fade(0.1)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Scale} title="Regulatory Context Awareness" />
            <p className="text-[11px] text-muted-foreground/60 mb-3">System designed with awareness of:</p>
            <div className="space-y-1.5">
              {REGULATORY_AWARENESS.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-4 border-t border-border/20 pt-3">
              The system supports structured reasoning documentation but does not replace formal compliance processes.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 3. Traceability & Auditability */}
      <motion.section {...fade(0.15)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Eye} title="Traceability & Auditability" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TRACEABILITY.map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-lg border border-border/20 bg-card/30 px-3.5 py-2.5">
                  <FileText className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-3">
              Outputs are reproducible within structured input constraints.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 4. AI Governance Safeguards */}
      <motion.section {...fade(0.2)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Lock} title="AI Governance Safeguards" />
            <div className="space-y-1.5">
              {AI_SAFEGUARDS.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-4 border-t border-border/20 pt-3">
              Model responses cannot override deterministic policy gates.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 5. Extreme Event Alignment */}
      <motion.section {...fade(0.25)}>
        <Card className="border border-amber-500/15 bg-amber-500/[0.02]">
          <CardContent className="p-5">
            <SectionHeading icon={CloudLightning} title="Extreme Event Alignment" />
            <p className="text-[11px] text-muted-foreground/60 mb-3">
              During storm, wildfire, flood, or ice events:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXTREME_EVENT.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 px-2.5 py-1 text-[11px] font-medium text-amber-400/80"
                >
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 6. Phase-1 Limitations */}
      <motion.section {...fade(0.3)}>
        <Card className="border border-destructive/10 bg-destructive/[0.02]">
          <CardContent className="p-5">
            <SectionHeading icon={Cpu} title="Phase-1 Limitations" />
            <div className="flex flex-wrap gap-1.5">
              {PHASE1_LIMITS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/15 bg-destructive/5 px-2.5 py-1 text-[11px] font-medium text-destructive/70"
                >
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Advisory-only · No compliance certification claimed · Human authority retained · Full trace logging
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
