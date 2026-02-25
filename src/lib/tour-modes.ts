/**
 * Multi-Mode Virtual Tour Definitions
 * Extends the tour engine with Executive, Operator, and Architecture modes.
 * Each mode defines a focused step sequence for its target audience.
 */

import type { TourStep } from './tour-engine';

// ── Mode Types ──

export type TourMode = 'executive' | 'operator' | 'architecture';

export interface TourModeConfig {
  id: TourMode;
  label: string;
  subtitle: string;
  description: string;
  audience: string;
  duration: string;
  stepCount: number;
  icon: string; // lucide icon name
  accentColor: string;
}

export const tourModeConfigs: Record<TourMode, TourModeConfig> = {
  executive: {
    id: 'executive',
    label: 'Executive Mode',
    subtitle: 'Strategic Briefing',
    description: 'CXO-level walkthrough: structured reasoning, multi-dimensional risk, governance enforcement, and Phase-1 → Phase-2 roadmap.',
    audience: 'CXO / VP / Board',
    duration: '7–8 min',
    stepCount: 9,
    icon: 'Presentation',
    accentColor: 'hsl(217, 91%, 60%)',
  },
  operator: {
    id: 'operator',
    label: 'Operator Mode',
    subtitle: 'Operational Realism',
    description: 'Hands-on operational walkthrough: event triage, ETR banding, critical load runway, constraint validation, and SitRep generation.',
    audience: 'Control Room / Field Ops',
    duration: '10–12 min',
    stepCount: 10,
    icon: 'Gauge',
    accentColor: 'hsl(173, 80%, 45%)',
  },
  architecture: {
    id: 'architecture',
    label: 'Architecture Mode',
    subtitle: 'CTO / AI Governance',
    description: 'Technical deep dive: deterministic rule gates, conditional AI invocation, schema-bound output, audit traceability, and human authority.',
    audience: 'CTO / AI Lead / Compliance',
    duration: '8–10 min',
    stepCount: 8,
    icon: 'Network',
    accentColor: 'hsl(280, 60%, 60%)',
  },
};

// ── Shared Constants ──

const STORM_EVENT_ID = '471105eb-fbf9-43c1-8cc5-ad8214abfed8';

// ── Narration Scripts per Mode ──

