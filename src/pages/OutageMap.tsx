import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Bot, Map, Layers, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { useScenarios } from '@/hooks/useScenarios';
import { OutageMapView } from '@/components/map/OutageMapView';
import { EventDetailDrawer } from '@/components/map/EventDetailDrawer';
import type { Scenario, LifecycleStage } from '@/types/scenario';
import { OUTAGE_TYPES } from '@/types/scenario';

const LIFECYCLE_OPTIONS: LifecycleStage[] = ['Pre-Event', 'Event', 'Post-Event'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

export default function OutageMap() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading } = useScenarios({ refetchInterval: 30000 });
  
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [outageTypeFilter, setOutageTypeFilter] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Filter scenarios with geo data
  const geoScenarios = useMemo(() => {
    if (!scenarios) return [];
    return scenarios.filter(s => s.geo_center);
  }, [scenarios]);

  // Apply filters
  const filteredScenarios = useMemo(() => {
    return geoScenarios.filter(scenario => {
      if (lifecycleFilter !== 'all' && scenario.lifecycle_stage !== lifecycleFilter) return false;
      if (priorityFilter !== 'all' && scenario.priority !== priorityFilter) return false;
      if (outageTypeFilter !== 'all' && scenario.outage_type !== outageTypeFilter) return false;
      return true;
    });
  }, [geoScenarios, lifecycleFilter, priorityFilter, outageTypeFilter]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId || !scenarios) return null;
    return scenarios.find(s => s.id === selectedEventId) || null;
  }, [selectedEventId, scenarios]);

  const handleViewOnMap = (scenario: Scenario) => {
    setSelectedEventId(scenario.id);
  };

  const handleMarkerClick = (scenario: Scenario) => {
    setSelectedEventId(scenario.id);
    setDrawerOpen(true);
  };

  const handleOpenInCopilot = () => {
    if (!selectedEvent) return;
    const prompt = encodeURIComponent(
      `Summarize outage context, risks, trade-offs, and checklist for this event: "${selectedEvent.name}" (${selectedEvent.outage_type || 'Unknown'} - ${selectedEvent.lifecycle_stage})`
    );
    navigate(`/copilot-studio?prefill=${prompt}`);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Events List */}
      <div className="w-96 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Outage Map</h1>
          <Badge variant="outline" className="ml-auto text-xs bg-warning/10 text-warning border-warning/30">
              Demo Geography
            </Badge>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Lifecycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {LIFECYCLE_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={outageTypeFilter} onValueChange={setOutageTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {OUTAGE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-border bg-background">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : filteredScenarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events with location data</p>
              </div>
            ) : (
              filteredScenarios.map(scenario => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedEventId === scenario.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border bg-background hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => handleViewOnMap(scenario)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-1">
                      {scenario.name}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {scenario.outage_type && (
                      <OutageTypeBadge type={scenario.outage_type} className="text-[10px]" />
                    )}
                    <StatusBadge 
                      variant={scenario.lifecycle_stage === 'Event' ? 'event' : scenario.lifecycle_stage === 'Pre-Event' ? 'pre-event' : 'post-event'}
                    >
                      {scenario.lifecycle_stage}
                    </StatusBadge>
                    {scenario.priority && (
                      <span className={`text-xs font-medium capitalize ${getPriorityColor(scenario.priority)}`}>
                        {scenario.priority}
                      </span>
                    )}
                  </div>
                  
                  {scenario.customers_impacted && scenario.customers_impacted > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {scenario.customers_impacted.toLocaleString()} customers impacted
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredScenarios.length} events shown</span>
            <span>{geoScenarios.length} with location data</span>
          </div>
        </div>
      </div>

      {/* Main Panel - Map */}
      <div className="flex-1 relative">
        <OutageMapView 
          scenarios={filteredScenarios}
          selectedEventId={selectedEventId}
          onMarkerClick={handleMarkerClick}
          showHeatmap={showHeatmap}
        />
        
        {/* Layer Toggle Controls */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="heatmap-toggle" className="text-xs font-medium text-foreground cursor-pointer">
              Customer Impact Heatmap
            </Label>
            <Switch
              id="heatmap-toggle"
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
            />
          </div>
        </div>
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3">
          <h4 className="text-xs font-semibold text-foreground mb-2">Legend</h4>
          <div className="space-y-1.5 text-xs">
            {showHeatmap ? (
              <>
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Customer Impact Density</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="h-2 w-full rounded-sm" style={{ 
                    background: 'linear-gradient(to right, #1e3a5f, #3b82f6, #f59e0b, #ef4444, #dc2626)' 
                  }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Active Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Pre-Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Post-Event</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                  <div className="w-4 h-2 bg-destructive/30 border border-destructive/50 rounded-sm" />
                  <span className="text-muted-foreground">Outage Area</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenInCopilot={handleOpenInCopilot}
      />
    </div>
  );
}
