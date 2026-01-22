import { ReactNode, useState } from 'react';
import { APP_VERSION, APP_STAGE } from '@/lib/version';
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
  ShieldCheck,
  CreditCard,
  History,
  Rocket,
  MessageSquarePlus
} from 'lucide-react';
import { FeedbackButton, FeedbackDialog } from '@/components/FeedbackDialog';
import { OnboardingSidebarLink, OnboardingMobileLink } from '@/components/OnboardingSidebarLink';
import { NotificationBell } from '@/components/NotificationBell';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

import { DemoModeControls } from '@/components/DemoModeControls';
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { GracePeriodBanner } from '@/components/GracePeriodBanner';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { useSubscription } from '@/hooks/useSubscription';
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useDeviceType } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Equipment', href: '/equipment', icon: Package },
      { name: 'Insurance', href: '/insurance', icon: ShieldCheck },
    ]
  },
  {
    label: 'Analysis',
    items: [
      { name: 'Cashflow Analysis', href: '/cashflow', icon: Wallet },
      { name: 'Buy vs. Rent', href: '/buy-vs-rent', icon: Scale },
    ]
  },
  {
    label: 'Tools',
    items: [
      { name: 'FMS Export', href: '/export', icon: FileSpreadsheet },
      { name: 'Category Lifespans', href: '/categories', icon: Clock },
    ]
  },
  {
    label: 'Reference',
    items: [
      { name: 'Definitions', href: '/definitions', icon: BookOpen },
      { name: 'Change Log', href: '/changelog', icon: History },
    ]
  },
];

// Content header with theme toggle and notification bell
function ContentHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-1 border-b bg-background px-4 md:px-6">
      <ThemeToggle variant="icon" />
      <NotificationBell />
    </header>
  );
}

// Flat list for mobile menu
const allNavItems = navigationGroups.flatMap(group => group.items);

function SidebarToggleButton({ className }: { className?: string }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(
        "h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        className
      )}
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Use standard navigation groups (Admin moved to footer)
  const groups = navigationGroups;

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
              <h1 className="text-sm font-semibold text-sidebar-foreground">equipIQ</h1>
            </>
          )}
          <SidebarToggleButton className={!isCollapsed ? "ml-auto" : undefined} />
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("py-2", isCollapsed ? "px-0" : "px-2")}>
        {/* Get Started Link at the top */}
        <SidebarGroup className={cn("py-1", isCollapsed && "px-0")}>
          <SidebarGroupContent>
            <SidebarMenu>
              <OnboardingSidebarLink isCollapsed={isCollapsed} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="my-2" />
        
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={group.label || `group-${groupIndex}`} className={cn("py-1", isCollapsed && "px-0")}>
            {!isCollapsed && group.label && (
              <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 font-medium px-3 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name} className={cn(isCollapsed && "w-full flex justify-center")}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              'transition-all',
                              isCollapsed && 'w-8 justify-center',
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
                              {isCollapsed ? (
                                <span className="sr-only">{item.name}</span>
                              ) : (
                                <span>{item.name}</span>
                              )}
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-sidebar-border", isCollapsed ? "p-0 py-3" : "p-3")}>
        <div className={cn("space-y-3", isCollapsed && "flex flex-col items-center px-0")}>
          {/* Send Feedback Button - at top for all users */}
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => setFeedbackOpen(true)}
                className={cn(
                  'transition-all',
                  isCollapsed && 'w-8 justify-center',
                  'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <MessageSquarePlus className="h-5 w-5 flex-shrink-0 text-sidebar-foreground/50" />
                {isCollapsed ? (
                  <span className="sr-only">Send Feedback</span>
                ) : (
                  <span>Send Feedback</span>
                )}
              </SidebarMenuButton>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Send Feedback
              </TooltipContent>
            )}
          </Tooltip>

          {/* Separator between feedback and admin/user section */}
          <Separator className="my-1 bg-sidebar-border/50" />

          {/* Admin Link - only when admin mode is active */}
          {adminModeActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/admin'}
                  className={cn(
                    'transition-all',
                    location.pathname === '/admin'
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Link to="/admin">
                    <Shield className={cn(
                      'h-5 w-5 flex-shrink-0',
                      location.pathname === '/admin' ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
                    )} />
                    {isCollapsed ? (
                      <span className="sr-only">Admin</span>
                    ) : (
                      <span>Admin</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  Admin
                </TooltipContent>
              )}
            </Tooltip>
          )}
          
          {/* Demo Mode Controls - only show when sidebar is expanded and admin mode is active */}
          {!isCollapsed && adminModeActive && <DemoModeControls />}
          
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
              <DropdownMenuItem asChild>
                <Link to="/settings/billing">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
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

          {/* Version display - only when expanded */}
          {!isCollapsed && (
            <p className="text-xs text-sidebar-foreground/40 text-center mt-2">
              v{APP_VERSION} {APP_STAGE}
            </p>
          )}
        </div>
      </SidebarFooter>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  );
}

function PhoneHeader() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, adminModeActive, toggleAdminMode } = useAdminMode();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Use standard navigation groups (Admin moved to footer)
  const groups = navigationGroups;

  return (
    <header className="sticky top-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <EquipIQIcon size="md" className="h-8 w-8" />
        <span className="text-sm font-semibold text-sidebar-foreground">equipIQ</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle variant="icon" />
        <NotificationBell />
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
              <h1 className="text-sm font-semibold text-sidebar-foreground">equipIQ</h1>
            </div>

            {/* Navigation - Get Started + Grouped */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {/* Get Started Link */}
              <div className="mb-4">
                <OnboardingMobileLink />
              </div>
              
              <div className="border-t border-sidebar-border my-4" />
              
              {groups.map((group, groupIndex) => (
                <div key={group.label || `group-${groupIndex}`} className={cn(groupIndex > 0 && "mt-4")}>
                  {group.label && (
                    <p className="text-xs text-sidebar-foreground/40 font-medium px-3 mb-2">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
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
                  </div>
                </div>
              ))}
            </nav>

            {/* User Menu & Footer */}
            <div className="border-t border-sidebar-border p-4 space-y-4">
              {/* Admin Link - only when admin mode is active */}
              {adminModeActive && (
                <Link
                  to="/admin"
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    location.pathname === '/admin'
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Shield className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    location.pathname === '/admin' ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70'
                  )} />
                  <span className="flex-1">Admin</span>
                </Link>
              )}
              
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
                  <DropdownMenuItem asChild>
                    <Link to="/settings/billing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
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

              {/* Version display */}
              <p className="text-xs text-sidebar-foreground/40 text-center mt-2">
                v{APP_VERSION} {APP_STAGE}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </header>
  );
}

export function Layout({ children }: LayoutProps) {
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  const defaultOpen = deviceType === 'desktop';
  const { subscription, daysLeftInGrace } = useSubscription();

  if (isPhone) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PhoneHeader />
        <ImpersonationBanner />
        <DemoModeBanner />
        {subscription.inGracePeriod && daysLeftInGrace !== null && (
          <GracePeriodBanner daysLeft={daysLeftInGrace} plan={subscription.plan} />
        )}
        <main className="flex-1">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
        <FeedbackButton />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ContentHeader />
          <ImpersonationBanner />
          <DemoModeBanner />
          {subscription.inGracePeriod && daysLeftInGrace !== null && (
            <GracePeriodBanner daysLeft={daysLeftInGrace} plan={subscription.plan} />
          )}
          <main className="flex-1 min-h-0 min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
