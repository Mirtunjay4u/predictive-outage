import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Crew, CrewWithAvailability } from '@/types/crew';
import type { Scenario } from '@/types/scenario';
import { Button } from '@/components/ui/button';
import { Play, Phone, Users, Truck, Clock, Navigation } from 'lucide-react';

interface AnimatedCrewMarkersProps {
  crews: Crew[] | CrewWithAvailability[];
  scenarios: Scenario[];
  visible: boolean;
  onCrewClick: (crew: Crew) => void;
  onSimulateMovement?: (crewId: string, targetLat: number, targetLng: number) => void;
  showRouteTrails?: boolean;
}

// Type guard for availability
function hasAvailability(crew: Crew | CrewWithAvailability): crew is CrewWithAvailability {
  return 'shiftStatus' in crew;
}

// Position history for route trails
interface PositionHistory {
  [crewId: string]: Array<[number, number]>;
}

// Create crew marker icon with pulse animation for moving crews
const createCrewIcon = (
  status: Crew['status'], 
  hasAssignment: boolean,
  shiftStatus?: CrewWithAvailability['shiftStatus'],
  isMoving?: boolean
) => {
  const size = 36;
  const isOffDuty = shiftStatus === 'off_duty' || shiftStatus === 'on_break';
  
  let bgColor: string;
  let borderColor: string;
  let glowColor: string;
  
  if (isOffDuty && status === 'available') {
    bgColor = '#6b7280';
    borderColor = '#4b5563';
    glowColor = 'transparent';
  } else {
    switch (status) {
      case 'available':
        bgColor = '#22c55e';
        borderColor = '#16a34a';
        glowColor = '#22c55e';
        break;
      case 'dispatched':
        bgColor = '#f59e0b';
        borderColor = '#d97706';
        glowColor = '#f59e0b';
        break;
      case 'en_route':
        bgColor = '#3b82f6';
        borderColor = '#2563eb';
        glowColor = '#3b82f6';
        break;
      case 'on_site':
        bgColor = '#8b5cf6';
        borderColor = '#7c3aed';
        glowColor = '#8b5cf6';
        break;
      case 'returning':
        bgColor = '#6b7280';
        borderColor = '#4b5563';
        glowColor = 'transparent';
        break;
      default:
        bgColor = '#6b7280';
        borderColor = '#4b5563';
        glowColor = 'transparent';
    }
  }

  // Shift status indicator
  let shiftIndicator = '';
  if (shiftStatus === 'off_duty') {
    shiftIndicator = `
      <circle cx="28" cy="28" r="6" fill="#6b7280" stroke="white" stroke-width="1"/>
      <text x="28" y="31" text-anchor="middle" fill="white" font-size="8">Z</text>
    `;
  } else if (shiftStatus === 'on_break') {
    shiftIndicator = `
      <circle cx="28" cy="28" r="6" fill="#f59e0b" stroke="white" stroke-width="1"/>
      <text x="28" y="31" text-anchor="middle" fill="white" font-size="8">☕</text>
    `;
  }

  // Pulse animation for moving crews
  const pulseAnimation = isMoving ? `
    <circle cx="18" cy="18" r="16" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.6">
      <animate attributeName="r" from="14" to="22" dur="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite"/>
    </circle>
  ` : '';

  // Direction indicator for en_route
  const directionIndicator = status === 'en_route' ? `
    <polygon points="18,4 22,10 14,10" fill="white" opacity="0.9"/>
  ` : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="${size}" height="${size}" 
         style="opacity: ${isOffDuty && status === 'available' ? 0.6 : 1}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      ${pulseAnimation}
      <circle cx="18" cy="18" r="14" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
      ${directionIndicator}
      <g transform="translate(9, 11)" fill="white">
        <rect x="0" y="3" width="10" height="8" rx="1"/>
        <path d="M10 5h4l2 4v2h-6z"/>
        <circle cx="4" cy="12" r="2" fill="${borderColor}"/>
        <circle cx="13" cy="12" r="2" fill="${borderColor}"/>
      </g>
      ${hasAssignment ? `
        <circle cx="28" cy="8" r="5" fill="#ef4444" stroke="white" stroke-width="1"/>
        <text x="28" y="11" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>
      ` : ''}
      ${shiftIndicator}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: `crew-marker-icon ${isMoving ? 'crew-moving' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

// Animated marker wrapper
function AnimatedMarker({ 
  crew, 
  icon, 
  onCrewClick,
  children 
}: { 
  crew: Crew;
  icon: L.DivIcon;
  onCrewClick: (crew: Crew) => void;
  children: React.ReactNode;
}) {
  const markerRef = useRef<L.Marker>(null);
  const previousPosition = useRef<[number, number]>([crew.current_lat, crew.current_lng]);
  
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const newPos: [number, number] = [crew.current_lat, crew.current_lng];
    const oldPos = previousPosition.current;
    
    // Only animate if position changed
    if (oldPos[0] !== newPos[0] || oldPos[1] !== newPos[1]) {
      // Smooth animation over 800ms
      const startTime = Date.now();
      const duration = 800;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const lat = oldPos[0] + (newPos[0] - oldPos[0]) * eased;
        const lng = oldPos[1] + (newPos[1] - oldPos[1]) * eased;
        
        marker.setLatLng([lat, lng]);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          previousPosition.current = newPos;
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [crew.current_lat, crew.current_lng]);

  return (
    <Marker
      ref={markerRef}
      position={[crew.current_lat, crew.current_lng]}
      icon={icon}
      eventHandlers={{
        click: () => onCrewClick(crew),
      }}
    >
      {children}
    </Marker>
  );
}

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

// Get shift status label
const getShiftStatusLabel = (shiftStatus: CrewWithAvailability['shiftStatus']) => {
  switch (shiftStatus) {
    case 'on_shift': return 'On Shift';
    case 'on_break': return 'On Break';
    case 'off_duty': return 'Off Duty';
    default: return '';
  }
};

export function AnimatedCrewMarkers({ 
  crews, 
  scenarios,
  visible,
  onCrewClick,
  onSimulateMovement,
  showRouteTrails = true,
}: AnimatedCrewMarkersProps) {
  const [positionHistory, setPositionHistory] = useState<PositionHistory>({});
  const previousPositions = useRef<{ [id: string]: [number, number] }>({});

  // Track position history for route trails
  useEffect(() => {
    crews.forEach(crew => {
      const currentPos: [number, number] = [crew.current_lat, crew.current_lng];
      const prevPos = previousPositions.current[crew.id];
      
      // Only add to history if position actually changed
      if (!prevPos || prevPos[0] !== currentPos[0] || prevPos[1] !== currentPos[1]) {
        setPositionHistory(prev => {
          const history = prev[crew.id] || [];
          // Keep last 20 positions for trail
          const newHistory = [...history, currentPos].slice(-20);
          return { ...prev, [crew.id]: newHistory };
        });
        previousPositions.current[crew.id] = currentPos;
      }
    });
  }, [crews]);

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
        const shiftStatus = hasAvailability(crew) ? crew.shiftStatus : undefined;
        const isMoving = crew.status === 'en_route';
        const icon = createCrewIcon(crew.status, hasAssignment, shiftStatus, isMoving);
        const history = positionHistory[crew.id] || [];
        
        return (
          <div key={`crew-group-${crew.id}`}>
            {/* Route trail - fading breadcrumb path */}
            {showRouteTrails && history.length > 1 && (crew.status === 'en_route' || crew.status === 'dispatched') && (
              <>
                {/* Trail shadow */}
                <Polyline
                  positions={history}
                  pathOptions={{
                    color: '#000',
                    weight: 5,
                    opacity: 0.1,
                  }}
                />
                {/* Main trail with gradient effect via multiple segments */}
                {history.slice(0, -1).map((pos, i) => {
                  const nextPos = history[i + 1];
                  const opacity = 0.2 + (i / history.length) * 0.6; // Fade from old to new
                  return (
                    <Polyline
                      key={`trail-${crew.id}-${i}`}
                      positions={[pos, nextPos]}
                      pathOptions={{
                        color: crew.status === 'en_route' ? '#3b82f6' : '#f59e0b',
                        weight: 3,
                        opacity,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* Projected route to destination */}
            {hasAssignment && assignedEvent?.geo_center && (crew.status === 'dispatched' || crew.status === 'en_route') && (
              <Polyline
                positions={[
                  [crew.current_lat, crew.current_lng],
                  [assignedEvent.geo_center.lat, assignedEvent.geo_center.lng],
                ]}
                pathOptions={{
                  color: crew.status === 'en_route' ? '#3b82f6' : '#f59e0b',
                  weight: 2,
                  opacity: 0.5,
                  dashArray: '8, 12',
                }}
              />
            )}
            
            {/* Animated crew marker */}
            <AnimatedMarker
              crew={crew}
              icon={icon}
              onCrewClick={onCrewClick}
            >
              <Popup className="custom-popup crew-popup" maxWidth={280}>
                <div className="p-2 min-w-[240px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-foreground">{crew.crew_name}</h3>
                    <span className={`text-xs font-medium flex items-center gap-1 ${getStatusColor(crew.status)}`}>
                      {isMoving && <Navigation className="w-3 h-3 animate-pulse" />}
                      {getStatusLabel(crew.status)}
                    </span>
                  </div>
                  
                  {/* Crew ID & Shift Status */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      {crew.crew_id}
                    </p>
                    {hasAvailability(crew) && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        crew.shiftStatus === 'on_shift' 
                          ? 'bg-green-500/20 text-green-400' 
                          : crew.shiftStatus === 'on_break'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getShiftStatusLabel(crew.shiftStatus)}
                      </span>
                    )}
                  </div>
                  
                  {/* Shift Hours */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(crew.shift_start)} - {formatTime(crew.shift_end)}</span>
                  </div>
                  
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
            </AnimatedMarker>
          </div>
        );
      })}
    </>
  );
}
