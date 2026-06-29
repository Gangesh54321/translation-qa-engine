import { ShieldCheck, Zap, LogOut, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { isWorkspacePath } from '../App';

interface TopNavbarProps {
  user: { name: string; email: string; credits?: number } | null;
  onSignOut?: () => void;
  onNavigateHome?: () => void;
  onNavigateWorkspace?: () => void;
}

export function TopNavbar({ user, onSignOut, onNavigateHome, onNavigateWorkspace }: TopNavbarProps) {
  // Mock a user for the prototype if none is provided
  const displayUser = user || {
    name: 'Demo User',
    email: 'demo@transtech.com',
    credits: 50
  };

  const credits = (displayUser as { name: string; email: string; credits?: number }).credits ?? 50;
  const currentIsWorkspace = isWorkspacePath();

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={onNavigateHome}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
            <span className="font-black text-lg select-none">T</span>
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:inline-block">
            TransTech <span className="text-primary">Hub</span>
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={onNavigateHome}
            className={`transition-colors hover:text-foreground/80 ${!currentIsWorkspace ? 'text-foreground font-bold' : 'text-foreground/60'}`}
          >
            Home
          </button>
          <button
            onClick={onNavigateWorkspace}
            className={`transition-colors hover:text-foreground/80 ${currentIsWorkspace ? 'text-foreground font-bold' : 'text-foreground/60'}`}
          >
            Workspace
          </button>
        </nav>

        {/* Right: User Dashboard */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border border-border/50 bg-background hover:bg-muted/50 p-0 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20"
              >
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {displayUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 p-1">
                  <p className="text-sm font-bold leading-none">{displayUser.name}</p>
                  <p className="text-xs text-muted-foreground leading-none mt-1">
                    {displayUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Credits Section */}
              <div className="px-3 py-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" /> Credits
                  </span>
                  <span className="text-xs font-bold">{credits}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (credits / 100) * 100)}%` }}
                  />
                </div>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer font-medium py-2">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 font-medium py-2"
                onClick={onSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
