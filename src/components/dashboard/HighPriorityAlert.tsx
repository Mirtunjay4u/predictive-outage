import { AlertCircle, X, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HighPriorityAlertProps {
  count: number;
  onView: () => void;
  onDismiss: () => void;
}

export function HighPriorityAlert({ count, onView, onDismiss }: HighPriorityAlertProps) {
  return (
    <Alert
      variant="destructive"
      className={cn(
        'mb-8 border-2 border-destructive/25 bg-destructive/[0.03]',
        'transition-all duration-200',
        'hover:bg-destructive/[0.05] hover:border-destructive/35',
        'focus-within:ring-2 focus-within:ring-destructive/30 focus-within:ring-offset-2'
      )}
    >
      <div className="flex items-center w-full gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10 shrink-0">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        
        <div
          className="flex-1 cursor-pointer"
          onClick={onView}
          onKeyDown={(e) => e.key === 'Enter' && onView()}
          tabIndex={0}
          role="button"
          aria-label={`View ${count} high priority events`}
        >
          <AlertDescription className="flex items-center gap-2">
            <span className="font-semibold text-destructive">
              {count} high priority event{count > 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">
              require{count === 1 ? 's' : ''} immediate attention
            </span>
          </AlertDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
            onClick={onView}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
