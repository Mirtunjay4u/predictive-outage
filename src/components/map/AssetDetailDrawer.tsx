import { useNavigate } from 'react-router-dom';
import { Zap, Cable, Box, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function AssetDetailDrawer({ asset, open, onOpenChange }: AssetDetailDrawerProps) {
  const navigate = useNavigate();
  
  if (!asset) return null;
  
  const Icon = ASSET_ICONS[asset.asset_type] || Box;
  const colorClass = ASSET_COLORS[asset.asset_type] || 'bg-muted text-muted-foreground';

  const handleOpenInCopilot = () => {
    const prompt = encodeURIComponent(
      `Explain what this asset is, why it matters for outage restoration prioritization, what risks/trade-offs exist, and what an operator would review next. Include safety disclaimer.\n\nAsset: ${asset.name}\nType: ${asset.asset_type}\nFeeder ID: ${asset.feeder_id || 'N/A'}\nTransformer ID: ${asset.transformer_id || 'N/A'}\nFault ID: ${asset.fault_id || 'N/A'}\nMeta: ${asset.meta ? JSON.stringify(asset.meta) : 'N/A'}`
    );
    navigate(`/copilot-studio?prefill=${prompt}`);
  };

  const renderMetaFields = () => {
    if (!asset.meta || Object.keys(asset.meta).length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Technical Specifications
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(asset.meta).map(([key, value]) => (
            <div key={key} className="bg-muted/30 rounded-md p-2">
              <p className="text-xs text-muted-foreground capitalize">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg border ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] bg-muted/50">
                  Demo Asset
                </Badge>
              </div>
              <DrawerTitle className="text-lg font-bold text-foreground">
                {asset.name}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                {asset.asset_type} • {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Asset Type Badge */}
            <div>
              <Badge className={`${colorClass} border`}>
                <Icon className="w-3 h-3 mr-1" />
                {asset.asset_type}
              </Badge>
            </div>
            
            {/* IDs Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Identifiers
              </h4>
              <div className="grid gap-2">
                {asset.fault_id && (
                  <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                    <span className="text-xs text-muted-foreground">Fault ID</span>
                    <code className="text-sm font-mono text-foreground">{asset.fault_id}</code>
                  </div>
                )}
                {asset.feeder_id && (
                  <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                    <span className="text-xs text-muted-foreground">Feeder ID</span>
                    <code className="text-sm font-mono text-foreground">{asset.feeder_id}</code>
                  </div>
                )}
                {asset.transformer_id && (
                  <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                    <span className="text-xs text-muted-foreground">Transformer ID</span>
                    <code className="text-sm font-mono text-foreground">{asset.transformer_id}</code>
                  </div>
                )}
              </div>
            </div>
            
            {/* Meta Fields */}
            {renderMetaFields()}
            
            {/* Location */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </h4>
              <div className="bg-muted/30 rounded-md p-3">
                <p className="text-sm font-mono text-foreground">
                  {asset.lat.toFixed(6)}, {asset.lng.toFixed(6)}
                </p>
              </div>
            </div>
            
            {/* Info Notice */}
            <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This is demo asset data for illustration purposes. In production, this would display real-time GIS data from the utility's asset management system.
              </p>
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <Button 
            onClick={handleOpenInCopilot} 
            className="w-full"
            variant="default"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Copilot
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
