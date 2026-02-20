import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const INCLUDED = [
  'ETR confidence band estimation',
  'Critical load prioritization',
  'Weather hazard correlation',
  'Crew allocation insight',
  'Operator-approved communication drafting',
];

const NOT_INCLUDED = [
  'Breaker switching automation',
  'SCADA command execution',
  'Protection relay coordination',
  'Load flow simulation',
];

export function SystemScopePanel({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('border border-border/50 rounded-lg bg-card/40', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          System Scope
        </span>
        <span className="text-[11px] text-muted-foreground/70 ml-1">— Decision Intelligence Layer</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-x-6 gap-y-0">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">Included</p>
            <ul className="space-y-0.5">
              {INCLUDED.map(item => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-foreground/85 leading-tight">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">Not Included</p>
            <ul className="space-y-0.5">
              {NOT_INCLUDED.map(item => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground/70 leading-tight">
                  <XCircle className="w-3 h-3 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
