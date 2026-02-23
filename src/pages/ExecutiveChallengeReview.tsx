import { motion } from 'framer-motion';
import {
  Shield, ServerCrash, UserCheck, Scaling, Gavel, Swords,
  Construction, ShieldCheck, CheckCircle2, ChevronRight, MessageSquareWarning,
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

function ChallengeSection({ index, icon: Icon, number, question, children, callout }: {
  index: number; icon: React.ElementType; number: string; question?: string; children: React.ReactNode; callout?: string;
}) {
  return (
    <motion.div {...fade(index)}>
      <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/8">
              <Icon className="h-4 w-4 text-primary/70" strokeWidth={1.6} />
            </div>
            <h2 className="text-[14px] font-semibold text-foreground/90">{number}</h2>
            <Badge variant="outline" className="ml-auto border-border/20 text-[9px] font-medium text-muted-foreground/60">
              Challenge
            </Badge>
          </div>
          {question && (
            <div className="flex items-start gap-2.5 rounded-md border border-warning/15 bg-warning/3 px-4 py-3">
              <MessageSquareWarning className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning/70" />
              <p className="text-[12px] font-semibold text-warning/90 italic">{question}</p>
            </div>
          )}
          <Separator className="bg-border/20" />
          {children}
          {callout && (
            <Card className="border-primary/15 bg-primary/3">
              <CardContent className="px-4 py-3">
                <p className="text-[11px] font-semibold text-primary/80">{callout}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/80 leading-relaxed">
          <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ExecutiveChallengeReview() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      {/* Header */}
      <motion.div {...fade(0)}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Executive Technical Challenge Review
          </h1>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
            Governance
          </Badge>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground/70">
          Structured responses to critical architectural, operational, and governance questions.
        </p>
      </motion.div>

      <Separator className="bg-border/20" />

      {/* 1 */}
      <ChallengeSection index={1} icon={Shield} number="1. AI Safety Challenge" question="What prevents unsafe AI recommendations?" callout="Model output cannot override deterministic rule gates.">
        <BulletList items={[
          'Deterministic rule engine executes before any AI reasoning',
          'Maintenance and lock flags enforced at ingestion layer',
          'Advisory-only boundary — no operational command authority',
          'Structured output schema validation on all model responses',
          'No control authority granted to AI layer',
        ]} />
      </ChallengeSection>

      {/* 2 */}
      <ChallengeSection index={2} icon={ServerCrash} number="2. Model Availability Challenge" question="What happens if AI is unavailable?">
        <BulletList items={[
          'Advisory generation pauses gracefully',
          'Fallback template mode provides structured context without AI',
          'Operator notified of degraded advisory state',
          'System fails closed — no unsafe default outputs',
        ]} />
      </ChallengeSection>

      {/* 3 */}
      <ChallengeSection index={3} icon={UserCheck} number="3. Operator Dependency Challenge" question="What prevents over-reliance on AI advisory?">
        <BulletList items={[
          'Manual confirmation required before any operational action',
          'Confidence band visible on all advisory outputs',
          'Escalation protocol defined for low-confidence conditions',
          'Policy blocks exposed transparently to operator',
        ]} />
      </ChallengeSection>

      {/* 4 */}
      <ChallengeSection index={4} icon={Scaling} number="4. Scalability Challenge" question="Can this scale beyond demo?">
        <BulletList items={[
          'Stateless rule layer — horizontally scalable',
          'Modular ingestion adapters for OMS, GIS, SCADA feeds',
          'Model routing abstraction supports provider flexibility',
          'Loose coupling architecture enables independent scaling',
        ]} />
      </ChallengeSection>

      {/* 5 */}
      <ChallengeSection index={5} icon={Gavel} number="5. Regulatory Claim Challenge" question="Are we claiming compliance certification?">
        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-foreground/90">No.</p>
          <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
            The system supports traceability and structured reasoning documentation. Formal compliance certification remains under utility governance authority.
          </p>
        </div>
      </ChallengeSection>

      {/* 6 */}
      <ChallengeSection index={6} icon={Swords} number="6. Competitive Positioning Challenge" question="Why not let OMS vendors add AI?">
        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
            OMS manages outage lifecycle mechanics — ticket creation, status tracking, and field dispatch.
          </p>
          <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
            Operator Copilot structures constraint-aware reasoning across governance layers, synthesizing multiple correlation streams into a single governed advisory surface. These are complementary, not competing, functions.
          </p>
        </div>
      </ChallengeSection>

      {/* 7 */}
      <ChallengeSection index={7} icon={Construction} number="7. Phase-1 Limitations">
        <div className="flex flex-wrap gap-2">
          {[
            'Synthetic data ingestion',
            'No probabilistic ETR modeling',
            'No live topology simulation',
            'Advisory-only output',
          ].map(item => (
            <Badge key={item} variant="outline" className="text-[10px] font-medium border-amber-500/20 bg-amber-500/5 text-amber-400/80">
              {item}
            </Badge>
          ))}
        </div>
      </ChallengeSection>

      {/* 8 */}
      <ChallengeSection index={8} icon={ShieldCheck} number="8. Risk Containment Summary" callout="Advisory-only boundary reduces operational liability exposure.">
        <ul className="space-y-2">
          {[
            'Rule-first enforcement',
            'Human-in-the-loop authority',
            'Advisory boundary maintained',
            'Full trace logging preserved',
            'Explicit limitations documented',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/80 leading-relaxed">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success/60" />
              {item}
            </li>
          ))}
        </ul>
      </ChallengeSection>

      {/* Footer */}
      <Separator className="bg-border/20" />
      <motion.p {...fade(10)} className="text-center text-[10px] text-muted-foreground/40 pb-4">
        Advisory-only · Operator authority preserved · No autonomous control · Human-in-the-loop required
      </motion.p>
    </div>
  );
}
