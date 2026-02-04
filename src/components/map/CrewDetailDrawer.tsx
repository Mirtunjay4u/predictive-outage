import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  Users, 
  Phone, 
  MapPin, 
  Clock, 
  Play,
  CheckCircle,
  RotateCcw,
  Zap
} from 'lucide-react';
import type { Crew } from '@/types/crew';
import type { Scenario } from '@/types/scenario';

interface CrewDetailDrawerProps {
  crew: Crew | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedEvent: Scenario | null;
  onSimulateMovement?: () => void;
  onMarkArrived?: () => void;
  onMarkAvailable?: () => void;
}

// Get status badge variant
const getStatusVariant = (status: Crew['status']) => {
  switch (status) {
    case 'available': return 'default';
    case 'dispatched': return 'secondary';
    case 'en_route': return 'default';
    case 'on_site': return 'default';
    case 'returning': return 'outline';
    default: return 'outline';
  }
};

// Get status display with color
const getStatusDisplay = (status: Crew['status']) => {
  switch (status) {
    case 'available': return { label: 'Available', color: 'bg-green-500' };
    case 'dispatched': return { label: 'Dispatched', color: 'bg-amber-500' };
    case 'en_route': return { label: 'En Route', color: 'bg-blue-500' };
    case 'on_site': return { label: 'On Site', color: 'bg-purple-500' };
    case 'returning': return { label: 'Returning', color: 'bg-gray-500' };
    default: return { label: status, color: 'bg-gray-500' };
  }
};

// Format ETA
const formatEta = (minutes: number | null) => {
  if (minutes === null) return 'N/A';
  if (minutes === 0) return 'Arrived';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Format dispatch time
const formatDispatchTime = (time: string | null) => {
  if (!time) return 'Not dispatched';
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export function CrewDetailDrawer({
  crew,
  open,
  onOpenChange,
  assignedEvent,
  onSimulateMovement,
  onMarkArrived,
  onMarkAvailable,
}: CrewDetailDrawerProps) {
  if (!crew) return null;

  const statusDisplay = getStatusDisplay(crew.status);
  const isActive = crew.status === 'dispatched' || crew.status === 'en_route';
  const isOnSite = crew.status === 'on_site';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">{crew.crew_name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{crew.crew_id}</p>
            </div>
            <Badge 
              variant={getStatusVariant(crew.status)} 
              className="flex items-center gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
              {statusDisplay.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Crew Details */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Crew Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{crew.vehicle_type}</p>
                  <p className="text-xs text-muted-foreground">Vehicle Type</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{crew.team_size} Members</p>
                  <p className="text-xs text-muted-foreground">Team Size</p>
                </div>
              </div>
              
              {crew.specialization && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{crew.specialization}</p>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                  </div>
                </div>
              )}
              
              {crew.contact_phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{crew.contact_phone}</p>
                    <p className="text-xs text-muted-foreground">Contact</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Current Location */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Current Location</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {crew.current_lat.toFixed(4)}, {crew.current_lng.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">GPS Coordinates</p>
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          {assignedEvent && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Current Assignment</h4>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{assignedEvent.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {assignedEvent.outage_type || 'Unknown'} • {assignedEvent.lifecycle_stage}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        ETA: {formatEta(crew.eta_minutes)}
                      </span>
                    </div>
                    {crew.dispatch_time && (
                      <div className="text-xs text-muted-foreground">
                        Dispatched at {formatDispatchTime(crew.dispatch_time)}
                      </div>
                    )}
                  </div>

                  {assignedEvent.customers_impacted && (
                    <p className="text-xs text-muted-foreground">
                      {assignedEvent.customers_impacted.toLocaleString()} customers impacted
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            {isActive && onSimulateMovement && (
              <Button
                variant="default"
                className="w-full"
                onClick={onSimulateMovement}
              >
                <Play className="w-4 h-4 mr-2" />
                Simulate Movement
              </Button>
            )}
            
            {isActive && onMarkArrived && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onMarkArrived}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Arrived
              </Button>
            )}
            
            {(isOnSite || crew.status === 'returning') && onMarkAvailable && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onMarkAvailable}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Mark as Available
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
