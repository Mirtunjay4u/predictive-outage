# Executive Mode — Pre-Recorded Narration

Place high-quality MP3 narration files here to replace ElevenLabs TTS.

## File Naming Convention

```
step-0.mp3   → Strategic Context
step-1.mp3   → Dashboard Risk Overview
step-2.mp3   → Multi-Dimensional Constraints
step-3.mp3   → Event Detail Deep Dive
step-4.mp3   → Rule Gate Enforcement
step-5.mp3   → NVIDIA NIM Structured Output
step-6.mp3   → Architecture Boundary
step-7.mp3   → Phase-1 → Phase-2 Roadmap
step-8.mp3   → Closing Anchor
```

## Requirements

- Format: MP3 (44.1 kHz, 128 kbps minimum)
- Duration: Under 30 seconds per step
- Tone: Briefing cadence, governance-aligned, no marketing adjectives
- Voice: Medium-low, authoritative, calm (e.g., ElevenLabs "George")

## Fallback Behavior

If a step file is missing, the system falls back to:
1. ElevenLabs TTS API (real-time generation)
2. Browser SpeechSynthesis (last resort)
