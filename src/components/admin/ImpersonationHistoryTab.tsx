import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, CalendarIcon, X, Search, Download, Loader2, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { UserDisplayCell } from './UserDisplayCell';
import { downloadCSV } from '@/lib/csvExport';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/use-mobile';

interface ImpersonationSession {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  started_at: string;
  ended_at: string | null;
  reason: string | null;
  created_at: string;
}

export function ImpersonationHistoryTab() {
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { fetchProfiles, getDisplayName } = useUserProfiles();
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType !== 'desktop';

  // Get unique admin users for filter dropdown
  const uniqueAdmins = [...new Set(sessions.map(s => s.admin_user_id))];

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setSessions(data || []);

      // Fetch profiles for all users
      const adminIds = (data || []).map(s => s.admin_user_id);
      const impersonatedIds = (data || []).map(s => s.impersonated_user_id);
      const allIds = [...new Set([...adminIds, ...impersonatedIds])];
      await fetchProfiles(allIds);
    } catch (error) {
      console.error('Failed to fetch impersonation sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const adminInfo = getDisplayName(session.admin_user_id);
    const impersonatedInfo = getDisplayName(session.impersonated_user_id);
    
    // Search filter
    const matchesSearch = searchTerm === '' ||
      adminInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      impersonatedInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adminInfo.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (impersonatedInfo.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (session.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Admin filter
    const matchesAdmin = adminFilter === 'all' || session.admin_user_id === adminFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && !session.ended_at) ||
      (statusFilter === 'ended' && session.ended_at);

    // Date filtering
    const sessionDate = new Date(session.started_at);
    const matchesStartDate = !startDate || isAfter(sessionDate, startOfDay(startDate));
    const matchesEndDate = !endDate || isBefore(sessionDate, endOfDay(endDate));

    return matchesSearch && matchesAdmin && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const handleExport = () => {
    const headers = ['Started At', 'Ended At', 'Duration', 'Admin', 'Impersonated User', 'Reason', 'Status'];
    const rows = [headers];

    filteredSessions.forEach(session => {
      const adminInfo = getDisplayName(session.admin_user_id);
      const impersonatedInfo = getDisplayName(session.impersonated_user_id);
      const duration = session.ended_at 
        ? formatDuration(new Date(session.started_at), new Date(session.ended_at))
        : 'Active';

      rows.push([
        format(new Date(session.started_at), 'MMM d, yyyy h:mm a'),
        session.ended_at ? format(new Date(session.ended_at), 'MMM d, yyyy h:mm a') : '—',
        duration,
        `${adminInfo.name}${adminInfo.company ? ` (${adminInfo.company})` : ''}`,
        `${impersonatedInfo.name}${impersonatedInfo.company ? ` (${impersonatedInfo.company})` : ''}`,
        session.reason || '—',
        session.ended_at ? 'Ended' : 'Active',
      ]);
    });

    downloadCSV(rows, `impersonation-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setAdminFilter('all');
    setStatusFilter('all');
  };

  const formatDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      return `${diffHours}h ${remainingMins}m`;
    }
    return `${diffMins}m`;
  };

  const hasActiveFilters = searchTerm || startDate || endDate || adminFilter !== 'all' || statusFilter !== 'all';

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Impersonation History</CardTitle>
              <CardDescription>Audit log of admin impersonation sessions</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredSessions.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={adminFilter} onValueChange={setAdminFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Admins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Admins</SelectItem>
              {uniqueAdmins.map(adminId => {
                const info = getDisplayName(adminId);
                return (
                  <SelectItem key={adminId} value={adminId}>
                    {info.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>

        {/* Table or Empty State */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No impersonation sessions found</p>
            <p className="text-sm">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Impersonation sessions will appear here'}
            </p>
          </div>
        ) : isMobileOrTablet ? (
          /* Mobile Card View */
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const adminInfo = getDisplayName(session.admin_user_id);
              const impersonatedInfo = getDisplayName(session.impersonated_user_id);
              const isActive = !session.ended_at;
              
              return (
                <div key={session.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? 'Active' : 'Ended'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.started_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Admin</p>
                      <p className="font-medium">{adminInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Impersonated</p>
                      <p className="font-medium">{impersonatedInfo.name}</p>
                    </div>
                  </div>
                  
                  {session.reason && (
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs">Reason</p>
                      <p>{session.reason}</p>
                    </div>
                  )}
                  
                  {session.ended_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Duration: {formatDuration(new Date(session.started_at), new Date(session.ended_at))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Impersonated User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => {
                const adminInfo = getDisplayName(session.admin_user_id);
                const impersonatedInfo = getDisplayName(session.impersonated_user_id);
                const isActive = !session.ended_at;
                
                return (
                  <TableRow key={session.id}>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <p>{format(new Date(session.started_at), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.started_at), 'h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserDisplayCell 
                        userId={session.admin_user_id} 
                        displayName={adminInfo}
                      />
                    </TableCell>
                    <TableCell>
                      <UserDisplayCell 
                        userId={session.impersonated_user_id} 
                        displayName={impersonatedInfo}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {session.reason ? (
                        <span className="text-sm truncate block" title={session.reason}>
                          {session.reason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.started_at))}
                        </span>
                      ) : (
                        formatDuration(new Date(session.started_at), new Date(session.ended_at!))
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? 'Active' : 'Ended'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
