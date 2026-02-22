import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, CheckCircle2, RotateCcw, X,
  Shield, Brain, Map, CloudLightning, Network, Eye,
  Gauge, Sparkles, Volume2, VolumeX, Loader2, Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTourNarration } from '@/hooks/useTourNarration';
import { TourSpotlight } from '@/components/tour/TourSpotlight';
import {
  tourSteps,
  safeScroll,
  safeClick,
  waitForStepReady,
  enableDebugMode,
  getDebugLogs,
  clearDebugLogs,
  type TourBeat,
} from '@/lib/tour-engine';

// ── Types ──

interface BeatState {
  selector: string | null;
  caption: string | null;
}

export function DemoTourHUD() {
  // ── Core state ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepComplete, setStepComplete] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [tourComplete, setTourComplete] = useState(false);

  // ── Beat state ──
  const [activeBeat, setActiveBeat] = useState<BeatState>({ selector: null, caption: null });
  const beatIndexRef = useRef(0);
  const beatTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedBeatIndexRef = useRef(0);

  // ── Debug ──
  const [debugMode, setDebugMode] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // ── Narration ──
  const {
    isMuted, isLoading: narrationLoading, isSpeaking, preCacheProgress,
    narrationDone, toggleMute, playStepNarration, stopNarration,
    pauseNarration, resumeNarration, preCacheAll,
  } = useTourNarration();

  const navigate = useNavigate();
  const autoActionFiredRef = useRef<Set<number>>(new Set());

  // ── Sync debug mode ──
  useEffect(() => { enableDebugMode(debugMode); }, [debugMode]);

  // ── Listen for tour start from DemoScriptModal ──
  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentStep(0);
      setStepComplete(false);
      setCompletedSteps([]);
      setTourComplete(false);
      autoActionFiredRef.current = new Set();
      clearDebugLogs();
      preCacheAll();
    };
    window.addEventListener('start-demo-tour', handleStart);
    return () => window.removeEventListener('start-demo-tour', handleStart);
  }, [preCacheAll]);

  // ── Body class for dim ──
  useEffect(() => {
    if (isPlaying && !tourComplete) {
      document.body.classList.add('tour-active');
    } else {
      document.body.classList.remove('tour-active');
    }
    return () => document.body.classList.remove('tour-active');
  }, [isPlaying, tourComplete]);

  // ── Clear beats ──
  const clearBeats = useCallback(() => {
    beatTimersRef.current.forEach(t => clearTimeout(t));
    beatTimersRef.current = [];
    setActiveBeat({ selector: null, caption: null });
  }, []);

  // ── Execute beats for a step ──
  const executeBeats = useCallback((step: typeof tourSteps[0], startFromBeat = 0) => {
    clearBeats();
    const beats = step.beats;
    if (!beats.length) return;

    // Calculate timing: spread beats across ~25s (estimated narration length)
    const estimatedDuration = 25000;
    const beatInterval = estimatedDuration / beats.length;

    beats.forEach((beat, idx) => {
      if (idx < startFromBeat) return;
      const delay = (idx - startFromBeat) * beatInterval;

      const timer = setTimeout(() => {
        beatIndexRef.current = idx;

        // Scroll to element
        safeScroll(beat.selector, step.id, idx);

        // Execute action
        if (beat.action === 'click') {
          // Don't actually click unless it's the login button
          if (step.autoAction === 'login' && idx === 1) {
            // Login click handled by auto-action system
          }
        }

        // Set spotlight
        setActiveBeat({ selector: beat.selector, caption: beat.caption });

        // Clear spotlight before next beat (or at end)
        const clearTimer = setTimeout(() => {
          if (beatIndexRef.current === idx) {
            setActiveBeat({ selector: null, caption: null });
          }
        }, beatInterval - 800);
        beatTimersRef.current.push(clearTimer);
      }, delay);

      beatTimersRef.current.push(timer);
    });
  }, [clearBeats]);

  // ── Run step orchestration ──
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const step = tourSteps[currentStep];
    if (!step) return;

    setStepComplete(false);
    clearBeats();
    beatIndexRef.current = 0;

    // Navigate to route
    navigate(step.route);

    // Wait for readiness, then start narration + beats
    const runStep = async () => {
      // Wait for route to settle
      await new Promise(r => setTimeout(r, 800));

      // Wait for DOM readiness
      await waitForStepReady(step);

      // Auto-login for step 0
      if (step.autoAction === 'login' && !autoActionFiredRef.current.has(currentStep)) {
        autoActionFiredRef.current.add(currentStep);
        // Fire login after a beat delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tour-auto-login'));
        }, 4000);
      }

      // Start narration
      if (!isPaused) {
        playStepNarration(currentStep);
      }

      // Execute beats
      if (!isPaused) {
        executeBeats(step);
      }
    };

    runStep();

    return () => {
      stopNarration();
      clearBeats();
    };
  }, [currentStep, isPlaying, navigate, playStepNarration, stopNarration, clearBeats, executeBeats, isPaused]);

  // ── Mark step complete when narration ends ──
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    if (narrationDone || isMuted) {
      // Small delay after narration to let final beat finish
      const timer = setTimeout(() => {
        setStepComplete(true);
        clearBeats();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [narrationDone, isMuted, isPlaying, isPaused, clearBeats]);

  // ── Pause handler ──
  const handlePause = useCallback(() => {
    setIsPaused(true);
    pauseNarration();
    pausedBeatIndexRef.current = beatIndexRef.current;
    // Cancel queued beat timers
    beatTimersRef.current.forEach(t => clearTimeout(t));
    beatTimersRef.current = [];
  }, [pauseNarration]);

  // ── Resume handler ──
  const handleResume = useCallback(() => {
    setIsPaused(false);
    resumeNarration();
    // Resume beats from where we left off
    const step = tourSteps[currentStep];
    if (step) {
      executeBeats(step, pausedBeatIndexRef.current + 1);
    }
  }, [resumeNarration, currentStep, executeBeats]);

  // ── Next step (manual only) ──
  const handleNext = useCallback(() => {
    if (!stepComplete && !isPaused) return; // Disabled unless complete or paused (skip)
    stopNarration();
    clearBeats();
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepComplete(false);
      setIsPaused(false);
    } else {
      setIsPlaying(false);
      setTourComplete(true);
      stopNarration();
    }
  }, [stepComplete, isPaused, currentStep, stopNarration, clearBeats]);

  // ── Skip (force next even if not complete) ──
  const handleSkip = useCallback(() => {
    stopNarration();
    clearBeats();
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepComplete(false);
      setIsPaused(false);
    } else {
      setIsPlaying(false);
      setTourComplete(true);
    }
  }, [currentStep, stopNarration, clearBeats]);

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stopNarration();
    clearBeats();
    setTourComplete(false);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentStep(0);
    setStepComplete(false);
    setCompletedSteps([]);
    autoActionFiredRef.current = new Set();
    clearDebugLogs();
  }, [stopNarration, clearBeats]);

  // ── Stop ──
  const handleStop = useCallback(() => {
    stopNarration();
    clearBeats();
    setIsPlaying(false);
    setIsPaused(false);
  }, [stopNarration, clearBeats]);

  // ── Completion Screen ──
  const domainSections = [
    {
      icon: Shield,
      title: 'Deterministic Operational Policy Enforcement',
      bullets: [
        'Severity-based escalation (1–5 utility scale)',
        'Crew skillset and readiness gating',
        'Critical load protection logic',
        'Explicit policy blocks prior to advisory output',
      ],
    },
    {
      icon: Gauge,
      title: 'Confidence-Based ETR Modeling',
      bullets: [
        'ETR confidence bands (High / Medium / Low)',
        'Uncertainty transparency (no single-point estimates)',
        'Hazard-adjusted restoration risk',
      ],
    },
    {
      icon: CloudLightning,
      title: 'Hazard-Correlated Risk Scoring',
      bullets: [
        'Weather hazard overlays (wind, lightning, flood, heat)',
        'Feeder-level vulnerability assessment',
        'Crew safety constraints under active hazard zones',
      ],
    },
    {
      icon: Brain,
      title: 'Structured AI Guardrails & Explainability',
      bullets: [
        'Structured output contracts (no free-form generation)',
        'Policy-based blocking with remediation guidance',
        'Transparent reasoning pathways',
      ],
    },
    {
      icon: Map,
      title: 'Geospatial Situational Awareness',
      bullets: [
        'Real-time outage visualization',
        'Feeder zone mapping with critical infrastructure',
        'Lifecycle progression (Pre-Event → Event → Post-Event)',
      ],
    },
    {
      icon: Network,
      title: 'Governance-First Architecture',
      bullets: [
        'Advisory-only control posture',
        'Deterministic rule engine precedes AI inference',
        'Enterprise integration pathway (Phase-2)',
      ],
    },
  ];

  const postureSummary = [
    { label: 'System Risk Index', value: 'Stabilized', color: 'text-green-500' },
    { label: 'Critical Load Exposure', value: 'Reduced', color: 'text-green-500' },
    { label: 'Policy Violations', value: 'None', color: 'text-green-500' },
    { label: 'Crew Deployment', value: 'Within Threshold', color: 'text-green-500' },
    { label: 'AI Confidence Band', value: 'High', color: 'text-primary' },
  ];

  // ── Tour Completion Screen ──
  if (tourComplete) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-[780px] max-w-[95vw] max-h-[92vh] rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary flex-shrink-0" />

            <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">
              {/* Title */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20"
                >
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </motion.div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Executive Demonstration Complete
                </h2>
                <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                  AI-Constrained Decision Intelligence for Utility Outage Operations
                </p>
              </div>

              {/* Capabilities recap */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-3">
                  Capabilities Demonstrated
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {domainSections.map((section, si) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + si * 0.06 }}
                      className="rounded-lg border border-border/40 bg-muted/30 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <section.icon className="w-3 h-3 text-primary" strokeWidth={1.75} />
                        </div>
                        <h4 className="text-[11px] font-semibold text-foreground">{section.title}</h4>
                      </div>
                      <ul className="space-y-0.5 pl-7">
                        {section.bullets.map((b) => (
                          <li key={b} className="text-[9px] text-muted-foreground flex items-start gap-1">
                            <span className="text-primary/60 mt-[2px]">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Posture Summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Operational Posture Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {postureSummary.map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5 px-2 py-1.5 rounded-md bg-card/60">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      <span className={cn('text-[11px] font-bold', item.color)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Final statement */}
              <div className="border-l-2 border-primary/50 pl-4 py-1">
                <p className="text-[11px] text-foreground/90 leading-relaxed font-medium italic">
                  This solution represents a defensible, AI-constrained decision-support layer for electric utility outage management — designed to enhance operator judgment without introducing automation risk.
                </p>
              </div>

              {/* Thank you */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="text-center py-3"
              >
                <motion.div
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] bg-clip-text text-transparent"
                >
                  <span className="text-lg font-bold tracking-tight">
                    Thank you for watching the Executive Demo
                  </span>
                </motion.div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  AI-Constrained Decision Intelligence · Phase-1 Prototype
                </p>
              </motion.div>
            </div>

            {/* Action bar */}
            <div className="flex-shrink-0 border-t border-border/40 bg-card/95 backdrop-blur-sm px-7 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={handleRestart}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart Tour
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setTourComplete(false); navigate('/dashboard'); }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Explore Manually
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setTourComplete(false)}
                  className="ml-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!isPlaying) return null;

  const step = tourSteps[currentStep];
  const overallProgress = ((completedSteps.length) / tourSteps.length) * 100;
  const totalSteps = tourSteps.length;

  return (
    <>
      {/* ── Spotlight Overlay ── */}
      <TourSpotlight
        selector={activeBeat.selector}
        caption={activeBeat.caption}
        visible={!isPaused && activeBeat.selector !== null}
      />

      {/* ── TOP PROGRESS BAR ── */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none"
      >
        <div className="h-1 bg-muted/50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* ── FLOATING HUD PANEL ── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[9999]"
      >
        <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-2 min-w-[460px] max-w-[560px]">
          {/* Header row with step title inline */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary flex-shrink-0">
                Executive Guided Tour
              </span>
              <span className="text-[10px] text-muted-foreground/60 mx-1 flex-shrink-0">·</span>
              <span className="text-[11px] font-semibold text-foreground truncate">{step.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold text-foreground tabular-nums">
                Step {currentStep + 1} of {totalSteps}
              </span>
              {isPaused && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-warning px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
                  Paused
                </span>
              )}
              {stepComplete && !isPaused && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                  Ready
                </span>
              )}
              {preCacheProgress > 0 && preCacheProgress < 100 && (
                <span className="text-[9px] text-muted-foreground/70 tabular-nums">
                  Voice {preCacheProgress}%
                </span>
              )}
            </div>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-[3px] flex-1 rounded-full transition-all duration-300',
                  completedSteps.includes(i)
                    ? 'bg-primary'
                    : i === currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/15'
                )}
              />
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1.5">
            {/* Play / Pause */}
            {isPaused ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                onClick={handleResume}
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={handlePause}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}

            {/* Next Step */}
            <Button
              size="sm"
              className={cn(
                'h-8 gap-1.5 transition-all',
                stepComplete
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
              onClick={handleNext}
              disabled={!stepComplete}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Next Step
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Waveform indicator */}
            <div className={cn(
              'flex items-end gap-[2px] h-4 transition-opacity duration-300 mr-1',
              isSpeaking && !isMuted ? 'opacity-100' : 'opacity-0'
            )}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-primary/70"
                  style={{
                    animation: isSpeaking && !isMuted
                      ? `waveform-bar 1.2s ease-in-out ${i * 0.15}s infinite`
                      : 'none',
                    height: '4px',
                  }}
                />
              ))}
            </div>

            {/* Mute */}
            <Button
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', isMuted ? 'text-muted-foreground/50' : 'text-primary')}
              onClick={toggleMute}
              title={isMuted ? 'Unmute narration' : 'Mute narration'}
            >
              {narrationLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Skip */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
              title="Skip step"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>

            {/* Restart */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleRestart}
              title="Restart tour"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Stop */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleStop}
              title="End tour"
            >
              <X className="h-3.5 w-3.5" />
            </Button>

            {/* Debug toggle (hidden) */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground/30 hover:text-muted-foreground"
              onClick={() => { setDebugMode(d => !d); setShowDebugPanel(p => !p); }}
              title="Toggle debug"
            >
              <Bug className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Debug panel */}
        <AnimatePresence>
          {showDebugPanel && debugMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 rounded-lg border border-border/40 bg-card/95 backdrop-blur-xl shadow-lg px-4 py-3 max-h-48 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Debug Log
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 text-[9px] px-1.5"
                  onClick={clearDebugLogs}
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-0.5 font-mono text-[9px]">
                {getDebugLogs().slice(-20).map((log, i) => (
                  <div key={i} className={cn(
                    'text-[9px]',
                    log.type === 'error' ? 'text-destructive' :
                    log.type === 'warn' ? 'text-warning' : 'text-muted-foreground'
                  )}>
                    S{log.stepId}B{log.beatIndex}: {log.message}
                  </div>
                ))}
                {getDebugLogs().length === 0 && (
                  <span className="text-muted-foreground/50">No logs yet</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Step fade transition overlay ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`step-transition-${currentStep}`}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed inset-0 z-[9989] pointer-events-none bg-background/20"
        />
      </AnimatePresence>
    </>
  );
}
