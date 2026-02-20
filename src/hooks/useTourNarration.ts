import { useRef, useCallback, useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Narration scripts for each tour step — aligned with the executive briefing tone.
 * Index matches tourSteps[].id in DemoTourHUD.
 */
const narrationScripts: string[] = [
  // Step 0 — Login & Context
  `Welcome to Operator Copilot — Predictive Outage Management. This platform is an AI-constrained operational decision-support layer designed for regulated utility outage environments. It augments operator judgment while preserving human authority and strict safety enforcement. The system operates strictly in advisory mode — it does not execute switching, SCADA actions, or field operations.`,

  // Step 1 — Dashboard Orientation
  `The dashboard represents a real-time operational war-room view. Active events are displayed with restoration confidence ranges rather than single-point estimates. Critical infrastructure — such as hospitals and water facilities — is visibly tagged and prioritized. Crew positioning and availability are displayed to support redeployment insight. All AI recommendations are policy-constrained and clearly labeled as advisory.`,

  // Step 2 — Scenario Playback
  `The Scenario Playback panel steps through Pre-Event, Event, and Post-Event lifecycle stages. This simulates hazard lifecycle progression to test policy validation and readiness posture across the full operational timeline.`,

  // Step 3 — Events Page
  `Reviewing the triage queue: high-priority events, severity scales, ETR confidence bands, critical load tags, and policy status. Each event includes ETR confidence banding, critical load prioritization, and deterministic policy evaluation.`,

  // Step 4 — Event Detail View
  `Each event provides a confidence-based restoration band reflecting uncertainty drivers such as weather exposure and asset condition. Critical load runway indicators show backup runtime remaining relative to escalation thresholds. If any asset is under maintenance or locked, recommendations are automatically filtered before reaching the operator.`,

  // Step 5 — Outage Map
  `The outage map correlates feeder topology, impacted downstream infrastructure, environmental hazards, and crew proximity. Live weather layers — including wind, precipitation, and storm tracking — inform risk modeling and crew safety awareness. This enhances situational context without automating operational decisions.`,

  // Step 6 — Weather Alerts
  `Weather intelligence integrates live environmental data to correlate hazard exposure with infrastructure risk. This allows operators to anticipate compounding outage risk before restoration windows close.`,

  // Step 7 — Copilot Studio
  `Copilot Studio provides structured, explainable advisory outputs. AI responses are generated using NVIDIA Nemotron under a deterministic rule engine. If a breaker is under maintenance or flagged as non-operable, the system blocks that switching pathway automatically. Recommendations include justification — not just suggestions. All actions remain human-in-the-loop.`,

  // Step 8 — Situation Report
  `Operators can generate AI-assisted situation reports. The content can be reviewed, approved, and distributed via the Communications Pack — maintaining operator authority over external communications.`,

  // Step 9 — Analytics
  `The analytics layer surfaces historical outage patterns, restoration timelines, and variability in ETR confidence modeling. This strengthens escalation planning and resource forecasting while preserving real-time operational authority.`,

  // Step 10 — Architecture
  `The system architecture separates ingestion, orchestration, inference, and governance into independent control planes. The deterministic rule engine precedes AI inference at every stage.`,

  // Step 11 — About & Governance
  `This system provides decision support only and does not execute control actions. Advisory-only governance and safety compliance are foundational to the platform's architecture.`,

  // Step 12 — Settings
  `The platform supports configurable AI modes and enterprise integration readiness — including Dataverse connectivity for regulated utility data environments.`,

  // Step 13 — Return to Dashboard
  `Completing the operational loop — confirming updated KPIs, stabilized posture, and the narrative resolution of the demo. AI-Augmented. Policy-Constrained. Operator-Controlled.`,
];

interface UseTourNarrationReturn {
  isMuted: boolean;
  isLoading: boolean;
  toggleMute: () => void;
  playStepNarration: (stepIndex: number) => void;
  stopNarration: () => void;
}

export function useTourNarration(): UseTourNarrationReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStepRef = useRef<number>(-1);
  const cacheRef = useRef<Map<number, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && audioRef.current) {
        audioRef.current.pause();
      }
      return next;
    });
  }, []);

  const playStepNarration = useCallback(async (stepIndex: number) => {
    // Stop any current narration
    stopNarration();
    currentStepRef.current = stepIndex;

    if (isMuted) return;

    const script = narrationScripts[stepIndex];
    if (!script) return;

    // Check cache
    const cachedUrl = cacheRef.current.get(stepIndex);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      try { await audio.play(); } catch (e) { /* autoplay blocked */ }
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

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
          body: JSON.stringify({ text: script }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        console.error('TTS fetch failed:', response.status);
        setIsLoading(false);
        return;
      }

      // Verify we're still on the same step
      if (currentStepRef.current !== stepIndex) {
        setIsLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      cacheRef.current.set(stepIndex, url);

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsLoading(false);

      try { await audio.play(); } catch (e) { /* autoplay blocked */ }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('TTS error:', e);
      }
      setIsLoading(false);
    }
  }, [isMuted, stopNarration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      // Revoke cached URLs
      cacheRef.current.forEach(url => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, [stopNarration]);

  return { isMuted, isLoading, toggleMute, playStepNarration, stopNarration };
}
