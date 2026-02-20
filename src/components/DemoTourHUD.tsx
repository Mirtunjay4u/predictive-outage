import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, Square, CheckCircle2, RotateCcw, X,
  Shield, Brain, Map, BarChart3, FileText, Layout, CloudLightning,
  Network, Info, Settings, Zap, Globe, Eye, Activity, Lock, Unlock,
  AlertTriangle, Target, Gauge, Users, Radio, Layers, Cpu, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORM_EVENT_ID = '471105eb-fbf9-43c1-8cc5-ad8214abfed8';

/**
 * 14-step Executive Auto Tour — GTC-grade live demo sequence.
 * Each step: route, duration, narrative (HUD), tooltip (overlay), highlights (section names).
 */
const tourSteps = [
  {
    id: 0,
    title: 'Login & Context',
    route: '/login',
    duration: 15000,
    narrative: 'Establishing operator context via the Login page. The landing view provides immediate orientation to system capabilities.',
    tooltip: 'This decision-support platform integrates deterministic policy enforcement with AI-assisted operational analysis.',
    highlights: ['Platform title', 'Key capabilities', 'Demo Mode button'],
    autoAction: 'login', // triggers auto-login at 10s
  },
  {
    id: 1,
    title: 'Dashboard Orientation',
    route: '/dashboard',
    duration: 25000,
    narrative: 'Reviewing active event KPIs, high-priority alerts, crew workload, Executive Signal, and the Operational Phase ribbon.',
    tooltip: 'The Dashboard provides real-time operational awareness combining risk scoring, event prioritization, and readiness tracking.',
    highlights: ['Active Event Banner', 'System Risk Index', 'Executive Signal', 'Operational Phase', 'Crew Readiness'],
  },
  {
    id: 2,
    title: 'Scenario Playback Lifecycle',
    route: '/dashboard',
    duration: 20000,
    narrative: 'Scrolling to the Scenario Playback panel — stepping through Pre-Event, Event, and Post-Event lifecycle stages.',
    tooltip: 'Scenario Playback simulates hazard lifecycle progression to test policy validation and readiness posture.',
    highlights: ['Scenario Playback Panel'],
  },
  {
    id: 3,
    title: 'Events Page Deep Dive',
    route: '/events',
    duration: 30000,
    narrative: 'Reviewing the triage queue: high-priority events, severity scales, ETR confidence bands, critical load tags, and policy status.',
    tooltip: 'Each event includes ETR confidence banding, critical load prioritization, and deterministic policy evaluation.',
    highlights: ['High Priority Event', 'Severity Scale', 'ETR Confidence Band', 'Critical Load Tag', 'Policy Status'],
  },
  {
    id: 4,
    title: 'Event Detail View',
    route: `/event/${STORM_EVENT_ID}`,
    duration: 20000,
    narrative: 'Drilling into Downtown Houston Storm Damage — crew assignment, escalation state, hazard correlation, ETR confidence explanation.',
    tooltip: 'All recommendations are validated through explicit operational rules before AI advisory output.',
    highlights: ['Crew Assignment', 'Escalation State', 'Hazard Correlation', 'ETR Confidence'],
  },
  {
    id: 5,
    title: 'Outage Map Intelligence',
    route: '/outage-map',
    duration: 35000,
    narrative: 'Viewing events geographically — outage zones, feeder topology, hazard overlays, critical loads, and crew positioning.',
    tooltip: 'Geospatial awareness integrates outage zones, feeder topology, hazard overlays, and crew positioning.',
    highlights: ['Event Markers', 'Critical Load Layer', 'Crew Dispatch Layer', 'Weather Overlay'],
  },
  {
    id: 6,
    title: 'Weather Alerts Section',
    route: '/weather-alerts',
    duration: 20000,
    narrative: 'Reviewing hazard exposure scoring, events in hazard zones, and crew safety status across active weather threats.',
    tooltip: 'Hazard intelligence correlates weather exposure with outage risk and crew deployment constraints.',
    highlights: ['Hazard Exposure Score', 'Events in Hazard Zones', 'Crew Safety Status'],
  },
  {
    id: 7,
    title: 'Copilot Studio',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}&auto_run=true`,
    duration: 40000,
    narrative: 'AI-assisted analysis of the Downtown Houston Storm event via the Nemotron engine. Reviewing guardrails and structured outputs.',
    tooltip: 'AI analysis operates within strict guardrails and structured output contracts. No autonomous actions are executed.',
    highlights: ['Selected Event', 'Analysis Mode', 'Guardrails Panel', 'Allowed Actions', 'Blocked Actions'],
    autoAction: 'copilot', // auto-run analysis
  },
  {
    id: 8,
    title: 'Situation Report Generation',
    route: `/event/${STORM_EVENT_ID}/situation-report`,
    duration: 20000,
    narrative: 'Generating an AI-assisted SitRep. The content can be reviewed, approved, and distributed via the Communications Pack.',
    tooltip: 'Operators can generate structured situation reports for controlled communication and stakeholder updates.',
    highlights: ['SitRep Generation', 'Approval Indicator'],
  },
  {
    id: 9,
    title: 'Analytics',
    route: '/analytics',
    duration: 20000,
    narrative: 'Reviewing operational analytics — high-priority counts, policy blocks, and ETR confidence distribution charts.',
    tooltip: 'Operational analytics are derived from live event data and deterministic rule-engine outputs.',
    highlights: ['High Priority Count', 'Policy Blocks', 'ETR Distribution Chart'],
  },
  {
    id: 10,
    title: 'Architecture Overview',
    route: '/architecture',
    duration: 20000,
    narrative: 'Exploring the system architecture — ingest layer, copilot orchestrator, guardrails, Nemotron LLM, observability.',
    tooltip: 'The architecture separates ingestion, orchestration, inference, and governance into independent control planes.',
    highlights: ['Ingest Layer', 'Copilot Orchestrator', 'Guardrails', 'Nemotron LLM', 'Observability'],
  },
  {
    id: 11,
    title: 'About & Governance',
    route: '/about',
    duration: 15000,
    narrative: 'Reviewing advisory-only governance, safety compliance, and the platform\'s decision-support-only boundary.',
    tooltip: 'This system provides decision support only and does not execute control actions.',
    highlights: ['Advisory Only Notice', 'Safety & Compliance'],
  },
  {
    id: 12,
    title: 'Settings',
    route: '/settings',
    duration: 15000,
    narrative: 'Reviewing configurable AI modes, Dataverse integration panel, and enterprise integration readiness.',
    tooltip: 'The platform supports configurable AI modes and enterprise integration readiness.',
    highlights: ['AI Mode Toggle', 'Dataverse Integration'],
  },
  {
    id: 13,
    title: 'Return to Dashboard',
    route: '/dashboard',
    duration: 20000,
    narrative: 'Completing the operational loop — confirming updated KPIs, stabilized posture, and the narrative resolution of the demo.',
    tooltip: 'The operational loop closes with updated KPIs and stabilized system posture.',
    highlights: ['System Risk Index', 'Operational Phase'],
  },
];

export function DemoTourHUD() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [tourComplete, setTourComplete] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartRef = useRef<number>(0);
  const autoActionFiredRef = useRef<Set<number>>(new Set());

  // Listen for tour start events from DemoScriptModal
  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentStep(0);
      setStepProgress(0);
      setCompletedSteps([]);
      setTourComplete(false);
      setShowTooltip(false);
      autoActionFiredRef.current = new Set();
    };
    window.addEventListener('start-demo-tour', handleStart);
    return () => window.removeEventListener('start-demo-tour', handleStart);
  }, []);

  // Toggle body class for dimming non-focused UI
  useEffect(() => {
    if (isPlaying && !tourComplete) {
      document.body.classList.add('tour-active');
    } else {
      document.body.classList.remove('tour-active');
    }
    return () => document.body.classList.remove('tour-active');
  }, [isPlaying, tourComplete]);

  // Navigate on step change
  useEffect(() => {
    if (!isPlaying) return;
    const step = tourSteps[currentStep];
    if (!step) return;
    navigate(step.route);
    // Show tooltip after a short delay
    setShowTooltip(false);
    const tooltipTimer = setTimeout(() => setShowTooltip(true), 1500);
    return () => clearTimeout(tooltipTimer);
  }, [currentStep, isPlaying, navigate]);

  // Progress timer + auto-actions
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

      // Auto-action: login at 66% of step 0
      if (step.autoAction === 'login' && elapsed > duration * 0.66 && !autoActionFiredRef.current.has(currentStep)) {
        autoActionFiredRef.current.add(currentStep);
        window.dispatchEvent(new CustomEvent('tour-auto-login'));
      }

      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        setCompletedSteps(prev => [...prev, currentStep]);

        if (currentStep < tourSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
          setStepProgress(0);
        } else {
          setIsPlaying(false);
          setStepProgress(100);
          setTourComplete(true);
        }
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, isPlaying, isPaused]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

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
      setTourComplete(true);
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

  const handleRestart = useCallback(() => {
    setTourComplete(false);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentStep(0);
    setStepProgress(0);
    setCompletedSteps([]);
    autoActionFiredRef.current = new Set();
  }, []);

  const handleDismissComplete = useCallback(() => {
    setTourComplete(false);
  }, []);

  // ── Domain capability sections ──
  const domainSections = [
    {
      icon: Shield,
      title: 'Deterministic Operational Policy Enforcement',
      bullets: [
        'Severity-based escalation (1–5 utility scale)',
        'Crew skillset and readiness gating',
        'Critical load protection logic',
        'Asset maintenance and lock-state enforcement',
        'Explicit policy blocks prior to advisory output',
      ],
      conclusion: 'All AI-assisted recommendations are bounded by explicit outage management rules aligned with real-world utility governance.',
    },
    {
      icon: Gauge,
      title: 'Confidence-Based ETR Modeling',
      bullets: [
        'ETR confidence bands (High / Medium / Low)',
        'Uncertainty transparency (no single-point estimates)',
        'Hazard-adjusted restoration risk',
        'Crew availability impact on restoration timelines',
        'Critical load runway sensitivity',
      ],
      conclusion: 'Restoration estimates are probabilistic, defensible, and operationally explainable — not opaque AI predictions.',
    },
    {
      icon: CloudLightning,
      title: 'Hazard-Correlated Risk Scoring',
      bullets: [
        'Weather hazard overlays (wind, lightning, flood, heat)',
        'Vegetation and exposure modeling',
        'Feeder-level vulnerability assessment',
        'Crew safety constraints under active hazard zones',
      ],
      conclusion: 'Operational risk prioritization reflects real environmental exposure and infrastructure vulnerability.',
    },
    {
      icon: Brain,
      title: 'Structured AI Guardrails & Explainability',
      bullets: [
        'Structured output contracts (no free-form generation)',
        'Clear separation of Allowed vs Restricted actions',
        'Policy-based blocking with remediation guidance',
        'Transparent reasoning pathways',
      ],
      conclusion: 'AI augments operator reasoning within safety boundaries — it does not override operational governance.',
    },
    {
      icon: Map,
      title: 'Geospatial Situational Awareness',
      bullets: [
        'Real-time outage visualization',
        'Feeder zone mapping',
        'Crew dispatch tracking',
        'Critical infrastructure overlays',
        'Lifecycle progression (Pre-Event → Event → Post-Event)',
      ],
      conclusion: 'The system functions as a grid resilience command interface — not just a reporting dashboard.',
    },
    {
      icon: Network,
      title: 'Governance-First Architecture',
      bullets: [
        'Advisory-only control posture',
        'No live SCADA / OMS / ADMS actuation',
        'Deterministic rule engine precedes AI inference',
        'Observability and compliance readiness',
        'Enterprise integration pathway (Phase-2)',
      ],
      conclusion: 'The architecture aligns with regulated utility operational standards and minimizes AI-related control risk.',
    },
  ];

  const aiImpactPoints = [
    'AI-assisted triage without autonomous switching',
    'Explainable restoration guidance',
    'Policy-aware recommendation filtering',
    'Hazard-informed outage prioritization',
    'Transparent uncertainty communication',
    'Human-in-the-loop decision governance',
  ];

  const postureSummary = [
    { label: 'System Risk Index', value: 'Stabilized', color: 'text-green-500' },
    { label: 'Critical Load Exposure', value: 'Reduced', color: 'text-green-500' },
    { label: 'Policy Violations', value: 'None', color: 'text-green-500' },
    { label: 'Crew Deployment Status', value: 'Within Threshold', color: 'text-green-500' },
    { label: 'AI Confidence Band', value: 'High', color: 'text-primary' },
  ];

  // Greeting animation state
  const [showGreeting, setShowGreeting] = useState(false);
  const greetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tourComplete) {
      greetingTimerRef.current = setTimeout(() => setShowGreeting(true), 1200);
    } else {
      setShowGreeting(false);
    }
    return () => { if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current); };
  }, [tourComplete]);

  // ── Tour completion celebration ──
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
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-[780px] max-w-[95vw] max-h-[92vh] rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Gradient header bar */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary flex-shrink-0" />

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6">
              {/* ── Title Block ── */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20"
                >
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-xl font-bold tracking-tight text-foreground"
                >
                  Executive Demonstration Complete
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto"
                >
                  AI-Constrained Decision Intelligence for Utility Outage Operations
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-xl mx-auto"
                >
                  This guided demonstration validated the platform's ability to combine deterministic operational policy with explainable AI reasoning — without introducing autonomous control risk.
                </motion.p>
              </div>

              {/* ── Operational Capabilities Proven ── */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-3">
                  Operational Capabilities Proven
                </h3>
                <div className="space-y-3">
                  {domainSections.map((section, si) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + si * 0.08 }}
                      className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <section.icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
                        </div>
                        <h4 className="text-[12px] font-semibold text-foreground">{section.title}</h4>
                      </div>
                      <ul className="space-y-0.5 pl-8 mb-2">
                        {section.bullets.map((b) => (
                          <li key={b} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary/60 mt-[3px]">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pl-8">
                        <p className="text-[10px] italic text-accent font-medium leading-snug">
                          Domain Conclusion: {section.conclusion}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── AI Impact in Utility Context ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    AI Impact in Utility Context
                  </h3>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                  This platform demonstrates the responsible application of AI in grid operations:
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                  {aiImpactPoints.map((pt) => (
                    <div key={pt} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-accent/70 mt-[2px] flex-shrink-0" />
                      <span className="text-[10px] text-foreground/80">{pt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── Operational Posture Summary ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Operational Posture Summary (Demo Scenario)
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

              {/* ── Final Positioning Statement ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="border-l-2 border-primary/50 pl-4 py-1"
              >
                <p className="text-[11px] text-foreground/90 leading-relaxed font-medium italic">
                  This solution represents a defensible, AI-constrained decision-support layer for electric utility outage management — designed to enhance operator judgment, improve restoration transparency, and strengthen grid resilience without introducing automation risk.
                </p>
              </motion.div>

              {/* ── Animated Greeting ── */}
              <AnimatePresence>
                {showGreeting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="inline-block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] bg-clip-text text-transparent"
                    >
                      <span className="text-lg font-bold tracking-tight">
                        Thank you for watching the Executive Demo
                      </span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-[10px] text-muted-foreground mt-1"
                    >
                      AI-Constrained Decision Intelligence · Utility Outage Operations · Phase-1
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Sticky Action Bar ── */}
            <div className="flex-shrink-0 border-t border-border/40 bg-card/95 backdrop-blur-sm px-7 py-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={handleRestart}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart Executive Tour
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setTourComplete(false); navigate('/dashboard'); }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Explore System Manually
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setTourComplete(false); navigate('/architecture'); }}
                >
                  <Network className="w-4 h-4 mr-2" />
                  View Technical Architecture
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismissComplete}
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

  // Build block progress bar
  const totalSteps = tourSteps.length;
  const filledBlocks = completedSteps.length;
  const progressBlocks = Array.from({ length: totalSteps }, (_, i) =>
    i < filledBlocks ? '■' : i === currentStep ? '▶' : '□'
  ).join('');

  return (
    <>
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
        <div className="flex items-center justify-center gap-3 py-1.5 bg-card/90 backdrop-blur-sm border-b border-border/30">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Executive Auto Tour
          </span>
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
            {progressBlocks}
          </span>
          <span className="text-[10px] font-semibold text-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          {isPaused && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-warning px-1.5 py-0.5 rounded bg-warning/10">
              Paused
            </span>
          )}
        </div>
      </motion.div>

      {/* ── FLOATING TOOLTIP OVERLAY ── */}
      <AnimatePresence>
        {showTooltip && step.tooltip && (
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[52px] left-1/2 -translate-x-1/2 z-[9997] max-w-xl pointer-events-none"
          >
            <div className="relative rounded-lg border border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg px-5 py-3.5">
              {/* Gradient accent top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-primary via-accent to-primary" />
              
              {/* Highlight chips */}
              {step.highlights && step.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {step.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                {step.tooltip}
              </p>

              {/* Down arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card/95 border-r border-b border-primary/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM HUD ── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[640px] max-w-[95vw]"
      >
        <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Step pills */}
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-1">
              {tourSteps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleStepClick(i)}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-200 cursor-pointer',
                    completedSteps.includes(i)
                      ? 'bg-primary'
                      : i === currentStep
                      ? 'bg-primary/60'
                      : 'bg-muted-foreground/15 hover:bg-muted-foreground/25'
                  )}
                  title={s.title}
                />
              ))}
            </div>
          </div>

          <div className="px-4 pb-3 pt-2">
            {/* Current step info */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.14em]">
                    Step {currentStep + 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">·</span>
                  <span className="text-[10px] text-muted-foreground">{step.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {step.narrative}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isPaused ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    onClick={handleResume}
                    title="Resume"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:bg-muted"
                    onClick={handlePause}
                    title="Pause"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:bg-muted"
                  onClick={handleSkip}
                  title="Skip to next"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleStop}
                  title="Stop tour"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="mt-2 h-[3px] rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