export const modeNarrationScripts: Record<TourMode, string[]> = {
  executive: [
    // Step 0 — Strategic Context
    `Welcome to the Executive Briefing of Operator Copilot. This platform delivers governed AI decision intelligence for utility outage operations. Every output is advisory-only, bounded by deterministic policy enforcement and human authority. Let's begin.`,
    // Step 1 — Dashboard Risk Overview
    `The command center synthesizes operational risk across four dimensions: weather severity, hazard exposure, critical load status, and crew readiness. Each metric is validated by deterministic rules before presentation. No single-point estimates — we expose confidence bands.`,
    // Step 2 — Multi-Dimensional Constraints
    `Active events are triaged through structured filters: severity, affected feeder, critical load impact, and ETR uncertainty bands. This replaces manual correlation of five to seven data streams with a single governed advisory surface.`,
    // Step 3 — Event Detail Deep Dive
    `Each event presents crew assignment, hazard correlation, and escalation status in a unified view. The Decision Trace provides full transparency into which rules fired and what evidence drove each advisory output.`,
    // Step 4 — Rule Gate Enforcement
    `Copilot Studio demonstrates structured AI analysis via NVIDIA Nemotron. Critically, all outputs pass through a deterministic rule gate before reaching the operator. Policy violations trigger explicit blocks with remediation guidance.`,
    // Step 5 — NVIDIA NIM Structured Output
    `The AI reasoning layer operates within a strict seven-section output schema. No free-form generation. Every insight is constraint-validated, traceable, and bounded by operational policies defined in the rule engine.`,
    // Step 6 — Architecture Boundary
    `The five-layer architecture ensures governance at every level: data ingestion, deterministic rule enforcement, bounded AI inference, explainability, and operator interface. AI cannot bypass the rule gate.`,
    // Step 7 — Phase-1 to Phase-2 Roadmap
    `Phase One establishes decision intelligence — advisory-only, no predictive claims. Phase Two evolves toward calibrated predictive modeling with historical validation, production monitoring, and backtesting. No false commitments.`,
    // Step 8 — Closing Anchor
    `Three principles anchor this platform: AI bound by policy. Human authority preserved. Structured intelligence before action. This concludes the executive briefing. Not automation. Not replacement. Structured augmentation.`,
  ],
  operator: [
    // Step 0 — Operational Context
    `Welcome to the Operator walkthrough of Operator Copilot. We'll navigate through real operational workflows: event triage, ETR banding, critical load prioritization, and situation report generation. All actions are demo-safe — no live system modifications.`,
    // Step 1 — Dashboard Command Center
    `The command center provides consolidated operational awareness. The System Risk Index synthesizes weather severity, hazard exposure, critical load status, and crew readiness into a single governed metric. Each KPI is rule-engine validated.`,
    // Step 2 — Event Triage
    `Events are displayed with structured triage filters. Severity classification, affected feeder mapping, and ETR confidence bands enable operators to prioritize restoration without manual cross-referencing across multiple systems.`,
    // Step 3 — Event Detail & ETR Banding
    `This detail view combines ETR confidence bands — earliest, expected, and latest estimates — with uncertainty drivers. The system exposes ranges rather than single-point estimates, reinforcing operational realism.`,
    // Step 4 — Critical Load Runway
    `Critical load monitoring tracks backup runtime remaining for hospitals, water treatment, and emergency services. Runway status drives escalation triggers when backup power approaches threshold boundaries.`,
    // Step 5 — Outage Map & Spatial Awareness
    `The outage map overlays event markers with feeder zones, critical load layers, and hazard exposure. Spatial context enables restoration sequencing decisions without executing operational control actions.`,
    // Step 6 — Weather & Hazard Correlation
    `Hazard context correlates weather severity with infrastructure exposure. Wind and lightning risk scores feed directly into the rule engine, strengthening prioritization without automating dispatch decisions.`,
    // Step 7 — Copilot Constraint Validation
    `Copilot Studio runs structured AI analysis bounded by deterministic guardrails. The operator reviews the eight-section output, verifies constraint compliance, and marks the advisory as reviewed before any action.`,
    // Step 8 — Situation Report Generation
    `Structured situation reports are generated for executive and customer communication. All outputs remain subject to operator review and approval before distribution. No auto-send capability exists.`,
    // Step 9 — Operational Close
    `This concludes the operator walkthrough. Every advisory output is policy-constrained, uncertainty-transparent, and human-validated. The system augments operational judgment in critical infrastructure environments.`,
  ],
  architecture: [
    // Step 0 — Architecture Introduction
    `Welcome to the Architecture deep dive. We'll examine the governance-first design: deterministic rule gates, conditional AI invocation, schema-bound outputs, and full audit traceability. No SCADA integration. Human authority preserved at every layer.`,
    // Step 1 — Five-Layer Architecture
    `The platform implements a five-layer architecture: data ingestion, deterministic rule enforcement, bounded AI inference, explainability surface, and operator interface. Each layer enforces governance independently.`,
    // Step 2 — Deterministic Rule Gate
    `The rule engine evaluates every event against deterministic safety constraints before AI reasoning is invoked. Policy violations trigger explicit blocks. The AI reasoning layer cannot bypass this gate under any circumstance.`,
    // Step 3 — AI Governance Framework
    `The governance framework enforces sixteen operational controls: system classification, advisory boundary declarations, hallucination mitigation layers, structured output contracts, and failure mode containment sequences.`,
    // Step 4 — Schema-Bound Output Contract
    `All AI outputs conform to a strict seven-section schema contract. No free-form generation is permitted. Each section is independently validated against operational policies before presentation to the operator.`,
    // Step 5 — Validation & Compliance
    `The validation summary confirms platform capabilities across five assessment domains: operational differentiation, AI governance, demonstrated capabilities, business impact, and Phase One scope boundaries.`,
    // Step 6 — Documentation & Audit Trail
    `The documentation center provides enterprise-grade governance coverage: technical specifications at ninety-five percent, operational procedures at ninety percent, governance documentation at one hundred percent, and full audit traceability.`,
    // Step 7 — Architecture Close
    `Three architectural principles anchor this platform: deterministic rules precede AI reasoning, AI outputs are schema-bound and constraint-validated, and human authority is preserved at every decision boundary. This concludes the architecture review.`,
  ],
};

