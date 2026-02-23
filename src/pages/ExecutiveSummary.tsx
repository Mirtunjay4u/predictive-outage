import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Shield, CloudLightning, Brain, Users, CheckCircle, XCircle, ChevronRight, Scale, Zap } from 'lucide-react';
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

      {/* Printable page */}
      <div className="mx-auto max-w-[8.5in] px-8 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="print:p-[0.6in] space-y-5 print:space-y-4">

          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary/30 pb-4 print:pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground print:text-black">
                Executive Decision Brief
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 print:text-gray-600">
                Governed AI-assisted decision intelligence for outage operations.
              </p>
            </div>
            <img src={tcsLogo} alt="TCS" className="h-8 object-contain print:h-7" />
          </div>

          {/* 30-Second Value Block */}
          <Section title="Problem Context">
            <div className="space-y-2 text-[12px] leading-relaxed text-foreground/90 print:text-black">
              <p>
                Utilities operate in high-stakes outage environments where decisions must balance restoration speed,
                safety constraints, critical load protection, and regulatory discipline.
              </p>
              <p>
                Current OMS systems track events. <strong>They do not structure decision reasoning under constraint.</strong>
              </p>
              <p className="font-medium">
                Operator Copilot introduces governed advisory intelligence layered over OMS — not replacing it.
              </p>
            </div>
          </Section>

          {/* Why This Matters Now */}
          <Section title="Why This Matters Now">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: CloudLightning, title: 'Extreme Weather Escalation', desc: 'Increasing outage volatility and hazard exposure.' },
                { icon: Brain, title: 'Operator Cognitive Load', desc: 'Manual correlation across multiple systems.' },
                { icon: Scale, title: 'Regulatory Transparency', desc: 'Explainable, traceable decision records required.' },
                { icon: Shield, title: 'AI Governance Requirement', desc: 'Adoption must remain constrained and auditable.' },
              ].map(t => (
                <div key={t.title} className="rounded border border-border/50 p-3 print:border-gray-300">
                  <div className="flex items-center gap-1.5 mb-1">
                    <t.icon className="h-3.5 w-3.5 text-primary print:text-blue-700" />
                    <span className="text-[11px] font-semibold text-foreground print:text-black">{t.title}</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground print:text-gray-600 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Differentiation */}
          <Section title="What Makes This Different">
            <div className="grid grid-cols-2 gap-x-4 text-[11px]">
              <div>
                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[9px] mb-1.5">Traditional OMS</p>
                {['Event tracking', 'ETR calculation', 'Restoration management', 'Manual escalation monitoring'].map(t => (
                  <p key={t} className="text-muted-foreground py-0.5 print:text-gray-500">— {t}</p>
                ))}
              </div>
              <div>
                <p className="font-semibold text-primary uppercase tracking-wider text-[9px] mb-1.5 print:text-blue-700">Operator Copilot</p>
                {[
                  'Constraint-aware advisory logic',
                  'ETR uncertainty framing',
                  'Critical load runway monitoring',
                  'Structured escalation reasoning',
                  'Audit-ready trace logging',
                ].map(t => (
                  <p key={t} className="font-medium text-foreground py-0.5 print:text-black">✦ {t}</p>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-medium text-primary/70 mt-2.5 print:text-blue-600">
              Intelligence overlay — not system replacement.
            </p>
          </Section>

          {/* Phase 1 Status */}
          <Section title="Phase 1 — Advisory Intelligence (Current)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5 print:text-green-700">Deployed</p>
                {[
                  'Deterministic rule gate',
                  'Hazard-aware advisory',
                  'Human approval enforcement',
                  'AI reasoning under constraint',
                  'Full trace logging',
                ].map(i => (
                  <p key={i} className="text-[10.5px] text-foreground flex items-center gap-1.5 py-0.5 print:text-black">
                    <CheckCircle className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0 print:text-green-600" />{i}
                  </p>
                ))}
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Not Included</p>
                {['SCADA execution', 'Automated switching', 'Autonomous dispatch'].map(i => (
                  <p key={i} className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 py-0.5 print:text-gray-500">
                    <XCircle className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/40" />{i}
                  </p>
                ))}
              </div>
            </div>
          </Section>

          {/* Operational Impact Potential */}
          <Section title="Operational Impact Potential">
            <div className="flex flex-wrap gap-2">
              {[
                'Reduced cognitive compression time',
                'Faster escalation recognition',
                'Structured reasoning under uncertainty',
                'Improved regulatory defensibility',
                'Scalable AI foundation',
              ].map(v => (
                <span key={v} className="inline-flex items-center gap-1 rounded border border-border/50 bg-muted/30 px-2 py-1 text-[10.5px] font-medium text-foreground print:border-gray-300 print:text-black">
                  <ChevronRight className="h-2.5 w-2.5 text-primary/60 print:text-blue-600" />{v}
                </span>
              ))}
            </div>
          </Section>

          {/* Footer / Strategic Positioning */}
          <div className="border-t-2 border-primary/20 pt-3 mt-4 print:border-gray-300">
            <p className="text-[11px] font-semibold text-primary print:text-blue-700 leading-relaxed">
              Operator Copilot establishes a controlled AI decision layer for utilities — designed for governance first, automation second.
            </p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[9px] text-muted-foreground print:text-gray-500">
                Phase 1: Advisory Intelligence · Synthetic Data · Human-in-the-Loop
              </p>
              <p className="text-[8px] text-muted-foreground/60 print:text-gray-400">
                Confidential · TCS · {new Date().getFullYear()}
              </p>
            </div>
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
