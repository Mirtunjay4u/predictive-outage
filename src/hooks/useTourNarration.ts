import { useRef, useCallback, useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Narration scripts — rewritten for natural ElevenLabs George voice delivery.
 * Short sentences. Natural pauses via commas and ellipses. Briefing tone.
 * Index matches tourSteps[].id in DemoTourHUD.
 */
export const narrationScripts: string[] = [
  // Step 0 — Login & Context
  `Welcome to Operator Copilot... a governed AI decision layer built for regulated utility outage operations. This login screen establishes your operator context and session boundaries. In demo mode, we load pre-built storm scenarios... no live SCADA integration is active. The system is strictly advisory. No switching commands, no breaker actuation, no automatic dispatch. Human authority is preserved at all times.`,

  // Step 1 — Dashboard Orientation
  `This is your operational command center. At the top, you'll see severity-classified events and the System Risk Index. Below that... Executive Signal cards highlight what matters most right now. The KPI grid shows active outages, customers impacted, crew deployment status, and ETR confidence levels. Notice the governance header strip... Governed AI, Advisory-Only, Operator Validation Required. This reinforces operational discipline at every level.`,

  // Step 2 — Scenario Playback Lifecycle
  `Now we're looking at the Scenario Playback panel. This module simulates the full outage lifecycle... Pre-Event monitoring, Active Event response, and Post-Event stabilization. Watch how hazard exposure, crew allocation, and confidence metrics evolve through each phase. This is designed for operational rehearsal... and resilience planning.`,

  // Step 3 — Events Page Deep Dive
  `Here is the events triage queue. Each row gives you structured visibility into the event... severity classification, ETR confidence band, critical load tags, and policy enforcement status. Notice the policy flags on the right... these indicate whether operational constraints are affecting potential advisory insights. This creates full transparency between system logic and your awareness as an operator.`,

  // Step 4 — Event Detail View
  `We've drilled into the Downtown Houston Storm Damage event. This view reveals the full operational context... crew assignment state, escalation phase, hazard correlation, and ETR confidence explanation. The confidence range reflects multiple factors... weather exposure, asset condition, and crew readiness. If maintenance locks or safety constraints are present... advisory pathways are automatically restricted. Everything is explainable.`,

  // Step 5 — Outage Map Intelligence
  `The outage map integrates feeder topology with situational overlays. Here we can correlate downstream impact zones... critical infrastructure nodes... crew proximity... and hazard exposure layers. This spatial intelligence strengthens restoration prioritization while preserving clear operational boundaries. No switching actions are triggered from this interface.`,

  // Step 6 — Weather Alerts Section
  `This is the weather intelligence layer. We incorporate environmental signals... wind velocity, precipitation intensity, storm cell tracking, and exposure scoring. Events within hazard zones are dynamically correlated with weather data. This enhances predictive risk modeling and crew safety planning. Environmental awareness informs decision logic... but does not automate it.`,

  // Step 7 — Copilot Studio
  `Welcome to Copilot Studio... the governed AI advisory engine powered by NVIDIA Nemotron. But here's the key... inference is only executed after deterministic rule validation. The system evaluates asset maintenance flags, crew skillset mismatches, and critical load thresholds before generating any advisory output. You'll see allowed and blocked recommendations clearly separated. This ensures explainability... and full policy compliance.`,

  // Step 8 — Situation Report Generation
  `The system generates structured Situation Reports consolidating event status, confidence bands, critical load exposure, and actions taken. Notice the approval indicators... ensuring human validation before any distribution. This improves communication clarity across stakeholders... without removing operator oversight.`,

  // Step 9 — Analytics
  `The analytics layer visualizes high-priority event distributions... policy block frequency... ETR confidence variability... and restoration trend patterns. These metrics strengthen your resilience planning and post-event analysis. Analytics inform decision-making. They do not override it.`,

  // Step 10 — Architecture Overview
  `Now let's review the system architecture. It consists of a data ingestion layer... operational rule engine... copilot orchestration layer... NVIDIA Nemotron inference layer... guardrail enforcement module... and observability components. Notice the critical design principle... AI reasoning is always downstream of deterministic policy validation. This layered architecture ensures bounded intelligence within regulatory constraints.`,

  // Step 11 — About & Governance
  `The governance documentation clearly defines our system boundaries. The platform is advisory-only... human-in-the-loop... non-autonomous... and non-actuating. No SCADA integration is active in Phase One. This preserves full compliance with regulated grid operations.`,

  // Step 12 — Solution Roadmap
  `This is the Solution Evolution Blueprint. It visualizes a structured evolution plan aligned to utility operational governance and predictive validation milestones. Phase One establishes governed decision support. Phase Two introduces calibrated predictive analytics and enterprise integration. Phase Three targets production hardening. Notice the progress connectors between phases... and the acceptance markers that define clear transition criteria.`,

  // Step 13 — Knowledge & Policy
  `This page defines the operational governance rules that constrain system behavior. Every deterministic rule, escalation trigger, and safety policy is documented and auditable. Phase One scope boundaries are explicitly stated. This ensures regulatory defensibility and transparent operational discipline.`,

  // Step 14 — Glossary
  `The Glossary provides standardized definitions for all key operational and AI terms used throughout the platform. It's search-enabled, regulator-ready, and ensures terminology consistency across stakeholders... from field operators to executive leadership.`,

  // Step 15 — Settings
  `The settings panel exposes configurable AI modes and enterprise integration readiness. Future integrations including Dataverse and enterprise telemetry are architecturally supported... but not enabled in Phase One. This reflects scalable design... without premature automation.`,

  // Step 16 — Art of Possibilities
  `Now we explore the Art of Possibilities... a conceptual roadmap for Phase Two and beyond. This layer introduces environmental signal fusion... wildfire corridor awareness... vegetation stress intelligence... and bio-sentinel anomaly corroboration. The visualization shows how satellite hotspot data, wind vectors, fuel dryness indices, and corridor sensor signals could be fused into a unified risk overlay. Bio-sentinel signals are probabilistic... and serve only to corroborate primary evidence. No dispatch or switching actions are triggered from this layer. All outputs remain advisory.`,

  // Step 17 — Executive Validation Summary
  `This is the Executive Validation Summary. It documents how this solution differs from traditional OMS systems. We've demonstrated confidence-based ETR modeling... critical load prioritization... hazard-informed risk scoring... deterministic rule enforcement... and explainable advisory outputs. Phase One focuses strictly on decision intelligence. It does not include autonomous switching, breaker actuation, or SCADA execution.`,

  // Step 18 — Return to Dashboard & Close Loop
  `We return to the operational dashboard. Updated KPIs reflect a stabilized posture. The event lifecycle concludes with improved situational clarity... and defensible decision logic. Operator Copilot is a governed AI decision layer... advisory-only, policy-constrained, operator-controlled. Version One Point Zero... Decision Intelligence Prototype. Thank you.`,
];

interface UseTourNarrationReturn {
  isMuted: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  preCacheProgress: number;
  narrationDone: boolean;
  toggleMute: () => void;
  playStepNarration: (stepIndex: number) => void;
  stopNarration: () => void;
  pauseNarration: () => void;
  resumeNarration: () => void;
  preCacheAll: () => void;
}

/** Persistent flag — once quota is exhausted, skip all future ElevenLabs calls */
let quotaExhausted = false;

async function fetchTtsAudio(text: string, signal?: AbortSignal, retries = 2): Promise<string | null> {
  if (quotaExhausted) return null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ text }),
          signal,
        }
      );
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (response.status === 401 || !response.ok) {
        if (response.status === 401) quotaExhausted = true;
        await response.text();
        return null;
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }
  return null;
}

