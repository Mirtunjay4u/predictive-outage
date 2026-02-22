import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Play, Rocket } from 'lucide-react';
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
    description: 'Review Operational Risk Posture, severity events, hazard exposure, crew readiness, ETR confidence bands, and the governance header strip (Governed AI · Advisory-Only · Operator Validation Required).',
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
    title: 'Architecture Overview',
    description: 'Review layered design: Ingest → Rule Engine → Bounded AI Inference → Explainability → Operator Interface. Governance enforced before and after AI reasoning.',
  },
  {
    title: 'Knowledge & Policy',
    description: 'Define operational policies and advisory boundaries — ensuring regulatory defensibility and transparent operational discipline.',
  },
  {
    title: 'Glossary',
    description: 'Standardized definitions for all domain and AI terminology — eliminating ambiguity and supporting cross-functional clarity.',
  },
  {
    title: 'Solution Roadmap Blueprint',
    description: 'Structured evolution from Phase 1 decision intelligence to Phase 2 calibrated predictive capabilities — clearly separating implemented from planned milestones.',
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
            Automatically navigates through all {demoSteps.length} steps — full platform walkthrough (~9 min)
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
          <Button size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
