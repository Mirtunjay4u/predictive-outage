import { useNavigate } from 'react-router-dom';
import { Zap, Cable, Box, ExternalLink, Info, ShieldAlert, Lock, Wrench, TreePine, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Asset } from '@/types/asset';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Fault: Zap,
  Feeder: Cable,
  Transformer: Box,
};

const ASSET_COLORS: Record<string, string> = {
  Fault: 'bg-destructive/10 text-destructive border-destructive/30',
  Feeder: 'bg-primary/10 text-primary border-primary/30',
  Transformer: 'bg-warning/10 text-warning border-warning/30',
};

// Extract operational fields from meta
function getMetaField<T>(meta: Record<string, unknown> | null, key: string, fallback: T): T {
  if (!meta || !(key in meta)) return fallback;
  return meta[key] as T;
}

export function AssetDetailDrawer({ asset, open, onOpenChange }: AssetDetailDrawerProps) {
  const navigate = useNavigate();
  
  if (!asset) return null;
  
  const Icon = ASSET_ICONS[asset.asset_type] || Box;
  const colorClass = ASSET_COLORS[asset.asset_type] || 'bg-muted text-muted-foreground';

  // Operational fields
  const underMaintenance = getMetaField<boolean>(asset.meta, 'under_maintenance', false);
  const lockFlag = getMetaField<boolean>(asset.meta, 'lock_flag', false);
  const ageYears = getMetaField<number | null>(asset.meta, 'age_years', null);
  const vegetationExposure = getMetaField<number | null>(asset.meta, 'vegetation_exposure', null);
  const criticalityScore = getMetaField<number | null>(asset.meta, 'criticality_score', null);

  const handleOpenInCopilot = () => {
    const prompt = encodeURIComponent(
      `Explain what this asset is, why it matters for outage restoration prioritization, what risks/trade-offs exist, and what an operator would review next. Include safety disclaimer.\n\nAsset: ${asset.name}\nType: ${asset.asset_type}\nFeeder ID: ${asset.feeder_id || 'N/A'}\nTransformer ID: ${asset.transformer_id || 'N/A'}\nFault ID: ${asset.fault_id || 'N/A'}\nMeta: ${asset.meta ? JSON.stringify(asset.meta) : 'N/A'}`
    );
    navigate(`/copilot-studio?prefill=${prompt}`);
  };

  const getCriticalityColor = (score: number) => {
    if (score >= 90) return 'text-destructive';
    if (score >= 75) return 'text-warning';
    return 'text-emerald-500';
  };

  const getVegetationColor = (exposure: number) => {
    if (exposure >= 0.6) return 'text-destructive';
    if (exposure >= 0.4) return 'text-warning';
    return 'text-emerald-500';
  };

  // Technical specs (non-operational meta fields)
  const technicalMeta = asset.meta
    ? Object.fromEntries(
        Object.entries(asset.meta).filter(
          ([key]) => !['under_maintenance', 'lock_flag', 'age_years', 'vegetation_exposure', 'criticality_score'].includes(key)
        )
      )
    : null;

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
                  <div className={`p-2 rounded-lg border ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] bg-muted/50">Demo Asset</Badge>
                      {underMaintenance && (
                        <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">
                          <Wrench className="w-3 h-3 mr-0.5" /> Maintenance
                        </Badge>
                      )}
                      {lockFlag && (
                        <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
                          <Lock className="w-3 h-3 mr-0.5" /> Locked
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-foreground leading-snug">{asset.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {asset.asset_type} • {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9 hover:bg-muted" onClick={() => onOpenChange(false)}>
                  <span className="text-lg">×</span>
                </Button>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 space-y-5">
                {/* Status Flags */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Operational Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatusCard
                      label="Maintenance"
                      icon={<Wrench className="w-4 h-4" />}
                      value={underMaintenance ? 'Active' : 'None'}
                      variant={underMaintenance ? 'warning' : 'ok'}
                    />
                    <StatusCard
                      label="Lock Flag"
                      icon={<Lock className="w-4 h-4" />}
                      value={lockFlag ? 'Locked' : 'Clear'}
                      variant={lockFlag ? 'danger' : 'ok'}
                    />
                  </div>
                </section>

                <Separator />

                {/* Scores */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5" />
                    Risk & Criticality
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Age</span>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {ageYears != null ? `${ageYears}y` : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Veg. Exp.</span>
                      <p className={`text-xl font-bold font-mono ${vegetationExposure != null ? getVegetationColor(vegetationExposure) : 'text-muted-foreground'}`}>
                        {vegetationExposure != null ? vegetationExposure.toFixed(2) : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Criticality</span>
                      <p className={`text-xl font-bold font-mono ${criticalityScore != null ? getCriticalityColor(criticalityScore) : 'text-muted-foreground'}`}>
                        {criticalityScore != null ? criticalityScore : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Vegetation exposure bar */}
                  {vegetationExposure != null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <TreePine className="w-3 h-3" /> Vegetation Exposure
                        </span>
                        <span className={`text-[10px] font-semibold ${getVegetationColor(vegetationExposure)}`}>
                          {vegetationExposure >= 0.6 ? 'High' : vegetationExposure >= 0.4 ? 'Moderate' : 'Low'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            vegetationExposure >= 0.6 ? 'bg-destructive' :
                            vegetationExposure >= 0.4 ? 'bg-warning' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, vegetationExposure * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <Separator />

                {/* IDs */}
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identifiers</h3>
                  <div className="space-y-1.5">
                    {asset.fault_id && <IdRow label="Fault ID" value={asset.fault_id} />}
                    {asset.feeder_id && <IdRow label="Feeder ID" value={asset.feeder_id} />}
                    {asset.transformer_id && <IdRow label="Transformer ID" value={asset.transformer_id} />}
                  </div>
                </section>

                {/* Technical Specs */}
                {technicalMeta && Object.keys(technicalMeta).length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Technical Specs</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(technicalMeta).map(([key, value]) => (
                          <div key={key} className="bg-muted/30 rounded-md p-2">
                            <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-medium text-foreground">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* Info Notice */}
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Asset data is synthetic for demo purposes. In production, this would display real-time GIS data from the utility's asset management system.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 p-4 border-t border-border bg-muted/30">
              <Button onClick={handleOpenInCopilot} className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in Copilot
              </Button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ===== Helper Components =====

function StatusCard({ label, icon, value, variant }: { label: string; icon: React.ReactNode; value: string; variant: 'ok' | 'warning' | 'danger' }) {
  const variantStyles = {
    ok: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
  };

  return (
    <div className={`p-3 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className="text-sm font-mono text-foreground">{value}</code>
    </div>
  );
}
