import { useRef, useCallback, useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * 15-step narration scripts — concise, governance-aligned, under 30 seconds each.
 * ElevenLabs George voice. Briefing tone. No marketing adjectives.
 */
export const narrationScripts: string[] = [
  // Step 0 — Login
  `Welcome to Operator Copilot... a governed AI decision intelligence layer for utility outage operations. This platform augments operator decision-making through structured reasoning and deterministic policy enforcement. We are operating in demo data mode... no live SCADA, OMS, or ADMS connections. Let's enter the controlled demonstration environment.`,

  // Step 1 — Dashboard
  `The dashboard provides a consolidated operational overview. The Risk Posture bar synthesizes severity, hazard exposure, crew readiness, and ETR confidence. Each KPI below is rule-engine validated. The system status clearly indicates AI mode and data scope.`,

  // Step 2 — Scenario Lifecycle
  `We navigate through the outage lifecycle... Pre-Event, Active Event, and Post-Event. This reflects how utilities manage evolving operational states during grid disturbances. Advisory-only cues are reinforced at each stage.`,

  // Step 3 — Events
  `Active events are displayed with structured triage. Each entry shows severity, affected feeder, and ETR confidence bands. We expose uncertainty ranges rather than single-point estimates... reinforcing operational realism.`,

  // Step 4 — Event Detail
  `This detail view combines crew assignment, hazard correlation, and escalation status. Every advisory insight is constrained by the deterministic rule engine. The Decision Trace provides full transparency into rule checks and inference drivers.`,

  // Step 5 — Outage Map
  `The outage map overlays event markers with feeder zones, critical load layers, and hazard exposure. This enables spatial situational awareness without executing operational control actions.`,

  // Step 6 — Weather
  `Hazard context improves operational awareness... correlating weather severity with infrastructure exposure. This strengthens prioritization without automating dispatch decisions.`,

  // Step 7 — Copilot Studio
  `Copilot Studio provides structured AI analysis powered by NVIDIA Nemotron. All outputs remain advisory and policy-constrained. Reasoning is bounded by deterministic guardrails and validated before presentation.`,

  // Step 8 — Situation Report
  `Structured situation reports support executive and customer communication. All generated outputs remain subject to operator review and approval before distribution.`,

  // Step 9 — Analytics
  `Analytics summarize high-priority counts, policy blocks, and ETR distribution trends. These metrics support operational review without claiming predictive calibration in Phase One.`,

  // Step 10 — Architecture
  `The architecture illustrates layered design... Ingest, Rule Engine, Bounded AI Inference, Explainability, and Operator Interface. Governance is enforced before and after AI reasoning through independent control planes.`,

  // Step 11 — Knowledge & Governance
  `Operational policies and advisory boundaries are defined here... ensuring regulatory defensibility and transparent operational discipline across all system outputs.`,

  // Step 12 — Settings
  `Platform configuration and system preferences are accessible here... including AI mode selection and integration readiness indicators for enterprise deployment.`,

  // Step 13 — Solution Roadmap
  `This roadmap outlines structured evolution from Phase One decision intelligence to Phase Two predictive capabilities. It clearly separates implemented features from planned milestones... without false commitments.`,

  // Step 14 — Close
  `Operator Copilot introduces a governed AI reasoning layer for transmission and distribution outage operations. It synthesizes event severity, hazard exposure, crew readiness, and ETR uncertainty into structured advisory insights. Deterministic policy rules are enforced before AI reasoning is presented. All outputs remain explainable, auditable, and human-validated. Phase One establishes disciplined decision intelligence. Phase Two evolves toward calibrated predictive modeling with historical validation and production monitoring. This platform does not replace control systems. It augments operational judgment in critical infrastructure environments. This concludes the executive demonstration.`,
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
        setNarrationDone(true);
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
    runSequential().catch(() => {});
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

    const cachedUrl = cacheRef.current.get(stepIndex);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      attachAudioListeners(audio, stepIndex);
      audioRef.current = audio;
      try { await audio.play(); } catch { setNarrationDone(true); }
      return;
    }

    // ── Priority 1: Pre-recorded MP3 from public/tour/executive/step-{n}.mp3 ──
    const preRecordedPath = `/tour/executive/step-${stepIndex}.mp3`;
    try {
      const headResp = await fetch(preRecordedPath, { method: 'HEAD' });
      if (headResp.ok && headResp.headers.get('content-type')?.includes('audio')) {
        const audio = new Audio(preRecordedPath);
        attachAudioListeners(audio, stepIndex);
        audioRef.current = audio;
        try { await audio.play(); } catch { setNarrationDone(true); }
        return;
      }
    } catch {
      // Pre-recorded not available, continue to TTS
    }

    if (currentStepRef.current !== stepIndex) return;

    // ── Priority 2: ElevenLabs TTS ──
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
      try { await audio.play(); } catch { setNarrationDone(true); }
    } else {
      // ── Priority 3: Browser SpeechSynthesis ──
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
