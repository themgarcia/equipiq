import { useState } from 'react';
import { Copy, Send, Pencil, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InsuredEquipment, InsuranceSettings } from '@/types/insurance';
import { generateFullRegisterTemplate } from '@/lib/insuranceTemplates';

interface InsuredRegisterTabProps {
  equipment: InsuredEquipment[];
  settings: InsuranceSettings | null;
  userProfile: { fullName: string; companyName: string; email: string } | null;
  onUpdateInsurance?: (id: string, declaredValue: number, notes: string) => Promise<void>;
  onRemoveFromInsurance?: (id: string) => Promise<void>;
}

export function InsuredRegisterTab({ 
  equipment, 
  settings, 
  userProfile,
  onUpdateInsurance,
  onRemoveFromInsurance,
}: InsuredRegisterTabProps) {
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<InsuredEquipment | null>(null);
  const [editDeclaredValue, setEditDeclaredValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalValue = equipment.reduce((sum, e) => sum + e.declaredValue, 0);
  const totalPurchasePrice = equipment.reduce((sum, e) => sum + e.purchasePrice, 0);

  const handleRowClick = (item: InsuredEquipment) => {
    setSelectedEquipment(item);
    setEditDeclaredValue(item.declaredValue.toString());
    setEditNotes(item.insuranceNotes || '');
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedEquipment || !onUpdateInsurance) return;

    const declaredValue = parseFloat(editDeclaredValue);
    if (isNaN(declaredValue) || declaredValue < 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid declared value.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateInsurance(selectedEquipment.id, declaredValue, editNotes);
      setEditModalOpen(false);
      setSelectedEquipment(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedEquipment || !onRemoveFromInsurance) return;

    if (!confirm(`Are you sure you want to remove "${selectedEquipment.name}" from your insured equipment list?`)) {
      return;
    }

    setIsSaving(true);
    try {
      await onRemoveFromInsurance(selectedEquipment.id);
      setEditModalOpen(false);
      setSelectedEquipment(null);
    } finally {
      setIsSaving(false);
    }
  };

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
            <CardTitle>Insured Equipment List</CardTitle>
            <CardDescription>
              {equipment.length} items • ${Math.ceil(totalPurchasePrice).toLocaleString()} total purchase price • ${Math.ceil(totalValue).toLocaleString()} total declared value
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyRegister} disabled={equipment.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Full List
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
                      Send to Broker
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Declared Value</TableHead>
                  <TableHead>Financing</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="font-mono text-sm">{item.serialVin || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${Math.ceil(item.purchasePrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Math.ceil(item.declaredValue).toLocaleString()}
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

      {/* Edit Insurance Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-4 sm:mx-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedEquipment?.name}</DialogTitle>
            <DialogDescription>
              {selectedEquipment?.category} • {selectedEquipment?.serialVin || 'No serial/VIN'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Purchase Price</Label>
                <p className="font-medium font-mono-nums">
                  ${Math.ceil(selectedEquipment?.purchasePrice || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Financing Type</Label>
                <div className="mt-1">
                  {selectedEquipment && formatFinancing(selectedEquipment.financingType)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="declaredValue">Declared Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="declaredValue"
                  type="number"
                  min="0"
                  step="1"
                  value={editDeclaredValue}
                  onChange={(e) => setEditDeclaredValue(e.target.value)}
                  className="pl-7 font-mono-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Insurance Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes for your broker..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isSaving || !onRemoveFromInsurance}
              className="w-full sm:w-auto sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from Insurance
            </Button>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !onUpdateInsurance}>
              <Pencil className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
