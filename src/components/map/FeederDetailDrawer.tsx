import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Cable, Zap, Box, AlertTriangle, Activity } from 'lucide-react';
import type { FeederZone } from '@/types/feederZone';
import type { Asset } from '@/types/asset';
import type { Scenario } from '@/types/scenario';

interface FeederDetailDrawerProps {
  feederZone: FeederZone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  scenarios: Scenario[];
}

export function FeederDetailDrawer({ 
  feederZone, 
  open, 
  onOpenChange,
  assets,
  scenarios,
}: FeederDetailDrawerProps) {
  // Count linked assets (assets with matching feeder_id)
  const linkedAssets = useMemo(() => {
    if (!feederZone) return { faults: 0, feeders: 0, transformers: 0, total: 0 };
    
    const matching = assets.filter(a => a.feeder_id === feederZone.feeder_id);
    return {
      faults: matching.filter(a => a.asset_type === 'Fault').length,
      feeders: matching.filter(a => a.asset_type === 'Feeder').length,
      transformers: matching.filter(a => a.asset_type === 'Transformer').length,
      total: matching.length,
    };
  }, [feederZone, assets]);

  // Count events in this feeder zone
  const linkedEvents = useMemo(() => {
    if (!feederZone) return { active: 0, preEvent: 0, postEvent: 0, total: 0 };
    
    const matching = scenarios.filter(s => s.feeder_id === feederZone.feeder_id);
    return {
      active: matching.filter(s => s.lifecycle_stage === 'Event').length,
      preEvent: matching.filter(s => s.lifecycle_stage === 'Pre-Event').length,
      postEvent: matching.filter(s => s.lifecycle_stage === 'Post-Event').length,
      total: matching.length,
    };
  }, [feederZone, scenarios]);

  if (!feederZone) return null;

  const meta = feederZone.meta || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Cable className="w-5 h-5 text-primary" />
            <SheetTitle className="text-lg">Feeder Zone Details</SheetTitle>
          </div>
          <SheetDescription className="text-left">
            {feederZone.feeder_name} ({feederZone.feeder_id})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Metadata Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Zone Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {meta.voltage_kv && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">Voltage</p>
                  <p className="text-sm font-medium text-foreground">{String(meta.voltage_kv)} kV</p>
                </div>
              )}
              {meta.substations && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">Substations</p>
                  <p className="text-sm font-medium text-foreground">{String(meta.substations)}</p>
                </div>
              )}
              {meta.established && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">Established</p>
                  <p className="text-sm font-medium text-foreground">{String(meta.established)}</p>
                </div>
              )}
              {meta.critical && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive">Status</p>
                  <p className="text-sm font-medium text-destructive">Critical Infrastructure</p>
                </div>
              )}
              {meta.industrial && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-warning">Classification</p>
                  <p className="text-sm font-medium text-warning">Industrial Zone</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Linked Assets Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Box className="w-4 h-4 text-muted-foreground" />
              Linked Assets
              {linkedAssets.total > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {linkedAssets.total} total
                </Badge>
              )}
            </h4>
            
            {linkedAssets.total === 0 ? (
              <p className="text-sm text-muted-foreground">No assets linked to this feeder zone.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedAssets.faults > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-destructive/10 text-destructive border-destructive/30"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {linkedAssets.faults} Fault{linkedAssets.faults !== 1 ? 's' : ''}
                  </Badge>
                )}
                {linkedAssets.feeders > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    <Cable className="w-3 h-3 mr-1" />
                    {linkedAssets.feeders} Feeder{linkedAssets.feeders !== 1 ? 's' : ''}
                  </Badge>
                )}
                {linkedAssets.transformers > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-warning/10 text-warning border-warning/30"
                  >
                    <Box className="w-3 h-3 mr-1" />
                    {linkedAssets.transformers} Transformer{linkedAssets.transformers !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Linked Events Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Events in Zone
              {linkedEvents.total > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {linkedEvents.total} total
                </Badge>
              )}
            </h4>
            
            {linkedEvents.total === 0 ? (
              <p className="text-sm text-muted-foreground">No events in this feeder zone.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedEvents.active > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-destructive/10 text-destructive border-destructive/30"
                  >
                    {linkedEvents.active} Active Event{linkedEvents.active !== 1 ? 's' : ''}
                  </Badge>
                )}
                {linkedEvents.preEvent > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-warning/10 text-warning border-warning/30"
                  >
                    {linkedEvents.preEvent} Pre-Event{linkedEvents.preEvent !== 1 ? 's' : ''}
                  </Badge>
                )}
                {linkedEvents.postEvent > 0 && (
                  <Badge 
                    variant="outline" 
                    className="bg-muted text-muted-foreground border-border"
                  >
                    {linkedEvents.postEvent} Post-Event{linkedEvents.postEvent !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Demo Data Notice */}
          <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Demo data — synthetic feeder zone for demonstration purposes
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
