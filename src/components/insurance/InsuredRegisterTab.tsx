import { useState } from 'react';
import { Copy, Send, AlertTriangle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { InsuredEquipment, InsuranceSettings } from '@/types/insurance';
import { generateFullRegisterTemplate } from '@/lib/insuranceTemplates';
import { BrokerEmailModal } from './BrokerEmailModal';

interface InsuredRegisterTabProps {
  equipment: InsuredEquipment[];
  settings: InsuranceSettings | null;
  userProfile: { fullName: string; companyName: string; email: string } | null;
}

export function InsuredRegisterTab({ equipment, settings, userProfile }: InsuredRegisterTabProps) {
  const { toast } = useToast();
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const totalValue = equipment.reduce((sum, e) => sum + e.declaredValue, 0);

  const handleCopyRegister = () => {
    const template = generateFullRegisterTemplate(equipment, {
      userName: userProfile?.fullName || 'User',
      companyName: userProfile?.companyName || 'Company',
      userEmail: userProfile?.email || '',
      brokerName: settings?.brokerName || '',
    });

    navigator.clipboard.writeText(template);
    toast({
      title: "Copied to clipboard",
      description: "Full register template is ready to paste into your email.",
    });
  };

  const formatFinancing = (type: string) => {
    switch (type) {
      case 'financed':
        return <Badge variant="secondary">Financed</Badge>;
      case 'leased':
        return <Badge variant="outline">Leased</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Owned</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Insured Equipment Register</CardTitle>
            <CardDescription>
              {equipment.length} items • ${totalValue.toLocaleString()} total declared value
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyRegister} disabled={equipment.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Full Register
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setEmailModalOpen(true)}
              disabled={equipment.length === 0 || !settings?.brokerEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Broker
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No insured equipment yet.</p>
            <p className="text-sm mt-1">Review your unreviewed assets to add equipment to your insured list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial/VIN</TableHead>
                  <TableHead className="text-right">Declared Value</TableHead>
                  <TableHead>Financing</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="font-mono text-sm">{item.serialVin || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.declaredValue.toLocaleString()}
                    </TableCell>
                    <TableCell>{formatFinancing(item.financingType)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {item.insuranceNotes || '—'}
                    </TableCell>
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
        type="full_register"
        settings={settings}
        equipment={equipment}
        userProfile={userProfile}
      />
    </Card>
  );
}