// ── Step Definitions per Mode ──

export const executiveSteps: TourStep[] = [
  {
    id: 0,
    title: 'Strategic Context',
    route: '/executive-review',
    narrative: 'Strategic framing for CXO audience. Governed AI positioning and Phase-1 scope.',
    readinessSelectors: ['[data-tour="executive-review"]', '.min-h-screen'],
    beats: [
      { selector: '[data-tour="executive-review"], .min-h-screen', caption: 'Executive Review — governed AI decision intelligence positioning' },
      { selector: '[data-tour="executive-review"] h1, .min-h-screen h1', caption: 'Strategic narrative establishes advisory-only posture' },
    ],
  },
  {
    id: 1,
    title: 'Dashboard Risk Overview',
    route: '/dashboard',
    narrative: 'Consolidated operational overview: risk posture, severity, crew readiness, and ETR confidence.',
    readinessSelectors: ['[data-tour="dashboard-kpi"]', '[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour="dashboard-kpi"], [data-tour-section="dashboard"] .grid', caption: 'KPI row — structured decision-support metrics' },
      { selector: '[data-tour="risk-posture"], [data-tour-section="dashboard-active-event"]', caption: 'Operational Risk Posture — synthesized severity view', action: 'scroll' },
      { selector: '[data-tour="system-risk-index"], [data-tour-section="dashboard-grid"]', caption: 'System Risk Index — multi-dimensional risk synthesis', action: 'scroll' },
    ],
  },
  {
    id: 2,
    title: 'Multi-Dimensional Constraints',
    route: '/events',
    narrative: 'Structured triage with severity, feeder mapping, critical load, and ETR uncertainty bands.',
    readinessSelectors: ['[data-tour="events-filter"]', '[data-tour-section="events"]'],
    beats: [
      { selector: '[data-tour="events-filter"], [data-tour-section="events"] .flex', caption: 'Filter controls for structured event triage' },
      { selector: '[data-tour="etr-band"], table thead', caption: 'ETR confidence bands — uncertainty ranges, not single estimates', action: 'scroll' },
      { selector: 'table tbody tr:first-child', caption: 'Each event: severity, feeder, critical load impact' },
    ],
  },
  {
    id: 3,
    title: 'Event Detail Deep Dive',
    route: `/event/${STORM_EVENT_ID}`,
    narrative: 'Crew assignment, hazard correlation, escalation, and Decision Trace transparency.',
    readinessSelectors: ['[data-tour-section="event-detail"]'],
    beats: [
      { selector: '[data-tour-section="event-detail"]', caption: 'Event detail — comprehensive operational context' },
      { selector: '[data-tour="critical-load-runway"], .etr-explanation', caption: 'Critical load runway and ETR explanation', action: 'scroll' },
      { selector: '.decision-trace, [data-tour-section="event-detail"]', caption: 'Decision Trace — full rule and inference transparency', action: 'scroll' },
    ],
  },
  {
    id: 4,
    title: 'Rule Gate Enforcement',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}&auto_run=true`,
    narrative: 'Structured AI analysis via NVIDIA Nemotron. Policy-constrained and rule-gated.',
    readinessSelectors: ['[data-tour="copilot-run"]', '[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '[data-tour="copilot-run"], [data-tour-section="copilot-studio"]', caption: 'Copilot Studio — structured advisory engine' },
      { selector: '[data-tour="rule-gate-panel"], .guardrails-panel', caption: 'Deterministic rule gate — policy enforcement before AI', action: 'scroll' },
      { selector: '#copilot-response, [data-tour-section="copilot-studio"]', caption: 'Structured output — bounded by guardrails', action: 'scroll' },
    ],
  },
  {
    id: 5,
    title: 'NVIDIA NIM Structured Output',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}`,
    narrative: 'Seven-section output schema. Constraint-validated, traceable, policy-bounded.',
    readinessSelectors: ['[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '[data-tour="copilot-run"], [data-tour-section="copilot-studio"]', caption: 'Schema-bound AI output — no free-form generation' },
      { selector: '.decision-trace, [data-tour-section="copilot-studio"]', caption: 'Decision Trace — reasoning transparency and audit trail', action: 'scroll' },
    ],
  },
  {
    id: 6,
    title: 'Architecture Boundary',
    route: '/architecture',
    narrative: 'Five-layer governance-first design. AI cannot bypass the rule gate.',
    readinessSelectors: ['[data-tour="architecture-nim-lane"]', '[data-tour-section="architecture"]'],
    beats: [
      { selector: '[data-tour="architecture-nim-lane"], [data-tour-section="architecture"]', caption: 'Architecture — layered governance-first design' },
      { selector: '[data-tour-section="architecture"]', caption: 'Ingest → Rule Engine → Guardrails → Nemotron → Operator', action: 'scroll' },
    ],
  },
  {
    id: 7,
    title: 'Phase-1 → Phase-2 Roadmap',
    route: '/solution-roadmap',
    narrative: 'Decision intelligence to calibrated prediction. No false commitments.',
    readinessSelectors: ['[data-tour-section="solution-roadmap"]'],
    beats: [
      { selector: '[data-tour-section="solution-roadmap"]', caption: 'Phase 1 — Decision Intelligence (current)' },
      { selector: '[data-tour-section="solution-roadmap"]', caption: 'Phase 2 — Calibrated predictive modeling with backtesting', action: 'scroll' },
    ],
  },
  {
    id: 8,
    title: 'Closing Anchor',
    route: '/dashboard',
    narrative: 'AI bound by policy. Human authority preserved. Structured intelligence before action.',
    readinessSelectors: ['[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour-section="dashboard"]', caption: 'Dashboard — stabilized operational posture confirmed' },
      { selector: '[data-tour-section="dashboard"]', caption: 'AI Bound by Policy · Human Authority Preserved · Structured Intelligence Before Action' },
    ],
  },
];

