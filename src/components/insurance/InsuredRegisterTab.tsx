import { useState } from 'react';
import { Copy, Send, Pencil, Trash2, ChevronRight } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InsuredEquipment, InsuranceSettings } from '@/types/insurance';
import { generateFullRegisterTemplate } from '@/lib/insuranceTemplates';
import { useDeviceType } from '@/hooks/use-mobile';

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
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  
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

  // Shared edit form content
  const EditFormContent = () => (
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
  );

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-3">
      {equipment.map((item) => (
        <div
          key={item.id}
          onClick={() => handleRowClick(item)}
          className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-muted-foreground truncate">{item.category}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Declared: </span>
              <span className="font-medium font-mono-nums">
                ${Math.ceil(item.declaredValue).toLocaleString()}
              </span>
            </div>
            {formatFinancing(item.financingType)}
          </div>
          {item.insuranceNotes && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
              {item.insuranceNotes}
            </p>
          )}
        </div>
      ))}
      
      {/* Summary footer */}
      <div className="pt-4 border-t mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Purchase Price:</span>
          <span className="font-medium font-mono-nums">${Math.ceil(totalPurchasePrice).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-muted-foreground">Total Declared Value:</span>
          <span className="font-bold font-mono-nums">${Math.ceil(totalValue).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // Desktop table view
  const DesktopTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipment</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="hidden lg:table-cell">Serial/VIN</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Declared Value</TableHead>
            <TableHead>Financing</TableHead>
            <TableHead className="hidden xl:table-cell">Notes</TableHead>
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
              <TableCell className="hidden lg:table-cell font-mono text-sm">{item.serialVin || '—'}</TableCell>
              <TableCell className="text-right text-muted-foreground font-mono-nums">
                ${Math.ceil(item.purchasePrice).toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium font-mono-nums">
                ${Math.ceil(item.declaredValue).toLocaleString()}
              </TableCell>
              <TableCell>{formatFinancing(item.financingType)}</TableCell>
              <TableCell className="hidden xl:table-cell max-w-[200px] truncate text-muted-foreground">
                {item.insuranceNotes || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="overflow-hidden min-w-0 w-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Insured Equipment List</CardTitle>
            <CardDescription className="hidden sm:block">
              {equipment.length} items • ${Math.ceil(totalPurchasePrice).toLocaleString()} total purchase price • ${Math.ceil(totalValue).toLocaleString()} total declared value
            </CardDescription>
            <CardDescription className="sm:hidden">
              {equipment.length} items • ${Math.ceil(totalValue).toLocaleString()} declared
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyRegister} disabled={equipment.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Copy Full List</span>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No insured equipment yet.</p>
            <p className="text-sm mt-1">Review your unreviewed assets to add equipment to your insured list.</p>
          </div>
        ) : isPhone ? (
          <MobileCardView />
        ) : (
          <DesktopTableView />
        )}
      </CardContent>

      {/* Mobile: Use Sheet for editing */}
      {isPhone ? (
        <Sheet open={editModalOpen} onOpenChange={setEditModalOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[85vh]">
            <SheetHeader>
              <SheetTitle>{selectedEquipment?.name}</SheetTitle>
              <SheetDescription>
                {selectedEquipment?.category} • {selectedEquipment?.serialVin || 'No serial/VIN'}
              </SheetDescription>
            </SheetHeader>
            <EditFormContent />
            <SheetFooter className="flex-col gap-2">
              <Button onClick={handleSave} disabled={isSaving || !onUpdateInsurance} className="w-full">
                <Pencil className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSaving} className="w-full">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isSaving || !onRemoveFromInsurance}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Insurance
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Use Dialog for editing */
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>{selectedEquipment?.name}</DialogTitle>
              <DialogDescription>
                {selectedEquipment?.category} • {selectedEquipment?.serialVin || 'No serial/VIN'}
              </DialogDescription>
            </DialogHeader>
            <EditFormContent />
            <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-col-reverse sm:space-x-0 sm:justify-start">
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isSaving || !onRemoveFromInsurance}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Insurance
              </Button>
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSaving} className="w-full">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !onUpdateInsurance} className="w-full">
                <Pencil className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
