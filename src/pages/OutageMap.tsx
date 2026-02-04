import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Map, Layers, Flame, Search, X, Cloud, RefreshCw, Box, Cable, RotateCcw, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useAssets, useEventAssets } from '@/hooks/useAssets';
import { useFeederZones } from '@/hooks/useFeederZones';
import { useCrewsWithAvailability, useCrewsRealtime, useDispatchCrew, useEmergencyDispatchCrew, useSimulateCrewMovement, useUpdateCrewStatus } from '@/hooks/useCrews';
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
import { AssetDetailDrawer } from '@/components/map/AssetDetailDrawer';
import { FeederDetailDrawer } from '@/components/map/FeederDetailDrawer';
import { CrewDetailDrawer } from '@/components/map/CrewDetailDrawer';
import { CrewDispatchPanel } from '@/components/map/CrewDispatchPanel';
import { MapSearchBar, type SearchResult } from '@/components/map/MapSearchBar';
import type { Scenario, LifecycleStage } from '@/types/scenario';
import type { Asset } from '@/types/asset';
import type { FeederZone } from '@/types/feederZone';
import type { Crew } from '@/types/crew';
import { OUTAGE_TYPES } from '@/types/scenario';

const LIFECYCLE_OPTIONS: LifecycleStage[] = ['Pre-Event', 'Event', 'Post-Event'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

export default function OutageMap() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading } = useScenarios({ refetchInterval: 30000 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [outageTypeFilter, setOutageTypeFilter] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [enableClustering, setEnableClustering] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showFeederZones, setShowFeederZones] = useState(false);
  const [showCrews, setShowCrews] = useState(true); // Crews visible by default
  
  // Asset selection state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  
  // Feeder zone selection state
  const [selectedFeederZone, setSelectedFeederZone] = useState<FeederZone | null>(null);
  const [feederDrawerOpen, setFeederDrawerOpen] = useState(false);
  const [highlightedFeederId, setHighlightedFeederId] = useState<string | null>(null);
  
  // Crew selection state
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [crewDrawerOpen, setCrewDrawerOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Search & zoom state
  const [zoomTarget, setZoomTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);

  // Fetch weather data
  const { data: weatherData, isLoading: weatherLoading, refetch: refetchWeather } = useWeatherData(showWeather);
  
  // Fetch assets data
  const { data: assets = [] } = useAssets();
  const { data: linkedAssetIds = [] } = useEventAssets(selectedEventId);
  
  // Fetch feeder zones
  const { data: feederZones = [] } = useFeederZones();
  
  // Fetch crews with realtime updates and availability status
  const { data: crews = [] } = useCrewsWithAvailability();
  useCrewsRealtime();
  
  // Crew mutations
  const dispatchCrewMutation = useDispatchCrew();
  const emergencyDispatchMutation = useEmergencyDispatchCrew();
  const simulateMovementMutation = useSimulateCrewMovement();
  const updateCrewStatusMutation = useUpdateCrewStatus();

  // Filter scenarios with geo data
  const geoScenarios = useMemo(() => {
    if (!scenarios) return [];
    return scenarios.filter(s => s.geo_center);
  }, [scenarios]);

  // Apply search and filters
  const filteredScenarios = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    return geoScenarios.filter(scenario => {
      // Search filter - match name, outage type, description, fault/feeder/transformer IDs
      if (query) {
        const searchableFields = [
          scenario.name,
          scenario.outage_type,
          scenario.description,
          scenario.notes,
          scenario.fault_id,
          scenario.feeder_id,
          scenario.transformer_id,
          scenario.operator_role,
        ].filter(Boolean).map(f => f!.toLowerCase());
        
        const matchesSearch = searchableFields.some(field => field.includes(query));
        if (!matchesSearch) return false;
      }
      
      // Dropdown filters
      if (lifecycleFilter !== 'all' && scenario.lifecycle_stage !== lifecycleFilter) return false;
      if (priorityFilter !== 'all' && scenario.priority !== priorityFilter) return false;
      if (outageTypeFilter !== 'all' && scenario.outage_type !== outageTypeFilter) return false;
      return true;
    });
  }, [geoScenarios, searchQuery, lifecycleFilter, priorityFilter, outageTypeFilter]);

  const hasActiveFilters = searchQuery || lifecycleFilter !== 'all' || priorityFilter !== 'all' || outageTypeFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setLifecycleFilter('all');
    setPriorityFilter('all');
    setOutageTypeFilter('all');
  };

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

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetDrawerOpen(true);
  };

  const handleFeederClick = (zone: FeederZone) => {
    setSelectedFeederZone(zone);
    setFeederDrawerOpen(true);
    setHighlightedFeederId(zone.feeder_id);
  };

  const handleOpenInCopilot = () => {
    if (!selectedEvent) return;
    const prompt = encodeURIComponent(
      `Summarize outage context, risks, trade-offs, and checklist for this event: "${selectedEvent.name}" (${selectedEvent.outage_type || 'Unknown'} - ${selectedEvent.lifecycle_stage})`
    );
    navigate(`/copilot-studio?prefill=${prompt}`);
  };

  // Search result handler
  const handleSearchSelect = useCallback((result: SearchResult) => {
    if (result.lat && result.lng) {
      setZoomTarget({ lat: result.lat, lng: result.lng, zoom: result.type === 'feeder_zone' ? 11 : 15 });
      
      // Clear after animation
      setTimeout(() => setZoomTarget(null), 1000);
      
      if (result.type === 'feeder_zone') {
        setHighlightedFeederId(result.feederId || null);
        setShowFeederZones(true);
      } else if (result.type === 'asset') {
        setHighlightedAssetId(result.id);
        setShowAssets(true);
      }
    }
  }, []);

  // Reset map handler
  const handleResetMap = useCallback(() => {
    setSelectedEventId(null);
    setHighlightedFeederId(null);
    setHighlightedAssetId(null);
    setZoomTarget(null);
    setDrawerOpen(false);
    setAssetDrawerOpen(false);
    setFeederDrawerOpen(false);
    setCrewDrawerOpen(false);
  }, []);

  // Clear search highlights
  const handleSearchClear = useCallback(() => {
    setHighlightedFeederId(null);
    setHighlightedAssetId(null);
  }, []);

  // Crew handlers
  const handleCrewClick = useCallback((crew: Crew) => {
    setSelectedCrew(crew);
    setCrewDrawerOpen(true);
  }, []);

  const handleDispatchCrew = useCallback((crewId: string, eventId: string) => {
    const event = scenarios?.find(s => s.id === eventId);
    if (!event?.geo_center) {
      toast.error('Event location not available');
      return;
    }
    
    dispatchCrewMutation.mutate({
      crewId,
      eventId,
      eventLat: event.geo_center.lat,
      eventLng: event.geo_center.lng,
    }, {
      onSuccess: () => {
        toast.success('Crew dispatched successfully');
      },
      onError: (error) => {
        toast.error('Failed to dispatch crew');
        console.error(error);
      }
    });
  }, [scenarios, dispatchCrewMutation]);

  const handleSimulateCrewMovement = useCallback((crewId: string, targetLat: number, targetLng: number) => {
    simulateMovementMutation.mutate({
      crewId,
      targetLat,
      targetLng,
    }, {
      onSuccess: (result) => {
        if (result.arrived) {
          toast.success('Crew has arrived on site!');
        }
      },
    });
  }, [simulateMovementMutation]);

  const handleSimulateAll = useCallback(async () => {
    setIsSimulating(true);
    const activeCrews = crews.filter(c => 
      (c.status === 'dispatched' || c.status === 'en_route') && c.assigned_event_id
    );
    
    for (const crew of activeCrews) {
      const event = scenarios?.find(s => s.id === crew.assigned_event_id);
      if (event?.geo_center) {
        await simulateMovementMutation.mutateAsync({
          crewId: crew.id,
          targetLat: event.geo_center.lat,
          targetLng: event.geo_center.lng,
        });
      }
    }
    
    setIsSimulating(false);
    toast.success('Crew positions updated');
  }, [crews, scenarios, simulateMovementMutation]);

  // Emergency dispatch for off-duty crews
  const handleEmergencyDispatch = useCallback((crewId: string, eventId: string, authorizedBy: string, notes: string) => {
    const event = scenarios?.find(s => s.id === eventId);
    if (!event?.geo_center) {
      toast.error('Event location not available');
      return;
    }
    
    emergencyDispatchMutation.mutate({
      crewId,
      eventId,
      eventLat: event.geo_center.lat,
      eventLng: event.geo_center.lng,
      authorizedBy,
      notes,
    }, {
      onSuccess: () => {
        toast.success('Emergency dispatch logged - crew deployed with overtime');
      },
      onError: (error) => {
        toast.error('Failed to dispatch crew');
        console.error(error);
      }
    });
  }, [scenarios, emergencyDispatchMutation]);

  // Get assigned event for selected crew
  const selectedCrewEvent = useMemo(() => {
    if (!selectedCrew?.assigned_event_id || !scenarios) return null;
    return scenarios.find(s => s.id === selectedCrew.assigned_event_id) || null;
  }, [selectedCrew, scenarios]);

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
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events, types, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
          
          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {filteredScenarios.length} of {geoScenarios.length} events
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
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
          enableClustering={enableClustering}
          showWeather={showWeather}
          weatherPoints={weatherData?.points || []}
          showAssets={showAssets}
          assets={assets}
          linkedAssetIds={linkedAssetIds}
          onAssetClick={handleAssetClick}
          showFeederZones={showFeederZones}
          feederZones={feederZones}
          highlightedFeederId={highlightedFeederId}
          onFeederClick={handleFeederClick}
          zoomTarget={zoomTarget}
          highlightedAssetId={highlightedAssetId}
          showCrews={showCrews}
          crews={crews}
          onCrewClick={handleCrewClick}
          onSimulateCrewMovement={handleSimulateCrewMovement}
        />
        
        {/* Crew Dispatch Panel */}
        {showCrews && (
          <CrewDispatchPanel
            crews={crews}
            scenarios={scenarios || []}
            selectedEventId={selectedEventId}
            onDispatchCrew={handleDispatchCrew}
            onEmergencyDispatch={handleEmergencyDispatch}
            onSimulateAll={handleSimulateAll}
            isSimulating={isSimulating}
          />
        )}
        
        {/* Top Search Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
          <MapSearchBar
            assets={assets}
            feederZones={feederZones}
            onSelect={handleSearchSelect}
            onClear={handleSearchClear}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetMap}
                  className="h-9 w-9 bg-card/95 backdrop-blur-sm border-border"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Map</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Layer Toggle Controls */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3 space-y-3">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="cluster-toggle" className="text-xs font-medium text-foreground cursor-pointer">
              Cluster Markers
            </Label>
            <Switch
              id="cluster-toggle"
              checked={enableClustering}
              onCheckedChange={setEnableClustering}
              disabled={showHeatmap}
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Flame className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="heatmap-toggle" className="text-xs font-medium text-foreground cursor-pointer">
              Impact Heatmap
            </Label>
            <Switch
              id="heatmap-toggle"
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Cable className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="feeder-toggle" className="text-xs font-medium text-foreground cursor-pointer flex-1">
              Feeder Zones
            </Label>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-warning/10 text-warning border-warning/30">
              Demo
            </Badge>
            <Switch
              id="feeder-toggle"
              checked={showFeederZones}
              onCheckedChange={setShowFeederZones}
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Box className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="assets-toggle" className="text-xs font-medium text-foreground cursor-pointer flex-1">
              GIS Assets
            </Label>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-warning/10 text-warning border-warning/30">
              Demo
            </Badge>
            <Switch
              id="assets-toggle"
              checked={showAssets}
              onCheckedChange={setShowAssets}
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Cloud className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="weather-toggle" className="text-xs font-medium text-foreground cursor-pointer flex-1">
              Weather Overlay
            </Label>
            {showWeather && (
              <button
                onClick={() => refetchWeather()}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <Switch
              id="weather-toggle"
              checked={showWeather}
              onCheckedChange={setShowWeather}
            />
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="crews-toggle" className="text-xs font-medium text-foreground cursor-pointer flex-1">
              Crew Dispatch
            </Label>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
              Live
            </Badge>
            <Switch
              id="crews-toggle"
              checked={showCrews}
              onCheckedChange={setShowCrews}
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
                {enableClustering && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                    <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-[8px] text-white font-bold">3</div>
                    <span className="text-muted-foreground">Clustered Events</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                  <div className="w-4 h-2 bg-destructive/30 border border-destructive/50 rounded-sm" />
                  <span className="text-muted-foreground">Outage Area</span>
                </div>
                {showFeederZones && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                    <div className="w-4 h-2 bg-primary/20 border border-primary/50 rounded-sm" style={{ borderStyle: 'dashed' }} />
                    <span className="text-muted-foreground">Feeder Zone</span>
                  </div>
                )}
                {showAssets && (
                  <div className="pt-1 border-t border-border mt-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" className="text-destructive">
                        <polygon fill="currentColor" points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                      </svg>
                      <span className="text-muted-foreground">Fault</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" className="text-primary">
                        <rect x="4" y="8" width="16" height="8" rx="2" fill="currentColor"/>
                      </svg>
                      <span className="text-muted-foreground">Feeder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" className="text-warning">
                        <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
                      </svg>
                      <span className="text-muted-foreground">Transformer</span>
                    </div>
                  </div>
                )}
                {showWeather && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                    <Cloud className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">Weather (click for details)</span>
                  </div>
                )}
                {showCrews && (
                  <div className="pt-1 border-t border-border mt-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Crew Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Crew En Route</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-muted-foreground">Crew On Site</span>
                    </div>
                  </div>
                )}
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
      
      {/* Asset Detail Drawer */}
      <AssetDetailDrawer
        asset={selectedAsset}
        open={assetDrawerOpen}
        onOpenChange={setAssetDrawerOpen}
      />
      
      {/* Feeder Zone Detail Drawer */}
      <FeederDetailDrawer
        feederZone={selectedFeederZone}
        open={feederDrawerOpen}
        onOpenChange={(open) => {
          setFeederDrawerOpen(open);
          if (!open) setHighlightedFeederId(null);
        }}
        assets={assets}
        scenarios={scenarios || []}
      />
      
      {/* Crew Detail Drawer */}
      <CrewDetailDrawer
        crew={selectedCrew}
        open={crewDrawerOpen}
        onOpenChange={setCrewDrawerOpen}
        assignedEvent={selectedCrewEvent}
        onSimulateMovement={selectedCrew && selectedCrewEvent?.geo_center ? () => {
          handleSimulateCrewMovement(
            selectedCrew.id,
            selectedCrewEvent.geo_center!.lat,
            selectedCrewEvent.geo_center!.lng
          );
        } : undefined}
        onMarkArrived={selectedCrew ? () => {
          updateCrewStatusMutation.mutate({ crewId: selectedCrew.id, status: 'on_site' });
          toast.success('Crew marked as arrived');
        } : undefined}
        onMarkAvailable={selectedCrew ? () => {
          updateCrewStatusMutation.mutate({ crewId: selectedCrew.id, status: 'available' });
          setCrewDrawerOpen(false);
          toast.success('Crew marked as available');
        } : undefined}
      />
    </div>
  );
}
