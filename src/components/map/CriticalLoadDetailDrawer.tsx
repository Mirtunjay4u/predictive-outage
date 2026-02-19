import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Clock, AlertTriangle, Battery, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ScenarioWithIntelligence } from '@/types/scenario';

interface CriticalLoadInfo {
  loadType: string;
  event: ScenarioWithIntelligence;
}

interface CriticalLoadDetailDrawerProps {
  criticalLoad: CriticalLoadInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOAD_GLYPHS: Record<string, string> = {
  hospital: '🏥',
  water: '💧',
  shelter: '🏠',
  emergency: '🏠',
  telecom: '📡',
  data: '🖥️',
};

function getGlyph(loadType: string): string {
  const lower = loadType.toLowerCase();
  for (const [key, glyph] of Object.entries(LOAD_GLYPHS)) {
    if (lower.includes(key)) return glyph;
  }
  return '⚡';
}

export function CriticalLoadDetailDrawer({ criticalLoad, open, onOpenChange }: CriticalLoadDetailDrawerProps) {
  if (!criticalLoad) return null;

  const { loadType, event } = criticalLoad;
  const glyph = getGlyph(loadType);

  const backupRemaining = event.backup_runtime_remaining_hours;
  const threshold = event.critical_escalation_threshold_hours;
  const escalationTriggered = backupRemaining != null && threshold != null && backupRemaining < threshold;

  const getRunwayColor = () => {
    if (backupRemaining == null) return 'text-muted-foreground';
    if (backupRemaining < 2) return 'text-destructive';
    if (backupRemaining < 4) return 'text-warning';
    return 'text-emerald-500';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed right-0 top-0 h-full w-[440px] max-w-[90vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <header className="flex-shrink-0 px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{glyph}</span>
                  <div>
                    <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 mb-1">
                      Critical Load
                    </Badge>
                    <h2 className="text-base font-bold text-foreground leading-snug">{loadType}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Linked to: {event.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9 hover:bg-muted" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 space-y-5">
                {/* Escalation Alert */}
                {escalationTriggered && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="relative">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-destructive">Escalation Triggered</p>
                      <p className="text-xs text-muted-foreground">
                        Backup runtime ({backupRemaining?.toFixed(1)}h) is below the {threshold}h threshold
                      </p>
                    </div>
                  </div>
                )}

                {/* Load Type */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Load Classification</h3>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{glyph}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{loadType}</p>
                        <p className="text-xs text-muted-foreground">
                          {loadType.toLowerCase().includes('hospital') && 'Life-safety critical — requires continuous power for patient care systems'}
                          {loadType.toLowerCase().includes('water') && 'Infrastructure critical — water treatment and distribution systems'}
                          {loadType.toLowerCase().includes('shelter') && 'Community critical — emergency shelter requiring heating/cooling'}
                          {loadType.toLowerCase().includes('emergency') && 'Emergency services — first responder coordination and communications'}
                          {loadType.toLowerCase().includes('telecom') && 'Telecommunications — cellular and network infrastructure'}
                          {loadType.toLowerCase().includes('data') && 'Data infrastructure — computing and storage facilities'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Backup Runtime */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Battery className="w-3.5 h-3.5" />
                    Backup Runtime
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Remaining</span>
                      <p className={`text-xl font-bold font-mono ${getRunwayColor()}`}>
                        {backupRemaining != null ? `${backupRemaining.toFixed(1)}h` : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Total Capacity</span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {event.backup_runtime_hours != null ? `${event.backup_runtime_hours}h` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {backupRemaining != null && event.backup_runtime_hours != null && event.backup_runtime_hours > 0 && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            backupRemaining / event.backup_runtime_hours < 0.25 ? 'bg-destructive' :
                            backupRemaining / event.backup_runtime_hours < 0.5 ? 'bg-warning' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (backupRemaining / event.backup_runtime_hours) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {Math.round((backupRemaining / event.backup_runtime_hours) * 100)}% remaining
                      </p>
                    </div>
                  )}
                </section>

                <Separator />

                {/* Escalation Threshold */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Escalation Threshold
                  </h3>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Threshold</span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {threshold != null ? `${threshold}h` : '— (not configured)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {escalationTriggered ? (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          TRIGGERED
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px]">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          WITHIN LIMITS
                        </Badge>
                      )}
                    </div>
                  </div>
                </section>

                {/* Info Notice */}
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Critical load data is synthetic for demo purposes. In production, this would reflect real-time UPS/generator telemetry from the utility's monitoring systems.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
