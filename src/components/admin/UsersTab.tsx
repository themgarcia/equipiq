import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  ShieldCheck, 
  CalendarIcon, 
  Download, 
  X, 
  Search, 
  UserCheck 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';
import { supabase } from '@/integrations/supabase/client';
import { 
  getIndustryLabel, 
  getFieldEmployeesLabel, 
  getAnnualRevenueLabel, 
  getRegionLabel,
} from '@/data/signupOptions';
import { useDeviceType } from '@/hooks/use-mobile';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useNavigate } from 'react-router-dom';

export interface UserStats {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  equipmentCount: number;
  totalValue: number;
  companyName: string | null;
  industry: string | null;
  fieldEmployees: string | null;
  annualRevenue: string | null;
  region: string | null;
  betaAccess: boolean;
  betaAccessGrantedAt: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  billingInterval: string | null;
  isPaidSubscription: boolean;
  isAdmin: boolean;
  lastActive?: string | null;
}

interface UsersTabProps {
  userStats: UserStats[];
  setUserStats: React.Dispatch<React.SetStateAction<UserStats[]>>;
  currentUserId: string | null;
  updateUserPlan: (userId: string, newPlan: string) => Promise<void>;
  toggleAdminRole: (userId: string, makeAdmin: boolean) => Promise<void>;
  deleteUser: (userId: string, userName: string) => Promise<void>;
  changingPlan: string | null;
  togglingAdmin: string | null;
  deletingUser: string | null;
  formatCurrency: (value: number) => string;
}

