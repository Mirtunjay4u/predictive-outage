import { motion } from 'framer-motion';
import { Calendar, Clock, User, MoreVertical } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Scenario } from '@/types/scenario';

interface EventCardProps {
  scenario: Scenario;
  onClick: () => void;
  onDelete: () => void;
}

export function EventCard({ scenario, onClick, onDelete }: EventCardProps) {
  const lifecycleVariant = scenario.lifecycle_stage === 'Pre-Event' 
    ? 'pre-event' 
    : scenario.lifecycle_stage === 'Event' 
    ? 'event' 
    : 'post-event';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <Card 
        className="cursor-pointer group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/40 bg-card h-full"
        onClick={onClick}
      >
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-base">
                {scenario.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {scenario.description || 'No description'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 -mr-1 -mt-1 flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  Delete Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <StatusBadge variant={scenario.stage ? 'active' : 'inactive'}>
              {scenario.stage ? 'Activated' : 'Inactive'}
            </StatusBadge>
            <StatusBadge variant={lifecycleVariant}>
              {scenario.lifecycle_stage}
            </StatusBadge>
          </div>
          
          <div className="space-y-1.5 text-sm text-muted-foreground border-t border-border/50 pt-3 mt-3">
            {scenario.scenario_time && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{format(new Date(scenario.scenario_time), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {scenario.operator_role && (
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{scenario.operator_role}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Updated {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
