import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, User, LogOut, FlaskConical, ShieldCheck, Brain, Cog, Layers, Database, BookOpen, LayoutDashboard, FileText, Map, Bot, BarChart3, CloudLightning, Network, Route, Sparkles, Library, ClipboardCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardUi } from '@/contexts/DashboardUiContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import builderPhoto from '@/assets/builder-photo.png';
import tcsLogo from '@/assets/tcs-logo.png';

const pageResults = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'Pages' },
  { label: 'Events', path: '/events', icon: FileText, section: 'Pages' },
  { label: 'Outage Map', path: '/outage-map', icon: Map, section: 'Pages' },
  { label: 'Copilot Studio', path: '/copilot-studio', icon: Bot, section: 'Pages' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, section: 'Pages' },
  { label: 'Weather Alerts', path: '/weather-alerts', icon: CloudLightning, section: 'Pages' },
  { label: 'Architecture', path: '/architecture', icon: Network, section: 'Pages' },
  { label: 'Solution Roadmap', path: '/solution-roadmap', icon: Route, section: 'Pages' },
  { label: 'Art of Possibilities', path: '/art-of-possibilities', icon: Sparkles, section: 'Pages' },
  { label: 'Knowledge & Policy', path: '/knowledge-policy', icon: ShieldCheck, section: 'Pages' },
  { label: 'Glossary', path: '/glossary', icon: Library, section: 'Pages' },
  { label: 'Validation Summary', path: '/executive-validation', icon: ClipboardCheck, section: 'Pages' },
];

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const { user, logout } = useAuth();
  const { boardroomMode, setBoardroomMode } = useDashboardUi();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [eventResults, setEventResults] = useState<Array<{ id: string; name: string; location_name: string | null; priority: string | null }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter pages
  const filteredPages = query.length > 0
    ? pageResults.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Search events from DB
  useEffect(() => {
    if (query.length < 2) { setEventResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('scenarios')
        .select('id, name, location_name, priority')
        .ilike('name', `%${query}%`)
        .limit(6);
      setEventResults(data || []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const allResults = [
    ...filteredPages.map(p => ({ type: 'page' as const, ...p })),
    ...eventResults.map(e => ({ type: 'event' as const, label: e.name, path: `/events/${e.id}`, icon: FileText, section: 'Events', meta: e.location_name, priority: e.priority })),
  ];

  useEffect(() => { setActiveIndex(0); }, [allResults.length]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && allResults[activeIndex]) { e.preventDefault(); handleSelect(allResults[activeIndex].path); }
    else if (e.key === 'Escape') { setQuery(''); setOpen(false); inputRef.current?.blur(); }
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 border-b border-border/50 bg-card/80 px-5 backdrop-blur-sm" role="banner" aria-label="Application header">
      <div className="flex h-full w-full items-center justify-between gap-4">
        <div ref={containerRef} className="relative w-full max-w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search events, pages…"
            className="h-8 bg-background/50 pl-8 text-xs transition-shadow focus:shadow-md"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); onSearch?.(e.target.value); }}
            onFocus={() => query.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            aria-label="Global search"
          />
          {open && allResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-xl z-50">
              {/* Pages section */}
              {filteredPages.length > 0 && (
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2">Pages</span>
                </div>
              )}
              {allResults.map((item, idx) => {
                const showEventHeader = item.type === 'event' && (idx === 0 || allResults[idx - 1].type !== 'event');
                const Icon = item.icon;
                return (
                  <div key={item.path + idx}>
                    {showEventHeader && (
                      <div className="px-2 pt-2 pb-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2">Events</span>
                      </div>
                    )}
                    <button
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors rounded-md mx-1',
                        idx === activeIndex ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted/50'
                      )}
                      style={{ width: 'calc(100% - 8px)' }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(item.path)}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{item.label}</span>
                      {'meta' in item && item.meta && (
                        <span className="ml-auto text-[10px] text-muted-foreground/60 truncate max-w-20">{item.meta}</span>
                      )}
                    </button>
                  </div>
                );
              })}
              {query.length >= 2 && eventResults.length === 0 && filteredPages.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="User actions">
          {/* ── System Status Strip ── */}
          <div className="hidden md:flex items-center gap-1 shrink-0" role="status" aria-label="System status indicators">
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 rounded-full border border-[hsl(80,100%,36%)]/35 bg-[hsl(80,100%,36%)]/10 px-2 py-0.5 cursor-default whitespace-nowrap">
                  <Brain className="h-3.5 w-3.5 shrink-0 text-[hsl(80,100%,36%)]" strokeWidth={2} />
                  <span className="text-[9px] font-semibold text-[hsl(80,100%,36%)] hidden xl:inline">Nemotron</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-52 text-xs">Primary inference model currently active.</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/10 px-2 py-0.5 cursor-default whitespace-nowrap">
                  <Cog className="h-3.5 w-3.5 shrink-0 text-teal-400" strokeWidth={2} />
                  <span className="text-[9px] font-semibold text-teal-300 hidden xl:inline">Rules</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-52 text-xs">Deterministic operational constraints enforced before AI response.</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 cursor-default whitespace-nowrap">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span className="text-[9px] font-semibold text-muted-foreground hidden xl:inline">Phase 1</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-52 text-xs">Phase 1 – Advisory decision-support only.</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 cursor-default whitespace-nowrap">
                  <Database className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2} />
                  <span className="text-[9px] font-semibold text-amber-300 hidden xl:inline">Data: Demo (Synthetic)</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 text-xs">Data Mode: Demo — Synthetic structured events. No live SCADA or OMS integration.</TooltipContent>
            </Tooltip>
            <span className="hidden xl:inline text-[9px] text-muted-foreground/70 font-semibold tracking-wide ml-1">Governed AI · Advisory-Only · Operator Validation Required</span>
          </div>

          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Link to="/glossary" className="flex items-center justify-center h-7 w-7 rounded-md border border-border/40 bg-muted/20 text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground transition-colors" aria-label="Glossary">
                <BookOpen className="h-3.5 w-3.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Glossary</TooltipContent>
          </Tooltip>

          <div className="hidden md:block h-5 w-px bg-border/40" />

          {/* Advisory Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500/70" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">ADVISORY MODE</span>
              <span className="text-[8px] text-emerald-600/60 dark:text-emerald-400/50">No Autonomous Control</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[10px] font-medium text-muted-foreground">Boardroom</span>
            <Switch checked={boardroomMode} onCheckedChange={setBoardroomMode} aria-label="Toggle boardroom mode" className="scale-90" />
            {boardroomMode && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">ON</span>}
          </div>

          <div className="flex items-center gap-2 border-l border-border/50 pl-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={builderPhoto} alt="Mirtunjay Kumar" className="object-cover" />
              <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">MK</AvatarFallback>
            </Avatar>
          </div>

          <Button variant="ghost" size="icon" className="relative h-8 w-8 transition-colors hover:bg-muted" aria-label="Open notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">3</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {user?.email?.charAt(0).toUpperCase() || 'D'}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate text-xs font-medium hidden lg:inline">{user?.email || 'Demo User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex shrink-0 items-center border-l border-border/50 pl-3">
            <div className="tcs-logo-glow group/tcs relative rounded-lg border border-[#76B900]/50 px-3 py-2 transition-all duration-500">
              <img
                src={tcsLogo}
                alt="Tata Consultancy Services (TCS)"
                className="h-5 w-auto brightness-0 invert opacity-85 transition-opacity duration-300 group-hover/tcs:opacity-100"
              />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
