import { 
  CloudRain, 
  Droplets, 
  CloudSun, 
  Thermometer, 
  Flame, 
  Zap, 
  Snowflake, 
  Wind, 
  Wrench, 
  TreeDeciduous, 
  HelpCircle,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutageType } from '@/types/scenario';

const outageConfig: Record<OutageType, { icon: LucideIcon; className: string }> = {
  'Storm': { 
    icon: CloudRain, 
    className: 'bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400' 
  },
  'Flood': { 
    icon: Droplets, 
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400' 
  },
  'Heavy Rain': { 
    icon: CloudSun, 
    className: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400' 
  },
  'Heatwave': { 
    icon: Thermometer, 
    className: 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400' 
  },
  'Wildfire': { 
    icon: Flame, 
    className: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400' 
  },
  'Lightning': { 
    icon: Zap, 
    className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30 dark:text-yellow-400' 
  },
  'Snow Storm': { 
    icon: Snowflake, 
    className: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-400' 
  },
  'High Wind': { 
    icon: Wind, 
    className: 'bg-teal-500/15 text-teal-600 border-teal-500/30 dark:text-teal-400' 
  },
  'Equipment Failure': { 
    icon: Wrench, 
    className: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30 dark:text-zinc-400' 
  },
  'Vegetation': { 
    icon: TreeDeciduous, 
    className: 'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400' 
  },
  'Others': { 
    icon: HelpCircle, 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

interface OutageTypeBadgeProps {
  type: OutageType | null | undefined;
  className?: string;
}

export function OutageTypeBadge({ type, className }: OutageTypeBadgeProps) {
  const outageType = type || 'Others';
  const config = outageConfig[outageType] || outageConfig['Others'];
  const Icon = config.icon;

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {outageType}
    </span>
  );
}
