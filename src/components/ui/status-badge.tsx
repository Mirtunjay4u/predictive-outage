import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm',
  {
    variants: {
      variant: {
        active: 'bg-success/20 text-success border border-success/40 hover:bg-success/30',
        inactive: 'bg-muted/80 text-muted-foreground border border-border/60 hover:bg-muted',
        'pre-event': 'bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30',
        'event': 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30',
        'post-event': 'bg-accent/20 text-accent-foreground border border-accent/40 hover:bg-accent/30',
        high: 'bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30',
        medium: 'bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30',
        low: 'bg-muted/80 text-muted-foreground border border-border/60 hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'inactive',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ variant, children, className, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'active' && 'bg-success',
          variant === 'inactive' && 'bg-muted-foreground',
          variant === 'pre-event' && 'bg-warning',
          variant === 'event' && 'bg-primary',
          variant === 'post-event' && 'bg-accent',
          variant === 'high' && 'bg-destructive',
          variant === 'medium' && 'bg-warning',
          variant === 'low' && 'bg-muted-foreground',
        )} />
      )}
      {children}
    </span>
  );
}
