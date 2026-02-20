import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight, X, Play } from 'lucide-react';
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
    title: 'Login & Landing',
    description: 'Authenticate via the Login page to establish operator context and session. The landing view provides immediate orientation to system status.',
  },
  {
    title: 'Operations Dashboard',
    description: 'Review active event KPIs, high-priority alerts, crew workload, and system-wide readiness. Explore the Executive Signal, AI Briefing, and Operational Phase ribbon.',
  },
  {
    title: 'Scenario Playback',
    description: 'Use the Scenario Playback panel on the Dashboard to step through a pre-loaded hazard scenario — advance through Pre-Event, Event, and Post-Event lifecycle stages.',
  },
  {
    title: 'Event Details',
    description: 'Select any event to open its full detail view. Review ETR confidence bands, critical-load runway, crew assignments, and supporting signals.',
  },
  {
    title: 'Outage Map',
    description: 'Navigate to the Outage Map to see events geographically. Select events, view feeder zones, and explore crew positions on the live map.',
  },
  {
    title: 'Copilot Studio',
    description: 'Open Copilot Studio for AI-assisted event analysis. Run structured copilot analysis with the Nemotron / Model Router engine and review defensibility panels.',
  },
  {
    title: 'Situation Report',
    description: 'Generate an AI-assisted SitRep from the Situation Report panel. Review the content, approve it for distribution, and generate the Customer Communications Pack.',
  },
  {
    title: 'Return to Dashboard',
    description: 'Complete the loop by returning to the Dashboard to confirm updated KPIs, restored posture, and the narrative resolution of the demo scenario.',
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

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Demo Script
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
          {demoSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-3 rounded-lg border transition-all cursor-pointer',
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
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Circle className={cn(
                        'w-4 h-4',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'text-sm font-medium leading-tight',
                      isCompleted && 'text-success',
                      isCurrent && 'text-primary'
                    )}>
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
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
