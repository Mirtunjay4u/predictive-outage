import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  MapPin, 
  Zap, 
  Clock, 
  ChevronRight,
  Star,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CrewWithAvailability } from '@/types/crew';
import type { Scenario } from '@/types/scenario';

interface DispatchRecommendationsProps {
  crews: CrewWithAvailability[];
  selectedEvent: Scenario | null;
  onDispatchCrew: (crewId: string, eventId: string) => void;
  onEmergencyDispatch: (crewId: string, eventId: string, authorizedBy: string, notes: string) => void;
}

interface CrewRecommendation {
  crew: CrewWithAvailability;
  score: number;
  distanceKm: number;
  etaMinutes: number;
  proximityScore: number;
  specializationScore: number;
  availabilityScore: number;
  matchReason: string[];
}

// Specialization matching rules
const SPECIALIZATION_MATCHES: Record<string, string[]> = {
  'Storm': ['Storm Response', 'Emergency Response', 'Line Crew', 'General'],
  'Flood': ['Emergency Response', 'Underground', 'General'],
  'Heavy Rain': ['Storm Response', 'Line Crew', 'General'],
  'Heatwave': ['Transformer', 'Substation', 'General'],
  'Wildfire': ['Emergency Response', 'Line Crew', 'General'],
  'Lightning': ['Storm Response', 'High Voltage', 'Line Crew', 'General'],
  'Ice/Snow': ['Storm Response', 'Line Crew', 'General'],
  'High Wind': ['Storm Response', 'Line Crew', 'Tree Trimming', 'General'],
  'Equipment Failure': ['Transformer', 'Substation', 'High Voltage', 'General'],
  'Vegetation': ['Tree Trimming', 'Line Crew', 'General'],
  'Unknown': ['General', 'Emergency Response'],
};

// Haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate recommendations
function calculateRecommendations(
  crews: CrewWithAvailability[],
  event: Scenario
): CrewRecommendation[] {
  if (!event.geo_center) return [];

  const eventLat = event.geo_center.lat;
  const eventLng = event.geo_center.lng;
  const outageType = event.outage_type || 'Unknown';
  const matchingSpecializations = SPECIALIZATION_MATCHES[outageType] || ['General'];

  const availableCrews = crews.filter(c => c.status === 'available');

  return availableCrews.map(crew => {
    const matchReason: string[] = [];
    
    // Calculate distance and ETA
    const distanceKm = calculateDistance(
      crew.current_lat,
      crew.current_lng,
      eventLat,
      eventLng
    );
    const etaMinutes = Math.round((distanceKm / 48) * 60); // 48 km/h average

    // Proximity score (0-40 points) - closer is better
    // Max score at 0km, 0 points at 50km+
    const proximityScore = Math.max(0, 40 - (distanceKm / 50) * 40);
    if (distanceKm < 5) matchReason.push('Very close');
    else if (distanceKm < 15) matchReason.push('Nearby');

    // Specialization score (0-35 points)
    let specializationScore = 0;
    const crewSpec = crew.specialization || 'General';
    const specIndex = matchingSpecializations.indexOf(crewSpec);
    if (specIndex === 0) {
      specializationScore = 35; // Perfect match
      matchReason.push(`${crewSpec} specialist`);
    } else if (specIndex > 0) {
      specializationScore = 25 - (specIndex * 5); // Partial match
      matchReason.push(`${crewSpec} capable`);
    } else if (crewSpec === 'General') {
      specializationScore = 10; // General crews always get some points
    }

    // Availability score (0-25 points)
    let availabilityScore = 0;
    if (crew.isOnShift && !crew.isOnBreak) {
      availabilityScore = 25; // On shift and available
      matchReason.push('On shift');
    } else if (crew.isOnBreak) {
      availabilityScore = 15; // On break but could be called
      matchReason.push('On break');
    } else {
      availabilityScore = 5; // Off duty - emergency only
      matchReason.push('Off duty');
    }

    // Team size bonus (larger teams for bigger incidents)
    const teamBonus = event.customers_impacted && event.customers_impacted > 1000 
      ? Math.min(crew.team_size * 2, 10) 
      : 0;

    const score = Math.round(proximityScore + specializationScore + availabilityScore + teamBonus);

    return {
      crew,
      score,
      distanceKm,
      etaMinutes,
      proximityScore,
      specializationScore,
      availabilityScore,
      matchReason,
    };
  }).sort((a, b) => b.score - a.score);
}

