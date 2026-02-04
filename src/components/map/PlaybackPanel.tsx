import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

  return {
    min: new Date(minTime - 30 * 60 * 1000),
    max: new Date(maxTime + 30 * 60 * 1000),
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function getStageLabel(position: number): string {
  if (position < 33) return 'Pre-Event';
  if (position < 67) return 'Active';
  return 'Post-Event';
}

function getStageColor(position: number): string {
  if (position < 33) return 'text-warning border-warning/50';
  if (position < 67) return 'text-destructive border-destructive/50';
  return 'text-primary border-primary/50';
}

export function PlaybackPanel({
  scenarios,
  onPlaybackTimeChange,
  isPlaybackActive,
  onPlaybackActiveChange,
}: PlaybackPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState([100]);
  
  const timeRange = useMemo(() => calculateTimeRange(scenarios), [scenarios]);
  
  const currentTime = useMemo(() => {
    if (!timeRange || !isPlaybackActive) return null;
    const range = timeRange.max.getTime() - timeRange.min.getTime();
    const offset = (sliderValue[0] / 100) * range;
    return new Date(timeRange.min.getTime() + offset);
  }, [timeRange, sliderValue, isPlaybackActive]);

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

  useEffect(() => {
    onPlaybackTimeChange(currentTime);
  }, [currentTime, onPlaybackTimeChange]);

  useEffect(() => {
    if (!isPlaying || !isPlaybackActive) return;

    const interval = setInterval(() => {
      setSliderValue(prev => {
        const next = prev[0] + 0.5;
        if (next >= 100) {
          setIsPlaying(false);
          return [100];
        }
        return [next];
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isPlaybackActive]);

  const handlePlayPause = useCallback(() => {
    if (!isPlaybackActive) {
      onPlaybackActiveChange(true);
      setSliderValue([0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isPlaybackActive, onPlaybackActiveChange]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setSliderValue([100]);
    onPlaybackActiveChange(false);
  }, [onPlaybackActiveChange]);

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
    <div className="flex items-center gap-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border px-4 py-2 shadow-sm min-w-[420px]">
      {/* Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{isPlaying ? 'Pause' : 'Play Timeline'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={handleReset}
              disabled={!isPlaybackActive}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Reset to Live</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Slider */}
      <div className="flex-1 min-w-[180px]">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          max={100}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-0.5">
          <span>Pre-Event</span>
          <span>Active</span>
          <span>Post-Event</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {isPlaybackActive ? (
          <Badge variant="outline" className={`text-[10px] ${stageColor}`}>
            {stageLabel}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] text-muted-foreground gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </Badge>
        )}
        
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-[65px]">
          <Clock className="w-3 h-3" />
          <span className="font-mono">
            {isPlaybackActive && currentTime ? formatTime(currentTime) : 'Now'}
          </span>
        </div>

        <Badge variant="outline" className="text-[10px]">
          {visibleEventCount}
        </Badge>
      </div>
    </div>
  );
}
