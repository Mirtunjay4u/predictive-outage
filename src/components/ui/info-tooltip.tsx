import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  text: string;
  className?: string;
  iconSize?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({ text, className, iconSize = 13, side = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors cursor-help',
            className,
          )}
          aria-label="More information"
        >
          <Info style={{ width: iconSize, height: iconSize }} strokeWidth={1.75} />
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 text-[11px] leading-relaxed font-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
