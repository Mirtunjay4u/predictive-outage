import { useNavigate } from 'react-router-dom';
import { Shield, Gauge, CloudLightning, Brain, Map, Network, CheckCircle, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const comparisonRows = [
  { traditional: 'Event detection & tracking', copilot: 'Decision augmentation under uncertainty' },
  { traditional: 'Static ETR values', copilot: 'Confidence-based ETR band modeling' },
  { traditional: 'Manual triage escalation', copilot: 'Policy-constrained AI advisory' },
  { traditional: 'Reactive dispatch workflows', copilot: 'Hazard-informed prioritization logic' },
  { traditional: 'Ticket management', copilot: 'Deterministic rule-backed advisory filtering' },
];

const governanceItems = [
  'Deterministic rule engine precedes AI inference',
  'Asset lock and maintenance enforcement',
  'Critical load protection logic',
  'Structured output contract (no uncontrolled AI generation)',
  'Advisory-only architecture (no SCADA execution)',
  'Human-in-the-loop posture maintained',
];

const capabilities = [
  {
    icon: Gauge,
    title: 'Confidence-Based ETR Modeling',
    bullets: ['Probabilistic restoration ranges', 'Uncertainty transparency', 'Hazard-adjusted estimates', 'Critical load runway sensitivity'],
  },
  {
    icon: Shield,
    title: 'Critical Load Prioritization',
    bullets: ['Infrastructure tagging', 'Escalation thresholds', 'Runway awareness', 'Backup runtime monitoring'],
  },
  {
    icon: CloudLightning,
    title: 'Hazard-Correlated Risk Scoring',
    bullets: ['Weather overlay integration', 'Exposure-adjusted prioritization', 'Crew safety gating', 'Feeder-level vulnerability'],
  },
  {
    icon: Brain,
    title: 'Explainable AI Advisory',
    bullets: ['Guardrail enforcement', 'Allowed vs Restricted outputs', 'Structured reasoning trace', 'Policy-based blocking'],
  },
];

const businessValues = [
  'Reduced triage latency',
  'Improved prioritization accuracy',
  'Increased ETR communication confidence',
  'Reduced escalation ambiguity',
  'Governance-aligned AI augmentation',
];

const phase1Included = [
  'Advisory intelligence layer',
  'Deterministic rule enforcement',
  'Hazard-informed analysis',
  'AI-assisted advisory insights',
];

const phase1Excluded = [
  'Autonomous switching',
  'Breaker actuation',
  'Load flow simulation',
  'SCADA execution',
];

const postureItems = [
  { label: 'System Risk Index', value: 'Stabilized' },
  { label: 'Critical Load Exposure', value: 'Reduced' },
  { label: 'Policy Violations', value: 'None' },
  { label: 'Crew Deployment', value: 'Within threshold' },
  { label: 'AI Confidence Band', value: 'High' },
];

function SectionHeader({ title, number }: { title: string; number: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function Conclusion({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-[13px] font-medium text-primary/90 leading-relaxed">{children}</p>
    </div>
  );
}

export default function ExecutiveValidation() {
  const navigate = useNavigate();

  const handleRestartTour = () => {
    window.dispatchEvent(new CustomEvent('start-executive-tour'));
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Executive Validation Summary</h1>
              <p className="mt-1 text-sm text-muted-foreground">AI-Constrained Operational Decision Support Assessment</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold tracking-wide">
              ADVISORY MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">

        {/* Section 1 — Differentiation */}
        <section data-tour-section="validation-differentiation">
          <SectionHeader title="Operational Differentiation" number={1} />
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Traditional OMS</TableHead>
                    <TableHead className="w-1/2 text-primary font-semibold text-xs uppercase tracking-wider">Operator Copilot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-[13px] text-muted-foreground">{row.traditional}</TableCell>
                      <TableCell className="text-[13px] font-medium text-foreground">{row.copilot}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Conclusion>This platform strengthens operator decision context without replacing OMS control systems.</Conclusion>
            </CardContent>
          </Card>
        </section>

        {/* Section 2 — Safety & Governance */}
        <section data-tour-section="validation-governance">
          <SectionHeader title="AI Governance & Operational Safety" number={2} />
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2.5">
                {governanceItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-[13px] text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <Conclusion>AI operates strictly within defined operational and regulatory boundaries.</Conclusion>
            </CardContent>
          </Card>
        </section>

        {/* Section 3 — Capabilities */}
        <section data-tour-section="validation-capabilities">
          <SectionHeader title="Capabilities Demonstrated" number={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <Card key={cap.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <cap.icon className="h-4 w-4 text-primary" />
                    {cap.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {cap.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <Conclusion>The system augments situational awareness and improves decision defensibility during high-impact outage events.</Conclusion>
        </section>

        {/* Section 4 — Business Impact */}
        <section data-tour-section="validation-business-impact">
          <SectionHeader title="Operational & Strategic Value" number={4} />
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {businessValues.map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-md border border-border/40 bg-muted/20 px-3 py-2.5">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span className="text-[13px] font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md border border-primary/25 bg-primary/5 px-4 py-3">
                <p className="text-[13px] font-semibold text-primary leading-relaxed">
                  This solution represents a defensible AI-constrained decision intelligence layer for regulated utility outage operations.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5 — Phase 1 Scope */}
        <section data-tour-section="validation-phase1-scope">
          <SectionHeader title="Phase 1 Operational Scope" number={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-emerald-600 dark:text-emerald-400">Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phase1Included.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Not Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phase1Excluded.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span className="h-3.5 w-3.5 flex items-center justify-center text-muted-foreground/50">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 rounded-md border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-[13px] font-semibold text-foreground">Phase 1 focuses on decision intelligence — not automation.</p>
          </div>
        </section>

        {/* Operational Posture Summary */}
        <section>
          <Separator className="mb-6" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Operational Posture Summary</h3>
          <div className="grid gap-3 sm:grid-cols-5">
            {postureItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/40 bg-card px-3 py-3 text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap items-center gap-3 pt-2 pb-8">
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
          <Button variant="outline" onClick={handleRestartTour} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Executive Tour
          </Button>
          <Button variant="outline" onClick={() => navigate('/architecture')} className="gap-2">
            <Network className="h-4 w-4" />
            View Architecture
          </Button>
        </section>
      </main>
    </div>
  );
}
