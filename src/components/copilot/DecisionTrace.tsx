import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecisionTraceProps {
  /** Model used for inference */
  modelUsed?: string;
  /** Whether a fallback model was used */
  fallbackUsed?: boolean;
  /** Optional scenario-specific inputs to highlight */
  inputs?: string[];
  /** Optional rule check overrides */
  ruleChecks?: { label: string; status: 'passed' | 'blocked' | 'triggered' | 'not_triggered' | 'applied' | 'not_applied' }[];
  /** Optional confidence drivers */
  confidenceDrivers?: string[];
  /** Whether this is demo/synthetic data */
  isDemo?: boolean;
  /** Additional className */
  className?: string;
}

const DEFAULT_INPUTS = [
  'Hazard severity and type',
  'Affected feeder / asset identification',
  'Customer impact count',
  'Critical load impact and runway status',
  'Crew availability and skill match',
  'Maintenance / lockout flag status',
];

const DEFAULT_RULE_CHECKS: DecisionTraceProps['ruleChecks'] = [
  { label: 'Lockout check', status: 'passed' },
  { label: 'Maintenance restriction', status: 'passed' },
  { label: 'Critical escalation', status: 'not_triggered' },
  { label: 'Crew skill validation', status: 'passed' },
  { label: 'Hazard restriction', status: 'not_applied' },
];

const DEFAULT_CONFIDENCE_DRIVERS = [
  'Weather volatility',
  'Access constraints',
  'Damage assessment completeness',
  'Crew availability variability',
];

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'passed':
      return { text: 'Passed', color: 'text-emerald-400' };
    case 'blocked':
      return { text: 'Blocked', color: 'text-red-400' };
    case 'triggered':
      return { text: 'Triggered', color: 'text-amber-400' };
    case 'not_triggered':
      return { text: 'Not triggered', color: 'text-muted-foreground/70' };
    case 'applied':
      return { text: 'Applied', color: 'text-amber-400' };
    case 'not_applied':
      return { text: 'Not applied', color: 'text-muted-foreground/70' };
    default:
      return { text: status, color: 'text-muted-foreground' };
  }
}

export function DecisionTrace({
  modelUsed = 'NVIDIA Nemotron (NIM)',
  fallbackUsed = false,
  inputs = DEFAULT_INPUTS,
  ruleChecks = DEFAULT_RULE_CHECKS,
  confidenceDrivers = DEFAULT_CONFIDENCE_DRIVERS,
  isDemo = true,
  className,
}: DecisionTraceProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('mt-3', className)}>
      {/* Divider */}
      <div className="h-px bg-border/40 mb-2" />

      {/* Toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        <span>Decision Trace</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="mt-1 rounded-lg border border-border/30 bg-muted/15 px-4 py-3.5 space-y-4">

          {/* INPUTS CONSIDERED */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1.5">
              Inputs Considered
            </h5>
            <ul className="space-y-1">
              {inputs.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground/75">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* RULE ENGINE CHECKS */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1.5">
              Rule Engine Checks
            </h5>
            <ul className="space-y-1">
              {ruleChecks?.map((check, i) => {
                const s = statusLabel(check.status);
                return (
                  <li key={i} className="flex items-center justify-between text-[11px] leading-relaxed">
                    <span className="text-foreground/75">{check.label}</span>
                    <span className={cn('font-medium', s.color)}>{s.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* CONFIDENCE DRIVERS */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1.5">
              Confidence Drivers
            </h5>
            <ul className="space-y-1">
              {confidenceDrivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground/75">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/40" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* MODEL USED */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
              Model Used
            </h5>
            <p className="text-[11px] text-foreground/75">
              {fallbackUsed ? (
                `Model Router (Fallback)`
              ) : (
                <span className="font-medium text-[hsl(80,100%,36%)]">{modelUsed}</span>
              )}
            </p>
          </section>

          {/* SCOPE */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
              Scope
            </h5>
            <p className="text-[11px] text-foreground/75">Phase 1 — Advisory Decision Support Only</p>
          </section>

          {/* DATA MODE */}
          <section>
            <h5 className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
              Data Mode
            </h5>
            <p className="text-[11px] text-foreground/75">
              {isDemo ? 'Synthetic / Demo Data' : 'Integrated Source'}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
