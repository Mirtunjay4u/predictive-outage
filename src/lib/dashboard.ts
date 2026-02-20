export function formatDashboardTime(value: number | Date | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export const DASHBOARD_TIMESTAMP_CLASS = 'text-[11px] font-normal tracking-wide text-muted-foreground/80';

export const DASHBOARD_INTERACTIVE_SURFACE_CLASS =
  'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const DASHBOARD_INTERACTIVE_BUTTON_CLASS =
  'transition-all duration-200 ease-out hover:border-border/80 hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function safeTruncate(value: string | null | undefined, maxLength: number, fallback = 'Not available') {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
