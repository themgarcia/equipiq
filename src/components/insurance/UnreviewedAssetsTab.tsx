import { useState } from 'react';
import { ShieldCheck, ShieldX, ChevronRight } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InsuredEquipment } from '@/types/insurance';
import { useDeviceType } from '@/hooks/use-mobile';

interface UnreviewedAssetsTabProps {
  equipment: InsuredEquipment[];
  onMarkAsInsured: (equipmentId: string, declaredValue: number, notes?: string) => Promise<void>;
  onExcludeFromInsurance: (equipmentId: string) => Promise<void>;
}

export function UnreviewedAssetsTab({
  equipment,
  onMarkAsInsured,
  onExcludeFromInsurance,
}: UnreviewedAssetsTabProps) {
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  
  const [insureModalOpen, setInsureModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<InsuredEquipment | null>(null);
  const [declaredValue, setDeclaredValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleOpenInsureModal = (item: InsuredEquipment) => {
    setSelectedEquipment(item);
    setDeclaredValue(item.purchasePrice);
    setNotes('');
    setInsureModalOpen(true);
  };

  const handleConfirmInsure = async () => {
    if (!selectedEquipment) return;
    await onMarkAsInsured(selectedEquipment.id, declaredValue, notes || undefined);
    setInsureModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleMarkAllFinancedAsInsured = async () => {
    const financedItems = equipment.filter(e => e.financingType === 'financed' || e.financingType === 'leased');
    for (const item of financedItems) {
      await onMarkAsInsured(item.id, item.purchasePrice);
    }
  };

  const financedCount = equipment.filter(e => e.financingType === 'financed' || e.financingType === 'leased').length;

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

  // Form content shared between Dialog and Sheet
  const InsureFormContent = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="declaredValue">Declared Value</Label>
        <Input
          id="declaredValue"
          type="number"
          value={declaredValue}
          onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Defaults to purchase price (${Math.ceil(selectedEquipment?.purchasePrice || 0).toLocaleString()})
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Policy reference, coverage notes, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
          className="p-4 border rounded-lg bg-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-muted-foreground truncate">{item.category}</p>
            </div>
            {formatFinancing(item.financingType)}
          </div>
          <div className="mt-2">
            <span className="text-sm text-muted-foreground">Purchase Price: </span>
            <span className="font-medium font-mono-nums">
              ${Math.ceil(item.purchasePrice).toLocaleString()}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleOpenInsureModal(item)}
              className="flex-1"
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Insure
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onExcludeFromInsurance(item.id)}
              className="flex-1"
            >
              <ShieldX className="h-4 w-4 mr-1" />
              Exclude
            </Button>
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
            <TableHead>Equipment</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Financing</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">{item.category}</TableCell>
              <TableCell>{formatFinancing(item.financingType)}</TableCell>
              <TableCell className="text-right font-medium font-mono-nums">
                ${Math.ceil(item.purchasePrice).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleOpenInsureModal(item)}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Insure
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onExcludeFromInsurance(item.id)}
                  >
                    <ShieldX className="h-4 w-4 mr-1" />
                    Exclude
                  </Button>
                </div>
              </TableCell>
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
              <CardTitle>Unreviewed Assets</CardTitle>
              <CardDescription>
                {equipment.length} items need insurance review
              </CardDescription>
            </div>
            {financedCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllFinancedAsInsured} className="w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Insure All Financed/Leased ({financedCount})</span>
                <span className="sm:hidden">Insure Financed ({financedCount})</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>All equipment has been reviewed.</p>
              <p className="text-sm mt-1">New equipment will appear here for insurance review.</p>
            </div>
          ) : isPhone ? (
            <MobileCardView />
          ) : (
            <DesktopTableView />
          )}
        </CardContent>
      </Card>

      {/* Mobile: Use Sheet for insuring */}
      {isPhone ? (
        <Sheet open={insureModalOpen} onOpenChange={setInsureModalOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[85vh]">
            <SheetHeader>
              <SheetTitle>Add to Insurance</SheetTitle>
              <SheetDescription>
                Set the declared value and optional notes for {selectedEquipment?.name}
              </SheetDescription>
            </SheetHeader>
            <InsureFormContent />
            <SheetFooter className="flex-row gap-2">
              <Button variant="outline" onClick={() => setInsureModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmInsure} className="flex-1">
                Add to Insurance
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Use Dialog for insuring */
        <Dialog open={insureModalOpen} onOpenChange={setInsureModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Insurance</DialogTitle>
              <DialogDescription>
                Set the declared value and optional notes for {selectedEquipment?.name}
              </DialogDescription>
            </DialogHeader>
            <InsureFormContent />
            <DialogFooter>
              <Button variant="outline" onClick={() => setInsureModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmInsure}>
                Add to Insurance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
