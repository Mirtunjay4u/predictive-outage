# Architecture Mode — Pre-Recorded Narration

Place high-quality MP3 narration files here to replace ElevenLabs TTS.

## File Naming Convention

```
step-0.mp3   → Architecture Introduction
step-1.mp3   → Five-Layer Architecture
step-2.mp3   → Deterministic Rule Gate
step-3.mp3   → AI Governance Framework
step-4.mp3   → Schema-Bound Output Contract
step-5.mp3   → Validation & Compliance
step-6.mp3   → Documentation & Audit Trail
step-7.mp3   → Architecture Close
```

## Requirements

- Format: MP3 (44.1 kHz, 128 kbps minimum)
- Duration: Under 30 seconds per step
- Tone: Technical precision, governance-focused, no marketing adjectives
- Voice: Medium-low, authoritative, calm (e.g., ElevenLabs "George")

## Fallback Behavior

If a step file is missing, the system falls back to:
1. ElevenLabs TTS API (real-time generation)
2. Browser SpeechSynthesis (last resort)
