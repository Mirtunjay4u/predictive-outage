import { format } from 'date-fns';
import { X, Bot, MapPin, Clock, Users, Zap, AlertTriangle, Info, Cable, Box, ExternalLink, Gauge, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssets, useEventAssets } from '@/hooks/useAssets';
import type { ScenarioWithIntelligence, EtrConfidence, EtrRiskLevel, CriticalRunwayStatus } from '@/types/scenario';

interface EventDetailDrawerProps {
  event: ScenarioWithIntelligence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInCopilot: () => void;
}

export function EventDetailDrawer({ event, open, onOpenChange, onOpenInCopilot }: EventDetailDrawerProps) {
  const { data: assets = [] } = useAssets();
  const { data: linkedAssetIds = [] } = useEventAssets(event?.id || null);

  const linkedAssets = assets.filter(a => linkedAssetIds.includes(a.id));
  const assetCounts = {
    Fault: linkedAssets.filter(a => a.asset_type === 'Fault').length,
    Feeder: linkedAssets.filter(a => a.asset_type === 'Feeder').length,
    Transformer: linkedAssets.filter(a => a.asset_type === 'Transformer').length,
  };
  const hasLinkedAssets = linkedAssets.length > 0;

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return <StatusBadge variant="high">High Priority</StatusBadge>;
      case 'medium':
        return <StatusBadge variant="medium">Medium Priority</StatusBadge>;
      case 'low':
        return <StatusBadge variant="low">Low Priority</StatusBadge>;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <header className="flex-shrink-0 p-5 border-b border-border bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2">{event.name}</h2>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <StatusBadge 
                      variant={event.lifecycle_stage === 'Event' ? 'event' : event.lifecycle_stage === 'Pre-Event' ? 'pre-event' : 'post-event'}
                    >
                      {event.lifecycle_stage}
                    </StatusBadge>
                    {event.outage_type && <OutageTypeBadge type={event.outage_type} />}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-9 w-9 hover:bg-muted"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </header>
            
            {/* Content - Scrollable */}
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Priority */}
                {event.priority && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    {getPriorityBadge(event.priority)}
                  </div>
                )}
                
                {/* SECTION: Impact */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Impact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {event.customers_impacted !== null && (
                      <MetricCard
                        icon={<Users className="w-4 h-4" />}
                        label="Customers"
                        value={event.customers_impacted.toLocaleString()}
                      />
                    )}
                    {event.eta && (
                      <MetricCard
                        icon={<Clock className="w-4 h-4" />}
                        label="ETR"
                        value={format(new Date(event.eta), 'MMM d, h:mm a')}
                        small
                      />
                    )}
                  </div>
                </section>

                {/* SECTION: ETR Confidence Band */}
                <EtrConfidenceSection event={event} />

                {/* SECTION: Critical Load Runway */}
                <CriticalLoadSection event={event} />
                
                {/* SECTION: Location */}
                {(event.location_name || event.geo_center) && (
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        {event.location_name && (
                          <p className="text-sm font-medium text-foreground">{event.location_name}</p>
                        )}
                        {event.service_area && (
                          <p className="text-xs text-muted-foreground">{event.service_area}</p>
                        )}
                        {event.geo_center && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">
                            {event.geo_center.lat.toFixed(4)}, {event.geo_center.lng.toFixed(4)}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Demo geography</p>
                      </div>
                    </div>
                  </section>
                )}
                
                <Separator />
                
                {/* SECTION: Infrastructure Details */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Infrastructure
                  </h3>
                  <div className="space-y-0 divide-y divide-border rounded-lg border border-border overflow-hidden bg-background">
                    <InfoRow label="Fault ID" value={event.fault_id} />
                    <InfoRow label="Feeder ID" value={event.feeder_id} />
                    <InfoRow label="Transformer ID" value={event.transformer_id} />
                  </div>
                </section>

                {/* SECTION: Linked Assets */}
                {hasLinkedAssets && (
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5" />
                      Linked Assets
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {assetCounts.Fault > 0 && (
                        <AssetBadge 
                          icon={<Zap className="w-3 h-3" />}
                          count={assetCounts.Fault}
                          label="Fault"
                          variant="destructive"
                        />
                      )}
                      {assetCounts.Feeder > 0 && (
                        <AssetBadge 
                          icon={<Cable className="w-3 h-3" />}
                          count={assetCounts.Feeder}
                          label="Feeder"
                          variant="primary"
                        />
                      )}
                      {assetCounts.Transformer > 0 && (
                        <AssetBadge 
                          icon={<Box className="w-3 h-3" />}
                          count={assetCounts.Transformer}
                          label="Transformer"
                          variant="warning"
                        />
                      )}
                    </div>
                  </section>
                )}
                
                <Separator />
                
                {/* SECTION: Notes */}
                {(event.description || event.notes) && (
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" />
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border">
                      {event.notes || event.description}
                    </p>
                  </section>
                )}
                
                {/* Operator Role */}
                {event.operator_role && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Assigned Role</span>
                    <p className="text-sm font-medium text-foreground mt-1">{event.operator_role}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Footer - Actions */}
            <footer className="flex-shrink-0 p-4 border-t border-border bg-muted/30 space-y-3">
              <Button 
                onClick={onOpenInCopilot}
                className="w-full gap-2 h-11"
                size="lg"
              >
                <Bot className="w-4 h-4" />
                Open in Copilot
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Get AI analysis of risks, trade-offs & checklists
              </p>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ===== ETR Confidence Section =====

function EtrConfidenceSection({ event }: { event: ScenarioWithIntelligence }) {
  const hasEtrData = event.etr_earliest || event.etr_latest || event.etr_confidence;
  
  if (!hasEtrData) return null;

  const formatEtrTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'h:mm a');
  };

  const getConfidenceBadgeStyle = (confidence: EtrConfidence | null) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRiskBadgeStyle = (risk: EtrRiskLevel | null) => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const uncertaintyDrivers = event.etr_uncertainty_drivers || [];

  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5" />
        ETR Confidence
      </h3>
      <div className="space-y-3">
        {/* ETR Band */}
        {(event.etr_earliest || event.etr_latest) && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Restoration Window</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-foreground">{formatEtrTime(event.etr_earliest)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-mono text-foreground">{formatEtrTime(event.etr_latest)}</span>
            </div>
            {event.etr_band_hours !== null && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Band width: {event.etr_band_hours.toFixed(1)} hrs
              </p>
            )}
          </div>
        )}

        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.etr_confidence && (
            <Badge variant="outline" className={`text-[10px] ${getConfidenceBadgeStyle(event.etr_confidence)}`}>
              Confidence: {event.etr_confidence}
            </Badge>
          )}
          {event.etr_risk_level && (
            <Badge variant="outline" className={`text-[10px] ${getRiskBadgeStyle(event.etr_risk_level)}`}>
              Risk: {event.etr_risk_level}
            </Badge>
          )}
        </div>

        {/* Uncertainty Drivers */}
        {uncertaintyDrivers.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-2">Uncertainty Factors</span>
            <div className="flex flex-wrap gap-1.5">
              {uncertaintyDrivers.map((driver, idx) => (
                <span 
                  key={idx} 
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground border border-border"
                >
                  {driver}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ===== Critical Load Section =====

function CriticalLoadSection({ event }: { event: ScenarioWithIntelligence }) {
  const getRunwayStatusStyle = (status: CriticalRunwayStatus | null) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'AT_RISK':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'BREACH':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const criticalLoadTypes = event.critical_load_types || [];

  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5" />
        Critical Load Continuity
      </h3>

      {!event.has_critical_load ? (
        <p className="text-sm text-muted-foreground italic">
          No critical load flagged for this event.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Critical Load Types */}
          {criticalLoadTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {criticalLoadTypes.map((loadType, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-[10px] bg-primary/5 text-primary border-primary/20"
                >
                  {loadType}
                </Badge>
              ))}
            </div>
          )}

          {/* Runtime Stats */}
          <div className="grid grid-cols-2 gap-2">
            {event.backup_runtime_remaining_hours !== null && (
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Hours Remaining</span>
                <span className="text-lg font-bold text-foreground">
                  {event.backup_runtime_remaining_hours.toFixed(1)}
                </span>
              </div>
            )}
            {event.critical_escalation_threshold_hours !== null && (
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Escalation Threshold</span>
                <span className="text-lg font-bold text-foreground">
                  {event.critical_escalation_threshold_hours.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {event.critical_runway_status && (
            <Badge variant="outline" className={`text-[10px] ${getRunwayStatusStyle(event.critical_runway_status)}`}>
              Status: {event.critical_runway_status.replace('_', ' ')}
            </Badge>
          )}

          {/* Escalation Warning */}
          {event.requires_escalation && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
              <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">Escalation required</span> — operator review needed.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ===== Helper Components =====

function MetricCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-foreground ${small ? 'text-sm' : 'text-lg'}`}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono text-foreground">
        {value || '—'}
      </span>
    </div>
  );
}

function AssetBadge({ 
  icon, 
  count, 
  label, 
  variant 
}: { 
  icon: React.ReactNode; 
  count: number; 
  label: string; 
  variant: 'destructive' | 'primary' | 'warning';
}) {
  const variantClasses = {
    destructive: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20',
    primary: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
    warning: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 cursor-pointer transition-colors ${variantClasses[variant]}`}
      onClick={() => window.dispatchEvent(new CustomEvent('zoom-to-assets', { detail: label }))}
    >
      {icon}
      {count} {label}{count !== 1 ? 's' : ''}
    </Badge>
  );
}
