import { format } from 'date-fns';
import { X, Bot, MapPin, Clock, Users, Zap, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Scenario } from '@/types/scenario';

interface EventDetailDrawerProps {
  event: Scenario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInCopilot: () => void;
}

export function EventDetailDrawer({ event, open, onOpenChange, onOpenInCopilot }: EventDetailDrawerProps) {
  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Priority</Badge>;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground line-clamp-2">{event.name}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {event.outage_type && <OutageTypeBadge type={event.outage_type} />}
                    <StatusBadge 
                      variant={event.lifecycle_stage === 'Event' ? 'event' : event.lifecycle_stage === 'Pre-Event' ? 'pre-event' : 'post-event'}
                    >
                      {event.lifecycle_stage}
                    </StatusBadge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Priority */}
              {event.priority && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  {getPriorityBadge(event.priority)}
                </div>
              )}
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {event.customers_impacted !== null && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs">Customers Impacted</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {event.customers_impacted.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {event.eta && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">ETA</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {format(new Date(event.eta), 'MMM d, h:mm a')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Location */}
              {event.geo_center && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">Location (Demo)</span>
                  </div>
                  <p className="text-sm font-mono text-foreground">
                    {event.geo_center.lat.toFixed(4)}, {event.geo_center.lng.toFixed(4)}
                  </p>
                </div>
              )}
              
              <Separator />
              
              {/* Infrastructure IDs */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Infrastructure Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Fault ID</span>
                    <span className="text-sm font-mono text-foreground">
                      {event.fault_id || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Feeder ID</span>
                    <span className="text-sm font-mono text-foreground">
                      {event.feeder_id || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">Transformer ID</span>
                    <span className="text-sm font-mono text-foreground">
                      {event.transformer_id || '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Description / Notes */}
              {(event.description || event.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {event.notes || event.description}
                  </p>
                </div>
              )}
              
              {/* Operator Role */}
              {event.operator_role && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs text-muted-foreground">Assigned Role</span>
                  <p className="text-sm font-medium text-foreground mt-0.5">{event.operator_role}</p>
                </div>
              )}
            </div>
            
            {/* Footer - Open in Copilot */}
            <div className="p-4 border-t border-border bg-muted/30">
              <Button 
                onClick={onOpenInCopilot}
                className="w-full gap-2 shadow-md"
              >
                <Bot className="w-4 h-4" />
                Open in Copilot
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Get AI analysis of risks, trade-offs & checklists
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