export const operatorSteps: TourStep[] = [
  {
    id: 0,
    title: 'Operational Context',
    route: '/dashboard',
    narrative: 'Establishing operator context in demo data mode. No live system connections.',
    readinessSelectors: ['[data-tour="dashboard-kpi"]', '[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour-section="dashboard"]', caption: 'Command center — consolidated operational awareness' },
      { selector: '[data-tour="dashboard-kpi"], [data-tour-section="dashboard"] .grid', caption: 'KPI row — rule-engine validated metrics' },
    ],
  },
  {
    id: 1,
    title: 'System Risk Assessment',
    route: '/dashboard',
    narrative: 'System Risk Index synthesizes weather, hazard, critical load, and crew readiness.',
    readinessSelectors: ['[data-tour="system-risk-index"]', '[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour="system-risk-index"], [data-tour-section="dashboard-grid"]', caption: 'System Risk Index — multi-dimensional risk score', action: 'scroll' },
      { selector: '[data-tour="risk-posture"], [data-tour-section="dashboard-active-event"]', caption: 'Operational Risk Posture — hazard and severity synthesis', action: 'scroll' },
    ],
  },
  {
    id: 2,
    title: 'Event Triage',
    route: '/events',
    narrative: 'Structured triage filters: severity, feeder, critical load, and ETR bands.',
    readinessSelectors: ['[data-tour="events-filter"]', '[data-tour-section="events"]'],
    beats: [
      { selector: '[data-tour="events-filter"], [data-tour-section="events"] .flex', caption: 'Filter controls — structured event triage' },
      { selector: 'table thead, [role="columnheader"]', caption: 'ETR confidence bands visible per event', action: 'scroll' },
      { selector: 'table tbody tr:first-child', caption: 'Select event for detailed analysis' },
    ],
  },
  {
    id: 3,
    title: 'ETR Banding & Detail',
    route: `/event/${STORM_EVENT_ID}`,
    narrative: 'ETR confidence bands with uncertainty drivers. Ranges, not single estimates.',
    readinessSelectors: ['[data-tour-section="event-detail"]'],
    beats: [
      { selector: '[data-tour-section="event-detail"]', caption: 'Event detail — comprehensive operational context' },
      { selector: '[data-tour="etr-band"], .etr-explanation', caption: 'ETR confidence bands — earliest, expected, latest', action: 'scroll' },
    ],
  },
  {
    id: 4,
    title: 'Critical Load Runway',
    route: `/event/${STORM_EVENT_ID}`,
    narrative: 'Critical load monitoring: hospitals, water treatment, emergency services.',
    readinessSelectors: ['[data-tour-section="event-detail"]'],
    beats: [
      { selector: '[data-tour="critical-load-runway"], [data-tour-section="event-detail"]', caption: 'Critical load runway — backup power tracking', action: 'scroll' },
      { selector: '.decision-trace, [data-tour-section="event-detail"]', caption: 'Escalation triggers at threshold boundaries', action: 'scroll' },
    ],
  },
  {
    id: 5,
    title: 'Outage Map Intelligence',
    route: '/outage-map',
    narrative: 'Spatial awareness: event markers, feeder zones, critical loads, hazard exposure.',
    readinessSelectors: ['.leaflet-container, [data-tour-section="outage-map"]'],
    beats: [
      { selector: '.leaflet-container, [data-tour-section="outage-map"]', caption: 'Outage map with feeder zone overlays' },
      { selector: '.map-legend, .leaflet-control', caption: 'Legend — event markers, critical loads, hazard zones' },
    ],
  },
  {
    id: 6,
    title: 'Weather & Hazard Alerts',
    route: '/weather-alerts',
    narrative: 'Correlating weather severity with infrastructure exposure for prioritization.',
    readinessSelectors: ['[data-tour-section="weather-alerts"]'],
    beats: [
      { selector: '[data-tour-section="weather-alerts"]', caption: 'Hazard exposure scoring — weather-correlated risk' },
      { selector: '[data-tour-section="weather-crew-safety"]', caption: 'Impacted zones and crew safety constraints', action: 'scroll' },
    ],
  },
  {
    id: 7,
    title: 'Copilot Constraint Validation',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}&auto_run=true`,
    narrative: 'Structured AI analysis with deterministic guardrails. Operator review required.',
    readinessSelectors: ['[data-tour="copilot-run"]', '[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '[data-tour="copilot-run"], [data-tour-section="copilot-studio"]', caption: 'Copilot — structured advisory engine' },
      { selector: '[data-tour="rule-gate-panel"], .guardrails-panel', caption: 'Rule gate enforcement — policy checks before AI', action: 'scroll' },
      { selector: '#copilot-response', caption: 'Advisory output — bounded and constraint-validated', action: 'scroll' },
    ],
  },
  {
    id: 8,
    title: 'Situation Report',
    route: `/event/${STORM_EVENT_ID}/situation-report`,
    narrative: 'Structured reports for executive and customer communication. Subject to approval.',
    readinessSelectors: ['[data-tour-section="situation-report"]'],
    beats: [
      { selector: '[data-tour-section="situation-report"]', caption: 'Generated situation report content' },
      { selector: '.approval-workflow, [data-tour-section="situation-report"]', caption: 'Operator approval — human-in-the-loop', action: 'scroll' },
    ],
  },
  {
    id: 9,
    title: 'Operational Close',
    route: '/dashboard',
    narrative: 'Every advisory is policy-constrained, uncertainty-transparent, and human-validated.',
    readinessSelectors: ['[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour-section="dashboard"]', caption: 'Command center — operational posture confirmed' },
      { selector: '[data-tour-section="dashboard"]', caption: 'Advisory-Only · Operator-Validated · Demo-Safe' },
    ],
  },
];

export const architectureSteps: TourStep[] = [
  {
    id: 0,
    title: 'Architecture Introduction',
    route: '/architecture',
    narrative: 'Governance-first design: rule gates, conditional AI, schema-bound outputs, audit trail.',
    readinessSelectors: ['[data-tour="architecture-nim-lane"]', '[data-tour-section="architecture"]'],
    beats: [
      { selector: '[data-tour="architecture-nim-lane"], [data-tour-section="architecture"]', caption: 'Five-layer architecture — governance at every level' },
      { selector: '[data-tour-section="architecture"]', caption: 'Data Ingest → Rule Engine → AI Inference → Explainability → Operator', action: 'scroll' },
    ],
  },
  {
    id: 1,
    title: 'Deterministic Rule Gate',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}&auto_run=true`,
    narrative: 'Rule engine evaluates every event before AI reasoning is invoked.',
    readinessSelectors: ['[data-tour="rule-gate-panel"]', '[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '[data-tour="rule-gate-panel"], .guardrails-panel, [data-tour-section="copilot-studio"]', caption: 'Deterministic rule gate — policy enforcement precedes AI' },
      { selector: '[data-tour="copilot-run"], [data-tour-section="copilot-studio"]', caption: 'AI invocation is conditional on rule gate clearance', action: 'scroll' },
    ],
  },
  {
    id: 2,
    title: 'Conditional AI Invocation',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}`,
    narrative: 'NVIDIA Nemotron operates within strict schema contracts. No free-form generation.',
    readinessSelectors: ['[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '#copilot-response, [data-tour-section="copilot-studio"]', caption: 'Schema-bound output — seven mandatory sections' },
      { selector: '.decision-trace, [data-tour-section="copilot-studio"]', caption: 'Reasoning trace — full transparency into AI decisions', action: 'scroll' },
    ],
  },
  {
    id: 3,
    title: 'AI Governance Framework',
    route: '/ai-governance',
    narrative: 'Sixteen operational controls: classification, boundaries, mitigation, containment.',
    readinessSelectors: ['[data-tour-section="ai-governance"]', '.min-h-screen'],
    beats: [
      { selector: '[data-tour-section="ai-governance"], .min-h-screen', caption: 'AI Governance — sixteen-section control framework' },
      { selector: '[data-tour-section="ai-governance"]', caption: 'System classification, advisory boundaries, failure modes', action: 'scroll' },
    ],
  },
  {
    id: 4,
    title: 'Schema-Bound Output',
    route: '/architecture',
    narrative: 'Structured output contracts validated against operational policies.',
    readinessSelectors: ['[data-tour-section="architecture"]'],
    beats: [
      { selector: '[data-tour-section="architecture"]', caption: 'Output schema contract — no free-form AI generation' },
      { selector: '[data-tour-section="architecture"]', caption: 'Independent validation at every architectural layer', action: 'scroll' },
    ],
  },
  {
    id: 5,
    title: 'Validation & Compliance',
    route: '/executive-validation',
    narrative: 'Five assessment domains confirm platform capabilities and scope boundaries.',
    readinessSelectors: ['[data-tour-section="executive-validation"]', '.min-h-screen'],
    beats: [
      { selector: '[data-tour-section="executive-validation"], .min-h-screen', caption: 'Validation Summary — five assessment domains' },
      { selector: '[data-tour-section="executive-validation"]', caption: 'Phase-1 scope: advisory only, no autonomous control', action: 'scroll' },
    ],
  },
  {
    id: 6,
    title: 'Documentation & Audit',
    route: '/documentation-center',
    narrative: 'Enterprise documentation coverage: technical, operational, governance, audit.',
    readinessSelectors: ['[data-tour-section="documentation-center"]', '.min-h-screen'],
    beats: [
      { selector: '[data-tour-section="documentation-center"], .min-h-screen', caption: 'Documentation Center — enterprise governance coverage' },
      { selector: '[data-tour-section="documentation-center"]', caption: 'Role-based access, version control, audit traceability', action: 'scroll' },
    ],
  },
  {
    id: 7,
    title: 'Architecture Close',
    route: '/architecture',
    narrative: 'Deterministic rules precede AI. Outputs are schema-bound. Human authority preserved.',
    readinessSelectors: ['[data-tour-section="architecture"]'],
    beats: [
      { selector: '[data-tour-section="architecture"]', caption: 'Architecture — governance enforcement confirmed' },
      { selector: '[data-tour-section="architecture"]', caption: 'Deterministic · Schema-Bound · Human-Validated' },
    ],
  },
];

/** Get steps for a given tour mode */
export function getStepsForMode(mode: TourMode): TourStep[] {
  switch (mode) {
    case 'executive': return executiveSteps;
    case 'operator': return operatorSteps;
    case 'architecture': return architectureSteps;
  }
}

/** Get narration scripts for a given tour mode */
export function getNarrationForMode(mode: TourMode): string[] {
  return modeNarrationScripts[mode];
}
