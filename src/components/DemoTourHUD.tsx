import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Square, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * The auto-play demo tour steps.
 * Each step has a route to navigate to, a display duration (ms),
 * and optional highlight instructions.
 */
const STORM_EVENT_ID = '471105eb-fbf9-43c1-8cc5-ad8214abfed8';

const tourSteps = [
  {
    id: 0,
    title: 'Login & Landing',
    route: '/login',
    duration: 5000,
    narrative: 'Establishing operator context via the Login page. The landing view provides immediate orientation to system status.',
  },
  {
    id: 1,
    title: 'Operations Dashboard',
    route: '/dashboard',
    duration: 8000,
    narrative: 'Reviewing active event KPIs, high-priority alerts, crew workload, and the Executive Signal ribbon.',
  },
  {
    id: 2,
    title: 'Scenario Playback',
    route: '/dashboard',
    duration: 7000,
    narrative: 'Scrolling to the Scenario Playback panel — stepping through Pre-Event, Event, and Post-Event lifecycle stages.',
  },
  {
    id: 3,
    title: 'Event Details',
    route: `/event/${STORM_EVENT_ID}`,
    duration: 8000,
    narrative: 'Opening the Downtown Houston Storm Damage event. Reviewing ETR confidence bands, critical-load runway, and crew assignments.',
  },
  {
    id: 4,
    title: 'Outage Map',
    route: '/outage-map',
    duration: 7000,
    narrative: 'Viewing events geographically on the live map. Feeder zones, crew positions, and asset overlays are visible.',
  },
  {
    id: 5,
    title: 'Copilot Studio',
    route: '/copilot-studio',
    duration: 7000,
    narrative: 'AI-assisted event analysis with the Nemotron / Model Router engine. Review defensibility panels and structured outputs.',
  },
  {
    id: 6,
    title: 'Situation Report',
    route: `/event/${STORM_EVENT_ID}/situation-report`,
    duration: 7000,
    narrative: 'Generating an AI-assisted SitRep. The content can be reviewed, approved, and distributed via the Communications Pack.',
  },
  {
    id: 7,
    title: 'Return to Dashboard',
    route: '/dashboard',
    duration: 6000,
    narrative: 'Completing the loop — confirming updated KPIs, restored posture, and the narrative resolution of the demo scenario.',
  },
];

export function DemoTourHUD() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Listen for tour start events from DemoScriptModal
  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentStep(0);
      setStepProgress(0);
      setCompletedSteps([]);
    };
    window.addEventListener('start-demo-tour', handleStart);
    return () => window.removeEventListener('start-demo-tour', handleStart);
  }, []);

  // Navigate on step change
  useEffect(() => {
    if (!isPlaying) return;
    const step = tourSteps[currentStep];
    if (step && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [currentStep, isPlaying, navigate, location.pathname]);

  // Progress timer
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const step = tourSteps[currentStep];
    if (!step) return;

    stepStartRef.current = Date.now();
    const duration = step.duration;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - stepStartRef.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setStepProgress(pct);

      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        setCompletedSteps(prev => [...prev, currentStep]);

        if (currentStep < tourSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
          setStepProgress(0);
        } else {
          // Tour complete
          setIsPlaying(false);
          setStepProgress(100);
        }
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, isPlaying, isPaused]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    pausedAtRef.current = stepProgress;
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stepProgress]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
      setIsPaused(false);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep]);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setStepProgress(0);
  }, []);

  const handleStepClick = useCallback((index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStep(index);
    setStepProgress(0);
    setIsPaused(false);
    setCompletedSteps(prev => prev.filter(s => s > index));
  }, []);

  if (!isPlaying) return null;

  const step = tourSteps[currentStep];
  const overallProgress = ((completedSteps.length) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[600px] max-w-[95vw]"
      >
        <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Overall progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-4">
            {/* Step indicator pills */}
            <div className="flex items-center gap-1.5 mb-3">
              {tourSteps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleStepClick(i)}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-all duration-200 cursor-pointer',
                    completedSteps.includes(i)
                      ? 'bg-primary'
                      : i === currentStep
                      ? 'bg-primary/60'
                      : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                  )}
                  title={s.title}
                />
              ))}
            </div>

            {/* Current step info */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Step {currentStep + 1} of {tourSteps.length}
                  </span>
                  {isPaused && (
                    <span className="text-[9px] font-medium text-warning uppercase tracking-wider">
                      Paused
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {step.narrative}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isPaused ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={handleResume}
                    title="Resume"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                    onClick={handlePause}
                    title="Pause"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-muted"
                  onClick={handleSkip}
                  title="Skip to next"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleStop}
                  title="Stop tour"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
