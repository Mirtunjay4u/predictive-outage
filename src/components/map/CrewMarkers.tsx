import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { Crew } from '@/types/crew';
import type { Scenario } from '@/types/scenario';
import { Button } from '@/components/ui/button';
import { Play, Phone, Users, Truck } from 'lucide-react';

interface CrewMarkersProps {
  crews: Crew[];
  scenarios: Scenario[];
  visible: boolean;
  onCrewClick: (crew: Crew) => void;
  onSimulateMovement?: (crewId: string, targetLat: number, targetLng: number) => void;
}

// Create crew marker icon
const createCrewIcon = (status: Crew['status'], hasAssignment: boolean) => {
  const size = 32;
  
  // Status-based colors
  let bgColor: string;
  let borderColor: string;
  
  switch (status) {
    case 'available':
      bgColor = '#22c55e'; // green
      borderColor = '#16a34a';
      break;
    case 'dispatched':
      bgColor = '#f59e0b'; // amber
      borderColor = '#d97706';
      break;
    case 'en_route':
      bgColor = '#3b82f6'; // blue
      borderColor = '#2563eb';
      break;
    case 'on_site':
      bgColor = '#8b5cf6'; // purple
      borderColor = '#7c3aed';
      break;
    case 'returning':
      bgColor = '#6b7280'; // gray
      borderColor = '#4b5563';
      break;
    default:
      bgColor = '#6b7280';
      borderColor = '#4b5563';
  }

  // Truck icon SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
      <circle cx="16" cy="16" r="14" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
      <g transform="translate(8, 9)" fill="white">
        <rect x="0" y="3" width="10" height="8" rx="1"/>
        <path d="M10 5h4l2 4v2h-6z"/>
        <circle cx="4" cy="12" r="2" fill="${borderColor}"/>
        <circle cx="13" cy="12" r="2" fill="${borderColor}"/>
      </g>
      ${hasAssignment ? `
        <circle cx="26" cy="6" r="5" fill="#ef4444" stroke="white" stroke-width="1"/>
        <text x="26" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'crew-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

// Format ETA display
const formatEta = (minutes: number | null) => {
  if (minutes === null) return 'N/A';
  if (minutes === 0) return 'Arrived';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Get status display label
const getStatusLabel = (status: Crew['status']) => {
  switch (status) {
    case 'available': return 'Available';
    case 'dispatched': return 'Dispatched';
    case 'en_route': return 'En Route';
    case 'on_site': return 'On Site';
    case 'returning': return 'Returning';
    default: return status;
  }
};

// Get status color class
const getStatusColor = (status: Crew['status']) => {
  switch (status) {
    case 'available': return 'text-green-400';
    case 'dispatched': return 'text-amber-400';
    case 'en_route': return 'text-blue-400';
    case 'on_site': return 'text-purple-400';
    case 'returning': return 'text-gray-400';
    default: return 'text-muted-foreground';
  }
};

export function CrewMarkers({ 
  crews, 
  scenarios,
  visible,
  onCrewClick,
  onSimulateMovement,
}: CrewMarkersProps) {
  if (!visible) return null;

  // Get assigned event for a crew
  const getAssignedEvent = (eventId: string | null): Scenario | undefined => {
    if (!eventId) return undefined;
    return scenarios.find(s => s.id === eventId);
  };

  return (
    <>
      {crews.map(crew => {
        const hasAssignment = !!crew.assigned_event_id;
        const assignedEvent = getAssignedEvent(crew.assigned_event_id);
        const icon = createCrewIcon(crew.status, hasAssignment);
        
        return (
          <div key={`crew-group-${crew.id}`}>
            {/* Route line to assigned event */}
            {hasAssignment && assignedEvent?.geo_center && (crew.status === 'dispatched' || crew.status === 'en_route') && (
              <Polyline
                positions={[
                  [crew.current_lat, crew.current_lng],
                  [assignedEvent.geo_center.lat, assignedEvent.geo_center.lng],
                ]}
                pathOptions={{
                  color: crew.status === 'en_route' ? '#3b82f6' : '#f59e0b',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '10, 10',
                }}
              />
            )}
            
            {/* Crew marker */}
            <Marker
              key={`crew-${crew.id}`}
              position={[crew.current_lat, crew.current_lng]}
              icon={icon}
              eventHandlers={{
                click: () => onCrewClick(crew),
              }}
            >
              <Popup className="custom-popup crew-popup" maxWidth={280}>
                <div className="p-2 min-w-[240px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-foreground">{crew.crew_name}</h3>
                    <span className={`text-xs font-medium ${getStatusColor(crew.status)}`}>
                      {getStatusLabel(crew.status)}
                    </span>
                  </div>
                  
                  {/* Crew ID */}
                  <p className="text-xs text-muted-foreground mb-2">
                    {crew.crew_id}
                  </p>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="w-3 h-3" />
                      <span>{crew.vehicle_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{crew.team_size} members</span>
                    </div>
                    {crew.specialization && (
                      <div className="col-span-2 text-muted-foreground">
                        <span className="font-medium">Spec:</span> {crew.specialization}
                      </div>
                    )}
                    {crew.contact_phone && (
                      <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{crew.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Assignment Info */}
                  {hasAssignment && assignedEvent && (
                    <div className="bg-primary/10 rounded-md p-2 mb-2">
                      <p className="text-xs text-foreground font-medium mb-1">
                        Assigned to: {assignedEvent.name}
                      </p>
                      {crew.eta_minutes !== null && (
                        <p className="text-xs text-primary font-semibold">
                          ETA: {formatEta(crew.eta_minutes)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Simulate Movement Button */}
                  {onSimulateMovement && (crew.status === 'dispatched' || crew.status === 'en_route') && assignedEvent?.geo_center && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSimulateMovement(
                          crew.id,
                          assignedEvent.geo_center!.lat,
                          assignedEvent.geo_center!.lng
                        );
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Simulate Movement
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </>
  );
}
