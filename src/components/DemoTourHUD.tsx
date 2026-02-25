import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, CheckCircle2, RotateCcw, X,
  Shield, Brain, Map, CloudLightning, Network, Eye,
  Gauge, Sparkles, Volume2, VolumeX, Loader2, Bug, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TourSpotlight } from '@/components/tour/TourSpotlight';
import { TourTranscriptPanel } from '@/components/tour/TourTranscriptPanel';
import {
  safeScroll,
  waitForStepReady,
  enableDebugMode,
  getDebugLogs,
  clearDebugLogs,
  type TourStep,
} from '@/lib/tour-engine';
import {
  getStepsForMode,
  getNarrationForMode,
  tourModeConfigs,
  type TourMode,
} from '@/lib/tour-modes';

// ── Narration hook (inline simplified version that uses mode-aware scripts) ──

function useModeNarration(mode: TourMode) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [narrationDone, setNarrationDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStepRef = useRef(-1);
  const cacheRef = useRef<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setIsLoading(false);
    setIsSpeaking(false);
  }, []);

  const pauseNarration = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.pause();
  }, []);

  const resumeNarration = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime > 0) {
      audioRef.current.play().catch(() => {});
    }
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        if (audioRef.current) audioRef.current.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setNarrationDone(true);
      }
      return next;
    });
  }, []);

  const attachListeners = useCallback((audio: HTMLAudioElement, stepIndex: number) => {
    audio.addEventListener('play', () => { setIsSpeaking(true); setNarrationDone(false); });
    audio.addEventListener('pause', () => setIsSpeaking(false));
    audio.addEventListener('ended', () => {
      setIsSpeaking(false);
      if (currentStepRef.current === stepIndex) setNarrationDone(true);
    });
  }, []);

  const playStepNarration = useCallback(async (stepIndex: number) => {
    stopNarration();
    currentStepRef.current = stepIndex;
    setNarrationDone(false);

    if (isMuted) { setNarrationDone(true); return; }

    const scripts = getNarrationForMode(mode);
    const script = scripts[stepIndex];
    if (!script) { setNarrationDone(true); return; }

    const cacheKey = `${mode}-${stepIndex}`;
    const cachedUrl = cacheRef.current[cacheKey];

    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      attachListeners(audio, stepIndex);
      audioRef.current = audio;
      try { await audio.play(); } catch { setNarrationDone(true); }
      return;
    }

    // ── Priority 1: Pre-recorded MP3 from public/tour/{mode}/step-{n}.mp3 ──
    const preRecordedPath = `/tour/${mode}/step-${stepIndex}.mp3`;
    try {
      const headResp = await fetch(preRecordedPath, { method: 'HEAD' });
      if (headResp.ok && headResp.headers.get('content-type')?.includes('audio')) {
        cacheRef.current[cacheKey] = preRecordedPath;
        const audio = new Audio(preRecordedPath);
        attachListeners(audio, stepIndex);
        audioRef.current = audio;
        try { await audio.play(); } catch { setNarrationDone(true); }
        return;
      }
    } catch {
      // Pre-recorded file not available, continue to TTS
    }

    if (currentStepRef.current !== stepIndex) return;

    // ── Priority 2: ElevenLabs TTS ──
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ text: script }),
        signal: controller.signal,
      });

      if (currentStepRef.current !== stepIndex) { setIsLoading(false); return; }

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        cacheRef.current[cacheKey] = url;
        const audio = new Audio(url);
        attachListeners(audio, stepIndex);
        audioRef.current = audio;
        setIsLoading(false);
        try { await audio.play(); } catch { setNarrationDone(true); }
        return;
      }
    } catch {
      // fallback
    }

    // ── Priority 3: Browser SpeechSynthesis ──
    setIsLoading(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(script);
      utt.rate = 0.92;
      utt.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en'));
      if (preferred) utt.voice = preferred;
      setIsSpeaking(true);
      utt.onend = () => {
        setIsSpeaking(false);
        if (currentStepRef.current === stepIndex) setNarrationDone(true);
      };
      utt.onerror = () => {
        setIsSpeaking(false);
        setNarrationDone(true);
      };
      window.speechSynthesis.speak(utt);
    } else {
      setNarrationDone(true);
    }
  }, [isMuted, mode, stopNarration, attachListeners, SUPABASE_URL, SUPABASE_KEY]);

  useEffect(() => {
    return () => {
      stopNarration();
      Object.values(cacheRef.current).forEach(url => URL.revokeObjectURL(url));
      cacheRef.current = {};
    };
  }, [stopNarration]);

  return { isMuted, isLoading, isSpeaking, narrationDone, toggleMute, playStepNarration, stopNarration, pauseNarration, resumeNarration };
}

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
  const [tourMode, setTourMode] = useState<TourMode>('executive');
  const [showTranscript, setShowTranscript] = useState(false);

  // ── Beat state ──
  const [activeBeat, setActiveBeat] = useState<BeatState>({ selector: null, caption: null });
  const beatIndexRef = useRef(0);
  const beatTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedBeatIndexRef = useRef(0);

  // ── Debug ──
  const [debugMode, setDebugMode] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // ── Mode-aware narration ──
  const {
    isMuted, isLoading: narrationLoading, isSpeaking,
    narrationDone, toggleMute, playStepNarration, stopNarration,
    pauseNarration, resumeNarration,
  } = useModeNarration(tourMode);

  const navigate = useNavigate();

  // Get current mode's steps
  const modeSteps = getStepsForMode(tourMode);
  const modeConfig = tourModeConfigs[tourMode];

  // ── Sync debug mode ──
  useEffect(() => { enableDebugMode(debugMode); }, [debugMode]);

  // ── Listen for tour start ──
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const mode: TourMode = detail?.mode || 'executive';
      setTourMode(mode);
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentStep(0);
      setStepComplete(false);
      setCompletedSteps([]);
      setTourComplete(false);
      clearDebugLogs();
    };
    window.addEventListener('start-demo-tour', handleStart);
    return () => window.removeEventListener('start-demo-tour', handleStart);
  }, []);

  // ── Body class for dim ──
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (isPlaying && !tourComplete) {
      document.body.classList.add('tour-active');
      if (main) main.style.paddingBottom = '100px';
    } else {
      document.body.classList.remove('tour-active');
      if (main) main.style.paddingBottom = '';
    }
    return () => {
      document.body.classList.remove('tour-active');
      if (main) main.style.paddingBottom = '';
    };
  }, [isPlaying, tourComplete]);

  // ── Clear beats ──
  const clearBeats = useCallback(() => {
    beatTimersRef.current.forEach(t => clearTimeout(t));
    beatTimersRef.current = [];
    setActiveBeat({ selector: null, caption: null });
  }, []);

  // ── Execute beats for a step ──
  const executeBeats = useCallback((step: TourStep, startFromBeat = 0) => {
    clearBeats();
    const beats = step.beats;
    if (!beats.length) return;

    const estimatedDuration = 25000;
    const beatInterval = estimatedDuration / beats.length;

    beats.forEach((beat, idx) => {
      if (idx < startFromBeat) return;
      const delay = (idx - startFromBeat) * beatInterval;

      const timer = setTimeout(() => {
        beatIndexRef.current = idx;
        safeScroll(beat.selector, step.id, idx);
        setActiveBeat({ selector: beat.selector, caption: beat.caption });

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

    const step = modeSteps[currentStep];
    if (!step) return;

    setStepComplete(false);
    clearBeats();
    beatIndexRef.current = 0;

    navigate(step.route);

    const runStep = async () => {
      await new Promise(r => setTimeout(r, 800));
      await waitForStepReady(step);

      if (!isPaused) playStepNarration(currentStep);
      if (!isPaused) executeBeats(step);
    };

    runStep();

    return () => {
      stopNarration();
      clearBeats();
    };
  }, [currentStep, isPlaying, navigate, playStepNarration, stopNarration, clearBeats, executeBeats, isPaused, modeSteps]);

  // ── Mark step complete when narration ends ──
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    if (narrationDone || isMuted) {
      const timer = setTimeout(() => {
        setStepComplete(true);
        clearBeats();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [narrationDone, isMuted, isPlaying, isPaused, clearBeats]);

  // ── Pause / Resume ──
  const handlePause = useCallback(() => {
    setIsPaused(true);
    pauseNarration();
    pausedBeatIndexRef.current = beatIndexRef.current;
    beatTimersRef.current.forEach(t => clearTimeout(t));
    beatTimersRef.current = [];
  }, [pauseNarration]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    resumeNarration();
    const step = modeSteps[currentStep];
    if (step) executeBeats(step, pausedBeatIndexRef.current + 1);
  }, [resumeNarration, currentStep, executeBeats, modeSteps]);

  // ── Next step (manual only) ──
  const handleNext = useCallback(() => {
    if (!stepComplete && !isPaused) return;
    stopNarration();
    clearBeats();
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep < modeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepComplete(false);
      setIsPaused(false);
    } else {
      setIsPlaying(false);
      setTourComplete(true);
      stopNarration();
    }
  }, [stepComplete, isPaused, currentStep, stopNarration, clearBeats, modeSteps.length]);

  // ── Skip ──
  const handleSkip = useCallback(() => {
    stopNarration();
    clearBeats();
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep < modeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepComplete(false);
      setIsPaused(false);
    } else {
      setIsPlaying(false);
      setTourComplete(true);
    }
  }, [currentStep, stopNarration, clearBeats, modeSteps.length]);

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
    clearDebugLogs();
  }, [stopNarration, clearBeats]);

  // ── Stop ──
  const handleStop = useCallback(() => {
    stopNarration();
    clearBeats();
    setIsPlaying(false);
    setIsPaused(false);
    setShowTranscript(false);
  }, [stopNarration, clearBeats]);

  // ── Completion Screen ──
  const domainSections = [
    { icon: Shield, title: 'Deterministic Policy Enforcement', bullets: ['Severity-based escalation', 'Crew readiness gating', 'Critical load protection', 'Policy blocks prior to advisory'] },
    { icon: Gauge, title: 'Confidence-Based ETR Modeling', bullets: ['ETR confidence bands', 'Uncertainty transparency', 'Hazard-adjusted restoration risk'] },
    { icon: CloudLightning, title: 'Hazard-Correlated Risk Scoring', bullets: ['Weather hazard overlays', 'Feeder vulnerability assessment', 'Crew safety constraints'] },
    { icon: Brain, title: 'Structured AI Guardrails', bullets: ['Structured output contracts', 'Policy-based blocking', 'Transparent reasoning pathways'] },
    { icon: Map, title: 'Geospatial Awareness', bullets: ['Outage visualization', 'Feeder zone mapping', 'Lifecycle progression'] },
    { icon: Network, title: 'Governance-First Architecture', bullets: ['Advisory-only posture', 'Rule engine precedes AI', 'Enterprise integration pathway'] },
  ];

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
                  {modeConfig.label} Complete
                </h2>
                <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                  {modeConfig.subtitle} · {modeSteps.length} Steps Completed
                </p>
              </div>

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

              {/* Final statement */}
              <div className="border-l-2 border-primary/50 pl-4 py-1">
                <p className="text-[11px] text-foreground/90 leading-relaxed font-medium italic">
                  AI Bound by Policy. Human Authority Preserved. Structured Intelligence Before Action.
                </p>
              </div>

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
                    {modeConfig.label} — Complete
                  </span>
                </motion.div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Governed Decision Intelligence · Phase-1 Prototype
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
                  variant="outline"
                  onClick={() => {
                    setTourComplete(false);
                    window.dispatchEvent(new CustomEvent('open-demo-script'));
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try Another Mode
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

  const step = modeSteps[currentStep];
  const overallProgress = ((completedSteps.length) / modeSteps.length) * 100;
  const totalSteps = modeSteps.length;

  return (
    <>
      {/* ── Spotlight Overlay ── */}
      <TourSpotlight
        selector={activeBeat.selector}
        caption={activeBeat.caption}
        visible={!isPaused && activeBeat.selector !== null}
      />

      {/* ── Transcript Panel ── */}
      <TourTranscriptPanel
        mode={tourMode}
        currentStep={currentStep}
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
      >
        <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-2 min-w-[520px] max-w-[620px]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span
                className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border flex-shrink-0"
                style={{
                  color: modeConfig.accentColor,
                  borderColor: `${modeConfig.accentColor}40`,
                  backgroundColor: `${modeConfig.accentColor}10`,
                }}
              >
                {modeConfig.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60 mx-0.5 flex-shrink-0">·</span>
              <span className="text-[11px] font-semibold text-foreground truncate">{step.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold text-foreground tabular-nums">
                {currentStep + 1} / {totalSteps}
              </span>
              {isPaused && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  Paused
                </span>
              )}
              {stepComplete && !isPaused && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                  Ready
                </span>
              )}
            </div>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {modeSteps.map((_, i) => (
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
            {isPaused ? (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/10" onClick={handleResume}>
                <Play className="h-3.5 w-3.5" /> Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handlePause}>
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}

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
              <SkipForward className="h-3.5 w-3.5" /> Next Step
            </Button>

            <div className="flex-1" />

            {/* Waveform */}
            <div className={cn(
              'flex items-end gap-[2px] h-4 transition-opacity duration-300 mr-1',
              isSpeaking && !isMuted ? 'opacity-100' : 'opacity-0'
            )}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-primary/70"
                  style={{
                    animation: isSpeaking && !isMuted ? `waveform-bar 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
                    height: '4px',
                  }}
                />
              ))}
            </div>

            {/* Transcript toggle */}
            <Button
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', showTranscript ? 'text-primary' : 'text-muted-foreground')}
              onClick={() => setShowTranscript(v => !v)}
              title="Toggle transcript"
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>

            {/* Mute */}
            <Button
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', isMuted ? 'text-muted-foreground/50' : 'text-primary')}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
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
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleSkip} title="Skip step">
              <SkipForward className="h-3.5 w-3.5" />
            </Button>

            {/* Restart */}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleRestart} title="Restart">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Stop */}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleStop} title="End tour">
              <X className="h-3.5 w-3.5" />
            </Button>

            {/* Debug */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground/30 hover:text-muted-foreground"
              onClick={() => { setDebugMode(d => !d); setShowDebugPanel(p => !p); }}
              title="Debug"
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
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Debug Log</span>
                <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1.5" onClick={clearDebugLogs}>Clear</Button>
              </div>
              <div className="space-y-0.5 font-mono text-[9px]">
                {getDebugLogs().slice(-20).map((log, i) => (
                  <div key={i} className={cn(
                    'text-[9px]',
                    log.type === 'error' ? 'text-destructive' :
                    log.type === 'warn' ? 'text-amber-400' : 'text-muted-foreground'
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

      {/* ── Step fade transition ── */}
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
