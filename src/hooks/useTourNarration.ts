import { useRef, useCallback, useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Narration scripts for each tour step — aligned with the executive briefing tone.
 * Index matches tourSteps[].id in DemoTourHUD.
 */
const narrationScripts: string[] = [
  // Step 0 — Login & Context
  `Operator Copilot is an AI-constrained decision-support platform designed for regulated outage management environments. Authentication establishes operator context and operational session boundaries. In demo mode, preloaded outage scenarios simulate high-impact grid events without live SCADA integration. The system operates strictly in advisory mode. No switching commands, breaker actuation, or field dispatch actions are executed automatically. Human authority is preserved at all times.`,

  // Step 1 — Dashboard Orientation
  `The dashboard provides a command-center overview of active outage conditions. Here we observe: severity-classified events, confidence-based ETR bands, crew workload distribution, and operational phase indicators. Unlike traditional OMS systems that present fixed restoration times, Operator Copilot models uncertainty explicitly through confidence intervals. This enhances communication accuracy and escalation planning.`,

  // Step 2 — Scenario Playback Lifecycle
  `The scenario playback module simulates the full outage lifecycle: Pre-Event monitoring, Active Event response, and Post-Event stabilization. This demonstrates how hazard exposure, crew allocation, and confidence metrics evolve over time. The lifecycle view supports operational rehearsal and resilience planning.`,

  // Step 3 — Events Page Deep Dive
  `The events queue provides structured triage visibility. Each event includes: severity classification, ETR confidence band, critical load tagging, and policy enforcement status. Policy flags indicate whether operational constraints affect potential recommendations. This creates transparency between system logic and operator awareness.`,

  // Step 4 — Event Detail View
  `Drilling into an event reveals detailed operational context. We observe: crew assignment state, escalation phase, hazard correlation, and ETR confidence explanation. Confidence ranges reflect multiple factors including weather exposure, asset condition, and crew readiness. If maintenance locks or safety constraints exist, recommendation pathways are automatically restricted.`,

  // Step 5 — Outage Map Intelligence
  `The outage map integrates feeder topology with real-time situational overlays. We correlate: downstream impact zones, critical infrastructure nodes, crew proximity, and hazard exposure layers. This spatial intelligence strengthens restoration prioritization while preserving operational control boundaries. No switching actions are executed from this interface.`,

  // Step 6 — Weather Alerts Section
  `The weather intelligence layer incorporates live environmental signals including wind velocity, precipitation intensity, storm cell tracking, and exposure scoring. Events within hazard zones are dynamically correlated. This enhances predictive risk modeling and crew safety planning. Environmental awareness informs — but does not automate — decision logic.`,

  // Step 7 — Copilot Studio
  `Copilot Studio delivers AI-assisted advisory analysis powered by NVIDIA Nemotron. However, inference is executed only after deterministic rule validation. Operational constraints such as asset maintenance flags, crew skillset mismatches, and critical load thresholds are evaluated prior to advisory output generation. Allowed and blocked recommendations are explicitly identified. This ensures explainability and policy compliance.`,

  // Step 8 — Situation Report Generation
  `The system generates structured AI-assisted Situation Reports. These reports consolidate: event status, confidence bands, critical load exposure, and operational actions taken. Approval indicators ensure human validation before distribution. This improves communication clarity without removing operator oversight.`,

  // Step 9 — Analytics
  `The analytics layer visualizes: high-priority event distributions, policy block frequency, ETR confidence variability, and restoration trend patterns. These metrics strengthen resilience planning and post-event analysis. Analytics inform decision-making — they do not override it.`,

  // Step 10 — Architecture Overview
  `The system architecture consists of: data ingestion layer, operational rule engine, copilot orchestration layer, NVIDIA Nemotron inference engine, guardrail enforcement module, and observability components. AI reasoning is downstream of deterministic policy validation. This layered design ensures bounded intelligence within regulatory constraints.`,

  // Step 11 — About & Governance
  `Governance documentation clearly defines system boundaries. The platform is: advisory-only, human-in-the-loop, non-autonomous, and non-actuating. No SCADA integration is active in Phase One. This preserves compliance with regulated grid operations.`,

  // Step 12 — Settings
  `The settings panel exposes configurable AI modes and enterprise integration readiness. Future integrations — including Dataverse or enterprise telemetry — are architecturally supported but not enabled in Phase One. This reflects scalable design without premature automation.`,

  // Step 13 — Executive Validation Summary
  `This solution differs from traditional OMS systems by introducing policy-constrained AI reasoning within a deterministic operational framework. Capabilities demonstrated include: confidence-based ETR modeling, critical load prioritization, hazard-informed risk scoring, deterministic rule enforcement, and explainable advisory outputs. Phase One focuses strictly on decision intelligence. It does not include autonomous switching, breaker actuation, load flow automation, or SCADA execution.`,

  // Step 14 — Return to Dashboard & Close Loop
  `We return to the operational dashboard. Updated KPIs reflect stabilized posture. The event lifecycle concludes with improved situational clarity and defensible decision logic. Operator Copilot represents an AI-augmented, policy-constrained decision-support layer for regulated utility outage operations. AI-Augmented. Policy-Constrained. Operator-Controlled. Thank you.`,
];

interface UseTourNarrationReturn {
  isMuted: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  preCacheProgress: number; // 0-100
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
      // Quota exceeded — stop permanently
      if (response.status === 401 || !response.ok) {
        if (response.status === 401) quotaExhausted = true;
        await response.text(); // consume body
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

/** Browser SpeechSynthesis fallback — works offline, no quota needed */
function speakWithBrowserTTS(text: string, onEnd: () => void): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 0.95;
  // Prefer a deep English voice
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStepRef = useRef<number>(-1);
  const cacheRef = useRef<Map<number, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const preCacheAbortRef = useRef<AbortController | null>(null);

  const attachAudioListeners = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener('play', () => setIsSpeaking(true));
    audio.addEventListener('pause', () => setIsSpeaking(false));
    audio.addEventListener('ended', () => setIsSpeaking(false));
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
      }
      return next;
    });
  }, []);

  /**
   * Pre-cache narration clips sequentially (1 at a time) to stay within
   * ElevenLabs' 2-concurrent-request limit — reserving 1 slot for on-demand playback.
   */
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
        // Small delay between requests to avoid bursts
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

    if (isMuted) return;

    const script = narrationScripts[stepIndex];
    if (!script) return;

    // Check cache
    const cachedUrl = cacheRef.current.get(stepIndex);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      attachAudioListeners(audio);
      audioRef.current = audio;
      try { await audio.play(); } catch (e) { /* autoplay blocked */ }
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
      attachAudioListeners(audio);
      audioRef.current = audio;
      setIsLoading(false);
      try { await audio.play(); } catch { /* autoplay blocked */ }
    } else {
      // Fallback to browser SpeechSynthesis
      setIsLoading(false);
      setIsSpeaking(true);
      speakWithBrowserTTS(script, () => {
        if (currentStepRef.current === stepIndex) setIsSpeaking(false);
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

  return { isMuted, isLoading, isSpeaking, preCacheProgress, toggleMute, playStepNarration, stopNarration, pauseNarration, resumeNarration, preCacheAll };
}
