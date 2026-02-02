import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        active: 'bg-success/10 text-success border border-success/20',
        inactive: 'bg-muted text-muted-foreground border border-border',
        'pre-event': 'bg-warning/10 text-warning border border-warning/20',
        'event': 'bg-primary/10 text-primary border border-primary/20',
        'post-event': 'bg-accent/10 text-accent border border-accent/20',
        high: 'bg-destructive/10 text-destructive border border-destructive/20',
        medium: 'bg-warning/10 text-warning border border-warning/20',
        low: 'bg-muted text-muted-foreground border border-border',
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
