import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { Scenario } from '@/types/scenario';

interface PlaybackPanelProps {
  scenarios: Scenario[];
  onPlaybackTimeChange: (time: Date | null) => void;
  isPlaybackActive: boolean;
  onPlaybackActiveChange: (active: boolean) => void;
}

// Calculate time range from scenarios
function calculateTimeRange(scenarios: Scenario[]): { min: Date; max: Date } | null {
  const validScenarios = scenarios.filter(s => s.event_start_time);
  if (validScenarios.length === 0) return null;

  const startTimes = validScenarios
    .map(s => new Date(s.event_start_time!).getTime())
    .filter(t => !isNaN(t));
  
  const endTimes = validScenarios
    .map(s => s.event_end_time ? new Date(s.event_end_time).getTime() : Date.now())
    .filter(t => !isNaN(t));

  if (startTimes.length === 0) return null;

  const minTime = Math.min(...startTimes);
  const maxTime = Math.max(...endTimes, Date.now());

  // Add 30 min buffer on each end
  return {
    min: new Date(minTime - 30 * 60 * 1000),
    max: new Date(maxTime + 30 * 60 * 1000),
  };
}

// Format time for display
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Get lifecycle stage based on time position
function getStageLabel(position: number): string {
  if (position < 33) return 'Pre-Event';
  if (position < 67) return 'Active';
  return 'Post-Event';
}

// Get stage color
function getStageColor(position: number): string {
  if (position < 33) return 'text-warning';
  if (position < 67) return 'text-destructive';
  return 'text-primary';
}

export function PlaybackPanel({
  scenarios,
  onPlaybackTimeChange,
  isPlaybackActive,
  onPlaybackActiveChange,
}: PlaybackPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState([100]); // 0-100 percentage
  
  // Calculate time range from scenarios
  const timeRange = useMemo(() => calculateTimeRange(scenarios), [scenarios]);
  
  // Current playback time based on slider position
  const currentTime = useMemo(() => {
    if (!timeRange || !isPlaybackActive) return null;
    const range = timeRange.max.getTime() - timeRange.min.getTime();
    const offset = (sliderValue[0] / 100) * range;
    return new Date(timeRange.min.getTime() + offset);
  }, [timeRange, sliderValue, isPlaybackActive]);

  // Count visible events at current time
  const visibleEventCount = useMemo(() => {
    if (!currentTime) return scenarios.filter(s => s.geo_center).length;
    return scenarios.filter(s => {
      if (!s.geo_center || !s.event_start_time) return false;
      const startTime = new Date(s.event_start_time).getTime();
      const endTime = s.event_end_time ? new Date(s.event_end_time).getTime() : Date.now();
      const playbackTime = currentTime.getTime();
      return startTime <= playbackTime && playbackTime <= endTime;
    }).length;
  }, [scenarios, currentTime]);

  // Emit time changes
  useEffect(() => {
    onPlaybackTimeChange(currentTime);
  }, [currentTime, onPlaybackTimeChange]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || !isPlaybackActive) return;

    const interval = setInterval(() => {
      setSliderValue(prev => {
        const next = prev[0] + 0.5; // Move 0.5% every 100ms = ~20s for full timeline
        if (next >= 100) {
          setIsPlaying(false);
          return [100];
        }
        return [next];
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isPlaybackActive]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!isPlaybackActive) {
      onPlaybackActiveChange(true);
      setSliderValue([0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isPlaybackActive, onPlaybackActiveChange]);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setSliderValue([100]);
    onPlaybackActiveChange(false);
  }, [onPlaybackActiveChange]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    if (!isPlaybackActive) {
      onPlaybackActiveChange(true);
    }
    setSliderValue(value);
    setIsPlaying(false);
  }, [isPlaybackActive, onPlaybackActiveChange]);

  if (!timeRange) return null;

  const stageLabel = getStageLabel(sliderValue[0]);
  const stageColor = getStageColor(sliderValue[0]);

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3 min-w-[400px]">
      <div className="flex items-center gap-3 mb-3">
        {/* Play/Pause Button */}
        <Button
          size="sm"
          variant={isPlaying ? 'default' : 'outline'}
          className="h-8 w-8 p-0"
          onClick={handlePlayPause}
          title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {/* Reset Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleReset}
          disabled={!isPlaybackActive}
          title="Reset to Live"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* Stage Label */}
        <div className="flex-1 flex items-center justify-center">
          {isPlaybackActive ? (
            <Badge variant="outline" className={`${stageColor} border-current`}>
              {stageLabel}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary mr-1.5 animate-pulse" />
              Live View
            </Badge>
          )}
        </div>

        {/* Current Time Display */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px] justify-end">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">
            {isPlaybackActive && currentTime ? formatTime(currentTime) : 'Now'}
          </span>
        </div>

        {/* Event Count */}
        <Badge variant="outline" className="text-xs">
          {visibleEventCount} events
        </Badge>
      </div>

      {/* Timeline Slider */}
      <div className="relative">
        {/* Stage Labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 px-1">
          <span>Pre-Event</span>
          <span>Active</span>
          <span>Post-Event</span>
        </div>

        {/* Slider */}
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          max={100}
          step={0.5}
          className="w-full"
        />

        {/* Time Range Labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
          <span>{formatTime(timeRange.min)}</span>
          <span>{formatTime(timeRange.max)}</span>
        </div>
      </div>
    </div>
  );
}
