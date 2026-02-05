import { useMemo } from 'react';
import { Eye, AlertTriangle, Cable, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Scenario, ScenarioWithIntelligence } from '@/types/scenario';

interface CommandSummaryProps {
  scenarios: (Scenario | ScenarioWithIntelligence)[];
  onHighPriorityClick: () => void;
  onTopFeederClick: (feederId: string) => void;
  isHighPriorityActive: boolean;
}

export function CommandSummary({
  scenarios,
  onHighPriorityClick,
  onTopFeederClick,
  isHighPriorityActive,
}: CommandSummaryProps) {
  // Calculate summary metrics
  const metrics = useMemo(() => {
    const visibleCount = scenarios.length;
    const highPriorityCount = scenarios.filter(s => s.priority === 'high').length;
    const totalCustomers = scenarios.reduce((sum, s) => sum + (s.customers_impacted || 0), 0);
    
    // Calculate top impact feeder
    const feederImpact = scenarios.reduce((acc, scenario) => {
      if (scenario.feeder_id && scenario.customers_impacted) {
        const key = scenario.feeder_id;
        if (!acc[key]) {
          acc[key] = { feederId: key, total: 0 };
        }
        acc[key].total += scenario.customers_impacted;
      }
      return acc;
    }, {} as Record<string, { feederId: string; total: number }>);
    
    const topFeeder = Object.values(feederImpact).sort((a, b) => b.total - a.total)[0] || null;
    
    return {
      visibleCount,
      highPriorityCount,
      totalCustomers,
      topFeeder,
    };
  }, [scenarios]);

  return (
    <div className="flex items-stretch gap-2 flex-wrap">
      {/* Visible Events Card */}
      <KPICard
        icon={<Eye className="w-4 h-4" />}
        label="Visible Events"
        value={metrics.visibleCount}
      />

      {/* High Priority Card */}
      <KPICard
        icon={<AlertTriangle className="w-4 h-4" />}
        label="High Priority"
        value={metrics.highPriorityCount}
        onClick={onHighPriorityClick}
        isActive={isHighPriorityActive}
        variant={metrics.highPriorityCount > 0 ? 'danger' : 'default'}
      />

      {/* Total Customers Impacted */}
      <KPICard
        icon={<Users className="w-4 h-4" />}
        label="Customers Impacted"
        value={metrics.totalCustomers.toLocaleString()}
      />

      {/* Top Impact Feeder Card */}
      <KPICard
        icon={<Cable className="w-4 h-4" />}
        label="Top Impact Feeder"
        value={metrics.topFeeder?.feederId || '—'}
        subValue={metrics.topFeeder ? `${metrics.topFeeder.total.toLocaleString()} customers` : undefined}
        onClick={metrics.topFeeder ? () => onTopFeederClick(metrics.topFeeder!.feederId) : undefined}
        variant="primary"
      />

      {/* Demo indicator */}
      <div className="flex items-center pl-2 ml-auto">
        <span className="text-[10px] text-muted-foreground/60 italic">Demo data</span>
      </div>
    </div>
  );
}

// ===== KPI Card Component =====

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: 'default' | 'danger' | 'primary';
}

function KPICard({ icon, label, value, subValue, onClick, isActive, variant = 'default' }: KPICardProps) {
  const isClickable = !!onClick;
  
  const baseClasses = cn(
    "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all min-w-[130px]",
    isClickable && "cursor-pointer",
    isActive && variant === 'danger' && "border-destructive/50 bg-destructive/10",
    isActive && variant === 'primary' && "border-primary/50 bg-primary/10",
    !isActive && "border-border/50 bg-card/80 backdrop-blur-sm",
    isClickable && !isActive && variant === 'danger' && "hover:border-destructive/40 hover:bg-destructive/5",
    isClickable && !isActive && variant === 'primary' && "hover:border-primary/40 hover:bg-primary/5",
    isClickable && !isActive && variant === 'default' && "hover:border-border hover:bg-muted/50"
  );

  const Wrapper = isClickable ? 'button' : 'div';

  return (
    <Wrapper className={baseClasses} onClick={onClick}>
      <div className={cn(
        "flex-shrink-0",
        variant === 'danger' && "text-destructive",
        variant === 'primary' && "text-primary",
        variant === 'default' && "text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="text-left min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className={cn(
          "text-sm font-bold leading-tight truncate",
          variant === 'danger' && (typeof value === 'number' && value > 0) && "text-destructive",
          variant === 'primary' && "text-primary",
          variant === 'default' && "text-foreground"
        )}>
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{subValue}</p>
        )}
      </div>
    </Wrapper>
  );
}
