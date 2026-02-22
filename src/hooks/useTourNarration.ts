import { useRef, useCallback, useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Narration scripts — rewritten for natural ElevenLabs George voice delivery.
 * Short sentences. Natural pauses via commas and ellipses. Briefing tone.
 * Index matches tourSteps[].id in DemoTourHUD.
 */
export const narrationScripts: string[] = [
  // Step 0 — Login & Context (includes opening)
  `Welcome to Operator Copilot... a governed AI decision intelligence layer designed for utility outage operations. This platform augments operator decision-making through structured reasoning, deterministic policy enforcement, and explainable AI... while maintaining strict advisory-only boundaries. We begin by establishing operator context. In this Phase One environment, we are operating in demo data mode... clearly indicated in the system status. No live SCADA, OMS, or ADMS systems are connected. This ensures a controlled and safe demonstration environment.`,

  // Step 1 — Dashboard Orientation
  `The dashboard provides a consolidated operational overview. At the top, the Operational Risk Posture synthesizes outage severity, hazard exposure, crew readiness, and ETR confidence bands into a single governed view. This is not an automation layer... it is a structured decision-support summary designed to reduce operator cognitive load. The System Status clearly indicates AI mode, data mode, and Phase scope... reinforcing transparency at every level.`,

  // Step 2 — Scenario Playback Lifecycle
  `We can dynamically navigate through the outage lifecycle... Pre-Event, Active Event, and Post-Event. This reflects how utilities manage evolving operational states during severe weather or grid disturbance.`,

  // Step 3 — Events Page Deep Dive
  `Here we review active events using structured triage. Each event displays severity, affected feeder, critical load impact, and ETR confidence bands. Importantly, we do not present a single deterministic ETR... instead we expose uncertainty bands, reinforcing operational realism.`,

  // Step 4 — Event Detail View
  `This event detail view combines crew assignment, hazard exposure correlation, escalation status, and structured reasoning outputs. Every advisory insight is constrained by a deterministic rule engine. The Decision Trace provides full transparency... including rule checks, inference drivers, and scope validation.`,

  // Step 5 — Outage Map Intelligence
  `The outage map overlays event markers with feeder zones, critical load layers, and hazard exposure. This enables spatial situational awareness without executing any operational control actions.`,

  // Step 6 — Weather Alerts Section
  `We integrate hazard context to improve operational awareness... correlating weather severity with affected infrastructure. This improves prioritization without automating dispatch decisions.`,

  // Step 7 — Copilot Studio
  `Copilot Studio provides structured AI-assisted analysis powered by NVIDIA Nemotron. All outputs remain advisory and policy-constrained. This reasoning is bounded by deterministic guardrails and validated before presentation.`,

  // Step 8 — Situation Report Generation
  `Here we generate structured situation reports for executive and customer communication. Outputs remain subject to operator approval.`,

  // Step 9 — Analytics
  `The Analytics section summarizes high-priority counts, policy blocks, and ETR distribution trends. These metrics support operational review without claiming predictive calibration in Phase One.`,

  // Step 10 — Architecture Overview
  `This architecture illustrates the layered design... Ingest, Rule Engine, Bounded AI Inference, Explainability, and Operator Interface. Governance is enforced before and after AI reasoning.`,

  // Step 11 — About
  `This section provides project context, team background, and the design philosophy behind Operator Copilot... grounded in utility-domain expertise and governed AI principles.`,

  // Step 12 — Solution Roadmap Blueprint
  `This blueprint outlines structured evolution from Phase One decision intelligence to Phase Two calibrated predictive capabilities. Phase Two introduces probabilistic risk scoring, ETR distribution modeling, historical backtesting, and production hardening... without compromising governance. This roadmap avoids false commitments and clearly separates implemented capabilities from planned milestones.`,

  // Step 13 — Knowledge & Policy
  `This section defines operational policies and advisory boundaries... ensuring regulatory defensibility and transparent operational discipline.`,

  // Step 14 — Glossary
  `To eliminate ambiguity, all domain and AI terminology is standardized here... supporting cross-functional clarity across stakeholders.`,

  // Step 15 — Settings
  `Platform configuration and system preferences are accessible here... ensuring transparency and adjustability of the demonstration environment.`,

  // Step 16 — Art of Possibilities
  `This section explores the future vision... advanced capabilities, predictive analytics, and next-generation decision intelligence concepts that extend beyond Phase One into operational transformation.`,

  // Step 17 — Executive Validation & Close
  `In summary, Operator Copilot does not replace OMS or ADMS. It augments operator reasoning through governed AI, explainability, and structured operational insight. It is designed for critical infrastructure domains... where safety, transparency, and human validation remain paramount. Operator Copilot represents a disciplined evolution toward calibrated predictive operations... grounded in governance, structured AI, and utility-domain alignment. Version One Point Zero... Decision Intelligence Prototype. Thank you.`,
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
