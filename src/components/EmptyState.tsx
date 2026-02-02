import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/60 border border-border/50 flex items-center justify-center mb-6 shadow-card">
        <Icon className="w-9 h-9 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