export function UsersTab({
  userStats,
  setUserStats,
  currentUserId,
  updateUserPlan,
  toggleAdminRole,
  deleteUser,
  changingPlan,
  togglingAdmin,
  deletingUser,
  formatCurrency,
}: UsersTabProps) {
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType !== 'desktop';
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // User detail sheet
  const [selectedUserForSheet, setSelectedUserForSheet] = useState<UserStats | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Last active data
  const [lastActiveMap, setLastActiveMap] = useState<Map<string, string>>(new Map());
  const [loadingLastActive, setLoadingLastActive] = useState(false);

  // Fetch last active data
  useEffect(() => {
    const fetchLastActive = async () => {
      setLoadingLastActive(true);
      try {
        const { data, error } = await supabase
          .from('user_activity_log')
          .select('user_id, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by user_id, take first (most recent) entry
        const map = new Map<string, string>();
        data?.forEach(entry => {
          if (!map.has(entry.user_id)) {
            map.set(entry.user_id, entry.created_at);
          }
        });
        setLastActiveMap(map);
      } catch (error) {
        console.error('Failed to fetch last active data:', error);
      } finally {
        setLoadingLastActive(false);
      }
    };

    fetchLastActive();
  }, []);

  // Get unique industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    const industries = new Set<string>();
    userStats.forEach(user => {
      if (user.industry) industries.add(user.industry);
    });
    return Array.from(industries).sort();
  }, [userStats]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return userStats.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        user.fullName.toLowerCase().includes(searchLower) ||
        (user.companyName?.toLowerCase().includes(searchLower) ?? false) ||
        user.email.toLowerCase().includes(searchLower);

      // Plan filter
      const matchesPlan = planFilter === 'all' || user.subscriptionPlan === planFilter;

      // Industry filter
      const matchesIndustry = industryFilter === 'all' || user.industry === industryFilter;

      // Admin filter
      const matchesAdmin = 
        adminFilter === 'all' || 
        (adminFilter === 'admin' && user.isAdmin) ||
        (adminFilter === 'non-admin' && !user.isAdmin);

      // Date range filter
      const joinDate = new Date(user.createdAt);
      const matchesStartDate = !startDate || isAfter(joinDate, startOfDay(startDate));
      const matchesEndDate = !endDate || isBefore(joinDate, endOfDay(endDate));

      return matchesSearch && matchesPlan && matchesIndustry && matchesAdmin && matchesStartDate && matchesEndDate;
    });
  }, [userStats, searchTerm, planFilter, industryFilter, adminFilter, startDate, endDate]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, planFilter, industryFilter, adminFilter, startDate, endDate, pageSize]);

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPlanFilter('all');
    setIndustryFilter('all');
    setAdminFilter('all');
    clearDateFilters();
  };

  const hasActiveFilters = searchTerm || planFilter !== 'all' || industryFilter !== 'all' || adminFilter !== 'all' || startDate || endDate;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Company', 'Name', 'Email', 'Industry', 'Plan', 'Joined', 'Equipment', 'Total Value', 'Admin', 'Last Active'];
    const rows = [headers];
    
    filteredUsers.forEach(user => {
      const lastActive = lastActiveMap.get(user.id);
      rows.push([
        user.companyName || '',
        user.fullName,
        user.email,
        user.industry ? getIndustryLabel(user.industry) : '',
        formatPlanDisplay(user.subscriptionPlan, user.billingInterval),
        format(new Date(user.createdAt), 'yyyy-MM-dd'),
        user.equipmentCount.toString(),
        user.totalValue.toString(),
        user.isAdmin ? 'Yes' : 'No',
        lastActive ? format(new Date(lastActive), 'yyyy-MM-dd HH:mm') : 'Never',
      ]);
    });
    
    downloadCSV(rows, `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const getPlanBadgeVariant = (plan: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (plan) {
      case 'business': return "default";
      case 'beta': return "default";
      case 'professional': return "secondary";
      default: return "outline";
    }
  };

  const formatPlanDisplay = (plan: string, interval: string | null): string => {
    if (plan === 'beta') return 'Beta';
    
    const planName = plan === 'professional' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1);
    
    if (plan === 'free') return 'Free';
    
    const intervalLabel = interval === 'year' ? 'Annual' : interval === 'month' ? 'Monthly' : '';
    return intervalLabel ? `${planName} (${intervalLabel})` : planName;
  };

  const formatLastActive = (userId: string): string => {
    const lastActive = lastActiveMap.get(userId);
    if (!lastActive) return 'Never';
    return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Overview of all platform users and their companies</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredUsers.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Row 1: Search + Plan + Industry */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, company, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {uniqueIndustries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {getIndustryLabel(industry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Dates + Admin Filter + Clear */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                  <SelectItem value="non-admin">Non-Admin</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Row 3: Results count + Pagination controls */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
              <span>
                Showing {paginatedUsers.length} of {filteredUsers.length} users
                {filteredUsers.length !== userStats.length && ` (${userStats.length} total)`}
              </span>
              <div className="flex items-center gap-2">
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>
                  <span className="px-2 text-xs">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Users list */}
          {isMobileOrTablet ? (
            /* Mobile/Tablet Card View */
            <div className="grid grid-cols-1 gap-3">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUserForSheet(user)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.companyName || 'No company'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active {formatLastActive(user.id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPlanBadgeVariant(user.subscriptionPlan)}`}
                    >
                      {formatPlanDisplay(user.subscriptionPlan, user.billingInterval)}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedUserForSheet(user)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p>{user.companyName || 'No company'}</p>
                        <p className="text-xs text-muted-foreground">{user.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.industry ? getIndustryLabel(user.industry) : '—'}</TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {loadingLastActive ? (
                        <span className="text-xs">...</span>
                      ) : (
                        formatLastActive(user.id)
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPlanBadgeVariant(user.subscriptionPlan)}`}
                      >
                        {formatPlanDisplay(user.subscriptionPlan, user.billingInterval)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isPaidSubscription ? (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                          Paid
                        </Badge>
                      ) : user.subscriptionPlan === 'beta' ? (
                        <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                          Beta
                        </Badge>
                      ) : user.subscriptionPlan !== 'free' ? (
                        <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/30">
                          Admin
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isAdmin ? (
                        <ShieldCheck className="h-4 w-4 text-destructive mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users match your filters.</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Sheet */}
      <Sheet open={!!selectedUserForSheet} onOpenChange={(open) => !open && setSelectedUserForSheet(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedUserForSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUserForSheet.companyName || 'No company'}</SheetTitle>
                <SheetDescription>
                  {selectedUserForSheet.fullName}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <span className="text-sm font-medium">
                      {selectedUserForSheet.industry ? getIndustryLabel(selectedUserForSheet.industry) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Employees</span>
                    <span className="text-sm font-medium">
                      {selectedUserForSheet.fieldEmployees ? getFieldEmployeesLabel(selectedUserForSheet.fieldEmployees) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-medium">
                      {selectedUserForSheet.annualRevenue ? getAnnualRevenueLabel(selectedUserForSheet.annualRevenue) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Region</span>
                    <span className="text-sm font-medium">
                      {selectedUserForSheet.region ? getRegionLabel(selectedUserForSheet.region) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedUserForSheet.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Last Active</span>
                    <span className="text-sm font-medium">
                      {formatLastActive(selectedUserForSheet.id)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Equipment</span>
                    <span className="text-sm font-medium">{selectedUserForSheet.equipmentCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedUserForSheet.totalValue)}</span>
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Plan</label>
                  <Select
                    value={selectedUserForSheet.subscriptionPlan}
                    onValueChange={(value) => {
                      updateUserPlan(selectedUserForSheet.id, value);
                      setSelectedUserForSheet({ ...selectedUserForSheet, subscriptionPlan: value });
                    }}
                    disabled={changingPlan === selectedUserForSheet.id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Admin Role</p>
                      <p className="text-xs text-muted-foreground">Grant admin access</p>
                    </div>
                    <Switch 
                      checked={selectedUserForSheet.isAdmin}
                      onCheckedChange={(checked) => {
                        toggleAdminRole(selectedUserForSheet.id, checked);
                        setSelectedUserForSheet({ ...selectedUserForSheet, isAdmin: checked });
                      }}
                      disabled={togglingAdmin === selectedUserForSheet.id || selectedUserForSheet.id === currentUserId}
                    />
                  </div>
                </div>

                {/* Impersonate Button */}
                {selectedUserForSheet.id !== currentUserId && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={impersonating === selectedUserForSheet.id}
                    onClick={async () => {
                      setImpersonating(selectedUserForSheet.id);
                      const success = await startImpersonation(selectedUserForSheet.id);
                      setImpersonating(null);
                      if (success) {
                        setSelectedUserForSheet(null);
                        navigate('/dashboard');
                      }
                    }}
                  >
                    {impersonating === selectedUserForSheet.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    Impersonate User
                  </Button>
                )}

                {/* Delete Button */}
                {!selectedUserForSheet.isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={deletingUser === selectedUserForSheet.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{selectedUserForSheet.fullName}</strong>
                          {selectedUserForSheet.companyName && ` from ${selectedUserForSheet.companyName}`}? 
                          This will permanently remove their account and all associated data 
                          ({selectedUserForSheet.equipmentCount} equipment items).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteUser(selectedUserForSheet.id, selectedUserForSheet.fullName);
                            setSelectedUserForSheet(null);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
