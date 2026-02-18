/**
 * ETR Display Formatting — single source of truth for all ETR display.
 *
 * Rules:
 *  - Round to nearest 5 minutes before converting to hrs
 *  - Use "hrs" as the unit uniformly (e.g. 2.5–3.5 hrs)
 *  - Confidence shown as label + % (High (80%), Medium (65%), Low (42%))
 *    High ≥ 80%, Medium 60–79%, Low < 60%
 *  - Compact chip format: "ETR (80%): 2.5–3.5 hrs"
 */

import { differenceInMinutes } from "date-fns";

// ─── Confidence mapping ──────────────────────────────────────────────────────

/** Canonical confidence levels stored in the DB */
export type EtrConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | null;

/**
 * Map a DB confidence string or a raw 0–1 float to {label, pct}.
 * Accepts:
 *   - "HIGH" | "MEDIUM" | "LOW"  (DB enum strings)
 *   - A decimal 0–1 (e.g. 0.32)
 *   - A 0–100 numeric string / number
 */
export function parseConfidence(raw: string | number | null | undefined): {
  label: "High" | "Medium" | "Low";
  pct: number;
} {
  if (raw == null) return { label: "Low", pct: 0 };

  // String enum from DB
  if (typeof raw === "string") {
    const upper = raw.toUpperCase();
    if (upper === "HIGH") return { label: "High", pct: 85 };
    if (upper === "MEDIUM") return { label: "Medium", pct: 70 };
    if (upper === "LOW") return { label: "Low", pct: 40 };

    // Try parsing as a number string
    const num = parseFloat(raw);
    if (!isNaN(num)) return parseConfidence(num);

    return { label: "Low", pct: 0 };
  }

  // Numeric: normalise to 0-100
  const pct = raw > 1 ? Math.round(raw) : Math.round(raw * 100);

  if (pct >= 80) return { label: "High", pct };
  if (pct >= 60) return { label: "Medium", pct };
  return { label: "Low", pct };
}

/** Full label: "High (85%)" */
export function formatConfidenceFull(raw: string | number | null | undefined): string {
  const { label, pct } = parseConfidence(raw);
  return `${label} (${pct}%)`;
}

/** Short label for chips: "85%" */
export function formatConfidencePct(raw: string | number | null | undefined): string {
  const { pct } = parseConfidence(raw);
  return `${pct}%`;
}

/** Tailwind class set for confidence badge colouring */
export function confidenceBadgeClass(raw: string | number | null | undefined): string {
  const { label } = parseConfidence(raw);
  switch (label) {
    case "High":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "Low":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
  }
}

// ─── Duration helpers ────────────────────────────────────────────────────────

/**
 * Round minutes to the nearest 5 minutes.
 */
function roundToNearest5(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

/**
 * Convert minutes → "X.X hrs" string, rounded to nearest 5 min.
 * e.g. 142 min → "2.5 hrs"
 */
function minsToHrsStr(minutes: number): string {
  const rounded = roundToNearest5(minutes);
  const hrs = rounded / 60;
  // Show 1 decimal place, drop ".0" when whole
  const hrsStr = Number.isInteger(hrs) ? `${hrs}` : hrs.toFixed(1);
  return `${hrsStr} hrs`;
}

// ─── ETR band helpers ────────────────────────────────────────────────────────

/**
 * Format an ETR band from etr_earliest and etr_latest timestamps.
 * Returns "2.5–3.5 hrs" or null if data is missing.
 */
export function formatEtrBand(
  earliest: string | null | undefined,
  latest: string | null | undefined
): string | null {
  if (!earliest || !latest) return null;

  const earlyDate = new Date(earliest);
  const lateDate = new Date(latest);
  const now = new Date();

  const earlyMins = Math.max(0, differenceInMinutes(earlyDate, now));
  const lateMins = Math.max(0, differenceInMinutes(lateDate, now));

  const earlyRounded = roundToNearest5(earlyMins);
  const lateRounded = roundToNearest5(lateMins);

  const toHrs = (mins: number) => {
    const h = mins / 60;
    return Number.isInteger(h) ? `${h}` : h.toFixed(1);
  };

  return `${toHrs(earlyRounded)}–${toHrs(lateRounded)} hrs`;
}

/**
 * Format band hours (a numeric duration already in hours, from etr_band_hours).
 * e.g. 1.17 → "1.0–2.0 hrs" not meaningful here; use for width display.
 * Rounds to nearest 0.25 hr (15 min).
 */
export function formatBandWidth(bandHours: number | null | undefined): string | null {
  if (bandHours == null) return null;
  const rounded = Math.round(bandHours * 4) / 4; // nearest 0.25 hr
  return `${rounded.toFixed(1)} hrs`;
}

// ─── Compact chip ─────────────────────────────────────────────────────────────

/**
 * Compact single-line chip text: "ETR (80%): 2.5–3.5 hrs"
 * Falls back gracefully when data is partial.
 */
export function formatEtrChip(
  earliest: string | null | undefined,
  latest: string | null | undefined,
  confidence: string | number | null | undefined
): string {
  const band = formatEtrBand(earliest, latest);
  const pct = formatConfidencePct(confidence);

  if (!band) return "ETR: —";
  return `ETR (${pct}): ${band}`;
}

// ─── Primary display line ─────────────────────────────────────────────────────

/**
 * Returns structured primary display:
 * { band: "2.5–3.5 hrs", confidence: "High (80%)" }
 */
export function formatEtrPrimary(
  earliest: string | null | undefined,
  latest: string | null | undefined,
  confidence: string | number | null | undefined
): { band: string; confidence: string } {
  return {
    band: formatEtrBand(earliest, latest) ?? "—",
    confidence: formatConfidenceFull(confidence),
  };
}

// ─── Backup runtime ───────────────────────────────────────────────────────────

/**
 * Format backup runtime hours for display, rounded to nearest 0.5 hr.
 * e.g. 3.72 → "3.5 hrs"
 */
export function formatRuntimeHours(hours: number | null | undefined): string {
  if (hours == null) return "—";
  const rounded = Math.round(hours * 2) / 2; // nearest 0.5 hr
  return `${rounded.toFixed(1)} hrs`;
}
