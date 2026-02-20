import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Download, CheckCircle2, Circle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { OperatorOutputContract } from '@/types/copilot';

interface OperatorApprovalGateProps {
  contract: OperatorOutputContract;
  eventName: string;
  timestamp: Date;
  modelEngine: string;
}

const CHECKLIST_ITEMS = [
  { id: 'critical_load', label: 'Critical load runway verified' },
  { id: 'safety_standdown', label: 'Lightning / safety stand-down checked' },
  { id: 'crew_availability', label: 'Crew availability confirmed' },
  { id: 'locked_assets', label: 'Maintenance/locked assets verified' },
  { id: 'comms_reviewed', label: 'Communication message reviewed' },
] as const;

export function OperatorApprovalGate({
  contract,
  eventName,
  timestamp,
  modelEngine,
}: OperatorApprovalGateProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState(false);

  const allChecked = checked.size === CHECKLIST_ITEMS.length;

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleMarkReviewed = useCallback(() => {
    setReviewed(true);
    toast.success('Marked as reviewed (demo)', {
      description: 'This is a demo governance action — no operational systems were modified.',
    });
  }, []);

  const handleExport = useCallback(() => {
    const lines: string[] = [
      `OPERATOR COPILOT — UPDATE DRAFT`,
      `${'═'.repeat(50)}`,
      `Event: ${eventName}`,
      `Generated: ${timestamp.toLocaleString()}`,
      `Engine: ${modelEngine}`,
      ``,
      `MODE: ${contract.mode}`,
      ``,
      `SITUATION SUMMARY`,
      contract.situation_summary,
      ``,
      `ETR BAND + CONFIDENCE`,
      contract.etr_band_confidence,
      ``,
      `CRITICAL LOAD RUNWAY`,
      contract.critical_load_runway,
      ``,
      `RECOMMENDATIONS (ADVISORY)`,
      ...contract.recommendations.map(r => `  • ${r}`),
      ``,
      `BLOCKED ACTIONS`,
      ...contract.blocked_actions.map(b => `  ✕ ${b.action} — ${b.reason}`),
      ``,
      `OPERATOR NOTES`,
      ...contract.operator_notes.map(n => `  ⚑ ${n}`),
      ``,
      `SOURCE NOTES`,
      ...contract.source_notes.map(s => `  • ${s}`),
      ``,
      `${'─'.repeat(50)}`,
      `Decision Support Only • No SCADA/OMS/ADMS Integration`,
      `This document is advisory. All actions require operator approval.`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operator-update-${eventName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Export downloaded', {
      description: 'Operator update draft saved as text file.',
    });
  }, [contract, eventName, timestamp, modelEngine]);

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30 rounded-t-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Operator Review & Approval</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-5 gap-1',
              reviewed
                ? 'bg-success/15 text-success border-success/30'
                : 'bg-warning/15 text-warning border-warning/30',
            )}
          >
            <Clock className="w-3 h-3" />
            {reviewed ? 'Reviewed (Demo)' : 'Awaiting Operator Approval'}
          </Badge>
        </div>

        {/* Checklist */}
        <div className="px-4 py-3 space-y-1">
          {CHECKLIST_ITEMS.map(item => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                disabled={reviewed}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
                  'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  reviewed && 'opacity-60 cursor-default',
                )}
              >
                {isChecked ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  </motion.div>
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={cn(
                  'text-foreground',
                  isChecked && 'text-muted-foreground line-through',
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Actions */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleMarkReviewed}
              disabled={reviewed}
              className="gap-1.5 text-xs h-8"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {reviewed ? 'Reviewed ✓' : 'Mark as Reviewed (Demo)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs h-8"
            >
              <Download className="w-3.5 h-3.5" />
              Export Update Draft
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {checked.size}/{CHECKLIST_ITEMS.length} items checked
          </span>
        </div>

        {/* Governance disclaimer */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground/40 italic">
            Demo governance only — no switching, control, or dispatch actions are executed.
            All operational decisions require explicit human operator approval through authorized systems.
          </p>
        </div>
      </div>
    </div>
  );
}