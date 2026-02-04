import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Clock, 
  MapPin,
  Send,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Crew } from '@/types/crew';
import type { Scenario } from '@/types/scenario';

interface CrewDispatchPanelProps {
  crews: Crew[];
  scenarios: Scenario[];
  selectedEventId: string | null;
  onDispatchCrew: (crewId: string, eventId: string) => void;
  onSimulateAll: () => void;
  isSimulating?: boolean;
}

// Get status color
const getStatusColor = (status: Crew['status']) => {
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
const getStatusTextColor = (status: Crew['status']) => {
  switch (status) {
    case 'available': return 'text-green-400';
    case 'dispatched': return 'text-amber-400';
    case 'en_route': return 'text-blue-400';
    case 'on_site': return 'text-purple-400';
    case 'returning': return 'text-gray-400';
    default: return 'text-gray-400';
  }
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
  onSimulateAll,
  isSimulating = false,
}: CrewDispatchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group crews by status
  const availableCrews = crews.filter(c => c.status === 'available');
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
              
              <ScrollArea className="max-h-[300px]">
                <div className="p-2 space-y-2">
                  {/* Available Crews Section */}
                  {availableCrews.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Available ({availableCrews.length})
                      </p>
                      <div className="space-y-1.5">
                        {availableCrews.map(crew => (
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

                  {/* Active Crews Section */}
                  {activeCrews.length > 0 && (
                    <div className={availableCrews.length > 0 ? 'pt-2' : ''}>
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
                  {!selectedEventId && availableCrews.length > 0 && (
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
    </div>
  );
}
