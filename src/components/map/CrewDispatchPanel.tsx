import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Send,
  RefreshCw,
  Moon,
  Coffee,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmergencyDispatchDialog } from './EmergencyDispatchDialog';
import { DispatchRecommendations } from './DispatchRecommendations';
import type { CrewWithAvailability } from '@/types/crew';
import type { Scenario } from '@/types/scenario';

interface CrewDispatchPanelProps {
  crews: CrewWithAvailability[];
  scenarios: Scenario[];
  selectedEventId: string | null;
  onDispatchCrew: (crewId: string, eventId: string) => void;
  onEmergencyDispatch: (crewId: string, eventId: string, authorizedBy: string, notes: string) => void;
  onSimulateAll: () => void;
  isSimulating?: boolean;
}

// Get status color
const getStatusColor = (status: CrewWithAvailability['status']) => {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'dispatched': return 'bg-amber-500';
    case 'en_route': return 'bg-blue-500';
    case 'on_site': return 'bg-purple-500';
    case 'returning': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

// Get status text color
const getStatusTextColor = (status: CrewWithAvailability['status']) => {
  switch (status) {
    case 'available': return 'text-green-400';
    case 'dispatched': return 'text-amber-400';
    case 'en_route': return 'text-blue-400';
    case 'on_site': return 'text-purple-400';
    case 'returning': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};

// Get shift status badge
const getShiftStatusBadge = (crew: CrewWithAvailability) => {
  if (crew.shiftStatus === 'off_duty') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted text-muted-foreground border-muted-foreground/30">
              <Moon className="w-2.5 h-2.5 mr-0.5" />
              Off
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p>Off duty - outside shift hours</p>
            <p className="text-muted-foreground">
              Shift: {formatTime(crew.shift_start)} - {formatTime(crew.shift_end)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (crew.shiftStatus === 'on_break') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-warning/10 text-warning border-warning/30">
              <Coffee className="w-2.5 h-2.5 mr-0.5" />
              Break
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p>On break</p>
            <p className="text-muted-foreground">
              Break: {formatTime(crew.break_start)} - {formatTime(crew.break_end)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return null;
};

// Format time for display
const formatTime = (time: string | null): string => {
  if (!time) return '--:--';
  const parts = time.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

// Format ETA
const formatEta = (minutes: number | null) => {
  if (minutes === null) return '';
  if (minutes === 0) return 'Arrived';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export function CrewDispatchPanel({
  crews,
  scenarios,
  selectedEventId,
  onDispatchCrew,
  onEmergencyDispatch,
  onSimulateAll,
  isSimulating = false,
}: CrewDispatchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [selectedOffDutyCrew, setSelectedOffDutyCrew] = useState<CrewWithAvailability | null>(null);

  // Group crews by availability and status
  const onShiftAvailable = crews.filter(c => c.status === 'available' && c.isOnShift);
  const offDutyAvailable = crews.filter(c => c.status === 'available' && !c.isOnShift);
  const activeCrews = crews.filter(c => ['dispatched', 'en_route', 'on_site'].includes(c.status));
  
  // Get assigned event name
  const getAssignedEventName = (eventId: string | null): string => {
    if (!eventId) return '';
    const event = scenarios.find(s => s.id === eventId);
    return event?.name || 'Unknown';
  };

  // Check if can dispatch to selected event
  const selectedEvent = selectedEventId 
    ? scenarios.find(s => s.id === selectedEventId)
    : null;

  // Handle emergency dispatch button click
  const handleEmergencyDispatchClick = (crew: CrewWithAvailability) => {
    setSelectedOffDutyCrew(crew);
    setEmergencyDialogOpen(true);
  };

  // Handle emergency dispatch confirmation
  const handleEmergencyConfirm = (authorizedBy: string, notes: string) => {
    if (selectedOffDutyCrew && selectedEventId) {
      onEmergencyDispatch(selectedOffDutyCrew.id, selectedEventId, authorizedBy, notes);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-80">
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '48px' }}
        className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Crew Dispatch</span>
            <Badge variant="outline" className="text-xs">
              {activeCrews.length} active
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Separator />
              
              {/* Simulate All Button */}
              {activeCrews.length > 0 && (
                <div className="p-2 border-b border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={onSimulateAll}
                    disabled={isSimulating}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    {isSimulating ? 'Simulating...' : 'Simulate All Movement'}
                  </Button>
                </div>
              )}
              
              <ScrollArea className="max-h-[400px]">
                <div className="p-2 space-y-3">
                  {/* AI Recommendations - Show when event selected */}
                  {selectedEvent && (
                    <>
                      <DispatchRecommendations
                        crews={crews}
                        selectedEvent={selectedEvent}
                        onDispatchCrew={onDispatchCrew}
                        onEmergencyDispatch={onEmergencyDispatch}
                      />
                      <Separator className="my-2" />
                    </>
                  )}
                  {/* On-Shift Available Crews */}
                  {onShiftAvailable.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        On Shift ({onShiftAvailable.length})
                      </p>
                      <div className="space-y-1.5">
                        {onShiftAvailable.map(crew => (
                          <div
                            key={crew.id}
                            className="flex items-center justify-between p-2 rounded-md bg-background border border-border"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(crew.status)}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {crew.crew_name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {crew.vehicle_type} • {crew.team_size} members
                                </p>
                              </div>
                            </div>
                            {selectedEvent?.geo_center && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => onDispatchCrew(crew.id, selectedEventId!)}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Dispatch
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Off-Duty/Break Crews */}
                  {offDutyAvailable.length > 0 && (
                    <div className={onShiftAvailable.length > 0 ? 'pt-2' : ''}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
                        <Moon className="w-3 h-3" />
                        Off Duty ({offDutyAvailable.length})
                      </p>
                      <div className="space-y-1.5">
                        {offDutyAvailable.map(crew => (
                          <div
                            key={crew.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-medium text-muted-foreground truncate">
                                    {crew.crew_name}
                                  </p>
                                  {getShiftStatusBadge(crew)}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  Shift: {formatTime(crew.shift_start)} - {formatTime(crew.shift_end)}
                                </p>
                              </div>
                            </div>
                            {selectedEvent?.geo_center && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleEmergencyDispatchClick(crew)}
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Override
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs">
                                    <p>Emergency dispatch (overtime)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Crews Section */}
                  {activeCrews.length > 0 && (
                    <div className={(onShiftAvailable.length > 0 || offDutyAvailable.length > 0) ? 'pt-2' : ''}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Active ({activeCrews.length})
                      </p>
                      <div className="space-y-1.5">
                        {activeCrews.map(crew => (
                          <div
                            key={crew.id}
                            className="p-2 rounded-md bg-background border border-border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(crew.status)}`} />
                                <p className="text-xs font-medium text-foreground">
                                  {crew.crew_name}
                                </p>
                              </div>
                              <span className={`text-[10px] font-medium ${getStatusTextColor(crew.status)}`}>
                                {crew.status === 'on_site' ? 'On Site' : formatEta(crew.eta_minutes)}
                              </span>
                            </div>
                            {crew.assigned_event_id && (
                              <p className="text-[10px] text-muted-foreground truncate pl-4">
                                → {getAssignedEventName(crew.assigned_event_id)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {crews.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No crews available</p>
                    </div>
                  )}

                  {/* Dispatch Hint */}
                  {!selectedEventId && onShiftAvailable.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2 px-4">
                      Select an event on the map to dispatch crews
                    </p>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Emergency Dispatch Dialog */}
      <EmergencyDispatchDialog
        open={emergencyDialogOpen}
        onOpenChange={setEmergencyDialogOpen}
        crew={selectedOffDutyCrew}
        eventName={selectedEvent?.name || ''}
        onConfirm={handleEmergencyConfirm}
      />
    </div>
  );
}
