import { format, formatDistanceToNow } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Scenario } from '@/types/scenario';

interface ScenarioTableProps {
  scenarios: Scenario[];
  onRowClick: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export function ScenarioTable({ scenarios, onRowClick, onDelete }: ScenarioTableProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="w-[200px] font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Stage</TableHead>
            <TableHead className="font-semibold">Lifecycle</TableHead>
            <TableHead className="font-semibold">Outage Type</TableHead>
            <TableHead className="font-semibold">Operator</TableHead>
            <TableHead className="font-semibold">Scheduled</TableHead>
            <TableHead className="font-semibold">Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((scenario) => {
            const lifecycleVariant = scenario.lifecycle_stage === 'Pre-Event' 
              ? 'pre-event' 
              : scenario.lifecycle_stage === 'Event' 
              ? 'event' 
              : 'post-event';

            return (
              <TableRow 
                key={scenario.id}
                className="cursor-pointer group transition-colors hover:bg-primary/5 border-b border-border/30"
                onClick={() => onRowClick(scenario)}
              >
                <TableCell className="font-medium">
                  <div>
                    <span className="group-hover:text-primary transition-colors">
                      {scenario.name}
                    </span>
                    {scenario.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {scenario.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={scenario.stage ? 'active' : 'inactive'}>
                    {scenario.stage ? 'Activated' : 'Inactive'}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={lifecycleVariant}>
                    {scenario.lifecycle_stage}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-medium">
                    {scenario.outage_type || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {scenario.operator_role || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {scenario.scenario_time 
                    ? format(new Date(scenario.scenario_time), 'MMM d, yyyy')
                    : '—'
                  }
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(scenario.updated_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(scenario); }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
