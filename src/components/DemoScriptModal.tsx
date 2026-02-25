import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Play, Rocket, Printer, Presentation, Gauge, Network, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tourModeConfigs, getStepsForMode, getNarrationForMode, type TourMode } from '@/lib/tour-modes';

const modeIcons: Record<TourMode, typeof Presentation> = {
  executive: Presentation,
  operator: Gauge,
  architecture: Network,
};

export function DemoScriptModal() {
  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TourMode | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

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

  const handleLaunchTour = (mode: TourMode) => {
    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('start-demo-tour', { detail: { mode } }));
    }, 300);
  };

  const handlePrint = useCallback(() => {
    if (!selectedMode) return;
    const steps = getStepsForMode(selectedMode);
    const scripts = getNarrationForMode(selectedMode);
    const config = tourModeConfigs[selectedMode];

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const stepsHtml = steps
      .map(
        (step, i) =>
          `<div style="margin-bottom:18px;padding:12px 16px;border:1px solid #d1d5db;border-radius:8px;page-break-inside:avoid;">
            <h3 style="margin:0 0 4px;font-size:14px;color:#1e293b;">Step ${i + 1}: ${step.title}</h3>
            <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">${scripts[i] || step.narrative}</p>
          </div>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${config.label} — Tour Script</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 24px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e293b; padding-bottom: 16px; }
        .header h1 { font-size: 20px; margin: 0 0 4px; }
        .header p { font-size: 11px; color: #64748b; margin: 0; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 10px; color: #94a3b8; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Operator Copilot — ${config.label}</h1>
        <p>${config.subtitle} · ${config.duration} · ${steps.length} Steps</p>
        <p style="margin-top:4px;">v1.0 – Decision Intelligence Prototype · Generated ${new Date().toLocaleDateString()}</p>
      </div>
      ${stepsHtml}
      <div class="footer">Advisory-Only · Operator Validation Required · Demo Data Mode</div>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }, [selectedMode]);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Mode selection view
  const renderModeSelector = () => (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground text-center">
        Select a tour mode tailored to your audience and objectives.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(tourModeConfigs) as TourMode[]).map((modeId) => {
          const config = tourModeConfigs[modeId];
          const Icon = modeIcons[modeId];
          return (
            <motion.button
              key={modeId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Object.keys(tourModeConfigs).indexOf(modeId) }}
              onClick={() => setSelectedMode(modeId)}
              className={cn(
                'group relative rounded-xl border p-4 text-left transition-all duration-200',
                'border-border/40 hover:border-primary/40 hover:bg-primary/5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border/40"
                  style={{ backgroundColor: `${config.accentColor}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: config.accentColor }} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                    <span className="text-[9px] font-medium text-muted-foreground/70 px-1.5 py-0.5 rounded-full bg-muted/50 border border-border/30">
                      {config.duration}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: config.accentColor }}>
                    {config.subtitle} · {config.audience}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {config.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-muted-foreground/60">{config.stepCount} steps</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // Step list view for selected mode
  const renderStepList = () => {
    if (!selectedMode) return null;
    const config = tourModeConfigs[selectedMode];
    const steps = getStepsForMode(selectedMode);
    const scripts = getNarrationForMode(selectedMode);

    return (
      <div className="space-y-3">
        {/* Mode header */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => { setSelectedMode(null); setCompletedSteps([]); }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
            <p className="text-[10px] text-muted-foreground">{config.subtitle} · {config.duration}</p>
          </div>
        </div>

        {/* Launch button */}
        <Button
          onClick={() => handleLaunchTour(selectedMode)}
          className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md"
          size="lg"
        >
          <Rocket className="h-4 w-4" />
          Launch {config.label}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          {steps.length} steps · Narrated walkthrough · Manual step advancement
        </p>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[45vh]">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'p-2.5 rounded-lg border transition-all cursor-pointer',
                  isCompleted
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-card border-border hover:border-primary/30'
                )}
                onClick={() => toggleStep(index)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'text-[13px] font-medium leading-tight',
                      isCompleted && 'text-green-500'
                    )}>
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {scripts[index] ? scripts[index].slice(0, 120) + '...' : step.narrative}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Virtual Tour Engine
            </DialogTitle>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Governed Enterprise Briefing System · Advisory-Only
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-1">
          {selectedMode ? renderStepList() : renderModeSelector()}
        </div>

        <div className="flex justify-between items-center pt-3 border-t flex-shrink-0">
          <span className="text-[9px] text-muted-foreground/60">
            v1.0 · Decision Intelligence Prototype
          </span>
          <div className="flex gap-2">
            {selectedMode && (
              <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Print Script
              </Button>
            )}
            <Button size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
