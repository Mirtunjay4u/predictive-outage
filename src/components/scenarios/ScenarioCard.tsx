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

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: () => void;
  onDelete: () => void;
}

export function ScenarioCard({ scenario, onClick, onDelete }: ScenarioCardProps) {
  const lifecycleVariant = scenario.lifecycle_stage === 'Pre-Event' 
    ? 'pre-event' 
    : scenario.lifecycle_stage === 'Event' 
    ? 'event' 
    : 'post-event';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer group hover:shadow-elevated transition-all duration-300 border-border/40 hover:border-primary/40 bg-gradient-to-br from-card to-card/80"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {scenario.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {scenario.description || 'No description'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <StatusBadge variant={scenario.stage ? 'active' : 'inactive'}>
              {scenario.stage ? 'Activated' : 'Inactive'}
            </StatusBadge>
            <StatusBadge variant={lifecycleVariant}>
              {scenario.lifecycle_stage}
            </StatusBadge>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            {scenario.scenario_time && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(scenario.scenario_time), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {scenario.operator_role && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{scenario.operator_role}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
