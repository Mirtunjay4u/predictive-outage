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
    description: 'Authenticate via the Login page to establish operator context. Auto-clicks "Continue in Demo Mode" to begin.',
  },
  {
    title: 'Dashboard Orientation',
    description: 'Review active event KPIs, high-priority alerts, crew workload, Executive Signal, and the Operational Phase ribbon.',
  },
  {
    title: 'Scenario Playback Lifecycle',
    description: 'Scroll to the Scenario Playback panel — advance through Pre-Event, Event, and Post-Event lifecycle stages.',
  },
  {
    title: 'Events Page Deep Dive',
    description: 'Navigate to Events. Review the triage queue: severity, ETR confidence bands, critical load tags, and policy status columns.',
  },
  {
    title: 'Event Detail View',
    description: 'Drill into an event detail view. Review crew assignment, escalation state, hazard correlation, and ETR confidence explanation.',
  },
  {
    title: 'Outage Map Intelligence',
    description: 'Navigate to the Outage Map. View event markers, feeder zones, critical load layers, crew dispatch, and weather overlays.',
  },
  {
    title: 'Weather Alerts Section',
    description: 'Navigate to Weather Alerts. Review hazard exposure scores, events in hazard zones, and crew safety status.',
  },
  {
    title: 'Copilot Studio',
    description: 'Open Copilot Studio for AI-assisted analysis. Auto-run analysis and review guardrails, allowed/blocked actions, and explainability.',
  },
  {
    title: 'Situation Report Generation',
    description: 'Generate an AI-assisted SitRep. Review the content, approval indicators, and the Customer Communications Pack.',
  },
  {
    title: 'Analytics',
    description: 'Navigate to Analytics. Review high-priority counts, policy blocks, and ETR confidence distribution charts.',
  },
  {
    title: 'Architecture Overview',
    description: 'Explore the system architecture — ingest layer, copilot orchestrator, guardrails, Nemotron LLM, and observability layer.',
  },
  {
    title: 'About & Governance',
    description: 'Review the advisory-only governance notice, safety & compliance information, and the platform\'s decision-support boundary.',
  },
  {
    title: 'Settings',
    description: 'Review configurable AI modes, Dataverse integration panel, and enterprise integration readiness.',
  },
  {
    title: 'Art of Possibilities',
    description: 'Explore Phase 2+ concept capabilities — environmental signal fusion, wildfire corridor awareness, vegetation stress, and bio-sentinel signals.',
  },
  {
    title: 'Executive Validation Summary',
    description: 'Review OMS vs Copilot comparison, AI governance & safety boundaries, capabilities demonstrated, and Phase-1 scope.',
  },
  {
    title: 'Return to Dashboard & Close Loop',
    description: 'Complete the operational loop — confirm updated KPIs, stabilized posture, and the narrative resolution of the demo scenario.',
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
            Automatically navigates through all {demoSteps.length} steps — full platform walkthrough
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
