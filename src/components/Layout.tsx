import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Clock, 
  FileSpreadsheet, 
  BookOpen,
  Scale,
  Wallet,
  LogOut,
  User,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDeviceType } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Equipment', href: '/equipment', icon: Package },
  { name: 'FMS Export', href: '/export', icon: FileSpreadsheet },
  { name: 'Cashflow Analysis', href: '/cashflow', icon: Wallet },
  { name: 'Category Lifespans', href: '/categories', icon: Clock },
  { name: 'Buy vs. Rent', href: '/buy-vs-rent', icon: Scale },
  { name: 'Definitions', href: '/definitions', icon: BookOpen },
];

function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
    >
      {isCollapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
}

function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, adminModeActive, toggleAdminMode } = useAdminMode();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Build navigation with admin item if in admin mode
  const navItems = adminModeActive
    ? [...navigation, { name: 'Admin', href: '/admin', icon: Shield }]
    : navigation;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn(
          "flex h-14 items-center px-3",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          {!isCollapsed && (
            <>
              <EquipIQIcon size="lg" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-sidebar-foreground truncate">equipIQ</h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">Equipment intelligence for contractors</p>
              </div>
            </>
          )}
          <SidebarToggleButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'transition-all',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
                        )} />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className={cn("space-y-3", isCollapsed && "flex flex-col items-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2 px-3 text-left hover:bg-sidebar-accent/50",
                  isCollapsed && "w-auto p-2 justify-center"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 flex-shrink-0">
                  <User className="h-4 w-4 text-sidebar-primary" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleAdminMode}>
                    {adminModeActive ? (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                        Exit Admin Mode
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Switch to Admin Mode
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isCollapsed && <ThemeToggle />}

          {!isCollapsed && (
            <p className="text-xs text-sidebar-foreground/50">
              Designed for contractors.
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function PhoneHeader() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, adminModeActive, toggleAdminMode } = useAdminMode();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Build navigation with admin item if in admin mode
  const navItems = adminModeActive
    ? [...navigation, { name: 'Admin', href: '/admin', icon: Shield }]
    : navigation;

  return (
    <header className="sticky top-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <EquipIQIcon size="md" className="h-8 w-8" />
        <span className="text-sm font-semibold text-sidebar-foreground">equipIQ</span>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
              <EquipIQIcon size="lg" />
              <div>
                <h1 className="text-sm font-semibold text-sidebar-foreground">equipIQ</h1>
                <p className="text-xs text-sidebar-foreground/60">Equipment intelligence for contractors</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
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
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={toggleAdminMode}>
                        {adminModeActive ? (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                            Exit Admin Mode
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Switch to Admin Mode
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              <p className="text-xs text-sidebar-foreground/50">
                Designed for contractors.
                <br />
                No accounting expertise required.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function Layout({ children }: LayoutProps) {
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  const defaultOpen = deviceType === 'desktop';

  if (isPhone) {
    return (
      <div className="min-h-screen bg-background">
        <PhoneHeader />
        <main>
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
