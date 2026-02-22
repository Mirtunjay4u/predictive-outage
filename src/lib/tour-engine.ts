/**
 * Premium Executive Auto Tour — Step & Beat Engine
 * Event-driven orchestration with safe DOM interactions.
 */

const STORM_EVENT_ID = '471105eb-fbf9-43c1-8cc5-ad8214abfed8';

// ── Types ──

export interface TourBeat {
  /** CSS selector for element to spotlight */
  selector: string;
  /** Floating caption text */
  caption: string;
  /** Optional action: 'click' | 'scroll' */
  action?: 'click' | 'scroll';
  /** Delay before this beat starts (ms from step start). Auto-calculated if omitted. */
  delayMs?: number;
}

export interface TourStep {
  id: number;
  title: string;
  route: string;
  beats: TourBeat[];
  /** Short narrative shown in HUD tooltip */
  narrative: string;
  /** Auto-action identifier */
  autoAction?: 'login';
  /** Selectors to wait for before starting beats */
  readinessSelectors?: string[];
}

// ── 15 Premium Steps ──

export const tourSteps: TourStep[] = [
  {
    id: 0,
    title: 'Login & Context',
    route: '/login',
    autoAction: 'login',
    narrative: 'Establishing operator context in demo data mode. No live SCADA, OMS, or ADMS connected.',
    readinessSelectors: ['form', 'button'],
    beats: [
      { selector: '.gradient-primary', caption: 'Platform branding establishes governed AI positioning' },
      { selector: 'button:has(.lucide-sparkles)', caption: 'Demo Mode entry — pre-loaded scenarios, no enterprise access', action: 'click' },
      { selector: '[data-tour-section="dashboard"]', caption: 'Dashboard renders with operational context' },
    ],
  },
  {
    id: 1,
    title: 'Dashboard Overview',
    route: '/dashboard',
    narrative: 'Consolidated operational overview: risk posture, severity, crew readiness, and ETR confidence.',
    readinessSelectors: ['[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour-section="dashboard"] .grid', caption: 'KPI row — structured decision-support metrics' },
      { selector: '[data-tour-section="dashboard-active-event"]', caption: 'Operational Risk Posture — synthesized severity view', action: 'scroll' },
      { selector: '[data-tour-section="dashboard-grid"]', caption: 'Executive Signal cards — policy-validated status', action: 'scroll' },
      { selector: '.tour-governance-header, [data-tour-section="dashboard"]', caption: 'System Status — AI mode, data scope, Phase indicator' },
    ],
  },
  {
    id: 2,
    title: 'Scenario Lifecycle',
    route: '/dashboard',
    narrative: 'Navigating Pre-Event, Active Event, and Post-Event lifecycle phases.',
    readinessSelectors: ['[data-tour-section="scenario-playback"]'],
    beats: [
      { selector: '[data-tour-section="scenario-playback"]', caption: 'Scenario playback simulates hazard lifecycle progression', action: 'scroll' },
      { selector: '[data-tour-section="scenario-playback"] button, [data-tour-section="scenario-playback"]', caption: 'Lifecycle stages reflect evolving operational states' },
      { selector: '[data-tour-section="scenario-playback"]', caption: 'Advisory-only cues reinforced at each stage' },
    ],
  },
  {
    id: 3,
    title: 'Events Triage',
    route: '/events',
    narrative: 'Structured triage with severity, affected feeder, critical load, and ETR uncertainty bands.',
    readinessSelectors: ['[data-tour-section="events"]', 'table, [role="table"]'],
    beats: [
      { selector: '[data-tour-section="events"] .flex, [data-tour-section="events"]', caption: 'Filter controls for structured event triage' },
      { selector: 'table thead, [role="columnheader"]', caption: 'ETR confidence bands — uncertainty ranges, not single estimates', action: 'scroll' },
      { selector: 'table tbody tr:first-child, [data-tour-section="events"]', caption: 'Each event: severity, feeder, critical load impact' },
      { selector: 'table tbody tr:first-child td:last-child, table tbody tr:first-child', caption: 'Row actions — navigate to event detail view' },
    ],
  },
  {
    id: 4,
    title: 'Event Detail',
    route: `/event/${STORM_EVENT_ID}`,
    narrative: 'Crew assignment, hazard correlation, escalation, and the Decision Trace for full transparency.',
    readinessSelectors: ['[data-tour-section="event-detail"]'],
    beats: [
      { selector: '[data-tour-section="event-detail"]', caption: 'Event detail — comprehensive operational context', action: 'scroll' },
      { selector: '.etr-explanation, [data-tour-section="event-detail"]', caption: 'ETR explanation — bounded inference, not opaque projection' },
      { selector: '.crew-assignment, [data-tour-section="event-detail"]', caption: 'Crew and hazard correlation — resource-aware triage' },
      { selector: '.decision-trace, [data-tour-section="event-detail"]', caption: 'Decision Trace — rule checks, inference drivers, scope validation', action: 'scroll' },
    ],
  },
  {
    id: 5,
    title: 'Outage Map',
    route: '/outage-map',
    narrative: 'Spatial situational awareness — event markers, feeder zones, critical loads, hazard exposure.',
    readinessSelectors: ['.leaflet-container, [data-tour-section="outage-map"]'],
    beats: [
      { selector: '.leaflet-container, [data-tour-section="outage-map"]', caption: 'Outage map with feeder zone overlays' },
      { selector: '.map-legend, .leaflet-control, [data-tour-section="outage-map"]', caption: 'Legend — event markers, critical loads, hazard zones' },
      { selector: '.leaflet-marker-icon, .leaflet-container', caption: 'Event markers — spatial intelligence for restoration' },
    ],
  },
  {
    id: 6,
    title: 'Weather & Hazards',
    route: '/weather-alerts',
    narrative: 'Correlating weather severity with infrastructure exposure to strengthen prioritization.',
    readinessSelectors: ['[data-tour-section="weather-alerts"]'],
    beats: [
      { selector: '[data-tour-section="weather-alerts"]', caption: 'Hazard exposure scoring — weather-correlated risk' },
      { selector: '[data-tour-section="weather-alerts"] .card, [data-tour-section="weather-alerts"]', caption: 'Active weather alerts with severity indicators', action: 'scroll' },
      { selector: '[data-tour-section="weather-crew-safety"]', caption: 'Impacted zones and crew safety constraints', action: 'scroll' },
    ],
  },
  {
    id: 7,
    title: 'Copilot Studio',
    route: `/copilot-studio?event_id=${STORM_EVENT_ID}&auto_run=true`,
    narrative: 'Structured AI analysis via NVIDIA Nemotron. All outputs advisory and policy-constrained.',
    readinessSelectors: ['[data-tour-section="copilot-studio"]'],
    beats: [
      { selector: '[data-tour-section="copilot-studio"]', caption: 'Event selected for Copilot analysis' },
      { selector: '#copilot-response, [data-tour-section="copilot-studio"]', caption: 'Structured output — bounded by deterministic guardrails', action: 'scroll' },
      { selector: '.guardrails-panel, [data-tour-section="copilot-studio"]', caption: 'Policy enforcement — allowed vs restricted actions' },
      { selector: '.decision-trace, [data-tour-section="copilot-studio"]', caption: 'Decision Trace — full AI reasoning transparency' },
    ],
  },
  {
    id: 8,
    title: 'Situation Report',
    route: `/event/${STORM_EVENT_ID}/situation-report`,
    narrative: 'Structured reports for executive and customer communication. Subject to operator approval.',
    readinessSelectors: ['[data-tour-section="situation-report"]'],
    beats: [
      { selector: '[data-tour-section="situation-report"]', caption: 'Generated situation report content' },
      { selector: '.approval-workflow, [data-tour-section="situation-report"]', caption: 'Operator approval workflow — human-in-the-loop', action: 'scroll' },
      { selector: '.export-button, button:has(.lucide-download), [data-tour-section="situation-report"]', caption: 'Export options for distribution' },
    ],
  },
  {
    id: 9,
    title: 'Analytics',
    route: '/analytics',
    narrative: 'High-priority counts, policy blocks, ETR distribution — operational review metrics.',
    readinessSelectors: ['[data-tour-section="analytics"]'],
    beats: [
      { selector: '[data-tour-section="analytics-kpis"], [data-tour-section="analytics"]', caption: 'KPI blocks — event counts, policy enforcement metrics' },
      { selector: '.recharts-wrapper, [data-tour-section="analytics"]', caption: 'ETR distribution trends — supporting operational review', action: 'scroll' },
      { selector: '[data-tour-section="analytics"] [role="tablist"], [data-tour-section="analytics"]', caption: 'Tab navigation for metric categories' },
    ],
  },
  {
    id: 10,
    title: 'Architecture',
    route: '/architecture',
    narrative: 'Layered design: Ingest, Rule Engine, AI Inference, Explainability, Operator Interface.',
    readinessSelectors: ['[data-tour-section="architecture"]'],
    beats: [
      { selector: '[data-tour-section="architecture"]', caption: 'Architecture — layered governance-first design' },
      { selector: '[data-tour-section="architecture"]', caption: 'Ingest → Rule Engine → Guardrails → Nemotron', action: 'scroll' },
      { selector: '[data-tour-section="architecture"]', caption: 'Observability and compliance readiness layer' },
    ],
  },
  {
    id: 11,
    title: 'Knowledge & Governance',
    route: '/knowledge-policy',
    narrative: 'Operational policies and advisory boundaries for regulatory defensibility.',
    readinessSelectors: ['[data-tour-section="knowledge-policy"]'],
    beats: [
      { selector: '[data-tour-section="knowledge-policy"]', caption: 'Advisory boundary — what the system can and cannot do' },
      { selector: '[data-tour-section="knowledge-policy"] [role="tablist"], [data-tour-section="knowledge-policy"]', caption: 'Policy tabs — deterministic and auditable constraints', action: 'scroll' },
      { selector: '[data-tour-section="knowledge-policy"]', caption: 'Governance rules ensure operational discipline' },
    ],
  },
  {
    id: 12,
    title: 'Settings',
    route: '/settings',
    narrative: 'Platform configuration, AI mode, and integration readiness indicators.',
    readinessSelectors: ['[data-tour-section="settings"]'],
    beats: [
      { selector: '[data-tour-section="settings"]', caption: 'AI mode selection and configuration' },
      { selector: '[data-tour-section="settings"]', caption: 'Integration readiness — Dataverse placeholder', action: 'scroll' },
      { selector: '[data-tour-section="settings"]', caption: 'Transparent and adjustable demonstration parameters' },
    ],
  },
  {
    id: 13,
    title: 'Solution Roadmap',
    route: '/solution-roadmap',
    narrative: 'Phase 1 decision intelligence to Phase 2 predictive capabilities — no false commitments.',
    readinessSelectors: ['[data-tour-section="solution-roadmap"]'],
    beats: [
      { selector: '[data-tour-section="solution-roadmap"]', caption: 'Phase 1 — Decision Intelligence (current)' },
      { selector: '[data-tour-section="solution-roadmap"]', caption: 'Phase 2A — Calibrated predictive scoring', action: 'scroll' },
      { selector: '[data-tour-section="solution-roadmap"]', caption: 'Phase 2B — Production hardening and backtesting', action: 'scroll' },
      { selector: '[data-tour-section="solution-roadmap"]', caption: '"What We Do Not Claim" — intellectual honesty' },
    ],
  },
  {
    id: 14,
    title: 'Tour Complete',
    route: '/dashboard',
    narrative: 'This platform augments operational judgment. It does not replace control systems. This concludes the executive demonstration.',
    readinessSelectors: ['[data-tour-section="dashboard"]'],
    beats: [
      { selector: '[data-tour-section="dashboard"]', caption: 'Dashboard — stabilized operational posture confirmed' },
      { selector: '[data-tour-section="dashboard"]', caption: 'Governed AI · Explainable · Operator-Controlled' },
    ],
  },
];

