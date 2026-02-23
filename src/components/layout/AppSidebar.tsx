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
  Sparkles,
  Network,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Library,
  Route,
  Crosshair,
  Swords,
  FileStack,
  Compass,
  Gavel,
  CircleDollarSign, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import tcsLogo from '@/assets/tcs-logo.png';

const navGroups = [
  {
    label: 'Operations',
    accent: 'ops',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: FileText, label: 'Events', path: '/events' },
      { icon: Map, label: 'Outage Map', path: '/outage-map' },
    ],
  },
  {
    label: 'Intelligence',
    accent: 'intel',
    items: [
      { icon: Bot, label: 'Copilot Studio', path: '/copilot-studio' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: CloudLightning, label: 'Weather Alerts', path: '/weather-alerts' },
    ],
  },
  {
    label: 'Insights & Vision',
    accent: 'vision',
    items: [
      { icon: Sparkles, label: 'Art of Possibilities', path: '/art-of-possibilities' },
      { icon: Crosshair, label: 'Use Cases', path: '/use-cases' },
      { icon: ShieldCheck, label: 'Knowledge & Policy', path: '/knowledge-policy' },
      { icon: Library, label: 'Glossary', path: '/glossary' },
    ],
  },
  {
    label: 'Platform',
    accent: 'platform',
    items: [
      { icon: Network, label: 'Architecture', path: '/architecture' },
      { icon: Route, label: 'Solution Roadmap', path: '/solution-roadmap' },
      { icon: Compass, label: 'Market Positioning', path: '/market-positioning' },
      { icon: Gavel, label: 'Regulatory Alignment', path: '/regulatory-alignment' },
      { icon: CircleDollarSign, label: 'Financial Impact', path: '/financial-impact' },
      { icon: ClipboardCheck, label: 'Validation Summary', path: '/executive-validation' },
      { icon: ScrollText, label: 'Operational SOP', path: '/operational-sop' },
      { icon: Swords, label: 'Architecture Review', path: '/architecture-review' },
      { icon: BookOpen, label: 'About', path: '/about' },
      { icon: FileStack, label: 'Resources', path: '/resources' },
      { icon: Library, label: 'Documentation Center', path: '/documentation-center' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

/* ── Accent bar & highlight styles per section using CSS vars ── */
const accentConfig: Record<string, {
  barGradient: string;
  activeBg: string;
  activeText: string;
  activeGlow: string;
  hoverBg: string;
  iconActive: string;
  headerColor: string;
}> = {
  ops: {
    barGradient: 'bg-gradient-to-b from-[hsl(217,91%,65%)] to-[hsl(217,91%,50%)]',
    activeBg: 'bg-[hsl(217,91%,60%,0.08)]',
    activeText: 'text-[hsl(217,91%,75%)]',
    activeGlow: 'shadow-[0_0_8px_hsl(217,91%,60%,0.12)]',
    hoverBg: 'hover:bg-[hsl(217,91%,60%,0.05)]',
    iconActive: 'text-[hsl(217,91%,72%)]',
    headerColor: 'text-[hsl(217,80%,65%)]',
  },
  intel: {
    barGradient: 'bg-gradient-to-b from-[hsl(173,80%,45%)] to-[hsl(173,80%,35%)]',
    activeBg: 'bg-[hsl(173,80%,40%,0.08)]',
    activeText: 'text-[hsl(173,70%,65%)]',
    activeGlow: 'shadow-[0_0_8px_hsl(173,80%,40%,0.12)]',
    hoverBg: 'hover:bg-[hsl(173,80%,40%,0.05)]',
    iconActive: 'text-[hsl(173,70%,60%)]',
    headerColor: 'text-[hsl(173,65%,55%)]',
  },
  vision: {
    barGradient: 'bg-gradient-to-b from-[hsl(280,60%,60%)] to-[hsl(280,60%,48%)]',
    activeBg: 'bg-[hsl(280,60%,55%,0.08)]',
    activeText: 'text-[hsl(280,50%,72%)]',
    activeGlow: 'shadow-[0_0_8px_hsl(280,60%,55%,0.12)]',
    hoverBg: 'hover:bg-[hsl(280,60%,55%,0.05)]',
    iconActive: 'text-[hsl(280,50%,68%)]',
    headerColor: 'text-[hsl(280,55%,72%)]',
  },
  platform: {
    barGradient: 'bg-gradient-to-b from-[hsl(215,20%,60%)] to-[hsl(215,20%,48%)]',
    activeBg: 'bg-[hsl(215,20%,55%,0.07)]',
    activeText: 'text-[hsl(215,20%,75%)]',
    activeGlow: 'shadow-[0_0_8px_hsl(215,20%,55%,0.10)]',
    hoverBg: 'hover:bg-[hsl(215,20%,55%,0.04)]',
    iconActive: 'text-[hsl(215,20%,70%)]',
    headerColor: 'text-[hsl(215,30%,72%)]',
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
      {/* ── Brand header ── */}
      <div className="flex min-h-14 items-center border-b border-sidebar-border px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-w-0 flex-col">
              <span className="text-[13px] font-semibold leading-tight text-sidebar-foreground">Operator Copilot</span>
              <span className="mt-0.5 text-[9px] leading-tight text-sidebar-foreground/50">Governed Decision Intelligence</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3" role="navigation" aria-label="Main navigation">
        {navGroups.map((group, gi) => {
          const accent = accentConfig[group.accent];
          return (
            <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
              {/* Section divider */}
              {gi > 0 && <div className="mx-2 mb-2 h-px bg-sidebar-border/50" />}

              {/* Section header */}
              {!collapsed && (
                <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-1">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.16em]',
                    accent.headerColor,
                  )}>
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-sidebar-border/30" />
                </div>
              )}

              {/* Nav items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;

                  const link = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'group/nav relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium outline-none',
                        'transition-all duration-150 ease-out',
                        'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar',
                        isActive
                          ? cn(accent.activeBg, accent.activeText, accent.activeGlow)
                          : cn(
                              'text-sidebar-foreground/55',
                              accent.hoverBg,
                              'hover:text-sidebar-foreground/85',
                            ),
                      )}
                    >
                      {/* 3px vertical gradient accent bar */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-accent-bar"
                          className={cn(
                            'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full',
                            accent.barGradient,
                          )}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}

                      <item.icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors duration-150',
                          isActive ? accent.iconActive : 'text-sidebar-foreground/45 group-hover/nav:text-sidebar-foreground/70',
                        )}
                        strokeWidth={1.75}
                      />

                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
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

      {/* ── Footer ── */}
      <div className="border-t border-sidebar-border p-3 space-y-3">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full border border-amber-500/20 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15 hover:text-amber-200" onClick={() => window.dispatchEvent(new CustomEvent('open-demo-script'))}>
                <HelpCircle className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Demo Script</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-md border border-amber-500/20 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={() => window.dispatchEvent(new CustomEvent('open-demo-script'))}
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            <span className="text-sm font-semibold">Demo Script</span>
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

      {/* ── Collapse toggle ── */}
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
