import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Shield, Gauge, CloudLightning, Brain, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import tcsLogo from '@/assets/tcs-logo.png';

export default function ExecutiveSummary() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only toolbar */}
      <div className="print:hidden border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-[8.5in] px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable page — constrained to letter size */}
      <div className="mx-auto max-w-[8.5in] px-8 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="print:p-[0.6in] space-y-5 print:space-y-4">

          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary/30 pb-4 print:pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground print:text-black">
                Operator Copilot — Executive Summary
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 print:text-gray-600">
                AI-Constrained Predictive Outage Management · Phase-1 Decision Intelligence
              </p>
            </div>
            <img src={tcsLogo} alt="TCS" className="h-8 object-contain print:h-7" />
          </div>

          {/* What It Is */}
          <Section title="What It Is">
            <p className="text-[12px] leading-relaxed text-foreground/90 print:text-black">
              A <strong>decision-support platform</strong> that augments utility outage operators with 
              confidence-based ETR modeling, critical-load prioritization, and hazard-correlated risk scoring — 
              all governed by a <strong>deterministic rule engine</strong> that evaluates every event before 
              any AI model is invoked. Advisory only. No autonomous control.
            </p>
          </Section>

          {/* Differentiation */}
          <Section title="How It's Different">
            <div className="grid grid-cols-2 gap-x-4 text-[11px]">
              <div>
                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[9px] mb-1.5">Traditional OMS</p>
                {['Static ETR values', 'Manual triage escalation', 'Reactive dispatch workflows', 'Ticket-based management'].map(t => (
                  <p key={t} className="text-muted-foreground py-0.5 print:text-gray-500">— {t}</p>
                ))}
              </div>
              <div>
                <p className="font-semibold text-primary uppercase tracking-wider text-[9px] mb-1.5 print:text-blue-700">Operator Copilot</p>
                {['Confidence-based ETR bands', 'Policy-constrained AI advisory', 'Hazard-informed prioritization', 'Deterministic rule-backed filtering'].map(t => (
                  <p key={t} className="font-medium text-foreground py-0.5 print:text-black">✦ {t}</p>
                ))}
              </div>
            </div>
          </Section>

          {/* Core Capabilities — 2x2 grid */}
          <Section title="Capabilities Demonstrated">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gauge, title: 'ETR Modeling', items: ['Probabilistic restoration ranges', 'Uncertainty transparency', 'Critical load runway sensitivity'] },
                { icon: Shield, title: 'Critical Load Prioritization', items: ['Infrastructure tagging', 'Escalation thresholds', 'Backup runtime monitoring'] },
                { icon: CloudLightning, title: 'Hazard-Correlated Scoring', items: ['Weather overlay integration', 'Crew safety gating', 'Feeder-level vulnerability'] },
                { icon: Brain, title: 'Explainable AI Advisory', items: ['Guardrail enforcement', 'Structured reasoning trace', 'Policy-based blocking'] },
              ].map(cap => (
                <div key={cap.title} className="rounded border border-border/50 p-2.5 print:border-gray-300">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <cap.icon className="h-3.5 w-3.5 text-primary print:text-blue-700" />
                    <span className="text-[11px] font-semibold text-foreground print:text-black">{cap.title}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {cap.items.map(b => (
                      <li key={b} className="text-[10px] text-muted-foreground print:text-gray-600 flex items-center gap-1">
                        <span className="h-0.5 w-0.5 rounded-full bg-primary/40 shrink-0 print:bg-gray-400" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Governance + Phase 1 — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <Section title="AI Governance">
              <ul className="space-y-1">
                {[
                  'Deterministic rules precede AI inference',
                  'Asset lock & maintenance enforcement',
                  'Critical load protection logic',
                  'Structured output contract (8 fixed sections)',
                  'Advisory-only — no SCADA execution',
                  'Human-in-the-loop at all times',
                ].map(g => (
                  <li key={g} className="flex items-start gap-1.5 text-[10.5px] text-foreground print:text-black">
                    <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500 mt-0.5 print:text-green-600" />{g}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Phase-1 Scope">
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 mb-1 print:text-green-700">Included</p>
                  {['Advisory intelligence layer', 'Deterministic rule enforcement', 'Hazard-informed analysis', 'AI-assisted advisory insights'].map(i => (
                    <p key={i} className="text-[10.5px] text-foreground flex items-center gap-1.5 py-0.5 print:text-black">
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-500 print:text-green-600" />{i}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Not Included</p>
                  {['Autonomous switching', 'Breaker actuation', 'Load flow simulation', 'SCADA execution'].map(i => (
                    <p key={i} className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 py-0.5 print:text-gray-500">
                      <span className="text-[10px]">—</span>{i}
                    </p>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          {/* Strategic Value */}
          <Section title="Strategic Value">
            <div className="flex flex-wrap gap-2">
              {[
                'Reduced triage latency',
                'Improved prioritization accuracy',
                'Increased ETR communication confidence',
                'Reduced escalation ambiguity',
                'Governance-aligned AI augmentation',
              ].map(v => (
                <span key={v} className="inline-flex items-center gap-1 rounded border border-border/50 bg-muted/30 px-2 py-1 text-[10.5px] font-medium text-foreground print:border-gray-300 print:text-black">
                  <ChevronRight className="h-2.5 w-2.5 text-primary/60 print:text-blue-600" />{v}
                </span>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t-2 border-primary/20 pt-3 mt-4 flex items-end justify-between print:border-gray-300">
            <div>
              <p className="text-[11px] font-semibold text-primary print:text-blue-700">
                "We built this to earn trust before asking for access."
              </p>
              <p className="text-[9px] text-muted-foreground mt-1 print:text-gray-500">
                Phase 1: Decision Intelligence · Synthetic Data · Advisory Only · Human-in-the-Loop
              </p>
            </div>
            <p className="text-[8px] text-muted-foreground/60 print:text-gray-400">
              Confidential · TCS · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2 print:text-blue-700">{title}</h2>
      {children}
    </div>
  );
}
