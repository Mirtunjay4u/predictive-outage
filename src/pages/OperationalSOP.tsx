import { motion } from 'framer-motion';
import {
  Shield, UserCheck, Workflow, AlertTriangle, Ban, CloudLightning,
  FileText, Construction, CheckCircle2, Target, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: 0.06 * i },
});

/* ── Chip list helper ── */
function ChipList({ items, color = 'primary' }: { items: string[]; color?: string }) {
  const styles: Record<string, string> = {
    primary: 'border-primary/20 bg-primary/5 text-primary/80',
    warning: 'border-warning/20 bg-warning/5 text-warning/80',
    destructive: 'border-destructive/20 bg-destructive/5 text-destructive/80',
    teal: 'border-teal-500/20 bg-teal-500/5 text-teal-400/80',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400/80',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <Badge key={item} variant="outline" className={cn('text-[10px] font-medium', styles[color] ?? styles.primary)}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

/* ── Numbered step ── */
function StepItem({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary/80">
        {num}
      </span>
      <span className="text-[12px] text-foreground/80">{label}</span>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ index, icon: Icon, title, badge, children }: {
  index: number; icon: React.ElementType; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <motion.div {...fade(index)}>
      <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/8">
              <Icon className="h-4 w-4 text-primary/70" strokeWidth={1.6} />
            </div>
            <h2 className="text-[14px] font-semibold text-foreground/90">{title}</h2>
            {badge && (
              <Badge variant="outline" className="ml-auto border-border/20 text-[9px] font-medium text-muted-foreground/60">
                {badge}
              </Badge>
            )}
          </div>
          <Separator className="bg-border/20" />
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Bullet list ── */
function BulletList({ items, icon }: { items: string[]; icon?: React.ElementType }) {
  const BIcon = icon ?? ChevronRight;
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/80 leading-relaxed">
          <BIcon className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function OperationalSOP() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      {/* Header */}
      <motion.div {...fade(0)}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Operational Standard Operating Framework
          </h1>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
            SOP
          </Badge>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground/70">
          Structured guidance for advisory-based outage decision support.
        </p>
      </motion.div>

      <Separator className="bg-border/20" />

      {/* 1. Purpose & Scope */}
      <Section index={1} icon={Target} title="Purpose & Scope" badge="Section 1">
        <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
          This framework defines how Operator Copilot is to be used within outage management workflows.
          The system operates in an <span className="font-semibold text-foreground/80">advisory-only</span> capacity
          with no operational command authority.
        </p>
        <div className="pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2 block">
            Applicable Event Types
          </span>
          <ChipList items={['Storm Events', 'Wildfire Exposure', 'Ice Events', 'Flood Risk', 'Vegetation Impact']} />
        </div>
      </Section>

      {/* 2. Operator Responsibilities */}
      <Section index={2} icon={UserCheck} title="Operator Responsibilities" badge="Section 2">
        <BulletList items={[
          'Review advisory output before any operational action',
          'Validate asset status against field conditions',
          'Confirm crew availability and shift constraints',
          'Confirm hazard exposure and safety clearance',
          'Document final decision with reasoning trace',
        ]} icon={CheckCircle2} />
        <Card className="mt-3 border-primary/15 bg-primary/3">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-semibold text-primary/80">
              The operator remains the final authority on all operational decisions.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* 3. Advisory Workflow */}
      <Section index={3} icon={Workflow} title="Advisory Workflow" badge="Section 3">
        <div className="space-y-3">
          {[
            'Event detected via ingestion layer',
            'Deterministic rule validation applied',
            'AI advisory generation (policy-bounded)',
            'Confidence evaluation and band assignment',
            'Operator review and assessment',
            'Manual action decision by authorized personnel',
            'Documentation logging with timestamp',
          ].map((step, i) => (
            <StepItem key={i} num={i + 1} label={step} />
          ))}
        </div>
      </Section>

      {/* 4. Escalation Protocol */}
      <Section index={4} icon={AlertTriangle} title="Escalation Protocol" badge="Section 4">
        <p className="text-[12px] text-muted-foreground/80 leading-relaxed mb-3">
          Escalation is required when any of the following conditions are detected:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Low Confidence Threshold', desc: 'Advisory confidence falls below acceptable band' },
            { label: 'Critical Load Runway Low', desc: 'Backup runtime approaching escalation threshold' },
            { label: 'Conflicting Signals', desc: 'Multiple data sources produce contradictory assessments' },
            { label: 'Rule Block Triggered', desc: 'Deterministic policy gate rejects advisory output' },
          ].map(item => (
            <Card key={item.label} className="border-warning/15 bg-warning/3">
              <CardContent className="px-4 py-3">
                <p className="text-[11px] font-semibold text-warning/90">{item.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 5. Prohibited Usage */}
      <Section index={5} icon={Ban} title="Prohibited Usage" badge="Section 5">
        <p className="text-[12px] text-muted-foreground/80 leading-relaxed mb-3">
          The system must not be used for the following activities under any circumstances:
        </p>
        <ChipList
          items={[
            'Execute switching operations',
            'Operate circuit breakers',
            'Modify protection settings',
            'Dispatch DER commands',
            'Override SCADA controls',
          ]}
          color="destructive"
        />
      </Section>

      {/* 6. Extreme Event Handling */}
      <Section index={6} icon={CloudLightning} title="Extreme Event Handling" badge="Section 6">
        <p className="text-[12px] text-muted-foreground/80 leading-relaxed mb-3">
          During severe weather or high-impact events, the following operational adjustments apply:
        </p>
        <BulletList items={[
          'Advisory cadence increases to reflect event velocity',
          'Confidence bands widen to account for uncertainty',
          'Hazard overlays are prioritized in situational displays',
          'Escalation sensitivity is increased across all thresholds',
        ]} />
      </Section>

      {/* 7. Documentation Requirements */}
      <Section index={7} icon={FileText} title="Documentation Requirements" badge="Section 7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Advisory Logged', desc: 'All generated advisories captured with full context' },
            { label: 'Operator Decision Logged', desc: 'Final operator action recorded with reasoning' },
            { label: 'Escalation Logged', desc: 'All escalation triggers and outcomes preserved' },
            { label: 'Timestamp Preserved', desc: 'Immutable chronological record maintained' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success/60" />
              <div>
                <p className="text-[11px] font-semibold text-foreground/80">{item.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 8. Phase-1 Limitations */}
      <Section index={8} icon={Construction} title="Phase-1 Limitations" badge="Section 8">
        <ChipList
          items={[
            'Synthetic data ingestion',
            'No live SCADA integration',
            'Advisory-only boundary',
            'Manual operator confirmation required',
          ]}
          color="amber"
        />
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-3">
          These boundaries define the current operational envelope. Expansion requires formal governance review and approval.
        </p>
      </Section>

      {/* Footer */}
      <Separator className="bg-border/20" />
      <motion.p {...fade(10)} className="text-center text-[10px] text-muted-foreground/40 pb-4">
        Advisory-only · Operator authority preserved · No autonomous control · Human-in-the-loop required
      </motion.p>
    </div>
  );
}
