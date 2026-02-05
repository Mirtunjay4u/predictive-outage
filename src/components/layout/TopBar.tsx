import { Search, Bell, User, LogOut, FlaskConical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header 
      className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6"
      role="banner"
      aria-label="Application header"
    >
      {/* Search */}
      <search role="search" aria-label="Search scenarios" className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search scenarios..."
          className="pl-10 bg-background/50 transition-shadow focus:shadow-md"
          onChange={(e) => onSearch?.(e.target.value)}
          aria-label="Search scenarios"
        />
      </search>

      {/* Right section */}
      <div className="flex items-center gap-4" role="group" aria-label="User actions">
        {/* Demo Mode Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30">
          <FlaskConical className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-medium text-warning">Demo Mode</span>
        </div>

        {/* Builder Identity */}
        <div className="flex items-center gap-2 pl-3 border-l border-border/50">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              MK
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground leading-tight">Mirtunjay Kumar</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Solution Builder (Demo)</span>
          </div>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-32 truncate">
                {user?.email || 'Demo User'}
              </span>
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
    </header>
  );
}
