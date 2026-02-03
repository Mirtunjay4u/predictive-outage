import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const OUTAGE_TYPES = [
  'Storm', 'Flood', 'Heavy Rain', 'Heatwave', 'Wildfire',
  'Lightning', 'Ice/Snow', 'High Wind', 'Equipment Failure', 'Vegetation', 'Unknown'
] as const;

interface EventFiltersProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  lifecycleFilter: string;
  onLifecycleFilterChange: (value: string) => void;
  outageTypeFilter: string;
  onOutageTypeFilterChange: (value: string) => void;
  onCreateClick: () => void;
}

export function EventFilters({
  viewMode,
  onViewModeChange,
  stageFilter,
  onStageFilterChange,
  lifecycleFilter,
  onLifecycleFilterChange,
  outageTypeFilter,
  onOutageTypeFilterChange,
  onCreateClick,
}: EventFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(v) => v && onViewModeChange(v as 'table' | 'cards')}
          className="bg-muted/60 p-1 rounded-lg border border-border/50 shadow-sm"
        >
          <ToggleGroupItem 
            value="table" 
            aria-label="Table view" 
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all"
          >
            <List className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="cards" 
            aria-label="Card view" 
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Stage Filter */}
        <Select value={stageFilter} onValueChange={onStageFilterChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="active">Activated</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Lifecycle Filter */}
        <Select value={lifecycleFilter} onValueChange={onLifecycleFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Lifecycles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lifecycles</SelectItem>
            <SelectItem value="Pre-Event">Pre-Event</SelectItem>
            <SelectItem value="Event">Event</SelectItem>
            <SelectItem value="Post-Event">Post-Event</SelectItem>
          </SelectContent>
        </Select>

        {/* Outage Type Filter */}
        <Select value={outageTypeFilter} onValueChange={onOutageTypeFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OUTAGE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Create Button */}
      <Button 
        onClick={onCreateClick} 
        className="gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      >
        <Plus className="w-4 h-4" />
        New Event
      </Button>
    </div>
  );
}
