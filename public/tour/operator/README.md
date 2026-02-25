# Operator Mode — Pre-Recorded Narration

Place high-quality MP3 narration files here to replace ElevenLabs TTS.

## File Naming Convention

```
step-0.mp3   → Operational Context
step-1.mp3   → System Risk Assessment
step-2.mp3   → Event Triage
step-3.mp3   → ETR Banding & Detail
step-4.mp3   → Critical Load Runway
step-5.mp3   → Outage Map & Spatial Awareness
step-6.mp3   → Weather & Hazard Correlation
step-7.mp3   → Copilot Constraint Validation
step-8.mp3   → Situation Report Generation
step-9.mp3   → Operational Close
```

## Requirements

- Format: MP3 (44.1 kHz, 128 kbps minimum)
- Duration: Under 30 seconds per step
- Tone: Operational clarity, procedural, governance-aware
- Voice: Medium-low, authoritative, calm (e.g., ElevenLabs "George")

## Fallback Behavior

If a step file is missing, the system falls back to:
1. ElevenLabs TTS API (real-time generation)
2. Browser SpeechSynthesis (last resort)