// Get score color
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-amber-500';
  return 'text-muted-foreground';
}

// Get score badge variant
function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-500/10 text-green-500 border-green-500/30';
  if (score >= 60) return 'bg-primary/10 text-primary border-primary/30';
  if (score >= 40) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
  return 'bg-muted text-muted-foreground border-border';
}

export function DispatchRecommendations({
  crews,
  selectedEvent,
  onDispatchCrew,
  onEmergencyDispatch,
}: DispatchRecommendationsProps) {
  const recommendations = useMemo(() => {
    if (!selectedEvent) return [];
    return calculateRecommendations(crews, selectedEvent).slice(0, 5); // Top 5
  }, [crews, selectedEvent]);

  if (!selectedEvent || recommendations.length === 0) {
    return null;
  }

  const topRecommendation = recommendations[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-semibold text-foreground">AI Recommendations</h4>
        <Badge variant="outline" className="text-[9px] ml-auto">
          {recommendations.length} matches
        </Badge>
      </div>

      {/* Top Recommendation - Highlighted */}
      {topRecommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-lg border-2 border-primary/50 bg-primary/5 p-3"
        >
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-bl-lg">
            <Star className="w-2.5 h-2.5 inline mr-0.5" />
            BEST MATCH
          </div>
          
          <div className="flex items-start justify-between gap-2 mt-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {topRecommendation.crew.crew_name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {topRecommendation.distanceKm.toFixed(1)}km
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {topRecommendation.etaMinutes}min ETA
                </span>
                {topRecommendation.crew.specialization && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {topRecommendation.crew.specialization}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {topRecommendation.matchReason.slice(0, 3).map((reason, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <div className={`text-lg font-bold ${getScoreColor(topRecommendation.score)}`}>
                    {topRecommendation.score}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs space-y-1">
                  <p>Match Score Breakdown:</p>
                  <p>Proximity: {Math.round(topRecommendation.proximityScore)}/40</p>
                  <p>Specialization: {Math.round(topRecommendation.specializationScore)}/35</p>
                  <p>Availability: {Math.round(topRecommendation.availabilityScore)}/25</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  if (topRecommendation.crew.isOnShift) {
                    onDispatchCrew(topRecommendation.crew.id, selectedEvent.id);
                  } else {
                    onEmergencyDispatch(
                      topRecommendation.crew.id,
                      selectedEvent.id,
                      'AI Recommendation',
                      `Auto-recommended based on ${topRecommendation.matchReason.join(', ')}`
                    );
                  }
                }}
              >
                <Send className="w-3 h-3 mr-1" />
                Dispatch
              </Button>
            </div>
          </div>
          
          {/* Score bar */}
          <div className="mt-3">
            <Progress value={topRecommendation.score} className="h-1" />
          </div>
        </motion.div>
      )}

      {/* Other Recommendations */}
      <AnimatePresence>
        {recommendations.slice(1).map((rec, index) => (
          <motion.div
            key={rec.crew.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-2 rounded-md bg-background border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0 font-semibold ${getScoreBadgeClass(rec.score)}`}
              >
                {rec.score}
              </Badge>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {rec.crew.crew_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {rec.distanceKm.toFixed(1)}km • {rec.etaMinutes}min • {rec.crew.specialization || 'General'}
                </p>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px]"
              onClick={() => {
                if (rec.crew.isOnShift) {
                  onDispatchCrew(rec.crew.id, selectedEvent.id);
                } else {
                  onEmergencyDispatch(
                    rec.crew.id,
                    selectedEvent.id,
                    'AI Recommendation',
                    `Auto-recommended based on ${rec.matchReason.join(', ')}`
                  );
                }
              }}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
