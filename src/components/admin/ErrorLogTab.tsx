import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle, RefreshCw, Search, CheckCircle, Clock, Loader2, CalendarIcon, Download, X, Copy, Check, ChevronRight } from 'lucide-react';
import { useDeviceType } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { UserDisplayCell } from './UserDisplayCell';
import { downloadCSV } from '@/lib/csvExport';
import { cn } from '@/lib/utils';

interface ErrorLogEntry {
  id: string;
  user_id: string | null;
  error_source: string;
  error_type: string;
  error_message: string;
  error_details: Record<string, any> | null;
  severity: string;
  resolved: boolean;
  admin_notes: string | null;
  created_at: string;
}

const severityColors: Record<string, string> = {
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-info/10 text-info border-info/30',
};

const sourceLabels: Record<string, string> = {
  'parse-equipment-docs': 'Equipment Import',
  'parse-insurance-docs': 'Insurance Import',
  'client': 'Client App',
};

export function ErrorLogTab() {
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [userIdFilter, setUserIdFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { toast } = useToast();
  const { fetchProfiles, getDisplayName } = useUserProfiles();

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      const typedData = (data || []).map(item => ({
        ...item,
        error_details: (item.error_details as Record<string, any>) || {},
      }));
      setErrors(typedData);
      
      // Fetch user profiles for all user IDs
      const userIds = typedData.map(e => e.user_id);
      await fetchProfiles(userIds);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const filteredErrors = errors.filter(error => {
    const displayInfo = getDisplayName(error.user_id);
    const matchesSearch = searchTerm === '' || 
      displayInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (displayInfo.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (error.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || error.error_source === sourceFilter;
    const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter;
    const matchesResolved = 
      resolvedFilter === 'all' ||
      (resolvedFilter === 'resolved' && error.resolved) ||
      (resolvedFilter === 'unresolved' && !error.resolved);
    const matchesUser = !userIdFilter || error.user_id === userIdFilter;
    
    // Date filtering
    const errorDate = new Date(error.created_at);
    const matchesStartDate = !startDate || isAfter(errorDate, startOfDay(startDate));
    const matchesEndDate = !endDate || isBefore(errorDate, endOfDay(endDate));
    
    return matchesSearch && matchesSource && matchesSeverity && matchesResolved && matchesUser && matchesStartDate && matchesEndDate;
  });

  const unresolvedCount = errors.filter(e => !e.resolved).length;
  const filteredUserDisplay = userIdFilter ? getDisplayName(userIdFilter) : null;

  const handleMarkResolved = async (errorId: string, notes: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('error_log')
        .update({ resolved: true, admin_notes: notes || null })
        .eq('id', errorId);

      if (error) throw error;

      setErrors(prev => prev.map(e => 
        e.id === errorId ? { ...e, resolved: true, admin_notes: notes || null } : e
      ));

      setSelectedError(null);
      toast({
        title: 'Error marked as resolved',
        description: 'The error has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async (errorId: string, notes: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('error_log')
        .update({ admin_notes: notes || null })
        .eq('id', errorId);

      if (error) throw error;

      setErrors(prev => prev.map(e => 
        e.id === errorId ? { ...e, admin_notes: notes || null } : e
      ));

      toast({
        title: 'Notes saved',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to save notes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const openErrorDetails = (error: ErrorLogEntry) => {
    setSelectedError(error);
    setAdminNotes(error.admin_notes || '');
    setCopiedUserId(false);
  };

  const handleCopyUserId = async () => {
    if (!selectedError?.user_id) return;
    try {
      await navigator.clipboard.writeText(selectedError.user_id);
      setCopiedUserId(true);
      toast({ title: 'User ID copied' });
      setTimeout(() => setCopiedUserId(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Time', 'User Name', 'Company', 'User ID', 'Source', 'Type', 'Message', 'Severity', 'Resolved', 'Admin Notes'];
    const rows = [headers];
    
    filteredErrors.forEach(error => {
      const displayInfo = getDisplayName(error.user_id);
      rows.push([
        format(new Date(error.created_at), 'MMM d, yyyy h:mm a'),
        displayInfo.name,
        displayInfo.company || '',
        error.user_id || '',
        sourceLabels[error.error_source] || error.error_source,
        error.error_type,
        error.error_message,
        error.severity,
        error.resolved ? 'Yes' : 'No',
        error.admin_notes || '',
      ]);
    });
    
    downloadCSV(rows, `error-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleUserClick = (userId: string) => {
    setUserIdFilter(userId);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const selectedUserDisplay = selectedError ? getDisplayName(selectedError.user_id) : null;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Log
                {unresolvedCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unresolvedCount} unresolved
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Track and diagnose errors from document imports and other operations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredErrors.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, message, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="parse-equipment-docs">Equipment Import</SelectItem>
                  <SelectItem value="parse-insurance-docs">Insurance Import</SelectItem>
                  <SelectItem value="client">Client App</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
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

          {/* Error Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading errors...
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
              <p>No errors found matching your filters.</p>
            </div>
          ) : isPhone ? (
            /* Mobile Card View */
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  onClick={() => openErrorDetails(error)}
                  className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{error.error_message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(error.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {error.resolved ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning" />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${severityColors[error.severity] || ''}`}>
                      {error.severity}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {sourceLabels[error.error_source] || error.error_source}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <UserDisplayCell
                      userId={error.user_id}
                      displayName={getDisplayName(error.user_id)}
                      onUserClick={handleUserClick}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredErrors.map((error) => (
                    <TableRow 
                      key={error.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openErrorDetails(error)}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(error.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <UserDisplayCell
                          userId={error.user_id}
                          displayName={getDisplayName(error.user_id)}
                          onUserClick={handleUserClick}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {sourceLabels[error.error_source] || error.error_source}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-xs">
                        {error.error_type}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm" title={error.error_message}>
                        {error.error_message}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severityColors[error.severity] || ''}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {error.resolved ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Dialog */}
      <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedError && selectedUserDisplay && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Details
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedError.created_at), 'MMMM d, yyyy at h:mm:ss a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* User Info */}
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">User:</span>
                    <span className="font-medium">{selectedUserDisplay.name}</span>
                  </div>
                  {selectedUserDisplay.company && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Company:</span>
                      <span className="text-sm">{selectedUserDisplay.company}</span>
                    </div>
                  )}
                  {selectedError.user_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">User ID:</span>
                      <span className="font-mono text-xs text-muted-foreground break-all flex-1">
                        {selectedError.user_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={handleCopyUserId}
                      >
                        {copiedUserId ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <p className="font-medium">{sourceLabels[selectedError.error_source] || selectedError.error_source}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-mono text-xs">{selectedError.error_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Severity:</span>
                    <Badge variant="outline" className={severityColors[selectedError.severity] || ''}>
                      {selectedError.severity}
                    </Badge>
                  </div>
                </div>

                {/* Error Message */}
                <div>
                  <span className="text-sm text-muted-foreground">Message:</span>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedError.error_message}</p>
                </div>

                {/* Error Details (JSON) */}
                {selectedError.error_details && Object.keys(selectedError.error_details).length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Details:</span>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedError.error_details, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <span className="text-sm text-muted-foreground">Admin Notes:</span>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this error, diagnosis, or fix..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateNotes(selectedError.id, adminNotes)}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Notes
                  </Button>
                  {!selectedError.resolved && (
                    <Button
                      onClick={() => handleMarkResolved(selectedError.id, adminNotes)}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
