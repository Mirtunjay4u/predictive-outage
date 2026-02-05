import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipDuration?: number;
}

export function FlipCard({ front, back, className, flipDuration = 0.5 }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn('relative cursor-pointer', className)}
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(!isFlipped)}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? 'Flip to front' : 'Flip to back'}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: flipDuration, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {back}
        </div>
      </motion.div>

      {/* Flip Indicator */}
      <div className={cn(
        'absolute top-2 right-2 z-10 p-1.5 rounded-full',
        'bg-muted/80 text-muted-foreground',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        'pointer-events-none'
      )}>
        <RotateCcw className="w-3 h-3" />
      </div>
    </div>
  );
}

// Preset card styles for front/back consistency
export function FlipCardFront({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('h-full w-full', className)}>
      {children}
    </div>
  );
}

export function FlipCardBack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('h-full w-full', className)}>
      {children}
    </div>
  );
}