// ── Safe DOM Utilities ──

export interface DebugLog {
  timestamp: number;
  stepId: number;
  beatIndex: number;
  type: 'info' | 'warn' | 'error';
  message: string;
}

let debugEnabled = false;
const debugLogs: DebugLog[] = [];

export function enableDebugMode(enabled: boolean) {
  debugEnabled = enabled;
}

export function getDebugLogs(): DebugLog[] {
  return [...debugLogs];
}

export function clearDebugLogs() {
  debugLogs.length = 0;
}

function log(stepId: number, beatIndex: number, type: DebugLog['type'], message: string) {
  if (debugEnabled) {
    const entry: DebugLog = { timestamp: Date.now(), stepId, beatIndex, type, message };
    debugLogs.push(entry);
    console.log(`[Tour ${type.toUpperCase()}] Step ${stepId} Beat ${beatIndex}: ${message}`);
  }
}

/**
 * Try to find an element using a comma-separated fallback selector list.
 * Returns the first match or null.
 */
export function resolveSelector(selectorGroup: string): Element | null {
  const selectors = selectorGroup.split(',').map(s => s.trim());
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch {
      // invalid selector, skip
    }
  }
  return null;
}

/** Scroll element into view smoothly */
export function safeScroll(selectorGroup: string, stepId: number, beatIndex: number): boolean {
  const el = resolveSelector(selectorGroup);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    log(stepId, beatIndex, 'info', `Scrolled to: ${selectorGroup}`);
    return true;
  }
  log(stepId, beatIndex, 'warn', `Scroll target not found: ${selectorGroup}`);
  return false;
}

/** Click an element safely */
export function safeClick(selectorGroup: string, stepId: number, beatIndex: number): boolean {
  const el = resolveSelector(selectorGroup);
  if (el && el instanceof HTMLElement) {
    el.click();
    log(stepId, beatIndex, 'info', `Clicked: ${selectorGroup}`);
    return true;
  }
  log(stepId, beatIndex, 'warn', `Click target not found: ${selectorGroup}`);
  return false;
}

/** Get bounding rect for spotlight positioning */
export function getElementRect(selectorGroup: string): DOMRect | null {
  const el = resolveSelector(selectorGroup);
  if (el) return el.getBoundingClientRect();
  return null;
}

/** Wait for a selector to appear in the DOM, with timeout */
export function waitForElement(selectorGroup: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const el = resolveSelector(selectorGroup);
    if (el) { resolve(true); return; }

    const observer = new MutationObserver(() => {
      if (resolveSelector(selectorGroup)) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);
  });
}

/** Wait for all readiness selectors for a step */
export async function waitForStepReady(step: TourStep): Promise<void> {
  if (!step.readinessSelectors?.length) return;
  await Promise.all(
    step.readinessSelectors.map(sel => waitForElement(sel, 4000))
  );
}
