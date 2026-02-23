import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Play, Rocket, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const demoSteps = [
  {
    title: 'Login & Context',
    description: 'Establish operator context in demo data mode. No live SCADA, OMS, or ADMS connected — controlled and safe demonstration environment.',
  },
  {
    title: 'Dashboard Orientation',
    description: 'Review Operational Risk Posture, severity events, hazard exposure, crew readiness, ETR confidence bands, and the governance header strip.',
  },
  {
    title: 'Scenario Playback Lifecycle',
    description: 'Navigate through Pre-Event, Active Event, and Post-Event lifecycle phases — reflecting how utilities manage evolving operational states.',
  },
  {
    title: 'Events Page Deep Dive',
    description: 'Review structured triage: severity, affected feeder, critical load impact, and ETR uncertainty bands — reinforcing operational realism.',
  },
  {
    title: 'Event Detail View',
    description: 'Examine crew assignment, hazard exposure correlation, escalation status, structured reasoning outputs, and the Decision Trace for full transparency.',
  },
  {
    title: 'Outage Map Intelligence',
    description: 'Overlay event markers with feeder zones, critical load layers, and hazard exposure for spatial situational awareness — no operational control actions executed.',
  },
  {
    title: 'Weather Alerts Section',
    description: 'Correlate weather severity with affected infrastructure to improve prioritization — without automating dispatch decisions.',
  },
  {
    title: 'Copilot Studio',
    description: 'Structured AI-assisted analysis via NVIDIA Nemotron. All outputs advisory and policy-constrained. Review bounded reasoning and deterministic guardrails.',
  },
  {
    title: 'Situation Report Generation',
    description: 'Generate structured situation reports for executive and customer communication — outputs subject to operator approval.',
  },
  {
    title: 'Analytics',
    description: 'Summarize high-priority counts, policy blocks, and ETR distribution trends — supporting operational review without claiming predictive calibration.',
  },
  {
    title: 'Operational Use Cases & Capabilities',
    description: 'Review the governed reasoning overlay positioning, Decision Intelligence Workflow trust flow, and "What This Is Not" boundary panel.',
  },
  {
    title: 'Art of Possibilities',
    description: 'Explore multi-hazard scenario modelling, domain expansion cards, and the interactive capability matrix — illustrating future extensibility.',
  },
  {
    title: 'Knowledge & Policy',
    description: 'Define operational policies and advisory boundaries — ensuring regulatory defensibility and transparent operational discipline.',
  },
  {
    title: 'Architecture Overview',
    description: 'Review layered design: Ingest → Rule Engine → Bounded AI Inference → Explainability → Operator Interface. Governance enforced before and after AI reasoning.',
  },
  {
    title: 'Solution Roadmap Blueprint',
    description: 'Structured evolution from Phase 1 decision intelligence to Phase 2 calibrated predictive capabilities — separating implemented from planned milestones.',
  },
  {
    title: 'AI Governance Framework',
    description: 'Deep-dive into the 16-section governance document: system positioning, rule precedence, advisory boundaries, failure modes, audit & traceability.',
  },
  {
    title: 'Architecture Review & Documentation',
    description: 'Review architecture decision records, operator SOPs, API & data schema contracts, and executive overview — full technical documentation suite.',
  },
  {
    title: 'Regulatory & Compliance Alignment',
    description: 'Review 16-section compliance document: system classification, operational boundary declaration, hallucination mitigation layers, and Phase-2 compliance roadmap.',
  },
  {
    title: 'Resources & Documentation Hub',
    description: 'Browse the centralized documentation portal with category filters, role-based access, pinned documents, and full-text search across all resources.',
  },
  {
    title: 'Glossary',
    description: 'Standardized definitions for all domain and AI terminology — eliminating ambiguity and supporting cross-functional clarity.',
  },
  {
    title: 'Executive Summary One-Pager',
    description: 'Print-ready executive summary capturing system positioning, key capabilities, risk posture, and governance assurance — ready for stakeholder distribution.',
  },
  {
    title: 'Settings & Troubleshooting',
    description: 'Review application configuration, theme preferences, data mode controls, and the embedded troubleshooting FAQ for operator self-service.',
  },
  {
    title: 'Executive Validation & Close',
    description: 'Confirm Operator Copilot augments operator reasoning through governed AI, explainability, and structured operational insight. Version stamp: v1.0 – Decision Intelligence Prototype.',
  },
];

export function DemoScriptModal() {
  const [open, setOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-demo-script', handleOpen);
    return () => window.removeEventListener('open-demo-script', handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAutoPlay = () => {
    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-demo-tour'));
    }, 300);
  };

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const stepsHtml = demoSteps
      .map(
        (step, i) =>
          `<div style="margin-bottom:18px;padding:12px 16px;border:1px solid #d1d5db;border-radius:8px;page-break-inside:avoid;">
            <h3 style="margin:0 0 4px;font-size:14px;color:#1e293b;">Step ${i + 1}: ${step.title}</h3>
            <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">${step.description}</p>
          </div>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Executive Demo Script</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 24px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e293b; padding-bottom: 16px; }
        .header h1 { font-size: 20px; margin: 0 0 4px; }
        .header p { font-size: 11px; color: #64748b; margin: 0; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 10px; color: #94a3b8; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Operator Copilot — Executive Demo Script</h1>
        <p>Governed AI Decision Intelligence · ${demoSteps.length} Steps · ~12 min walkthrough</p>
        <p style="margin-top:4px;">v1.0 – Decision Intelligence Prototype · Generated ${new Date().toLocaleDateString()}</p>
      </div>
      ${stepsHtml}
      <div class="footer">Advisory-Only · Operator Validation Required · Demo Data Mode</div>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Executive Demo Script
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Auto-Play CTA */}
        <div className="flex-shrink-0 mb-2">
          <Button
            onClick={handleAutoPlay}
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md"
            size="lg"
          >
            <Rocket className="h-4 w-4" />
            Play Executive Auto Tour
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Automatically navigates through all {demoSteps.length} steps — full platform walkthrough (~12 min)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mt-1 space-y-1.5 pr-1">
          {demoSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'p-2.5 rounded-lg border transition-all cursor-pointer',
                  isCompleted
                    ? 'bg-success/5 border-success/20'
                    : isCurrent
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border hover:border-primary/30'
                )}
                onClick={() => {
                  setCurrentStep(index);
                  toggleStep(index);
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Circle className={cn(
                        'w-3.5 h-3.5',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'text-[13px] font-medium leading-tight',
                      isCompleted && 'text-success',
                      isCurrent && 'text-primary'
                    )}>
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-3 border-t flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {completedSteps.length} of {demoSteps.length} completed
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Print Script
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
