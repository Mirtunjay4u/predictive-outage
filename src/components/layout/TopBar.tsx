import { Search, Bell, User, LogOut, FlaskConical, ShieldCheck, Brain, Cog, Layers, Database, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import builderPhoto from '@/assets/builder-photo.png';
import tcsLogo from '@/assets/tcs-logo.png';

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const { user, logout } = useAuth();
  const { boardroomMode, setBoardroomMode } = useDashboardUi();

  return (
    <header className="h-14 border-b border-border/50 bg-card/80 px-5 backdrop-blur-sm" role="banner" aria-label="Application header">
      <div className="flex h-full w-full items-center justify-between gap-4">
        <search role="search" aria-label="Search events" className="relative w-full max-w-52 shrink-0">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="h-8 bg-background/50 pl-8 text-xs transition-shadow focus:shadow-md"
            onChange={(e) => onSearch?.(e.target.value)}
            aria-label="Search events"
          />
        </search>

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
