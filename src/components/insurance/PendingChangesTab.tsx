import { useState } from 'react';
import { Copy, Send, Check, CheckCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { InsuranceChangeLog, InsuranceSettings } from '@/types/insurance';
import { generateChangeSummaryTemplate } from '@/lib/insuranceTemplates';
import { format } from 'date-fns';
import { useDeviceType } from '@/hooks/use-mobile';

interface PendingChangesTabProps {
  changes: InsuranceChangeLog[];
  allChanges: InsuranceChangeLog[];
  settings: InsuranceSettings | null;
  userProfile: { fullName: string; companyName: string; email: string } | null;
  onUpdateStatus: (changeId: string, status: 'sent' | 'confirmed') => Promise<void>;
  onMarkAllAsSent: () => Promise<void>;
}

export function PendingChangesTab({
  changes,
  allChanges,
  settings,
  userProfile,
  onUpdateStatus,
  onMarkAllAsSent,
}: PendingChangesTabProps) {
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [markAsSentDialogOpen, setMarkAsSentDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<InsuranceChangeLog | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const displayChanges = activeTab === 'pending' ? changes : allChanges;

  const handleCopySummary = () => {
    const template = generateChangeSummaryTemplate(changes, {
      userName: userProfile?.fullName || 'User',
      companyName: userProfile?.companyName || 'Company',
      userEmail: userProfile?.email || '',
      brokerName: settings?.brokerName || '',
    });

    navigator.clipboard.writeText(template);
    toast({
      title: "Copied to clipboard",
      description: "Change summary is ready to paste into your email.",
    });
    
    // Show the mark as sent dialog after copying
    if (changes.length > 0) {
      setMarkAsSentDialogOpen(true);
    }
  };

  const handleMarkAsSent = async () => {
    await onMarkAllAsSent();
    setMarkAsSentDialogOpen(false);
  };

  const handleOpenDetail = (change: InsuranceChangeLog) => {
    setSelectedChange(change);
    setDetailSheetOpen(true);
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Added</Badge>;
      case 'removed':
        return <Badge variant="destructive">Removed</Badge>;
      case 'value_changed':
        return <Badge variant="secondary">Value Changed</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning/50">Pending</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'confirmed':
        return <Badge className="bg-success/10 text-success">Confirmed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatReason = (reason: string) => {
    const reasonMap: Record<string, string> = {
      sold: 'Sold',
      retired: 'Retired',
      lost: 'Lost/Stolen',
      traded: 'Traded In',
      new_equipment: 'New Acquisition',
      manual: 'Manual',
    };
    return reasonMap[reason] || reason;
  };

  const formatChangeValue = (change: InsuranceChangeLog) => {
    if (change.changeType === 'removed') {
      return `$${Math.ceil(change.previousDeclaredValue || 0).toLocaleString()}`;
    }
    if (change.changeType === 'added') {
      return `$${Math.ceil(change.newDeclaredValue || 0).toLocaleString()}`;
    }
    return `$${Math.ceil(change.previousDeclaredValue || 0).toLocaleString()} → $${Math.ceil(change.newDeclaredValue || 0).toLocaleString()}`;
  };

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-3">
      {displayChanges.map((change) => (
        <div
          key={change.id}
          onClick={() => handleOpenDetail(change)}
          className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{change.equipmentName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(change.effectiveDate), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(change.status)}
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {getChangeTypeBadge(change.changeType)}
            <span className="text-sm font-medium font-mono-nums">
              {formatChangeValue(change)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop table view
  const DesktopTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Change</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {activeTab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayChanges.map((change) => (
            <TableRow key={change.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(change.effectiveDate), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="font-medium">{change.equipmentName}</TableCell>
              <TableCell>{getChangeTypeBadge(change.changeType)}</TableCell>
              <TableCell className="text-right font-medium font-mono-nums">
                {formatChangeValue(change)}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatReason(change.reason)}</TableCell>
              <TableCell>{getStatusBadge(change.status)}</TableCell>
              {activeTab === 'pending' && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Update
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUpdateStatus(change.id, 'sent')}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Sent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(change.id, 'confirmed')}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark as Confirmed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Insurance Changes</CardTitle>
              <CardDescription>
                {changes.length} pending changes require broker communication
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCopySummary} disabled={changes.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Copy Summary</span>
                <span className="sm:hidden">Copy</span>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="secondary" 
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Send to Broker</span>
                        <span className="sm:hidden">Send</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {changes.length > 0 && (
                <Button variant="outline" onClick={onMarkAllAsSent}>
                  <Check className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Mark All Sent</span>
                  <span className="sm:hidden">Mark Sent</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Tab Toggle */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('pending')}
            >
              Pending ({changes.length})
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
            >
              All History ({allChanges.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayChanges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {activeTab === 'pending' ? (
                <>
                  <p>No pending changes.</p>
                  <p className="text-sm mt-1">Changes will appear here when equipment is added or removed from insurance.</p>
                </>
              ) : (
                <p>No change history yet.</p>
              )}
            </div>
          ) : isPhone ? (
            <MobileCardView />
          ) : (
            <DesktopTableView />
          )}
        </CardContent>
      </Card>

      {/* Mobile detail sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>{selectedChange?.equipmentName}</SheetTitle>
            <SheetDescription>
              Change details
            </SheetDescription>
          </SheetHeader>
          {selectedChange && (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(selectedChange.effectiveDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Change Type</span>
                {getChangeTypeBadge(selectedChange.changeType)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-medium font-mono-nums">{formatChangeValue(selectedChange)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reason</span>
                <span className="font-medium">{formatReason(selectedChange.reason)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(selectedChange.status)}
              </div>
            </div>
          )}
          {activeTab === 'pending' && selectedChange && (
            <SheetFooter className="flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  onUpdateStatus(selectedChange.id, 'sent');
                  setDetailSheetOpen(false);
                }}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Sent
              </Button>
              <Button 
                onClick={() => {
                  onUpdateStatus(selectedChange.id, 'confirmed');
                  setDetailSheetOpen(false);
                }}
                className="flex-1"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={markAsSentDialogOpen} onOpenChange={setMarkAsSentDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Changes as Sent?</AlertDialogTitle>
            <AlertDialogDescription>
              You've copied the change summary to your clipboard. Would you like to mark these changes as sent to your broker?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">No, Just Copied</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsSent} className="w-full sm:w-auto">Yes, Mark as Sent</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
