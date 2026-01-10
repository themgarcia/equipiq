import { useState } from 'react';
import { Copy, Send, Check, CheckCheck } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { InsuranceChangeLog, InsuranceSettings, InsuredEquipment } from '@/types/insurance';
import { generateChangeSummaryTemplate } from '@/lib/insuranceTemplates';
import { format } from 'date-fns';
import { BrokerEmailModal } from './BrokerEmailModal';

interface PendingChangesTabProps {
  changes: InsuranceChangeLog[];
  allChanges: InsuranceChangeLog[];
  settings: InsuranceSettings | null;
  insuredEquipment: InsuredEquipment[];
  userProfile: { fullName: string; companyName: string; email: string } | null;
  onUpdateStatus: (changeId: string, status: 'sent' | 'confirmed') => Promise<void>;
  onMarkAllAsSent: () => Promise<void>;
}

export function PendingChangesTab({
  changes,
  allChanges,
  settings,
  insuredEquipment,
  userProfile,
  onUpdateStatus,
  onMarkAllAsSent,
}: PendingChangesTabProps) {
  const { toast } = useToast();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

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
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Added</Badge>;
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
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600">Confirmed</Badge>;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Insurance Changes</CardTitle>
            <CardDescription>
              {changes.length} pending changes require broker communication
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopySummary} disabled={changes.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Summary
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setEmailModalOpen(true)}
              disabled={changes.length === 0 || !settings?.brokerEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Broker
            </Button>
            {changes.length > 0 && (
              <Button variant="outline" onClick={onMarkAllAsSent}>
                <Check className="h-4 w-4 mr-2" />
                Mark All Sent
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
        ) : (
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
                    <TableCell className="text-right font-medium">
                      {change.changeType === 'removed' 
                        ? `$${(change.previousDeclaredValue || 0).toLocaleString()}`
                        : change.changeType === 'added'
                        ? `$${(change.newDeclaredValue || 0).toLocaleString()}`
                        : `$${(change.previousDeclaredValue || 0).toLocaleString()} → $${(change.newDeclaredValue || 0).toLocaleString()}`
                      }
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
        )}
      </CardContent>

      <BrokerEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        type="changes"
        settings={settings}
        changes={changes}
        equipment={insuredEquipment}
        userProfile={userProfile}
      />
    </Card>
  );
}
