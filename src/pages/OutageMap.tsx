import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Map, Layers, Flame, Search, X, Cloud, RefreshCw, Box, Cable, RotateCcw, Truck, Eye, ExternalLink, ShieldAlert, Droplets, Wind, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useScenariosWithIntelligence } from '@/hooks/useScenarios';
import { OutageMapView } from '@/components/map/OutageMapView';
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary';
import { EventDetailDrawer } from '@/components/map/EventDetailDrawer';
import { AssetDetailDrawer } from '@/components/map/AssetDetailDrawer';
import { FeederDetailDrawer } from '@/components/map/FeederDetailDrawer';
import { CrewDetailDrawer } from '@/components/map/CrewDetailDrawer';
import { CriticalLoadDetailDrawer } from '@/components/map/CriticalLoadDetailDrawer';
import { CrewDispatchPanel } from '@/components/map/CrewDispatchPanel';
import { PlaybackPanel } from '@/components/map/PlaybackPanel';
import { CommandSummary } from '@/components/map/CommandSummary';
import { MapSearchBar, type SearchResult } from '@/components/map/MapSearchBar';
import type { ScenarioWithIntelligence, LifecycleStage } from '@/types/scenario';
import type { Asset } from '@/types/asset';
import type { FeederZone } from '@/types/feederZone';
import type { Crew } from '@/types/crew';
import { OUTAGE_TYPES } from '@/types/scenario';
import { getEventSeverity, severityColor, severityLabel, HAZARD_OVERLAYS, type HazardOverlay } from '@/lib/severity';
const LIFECYCLE_OPTIONS: LifecycleStage[] = ['Pre-Event', 'Event', 'Post-Event'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

export default function OutageMap() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading } = useScenariosWithIntelligence({ refetchInterval: 30000 });
  
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
  const [showCrews, setShowCrews] = useState(true);
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  
  // New operator filters
  const [showCriticalLoads, setShowCriticalLoads] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<number | null>(null);
  const [criticalLoadOnly, setCriticalLoadOnly] = useState(false);
  const [activeHazardOverlays, setActiveHazardOverlays] = useState<HazardOverlay[]>([]);
  
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
  
  // Critical load drawer state
  const [criticalLoadDrawerOpen, setCriticalLoadDrawerOpen] = useState(false);
  const [selectedCriticalLoad, setSelectedCriticalLoad] = useState<{ loadType: string; event: ScenarioWithIntelligence } | null>(null);
  
  // Search & zoom state
  const [zoomTarget, setZoomTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);
  
  // Playback state
  const [playbackTime, setPlaybackTime] = useState<Date | null>(null);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);

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
      // Playback time filter
      if (isPlaybackActive && playbackTime && scenario.event_start_time) {
        const startTime = new Date(scenario.event_start_time).getTime();
        const endTime = scenario.event_end_time 
          ? new Date(scenario.event_end_time).getTime() 
          : Date.now();
        const currentTime = playbackTime.getTime();
        
        if (startTime > currentTime || currentTime > endTime) {
          return false;
        }
      }
      
      // Search filter
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
  }, [geoScenarios, searchQuery, lifecycleFilter, priorityFilter, outageTypeFilter, isPlaybackActive, playbackTime]);

  const hasActiveFilters = searchQuery || lifecycleFilter !== 'all' || priorityFilter !== 'all' || outageTypeFilter !== 'all' || isPlaybackActive;

  const clearAllFilters = () => {
    setSearchQuery('');
    setLifecycleFilter('all');
    setPriorityFilter('all');
    setOutageTypeFilter('all');
    setIsPlaybackActive(false);
    setPlaybackTime(null);
  };

  // Command Summary handlers
  const handleHighPriorityClick = useCallback(() => {
    if (priorityFilter === 'high') {
      setPriorityFilter('all');
    } else {
      setPriorityFilter('high');
    }
  }, [priorityFilter]);

  const handleTopFeederClick = useCallback((feederId: string) => {
    const zone = feederZones.find(z => z.feeder_id === feederId);
    if (zone) {
      setHighlightedFeederId(feederId);
      setShowFeederZones(true);
      const geoArea = zone.geo_area as { coordinates: number[][][] };
      if (geoArea?.coordinates?.[0]) {
        const coords = geoArea.coordinates[0];
        const centroid = coords.reduce(
          (acc, [lng, lat]) => ({ lat: acc.lat + lat / coords.length, lng: acc.lng + lng / coords.length }),
          { lat: 0, lng: 0 }
        );
        setZoomTarget({ lat: centroid.lat, lng: centroid.lng, zoom: 11 });
        setTimeout(() => setZoomTarget(null), 1000);
      }
    }
  }, [feederZones]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId || !scenarios) return null;
    return scenarios.find(s => s.id === selectedEventId) || null;
  }, [selectedEventId, scenarios]);

  const handleViewOnMap = (scenario: ScenarioWithIntelligence) => {
    setSelectedEventId(scenario.id);
    // Auto-enable asset layer when an event is selected so linked assets are visible
    if (!showAssets) setShowAssets(true);
  };

  const handleMarkerClick = (scenario: ScenarioWithIntelligence) => {
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

  const handleSearchSelect = useCallback((result: SearchResult) => {
    if (result.lat && result.lng) {
      setZoomTarget({ lat: result.lat, lng: result.lng, zoom: result.type === 'feeder_zone' ? 11 : 15 });
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

  const handleSearchClear = useCallback(() => {
    setHighlightedFeederId(null);
    setHighlightedAssetId(null);
  }, []);

  const handleCrewClick = useCallback((crew: Crew) => {
    setSelectedCrew(crew);
    setCrewDrawerOpen(true);
  }, []);

  const handleCriticalLoadClick = useCallback((loadType: string, event: any) => {
    // Find the full intelligence event
    const fullEvent = scenarios?.find(s => s.id === event.id);
    if (fullEvent) {
      setSelectedCriticalLoad({ loadType, event: fullEvent });
      setCriticalLoadDrawerOpen(true);
    }
  }, [scenarios]);

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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ===== TOP HEADER (fixed, compact) ===== */}
      <header className="flex-shrink-0 h-14 border-b border-border bg-card px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Map className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Outage Command Map</h1>
            <p className="text-[10px] text-muted-foreground leading-none">Situational awareness and decision support (Demo)</p>
          </div>
        </div>
        
        {/* Playback Controls in Header */}
        <PlaybackPanel
          scenarios={geoScenarios}
          onPlaybackTimeChange={setPlaybackTime}
          isPlaybackActive={isPlaybackActive}
          onPlaybackActiveChange={setIsPlaybackActive}
        />
      </header>

      {/* ===== COMMAND SUMMARY ROW ===== */}
      <div className="flex-shrink-0 border-b border-border bg-muted/30 px-4 py-2">
        <CommandSummary
          scenarios={filteredScenarios}
          onHighPriorityClick={handleHighPriorityClick}
          onTopFeederClick={handleTopFeederClick}
          isHighPriorityActive={priorityFilter === 'high'}
        />
      </div>

      {/* ===== MAIN CONTENT AREA (two-panel layout) ===== */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL - Event List (30% width) */}
        <aside className="w-[360px] min-w-[320px] border-r border-border flex flex-col bg-card">
          {/* Search & Filters Header */}
          <div className="flex-shrink-0 p-4 space-y-3 border-b border-border">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search events, types, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 text-sm bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filters - Grouped Clearly */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filters</span>
              <div className="grid grid-cols-3 gap-2">
                <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                  <SelectTrigger className="h-9 text-xs">
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
                  <SelectTrigger className="h-9 text-xs">
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
                  <SelectTrigger className="h-9 text-xs">
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
            
            {/* Active Filters Indicator */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {filteredScenarios.length} of {geoScenarios.length} events
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Events List - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-background">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : filteredScenarios.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No events found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredScenarios.map(scenario => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedEventId === scenario.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-transparent bg-background hover:border-border hover:shadow-sm hover:bg-muted/30'
                    }`}
                    onClick={() => handleViewOnMap(scenario)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                        {scenario.name}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkerClick(scenario);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Quick Preview</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/event/${scenario.id}`);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Full Details</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge 
                        variant={scenario.lifecycle_stage === 'Event' ? 'event' : scenario.lifecycle_stage === 'Pre-Event' ? 'pre-event' : 'post-event'}
                        className="text-[10px]"
                      >
                        {scenario.lifecycle_stage}
                      </StatusBadge>
                      {scenario.priority && (
                        <StatusBadge 
                          variant={scenario.priority === 'high' ? 'high' : scenario.priority === 'medium' ? 'medium' : 'low'}
                          className="text-[10px] capitalize"
                        >
                          {scenario.priority}
                        </StatusBadge>
                      )}
                      {scenario.outage_type && (
                        <OutageTypeBadge type={scenario.outage_type} className="text-[10px]" />
                      )}
                      <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border"
                        style={{ borderColor: severityColor(getEventSeverity(scenario)), color: severityColor(getEventSeverity(scenario)) }}
                      >
                        Sev {getEventSeverity(scenario)}
                      </span>
                      {!scenario.geo_center && (
                        <span className="text-[9px] text-warning italic">≈ approx</span>
                      )}
                    </div>
                    
                    {/* Customer Impact */}
                    {scenario.customers_impacted && scenario.customers_impacted > 0 && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{scenario.customers_impacted.toLocaleString()}</span>
                        customers impacted
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer Stats */}
          <div className="flex-shrink-0 p-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{filteredScenarios.length} events</span>
              <span>{geoScenarios.length} with location data</span>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL - Interactive Map (70% width) */}
        <main className="flex-1 relative min-w-0">
          <MapErrorBoundary>
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
              showCriticalLoads={showCriticalLoads}
              activeHazardOverlays={activeHazardOverlays}
              severityFilter={severityFilter}
              criticalLoadOnly={criticalLoadOnly}
              onCriticalLoadClick={handleCriticalLoadClick}
            />
          </MapErrorBoundary>
          
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
          
          {/* Search Bar + Legend - Positioned to avoid zoom controls */}
          <div className="absolute top-4 left-16 right-16 z-[1000] flex items-center gap-2 flex-wrap">
            <MapSearchBar
              assets={assets}
              feederZones={feederZones}
              onSelect={handleSearchSelect}
              onClear={handleSearchClear}
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetMap}
                  className="h-9 w-9 bg-card/95 backdrop-blur-sm border-border hover:bg-primary/10 hover:border-primary/50 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Reset Map</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Horizontal Collapsible Legend */}
            <HorizontalLegend 
              showHeatmap={showHeatmap}
              showFeederZones={showFeederZones}
              showCrews={showCrews}
            />
          </div>
          
          {/* Collapsible Layer Toggle Controls (top-right) */}
          <div className="absolute top-4 right-4 z-[1000] flex items-start gap-2">
            {/* Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLayersPanelOpen(!layersPanelOpen)}
              className={cn(
                "h-10 w-10 bg-card/95 backdrop-blur-sm border-border shadow-lg transition-all duration-200",
                layersPanelOpen 
                  ? "bg-primary/10 border-primary/50 text-primary" 
                  : "hover:bg-primary/10 hover:border-primary/50"
              )}
              title={layersPanelOpen ? "Collapse layers panel" : "Expand layers panel"}
            >
              <Layers className="w-4 h-4" />
            </Button>
            
            {/* Collapsible Panel */}
            <div 
              className={cn(
                "bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-lg overflow-hidden transition-all duration-300 ease-in-out origin-top-right",
                layersPanelOpen 
                  ? "opacity-100 scale-100 translate-x-0" 
                  : "opacity-0 scale-95 translate-x-4 pointer-events-none w-0 h-0"
              )}
            >
              <div className={cn(
                "p-4 space-y-3 min-w-[220px]",
                !layersPanelOpen && "hidden"
              )}>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Map Layers</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLayersPanelOpen(false)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <LayerToggle
                  id="heatmap-toggle"
                  icon={<Flame className="w-4 h-4" />}
                  label="Impact Heatmap"
                  checked={showHeatmap}
                  onCheckedChange={setShowHeatmap}
                />
                
                <LayerToggle
                  id="feeder-toggle"
                  icon={<Cable className="w-4 h-4" />}
                  label="Feeder Zones"
                  badge="Demo"
                  checked={showFeederZones}
                  onCheckedChange={setShowFeederZones}
                />
                
                <LayerToggle
                  id="assets-toggle"
                  icon={<Box className="w-4 h-4" />}
                  label="GIS Assets"
                  badge="Demo"
                  checked={showAssets}
                  onCheckedChange={setShowAssets}
                />
                
                <LayerToggle
                  id="weather-toggle"
                  icon={<Cloud className="w-4 h-4" />}
                  label="Weather Overlay"
                  checked={showWeather}
                  onCheckedChange={setShowWeather}
                  onRefresh={showWeather ? () => refetchWeather() : undefined}
                  isRefreshing={weatherLoading}
                />
                
                <LayerToggle
                  id="crews-toggle"
                  icon={<Truck className="w-4 h-4" />}
                  label="Crew Dispatch"
                  badge="Live"
                  badgeVariant="live"
                  checked={showCrews}
                  onCheckedChange={setShowCrews}
                />
                
                <LayerToggle
                  id="critical-loads-toggle"
                  icon={<ShieldAlert className="w-4 h-4" />}
                  label="Critical Loads"
                  badge="Demo"
                  checked={showCriticalLoads}
                  onCheckedChange={setShowCriticalLoads}
                />
                
                {/* Operator Filters Section */}
                <div className="pt-2 mt-2 border-t border-border">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Operator Filters</span>
                  
                  {/* Severity Filter */}
                  <div className="mt-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Min Severity</Label>
                    <div className="flex gap-1">
                      {[null, 1, 2, 3, 4, 5].map(sev => (
                        <button
                          key={sev ?? 'all'}
                          onClick={() => setSeverityFilter(sev)}
                          className={cn(
                            "flex-1 h-7 rounded text-[10px] font-bold border transition-all",
                            severityFilter === sev
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                          )}
                          style={sev ? { borderBottomColor: severityColor(sev), borderBottomWidth: 3 } : undefined}
                        >
                          {sev ?? 'All'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Critical Load Only */}
                  <div className="flex items-center gap-3 py-1.5 mt-2">
                    <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="critical-only" className="text-xs font-medium text-foreground cursor-pointer flex-1">
                      Critical load only
                    </Label>
                    <Switch
                      id="critical-only"
                      checked={criticalLoadOnly}
                      onCheckedChange={setCriticalLoadOnly}
                    />
                  </div>
                  
                  {/* Hazard Overlay Toggles */}
                  <div className="mt-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Hazard Overlays</Label>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {HAZARD_OVERLAYS.map(hazard => {
                        const isActive = activeHazardOverlays.includes(hazard);
                        const iconMap: Record<string, React.ReactNode> = { Storm: <Wind className="w-3.5 h-3.5" />, Wildfire: <TreePine className="w-3.5 h-3.5" />, Flood: <Droplets className="w-3.5 h-3.5" /> };
                        return (
                          <button
                            key={hazard}
                            onClick={() => setActiveHazardOverlays(prev => 
                              isActive ? prev.filter(h => h !== hazard) : [...prev, hazard]
                            )}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all border",
                              isActive 
                                ? "bg-primary/10 border-primary/40 text-primary" 
                                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            {iconMap[hazard]}
                            {hazard}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </main>
      </div>

      {/* ===== DETAIL DRAWERS ===== */}
      <EventDetailDrawer
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenInCopilot={handleOpenInCopilot}
      />
      
      <AssetDetailDrawer
        asset={selectedAsset}
        open={assetDrawerOpen}
        onOpenChange={setAssetDrawerOpen}
      />
      
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
      
      <CriticalLoadDetailDrawer
        criticalLoad={selectedCriticalLoad}
        open={criticalLoadDrawerOpen}
        onOpenChange={setCriticalLoadDrawerOpen}
      />
    </div>
  );
}

// ===== Helper Components =====

function LayerToggle({ 
  id, 
  icon, 
  label, 
  badge, 
  badgeVariant = 'demo',
  checked, 
  onCheckedChange,
  onRefresh,
  isRefreshing 
}: { 
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeVariant?: 'demo' | 'live';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-muted/50 transition-colors -mx-1">
      <span className="text-muted-foreground">{icon}</span>
      <Label htmlFor={id} className="text-xs font-medium text-foreground cursor-pointer flex-1">
        {label}
      </Label>
      {badge && (
        <Badge 
          variant="outline" 
          className={`text-[9px] px-1.5 py-0 ${
            badgeVariant === 'live' 
              ? 'bg-primary/10 text-primary border-primary/30' 
              : 'bg-warning/10 text-warning border-warning/30'
          }`}
        >
          {badge}
        </Badge>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function HorizontalLegend({ 
  showHeatmap, 
  showFeederZones, 
  showCrews 
}: { 
  showHeatmap: boolean;
  showFeederZones: boolean;
  showCrews: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex items-center">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-9 px-3 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-md transition-all hover:bg-primary/10 hover:border-primary/50",
          isExpanded && "rounded-r-none border-r-0"
        )}
        title={isExpanded ? "Collapse legend" : "Expand legend"}
      >
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Legend</span>
        <ChevronRight className={cn(
          "w-3 h-3 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {isExpanded && (
        <div className="h-9 px-3 flex items-center gap-4 bg-card/95 backdrop-blur-sm border border-border border-l-0 rounded-r-lg shadow-md">
          {showHeatmap ? (
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Impact</span>
              <div 
                className="h-2 w-16 rounded-sm" 
                style={{ 
                  background: 'linear-gradient(to right, #1e3a5f, #3b82f6, #f59e0b, #ef4444, #dc2626)' 
                }} 
              />
            </div>
          ) : (
            <>
              <HorizontalLegendItem color="bg-destructive" label="Event" />
              <HorizontalLegendItem color="bg-warning" label="Pre-Event" />
              <HorizontalLegendItem color="bg-muted-foreground" label="Post-Event" />
              
              {showFeederZones && (
                <>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-2 bg-primary/20 border border-primary/50 rounded-sm" style={{ borderStyle: 'dashed' }} />
                    <span className="text-xs text-muted-foreground">Feeder</span>
                  </div>
                </>
              )}
              
              {showCrews && (
                <>
                  <div className="w-px h-4 bg-border" />
                  <HorizontalLegendItem color="bg-green-500" label="Available" />
                  <HorizontalLegendItem color="bg-blue-500" label="En Route" />
                  <HorizontalLegendItem color="bg-purple-500" label="On Site" />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HorizontalLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  );
}
