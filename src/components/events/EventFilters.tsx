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
  'Lightning', 'Snow Storm', 'High Wind', 'Equipment Failure', 'Vegetation', 'Others'
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
    <div className="flex items-center justify-between gap-3 flex-wrap p-3 bg-card rounded-xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        {/* View Toggle */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(v) => v && onViewModeChange(v as 'table' | 'cards')}
          className="bg-muted/60 p-1 rounded-lg border border-border/50"
        >
          <ToggleGroupItem 
            value="table" 
            aria-label="Table view" 
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all h-8 w-8"
          >
            <List className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="cards" 
            aria-label="Card view" 
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all h-8 w-8"
          >
            <LayoutGrid className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="w-px h-6 bg-border/50 hidden sm:block" />

        {/* Stage Filter */}
        <Select value={stageFilter} onValueChange={onStageFilterChange}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
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
          <SelectTrigger className="w-[140px] h-9 text-sm">
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
          <SelectTrigger className="w-[140px] h-9 text-sm">
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
        className="gap-2 h-9 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        New Event
      </Button>
    </div>
  );
}