/** Browser SpeechSynthesis fallback */
function speakWithBrowserTTS(text: string, onEnd: () => void): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utt.voice = preferred;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
  return utt;
}

export function useTourNarration(): UseTourNarrationReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preCacheProgress, setPreCacheProgress] = useState(0);
  const [narrationDone, setNarrationDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStepRef = useRef<number>(-1);
  const cacheRef = useRef<Map<number, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const preCacheAbortRef = useRef<AbortController | null>(null);

  const attachAudioListeners = useCallback((audio: HTMLAudioElement, stepIndex: number) => {
    audio.addEventListener('play', () => { setIsSpeaking(true); setNarrationDone(false); });
    audio.addEventListener('pause', () => setIsSpeaking(false));
    audio.addEventListener('ended', () => {
      setIsSpeaking(false);
      if (currentStepRef.current === stepIndex) {
        setNarrationDone(true);
      }
    });
  }, []);

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setIsSpeaking(false);
  }, []);

  const pauseNarration = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
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
        setNarrationDone(true); // treat mute as narration complete for flow
      }
      return next;
    });
  }, []);

  const preCacheAll = useCallback(() => {
    if (preCacheAbortRef.current) preCacheAbortRef.current.abort();
    const controller = new AbortController();
    preCacheAbortRef.current = controller;

    const total = narrationScripts.length;
    let completed = 0;
    setPreCacheProgress(0);

    const runSequential = async () => {
      for (let idx = 0; idx < total; idx++) {
        if (controller.signal.aborted) return;
        if (cacheRef.current.has(idx)) {
          completed++;
          setPreCacheProgress(Math.round((completed / total) * 100));
          continue;
        }
        const url = await fetchTtsAudio(narrationScripts[idx], controller.signal);
        if (url) cacheRef.current.set(idx, url);
        completed++;
        setPreCacheProgress(Math.round((completed / total) * 100));
        if (idx < total - 1 && !controller.signal.aborted) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    };

    runSequential().catch(() => { /* aborted */ });
  }, []);

  const playStepNarration = useCallback(async (stepIndex: number) => {
    stopNarration();
    currentStepRef.current = stepIndex;
    setNarrationDone(false);

    if (isMuted) {
      setNarrationDone(true);
      return;
    }

    const script = narrationScripts[stepIndex];
    if (!script) {
      setNarrationDone(true);
      return;
    }

    // Check cache
    const cachedUrl = cacheRef.current.get(stepIndex);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      attachAudioListeners(audio, stepIndex);
      audioRef.current = audio;
      try { await audio.play(); } catch { /* autoplay blocked */ setNarrationDone(true); }
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const url = await fetchTtsAudio(script, controller.signal);
    if (currentStepRef.current !== stepIndex) {
      setIsLoading(false);
      return;
    }

    if (url) {
      cacheRef.current.set(stepIndex, url);
      const audio = new Audio(url);
      attachAudioListeners(audio, stepIndex);
      audioRef.current = audio;
      setIsLoading(false);
      try { await audio.play(); } catch { /* autoplay blocked */ setNarrationDone(true); }
    } else {
      // Fallback to browser SpeechSynthesis
      setIsLoading(false);
      setIsSpeaking(true);
      speakWithBrowserTTS(script, () => {
        if (currentStepRef.current === stepIndex) {
          setIsSpeaking(false);
          setNarrationDone(true);
        }
      });
    }
  }, [isMuted, stopNarration, attachAudioListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      if (preCacheAbortRef.current) preCacheAbortRef.current.abort();
      cacheRef.current.forEach(url => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, [stopNarration]);

  return { isMuted, isLoading, isSpeaking, preCacheProgress, narrationDone, toggleMute, playStepNarration, stopNarration, pauseNarration, resumeNarration, preCacheAll };
}
