import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  History, 
  Loader2, 
  CalendarIcon, 
  Download, 
  X, 
  Search, 
  RefreshCw 
} from 'lucide-react';
import { UserDisplayCell } from '@/components/admin/UserDisplayCell';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { downloadCSV } from '@/lib/csvExport';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface ActivityLogEntry {
  id: string;
  action_type: string;
  target_user_id: string;
  target_user_email: string;
  performed_by_user_id: string;
  performed_by_email: string;
  details: unknown;
  created_at: string;
}

interface AdminActivityTabProps {
  activityLog: ActivityLogEntry[];
  loadingActivityLog: boolean;
  fetchActivityLog: () => Promise<void>;
}

const formatActionType = (action: string): string => {
  const labels: Record<string, string> = {
    'admin_granted': 'Admin Granted',
    'admin_revoked': 'Admin Revoked',
    'plan_changed': 'Plan Changed',
    'beta_toggled': 'Beta Toggled',
    'user_deleted': 'User Deleted',
    'feedback_status_changed': 'Feedback Updated',
    'admin_reply_sent': 'Reply Sent',
    'impersonation_started': 'Impersonation Started',
  };
  return labels[action] || action;
};

const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'admin_granted': 'default',
    'admin_revoked': 'destructive',
    'user_deleted': 'destructive',
    'plan_changed': 'secondary',
    'beta_toggled': 'outline',
    'feedback_status_changed': 'secondary',
    'admin_reply_sent': 'outline',
    'impersonation_started': 'secondary',
  };
  return variants[action] || 'outline';
};

const formatDetails = (details: unknown): string => {
  if (!details || typeof details !== 'object') return '—';
  
  const d = details as Record<string, unknown>;

  if (d.old_plan && d.new_plan) {
    return `${d.old_plan} → ${d.new_plan}`;
  }
  if (d.beta_access !== undefined) {
    return d.beta_access ? 'Enabled' : 'Disabled';
  }
  if (d.new_status) {
    return `→ ${d.new_status}`;
  }
  if (d.reply_preview) {
    return `"${d.reply_preview}"`;
  }
  if (d.deleted_user_name) {
    return String(d.deleted_user_name);
  }
  return '—';
};

export function AdminActivityTab({
  activityLog,
  loadingActivityLog,
  fetchActivityLog,
}: AdminActivityTabProps) {
  const { getDisplayName } = useUserProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter activity log
  const filteredActivityLog = activityLog.filter(entry => {
    const targetDisplayInfo = getDisplayName(entry.target_user_id);
    const performedByDisplayInfo = getDisplayName(entry.performed_by_user_id);
    
    const matchesSearch = searchTerm === '' ||
      targetDisplayInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (targetDisplayInfo.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      performedByDisplayInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.target_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.performed_by_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const entryDate = new Date(entry.created_at);
    const matchesStartDate = !startDate || isAfter(entryDate, startOfDay(startDate));
    const matchesEndDate = !endDate || isBefore(entryDate, endOfDay(endDate));
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const handleExportActivityLog = () => {
    const headers = ['Date & Time', 'Action', 'Target User', 'Target Company', 'Target Email', 'Performed By', 'Performed By Email', 'Details'];
    const rows = [headers];
    
    filteredActivityLog.forEach(entry => {
      const targetDisplay = getDisplayName(entry.target_user_id);
      const performedByDisplay = getDisplayName(entry.performed_by_user_id);
      rows.push([
        format(new Date(entry.created_at), 'MMM d, yyyy h:mm a'),
        formatActionType(entry.action_type),
        targetDisplay.name,
        targetDisplay.company || '',
        entry.target_user_email,
        performedByDisplay.name,
        entry.performed_by_email,
        formatDetails(entry.details),
      ]);
    });
    
    downloadCSV(rows, `admin-activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Admin Activity Log
            </CardTitle>
            <CardDescription>
              Recent administrative actions and audit trail
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportActivityLog} disabled={filteredActivityLog.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchActivityLog} disabled={loadingActivityLog}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingActivityLog ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
          </div>
        </div>

        {loadingActivityLog ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredActivityLog.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity logged yet. Actions will appear here as they are performed.
          </div>
        ) : (
          <TooltipProvider>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivityLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(entry.action_type)}>
                          {formatActionType(entry.action_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserDisplayCell
                          userId={entry.target_user_id}
                          displayName={getDisplayName(entry.target_user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <UserDisplayCell
                          userId={entry.performed_by_user_id}
                          displayName={getDisplayName(entry.performed_by_user_id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {formatDetails(entry.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
