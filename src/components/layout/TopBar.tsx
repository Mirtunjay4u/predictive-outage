import { Search, Bell, User, LogOut, FlaskConical } from 'lucide-react';
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


interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const { user, logout } = useAuth();
  const { boardroomMode, setBoardroomMode } = useDashboardUi();

  return (
    <header className="h-16 border-b border-border bg-card/50 px-6 backdrop-blur-sm" role="banner" aria-label="Application header">
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

        <div className="flex items-center gap-4" role="group" aria-label="User actions">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-2.5 py-1">
            <span className="text-[11px] font-medium text-muted-foreground">Boardroom</span>
            <Switch checked={boardroomMode} onCheckedChange={setBoardroomMode} aria-label="Toggle boardroom mode" />
            {boardroomMode && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">ON</span>}
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/15 px-2.5 py-1">
            <FlaskConical className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-warning">Demo Mode</span>
          </div>

          <div className="flex items-center gap-2 border-l border-border/50 pl-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={builderPhoto} alt="Mirtunjay Kumar" className="object-cover" />
              <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">MK</AvatarFallback>
            </Avatar>
          </div>

          <Button variant="ghost" size="icon" className="relative transition-colors hover:bg-primary/10" aria-label="Open notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">3</span>
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
        </div>

      </div>
    </header>
  );
}
