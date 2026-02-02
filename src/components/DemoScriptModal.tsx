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
    title: 'Browse Scenarios',
    description: 'Navigate to the Scenarios page and explore the list. Toggle between table and card views, and use filters to narrow down results.',
  },
  {
    title: 'Create a New Scenario',
    description: 'Click "New Scenario" to open the creation form. Fill in the details including name, description, lifecycle stage, and operator role.',
  },
  {
    title: 'Edit an Existing Scenario',
    description: 'Click on any scenario row/card to open the edit drawer. Modify fields and save changes to see real-time updates.',
  },
  {
    title: 'Explore AI Copilot',
    description: 'With a scenario selected, open the Copilot panel on the right. Try suggested prompts like "Summarize scenario" or "Find risks".',
  },
  {
    title: 'Review Analytics & Settings',
    description: 'Visit the Analytics page for usage insights, and check Settings to see the Dataverse integration placeholder for Phase 2.',
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Demo Script
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {demoSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-4 rounded-lg border transition-all cursor-pointer',
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
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className={cn(
                        'w-5 h-5',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(
                      'font-medium',
                      isCompleted && 'text-success',
                      isCurrent && 'text-primary'
                    )}>
                      Step {index + 1}: {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {completedSteps.length} of {demoSteps.length} completed
          </span>
          <Button onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
