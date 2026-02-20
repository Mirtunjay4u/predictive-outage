import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  HelpCircle,
  Map,
  CloudLightning,
  Network,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import tcsLogo from '@/assets/tcs-logo.png';

const navGroups = [
  {
    label: 'Operations',
    accent: 'blue',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Events', path: '/events' },
      { icon: Map, label: 'Outage Map', path: '/outage-map' },
    ],
  },
  {
    label: 'Intelligence',
    accent: 'teal',
    items: [
      { icon: Bot, label: 'Copilot Studio', path: '/copilot-studio' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: CloudLightning, label: 'Weather Alerts', path: '/weather-alerts' },
    ],
  },
  {
    label: 'Platform',
    accent: 'slate',
    items: [
      { icon: Network, label: 'Architecture', path: '/architecture' },
      { icon: BookOpen, label: 'About', path: '/about' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

const accentStyles: Record<string, { active: string; border: string; glow: string }> = {
  blue: {
    active: 'bg-blue-500/12 text-blue-300',
    border: 'border-l-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  },
  teal: {
    active: 'bg-teal-500/12 text-teal-300',
    border: 'border-l-teal-400',
    glow: 'shadow-[0_0_12px_rgba(20,184,166,0.15)]',
  },
  slate: {
    active: 'bg-slate-400/10 text-slate-300',
    border: 'border-l-slate-400',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.10)]',
  },
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
      role="complementary"
      aria-label="Application sidebar"
    >
      <div className="flex min-h-14 items-center border-b border-sidebar-border px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-w-0 flex-col">
              <span className="text-[13px] font-semibold leading-tight text-sidebar-foreground">Operator Copilot</span>
              <span className="mt-0.5 text-[9px] leading-tight text-sidebar-foreground/50">Predictive Outage Mgmt</span>
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2.5" role="navigation" aria-label="Main navigation">
        {navGroups.map((group, gi) => {
          const styles = accentStyles[group.accent];
          return (
            <div key={group.label}>
              {/* Section separator (not before first group) */}
              {gi > 0 && <div className="mx-2 my-2 h-px bg-sidebar-border/60" />}

              {!collapsed && (
                <div className="flex items-center gap-2 px-2 pt-1 pb-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">{group.label}</span>
                  <div className="h-px flex-1 bg-sidebar-border/40" />
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const link = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'group/nav-item flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium outline-none transition-all duration-200',
                        'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                        isActive
                          ? cn(styles.active, styles.glow, 'border-l-2', styles.border)
                          : 'border-l-2 border-l-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90',
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 flex-shrink-0 transition-colors', isActive && 'drop-shadow-sm')} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.path} delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return link;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-3">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={() => window.dispatchEvent(new CustomEvent('open-demo-script'))}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Demo Script</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={() => window.dispatchEvent(new CustomEvent('open-demo-script'))}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Demo Script</span>
          </Button>
        )}

        <div className={cn("flex items-center", collapsed ? "justify-center" : "px-1")}>
          <div className="tcs-logo-glow group/tcs relative rounded-lg border border-[#76B900]/50 px-3 py-2 transition-all duration-500">
            <img
              src={tcsLogo}
              alt="Tata Consultancy Services (TCS)"
              className="h-5 w-auto brightness-0 invert opacity-85 transition-opacity duration-300 group-hover/tcs:opacity-100"
            />
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </motion.aside>
  );
}
