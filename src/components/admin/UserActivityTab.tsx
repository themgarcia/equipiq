import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Activity, RefreshCw, Search, FileText, Shield, Upload, Package, CalendarIcon, Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { UserDisplayCell } from './UserDisplayCell';
import { downloadCSV } from '@/lib/csvExport';
import { cn } from '@/lib/utils';

interface ActivityLogEntry {
  id: string;
  user_id: string;
  action_type: string;
  action_details: Record<string, any> | null;
  created_at: string;
}

const actionTypeLabels: Record<string, string> = {
  'equipment_import_success': 'Equipment Import',
  'insurance_import_success': 'Insurance Import',
  'equipment_import_failed': 'Equipment Import Failed',
  'insurance_import_failed': 'Insurance Import Failed',
  'equipment_create': 'Equipment Created',
  'equipment_update': 'Equipment Updated',
  'equipment_delete': 'Equipment Deleted',
  'login': 'Login',
  'signup': 'Sign Up',
};

const actionTypeIcons: Record<string, React.ReactNode> = {
  'equipment_import_success': <Upload className="h-4 w-4 text-green-600" />,
  'insurance_import_success': <Shield className="h-4 w-4 text-blue-600" />,
  'equipment_import_failed': <Upload className="h-4 w-4 text-destructive" />,
  'insurance_import_failed': <Shield className="h-4 w-4 text-destructive" />,
  'equipment_create': <Package className="h-4 w-4 text-primary" />,
  'equipment_update': <Package className="h-4 w-4 text-yellow-600" />,
  'equipment_delete': <Package className="h-4 w-4 text-destructive" />,
};

export function UserActivityTab() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userIdFilter, setUserIdFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { fetchProfiles, getDisplayName } = useUserProfiles();

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const typedData = (data || []).map(item => ({
        ...item,
        action_details: (item.action_details as Record<string, any>) || {},
      }));
      setActivities(typedData);
      
      // Fetch user profiles for all user IDs
      const userIds = typedData.map(a => a.user_id);
      await fetchProfiles(userIds);
    } catch (error) {
      console.error('Failed to fetch user activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const displayInfo = getDisplayName(activity.user_id);
    const matchesSearch = searchTerm === '' || 
      displayInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (displayInfo.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      activity.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(activity.action_details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || activity.action_type === actionFilter;
    const matchesUser = !userIdFilter || activity.user_id === userIdFilter;
    
    // Date filtering
    const activityDate = new Date(activity.created_at);
    const matchesStartDate = !startDate || isAfter(activityDate, startOfDay(startDate));
    const matchesEndDate = !endDate || isBefore(activityDate, endOfDay(endDate));
    
    return matchesSearch && matchesAction && matchesUser && matchesStartDate && matchesEndDate;
  });

  const uniqueActionTypes = [...new Set(activities.map(a => a.action_type))];
  const filteredUserDisplay = userIdFilter ? getDisplayName(userIdFilter) : null;

  const formatActionDetails = (details: Record<string, any>): string => {
    if (!details) return '—';
    
    const parts: string[] = [];
    
    if (details.fileName) parts.push(`File: ${details.fileName}`);
    if (details.equipmentCount !== undefined) parts.push(`${details.equipmentCount} item(s)`);
    if (details.extractedMakes) parts.push(`Makes: ${details.extractedMakes}`);
    if (details.policyNumber) parts.push(`Policy: ${details.policyNumber}`);
    if (details.processingTimeMs) parts.push(`${(details.processingTimeMs / 1000).toFixed(1)}s`);
    
    return parts.length > 0 ? parts.join(' • ') : '—';
  };

  const handleExportCSV = () => {
    const headers = ['Time', 'User Name', 'Company', 'User ID', 'Action', 'Details'];
    const rows = [headers];
    
    filteredActivities.forEach(activity => {
      const displayInfo = getDisplayName(activity.user_id);
      rows.push([
        format(new Date(activity.created_at), 'MMM d, yyyy h:mm a'),
        displayInfo.name,
        displayInfo.company || '',
        activity.user_id,
        actionTypeLabels[activity.action_type] || activity.action_type,
        formatActionDetails(activity.action_details),
      ]);
    });
    
    downloadCSV(rows, `user-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleUserClick = (userId: string) => {
    setUserIdFilter(userId);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Log
              </CardTitle>
              <CardDescription>Track user actions across the platform</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredActivities.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {actionTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date filters row */}
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
              
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear dates
                </Button>
              )}
              
              {userIdFilter && filteredUserDisplay && (
                <Badge variant="secondary" className="gap-1">
                  Filtering: {filteredUserDisplay.name}
                  <button onClick={() => setUserIdFilter(null)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>

          {/* Activity Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading activities...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <UserDisplayCell
                          userId={activity.user_id}
                          displayName={getDisplayName(activity.user_id)}
                          onUserClick={handleUserClick}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actionTypeIcons[activity.action_type] || <FileText className="h-4 w-4" />}
                          <span className="text-sm">
                            {actionTypeLabels[activity.action_type] || activity.action_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground" title={formatActionDetails(activity.action_details)}>
                        {formatActionDetails(activity.action_details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
