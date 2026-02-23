import { motion } from 'framer-motion';
import {
  DollarSign, TrendingDown, Shield, Layers, CheckCircle2,
  AlertTriangle, ChevronRight, Zap, BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FINANCIAL_PRESSURES = [
  'Extended outage penalties',
  'Regulatory scrutiny exposure',
  'Overtime crew escalation',
  'Misallocated resource dispatch',
  'Customer compensation exposure',
  'Service reliability impact',
];

const IMPACT_AREAS = [
  'ETR confidence framing reduces premature commitments',
  'Critical load prioritization protects high-impact infrastructure',
  'Structured crew redeployment insight reduces inefficiency',
  'Structured situation reporting improves audit defensibility',
  'Hazard correlation awareness improves preparedness posture',
];

const COST_MODEL = [
  'Misallocated crew cycles by even small percentages',
  'Extended outage duration marginally',
  'Reporting friction during regulatory review',
];

const OVERLAY_POINTS = [
  'Does not replace OMS or ADMS',
  'Leverages existing infrastructure investment',
  'Modular integration path',
  'Phased adoption strategy',
];

const PHASE_1_VALUE = [
  'Governance discipline',
  'Structured advisory layer',
  'Reporting efficiency',
];

const PHASE_2_VALUE = [
  'Predictive modeling overlays',
  'Probabilistic ETR analysis',
  'Historical outage intelligence',
];

const RISK_REDUCTION = [
  'Reduces decision ambiguity',
  'Preserves operator authority',
  'Improves regulatory transparency',
  'Creates traceable advisory records',
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.3, delay },
});

export default function FinancialImpact() {
  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.header {...fade(0)}>
        <h1 className="text-[1.35rem] font-bold tracking-tight text-foreground">
          Operational Financial Impact & ROI Considerations
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1">
          Evaluating decision intelligence as a cost-risk mitigation layer.
        </p>
      </motion.header>

      {/* 1. Financial Pressure */}
      <motion.section {...fade(0.05)}>
        <Card className="border border-destructive/10 bg-destructive/[0.02]">
          <CardContent className="p-5">
            <SectionHeading icon={AlertTriangle} title="Financial Pressure During Severe Events" />
            <div className="flex flex-wrap gap-1.5">
              {FINANCIAL_PRESSURES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/15 bg-destructive/5 px-2.5 py-1 text-[11px] font-medium text-destructive/70"
                >
                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 2. Decision Intelligence Impact Areas */}
      <motion.section {...fade(0.1)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Zap} title="Decision Intelligence Impact Areas" />
            <div className="space-y-1.5">
              {IMPACT_AREAS.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 3. Illustrative Cost Influence Model */}
      <motion.section {...fade(0.15)}>
        <Card className="border border-amber-500/15 bg-amber-500/[0.02]">
          <CardContent className="p-5">
            <SectionHeading icon={TrendingDown} title="Illustrative Cost Influence Model" />
            <p className="text-[12px] text-foreground/80 mb-3">
              If structured decision support reduces:
            </p>
            <div className="space-y-1.5 mb-4">
              {COST_MODEL.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-amber-400/70 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-foreground/75">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] font-medium text-foreground/85">
              Then cumulative financial exposure during extreme events may decrease.
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-3 border-t border-border/20 pt-3">
              Specific dollar claims intentionally omitted — impact is context-dependent and utility-specific.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 4. Non-Disruptive Overlay Model */}
      <motion.section {...fade(0.2)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Layers} title="Non-Disruptive Overlay Model" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OVERLAY_POINTS.map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-lg border border-border/20 bg-card/30 px-3.5 py-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 5. Phased Value Realization */}
      <motion.section {...fade(0.25)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border border-emerald-500/20 bg-emerald-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-emerald-400/70" />
                <h3 className="text-[13px] font-bold text-foreground/90">Phase 1 Value</h3>
                <Badge variant="outline" className="text-[8px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ml-auto">
                  Current
                </Badge>
              </div>
              <div className="space-y-1.5">
                {PHASE_1_VALUE.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500/70 flex-shrink-0" />
                    <span className="text-[12px] text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-blue-500/20 bg-blue-500/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-blue-400/70" />
                <h3 className="text-[13px] font-bold text-foreground/90">Phase 2 Value</h3>
                <Badge variant="outline" className="text-[8px] bg-blue-500/15 text-blue-400 border-blue-500/30 ml-auto">
                  Planned
                </Badge>
              </div>
              <div className="space-y-1.5">
                {PHASE_2_VALUE.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-blue-400/70 flex-shrink-0" />
                    <span className="text-[12px] text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* 6. Risk Reduction Summary */}
      <motion.section {...fade(0.3)}>
        <Card className="border border-border/30">
          <CardContent className="p-5">
            <SectionHeading icon={Shield} title="Risk Reduction Summary" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RISK_REDUCTION.map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-lg border border-border/20 bg-card/30 px-3.5 py-2.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500/70 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-4 border-t border-border/20 pt-3">
              Advisory-only boundary reduces operational liability exposure.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <footer className="pb-4 pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/40 tracking-wide">
          Conservative fiscal framing · No inflated ROI claims · Advisory-only · Human authority retained
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
