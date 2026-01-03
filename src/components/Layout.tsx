import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Clock, 
  FileSpreadsheet, 
  BookOpen,
  ChevronRight,
  Anvil,
  Scale,
  Wallet,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Equipment', href: '/equipment', icon: Package },
  { name: 'LMN Export', href: '/export', icon: FileSpreadsheet },
  { name: 'Category Lifespans', href: '/categories', icon: Clock },
  { name: 'Buy vs. Rent', href: '/buy-vs-rent', icon: Scale },
  { name: 'Cashflow Analysis', href: '/cashflow', icon: Wallet },
  { name: 'Definitions', href: '/definitions', icon: BookOpen },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Anvil className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">Forge Legacy</h1>
              <p className="text-xs text-sidebar-foreground/60">Equipment Tracker</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70'
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-sidebar-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu & Footer */}
          <div className="border-t border-sidebar-border p-4 space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-auto py-2 px-3 text-left hover:bg-sidebar-accent/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20">
                    <User className="h-4 w-4 text-sidebar-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">
                      {user?.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Profile (coming soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <p className="text-xs text-sidebar-foreground/50">
              Designed for contractors.
              <br />
              No accounting expertise required.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
