import { useState } from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { CrewWithAvailability } from '@/types/crew';

interface EmergencyDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crew: CrewWithAvailability | null;
  eventName: string;
  onConfirm: (authorizedBy: string, notes: string) => void;
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

export function EmergencyDispatchDialog({
  open,
  onOpenChange,
  crew,
  eventName,
  onConfirm,
}: EmergencyDispatchDialogProps) {
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!authorizedBy.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(authorizedBy.trim(), notes.trim());
      setAuthorizedBy('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAuthorizedBy('');
    setNotes('');
    onOpenChange(false);
  };

  if (!crew) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Emergency Override Dispatch
          </DialogTitle>
          <DialogDescription>
            You are about to dispatch an off-duty crew. This will be logged as overtime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Crew Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{crew.crew_name}</span>
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                {crew.shiftStatus === 'off_duty' ? 'Off Duty' : 'On Break'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Shift: {formatTime(crew.shift_start)} - {formatTime(crew.shift_end)}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Dispatching to: </span>
              <span className="font-medium text-foreground">{eventName}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
            <p className="text-xs text-warning-foreground">
              <strong>Warning:</strong> This crew is currently outside their scheduled shift hours. 
              Dispatching will incur overtime costs and should only be done in emergency situations.
            </p>
          </div>

          {/* Authorization */}
          <div className="space-y-2">
            <Label htmlFor="authorized-by" className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Authorized By <span className="text-destructive">*</span>
            </Label>
            <Input
              id="authorized-by"
              placeholder="Enter supervisor name"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Reason / Notes</Label>
            <Textarea
              id="notes"
              placeholder="Briefly describe the emergency situation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!authorizedBy.trim() || isSubmitting}
          >
            {isSubmitting ? 'Dispatching...' : 'Confirm Emergency Dispatch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
