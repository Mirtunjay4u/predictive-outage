import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Target, Rocket, Compass, CheckCircle2,
  XCircle, ArrowRight, Network, Gavel, CircleDollarSign,
  ClipboardCheck, FileStack, Route, Cpu, Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: 0.06 * i },
});

function Section({ index, icon: Icon, number, title, children }: {
  index: number; icon: React.ElementType; number: string; title: string; children: React.ReactNode;
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
            <Badge variant="outline" className="ml-auto border-border/20 text-[9px] font-medium text-muted-foreground/60">
              {number}
            </Badge>
          </div>
          <Separator className="bg-border/20" />
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const EXEC_SUMMARY = [
  'Governance-first decision intelligence overlay',
  'Deterministic rule gate before AI reasoning',
  'Advisory-only operational boundary',
  'Structured ETR confidence modeling',
  'Critical infrastructure prioritization',
  'Audit-traceable advisory output',
];

const INCLUDED = [
  'Decision intelligence overlay',
  'Structured advisory output',
  'Hazard-aware prioritization',
  'Rule-enforced governance',
  'Executive reporting',
];

const EXCLUDED = [
  'No switching automation',
  'No SCADA integration',
  'No autonomous dispatch',
];

const PHASE2 = [
  'Historical outage learning',
  'Probabilistic ETR modeling',
  'Live OMS integration',
  'GIS topology ingestion',
  'Predictive hazard modeling',
  'DER coordination advisory',
];

const NAV_INDEX = [
  { label: 'Technical Architecture Review', path: '/architecture-review', icon: Network },
  { label: 'Market Positioning', path: '/market-positioning', icon: Compass },
  { label: 'Regulatory Alignment', path: '/regulatory-alignment', icon: Gavel },
  { label: 'Financial Impact', path: '/financial-impact', icon: CircleDollarSign },
  { label: 'Operational SOP', path: '/operational-sop', icon: ClipboardCheck },
  { label: 'Documentation Center', path: '/documentation-center', icon: FileStack },
  { label: 'Roadmap Blueprint', path: '/solution-roadmap', icon: Route },
];

const RELEASE_META = [
  { label: 'Version', value: '1.0 — GTC 2026 Edition' },
  { label: 'Release Classification', value: 'Phase-1 Advisory' },
  { label: 'Architecture Status', value: 'Modular Overlay' },
  { label: 'AI Model', value: 'NVIDIA Nemotron (Structured Invocation)' },
  { label: 'Data Mode', value: 'Synthetic Scenario / Controlled Integration' },
];

export default function ExecutiveOverview() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      {/* Hero Header */}
      <motion.div {...fade(0)} className="text-center space-y-3">
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
            Phase 1
          </Badge>
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-[9px] font-semibold uppercase tracking-wider text-amber-400/70">
            Advisory Intelligence Release
          </Badge>
          <Badge variant="outline" className="border-border/20 text-[9px] font-medium text-muted-foreground/60">
            GTC Edition
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operator Copilot
        </h1>
        <p className="text-[14px] font-medium text-foreground/70">Predictive Outage Management</p>
        <p className="text-[13px] text-muted-foreground/60">Grid Resilience Command Center</p>
      </motion.div>

      <Separator className="bg-border/20" />

      {/* 1. Executive Summary */}
      <Section index={1} icon={Target} number="Section 1" title="Executive Summary">
        <ul className="space-y-2.5">
          {EXEC_SUMMARY.map(item => (
            <li key={item} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/80 leading-relaxed">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success/60" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* 2. Phase 1 Capability Scope */}
      <Section index={2} icon={Shield} number="Section 2" title="Phase 1 Capability Scope">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-success/70">Included</span>
            <ul className="space-y-2">
              {INCLUDED.map(item => (
                <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive/70">Excluded</span>
            <ul className="space-y-2">
              {EXCLUDED.map(item => (
                <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/80">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 3. Phase 2 Strategic Direction */}
      <Section index={3} icon={Rocket} number="Section 3" title="Phase 2 Strategic Direction">
        <div className="flex flex-wrap gap-2">
          {PHASE2.map(item => (
            <Badge key={item} variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary/80">
              {item}
            </Badge>
          ))}
        </div>
      </Section>

      {/* 4. Executive Navigation Index */}
      <Section index={4} icon={Compass} number="Section 4" title="Executive Navigation Index">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NAV_INDEX.map(nav => (
            <Button
              key={nav.path}
              variant="ghost"
              className="justify-start gap-3 h-10 text-[12px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-primary/5 border border-transparent hover:border-border/30 transition-all"
              onClick={() => navigate(nav.path)}
            >
              <nav.icon className="h-4 w-4 text-primary/50" strokeWidth={1.6} />
              {nav.label}
              <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/30" />
            </Button>
          ))}
        </div>
      </Section>

      {/* 5. Governance Declaration */}
      <Section index={5} icon={Lock} number="Section 5" title="Governance Declaration">
        <div className="space-y-3">
          {[
            'This system is designed as an advisory decision-support overlay for regulated utility environments.',
            'Operational authority remains with certified personnel.',
            'All outputs are traceable and policy-constrained.',
          ].map((text, i) => (
            <p key={i} className="text-[12px] text-muted-foreground/80 leading-relaxed flex items-start gap-2.5">
              <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/40" />
              {text}
            </p>
          ))}
        </div>
      </Section>

      {/* 6. Release Metadata */}
      <Section index={6} icon={Cpu} number="Section 6" title="Release Metadata">
        <div className="space-y-2.5">
          {RELEASE_META.map(item => (
            <div key={item.label} className="flex items-baseline gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 w-40 flex-shrink-0">
                {item.label}
              </span>
              <span className="text-[12px] text-foreground/80 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <Separator className="bg-border/20" />
      <motion.p {...fade(8)} className="text-center text-[10px] text-muted-foreground/40 pb-4">
        Advisory-only · Operator authority preserved · No autonomous control · Human-in-the-loop required
      </motion.p>
    </div>
  );
}
