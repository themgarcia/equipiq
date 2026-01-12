import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { AlertTriangle, RefreshCw, Search, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ErrorLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
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
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
};

const sourceLabels: Record<string, string> = {
  'parse-equipment-docs': 'Equipment Import',
  'parse-insurance-docs': 'Insurance Import',
  'client': 'Client App',
};

export function ErrorLogTab() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

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
    const matchesSearch = searchTerm === '' || 
      (error.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || error.error_source === sourceFilter;
    const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter;
    const matchesResolved = 
      resolvedFilter === 'all' ||
      (resolvedFilter === 'resolved' && error.resolved) ||
      (resolvedFilter === 'unresolved' && !error.resolved);
    
    return matchesSearch && matchesSource && matchesSeverity && matchesResolved;
  });

  const unresolvedCount = errors.filter(e => !e.resolved).length;

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
  };

  return (
    <>
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
            <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, message, or type..."
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

          {/* Error Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading errors...
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No errors found matching your filters.</p>
            </div>
          ) : (
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
                      <TableCell className="max-w-[150px] truncate text-sm" title={error.user_email || 'Anonymous'}>
                        {error.user_email || 'Anonymous'}
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
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
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
          {selectedError && (
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
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">User:</span>
                    <p className="font-medium">{selectedError.user_email || 'Anonymous'}</p>
                  </div>
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
    </>
  );
}