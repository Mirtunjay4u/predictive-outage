import { Search, Bell, User, LogOut, FlaskConical, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
        <search role="search" aria-label="Search scenarios" className="relative w-full max-w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scenarios..."
            className="bg-background/50 pl-10 transition-shadow focus:shadow-md"
            onChange={(e) => onSearch?.(e.target.value)}
            aria-label="Search scenarios"
          />
        </search>

        <div className="flex items-center gap-3" role="group" aria-label="User actions">
          {/* Phase-1 Demo micro-indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wide">Phase-1 Demo</span>
          </div>

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

          <div className="flex items-center gap-1 rounded-md border border-warning/20 bg-warning/8 px-2 py-1">
            <FlaskConical className="h-3 w-3 text-warning/70" />
            <span className="text-[10px] font-medium text-warning/80">Demo</span>
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
                <span className="max-w-32 truncate text-sm font-medium">{user?.email || 'Demo User'}</span>
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
