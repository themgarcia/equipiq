import { useState } from 'react';

import { Pencil, Trash2, FileText, Package, User, Building2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentFormContent } from '@/components/EquipmentFormContent';
import { EquipmentDocumentsContent } from '@/components/EquipmentDocumentsContent';
import { EquipmentAttachmentsContent } from '@/components/EquipmentAttachmentsContent';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { parseLocalDate } from '@/lib/utils';

import { EquipmentCalculated, Equipment } from '@/types/equipment';

type SheetView = 'details' | 'edit' | 'documents' | 'attachments';

interface EquipmentDetailsSheetProps {
  equipment: EquipmentCalculated | null;
  onClose: () => void;
  onUpdate: (id: string, data: Omit<Equipment, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function EquipmentDetailsSheet({
  equipment,
  onClose,
  onUpdate,
  onDelete,
}: EquipmentDetailsSheetProps) {
  const [sheetView, setSheetView] = useState<SheetView>('details');

  const handleClose = () => {
    onClose();
    setSheetView('details');
  };

  const handleConfirmDelete = () => {
    if (equipment) {
      onDelete(equipment.id);
      handleClose();
    }
  };

  if (!equipment) return null;

  return (
    <Sheet open={!!equipment} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-full md:max-w-xl lg:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          {sheetView === 'details' ? (
            <div className="flex items-start justify-between gap-2 pr-10">
              <div>
                <SheetTitle>{equipment.name}</SheetTitle>
                <SheetDescription>
                  {equipment.make} {equipment.model} • {equipment.year}
                </SheetDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setSheetView('edit')}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          ) : (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => setSheetView('details')}
                  >
                    {equipment.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {sheetView === 'edit' && 'Edit Equipment'}
                    {sheetView === 'documents' && 'Documents'}
                    {sheetView === 'attachments' && 'Attachments'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {sheetView === 'details' && (
              <EquipmentDetailsView 
                equipment={equipment} 
                onDocuments={() => setSheetView('documents')}
                onAttachments={() => setSheetView('attachments')}
                onConfirmDelete={handleConfirmDelete}
              />
            )}

            {sheetView === 'edit' && (
              <EquipmentFormContent
                equipment={equipment}
                onSubmit={(data) => {
                  onUpdate(equipment.id, data);
                  setSheetView('details');
                }}
                onCancel={() => setSheetView('details')}
                hideFooter
                formId="equipment-edit-form"
              />
            )}

            {sheetView === 'documents' && (
              <EquipmentDocumentsContent
                equipmentId={equipment.id}
                equipmentName={equipment.name}
              />
            )}

            {sheetView === 'attachments' && (
              <EquipmentAttachmentsContent
                equipmentId={equipment.id}
                equipmentName={equipment.name}
              />
            )}
          </div>
        </ScrollArea>

        {sheetView === 'edit' && (
          <div className="shrink-0 border-t p-4 bg-background flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setSheetView('details')} className="sm:flex-1">
              Cancel
            </Button>
            <Button type="submit" form="equipment-edit-form" className="sm:flex-1">
              Save Changes
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Internal component for the details view
interface EquipmentDetailsViewProps {
  equipment: EquipmentCalculated;
  onDocuments: () => void;
  onAttachments: () => void;
  onConfirmDelete: () => void;
}

function EquipmentDetailsView({
  equipment,
  onDocuments,
  onAttachments,
  onConfirmDelete,
}: EquipmentDetailsViewProps) {
  // Calculate financing status line
  const getFinancingStatus = () => {
    if (equipment.financingType === 'owned') return 'Owned';
    if (equipment.monthlyPayment > 0 && equipment.termMonths > 0 && equipment.financingStartDate) {
      const start = parseLocalDate(equipment.financingStartDate);
      const monthsElapsed = Math.floor(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      const paymentsLeft = Math.max(0, equipment.termMonths - monthsElapsed);
      if (paymentsLeft === 0) return 'Paid off';
      return `${formatCurrency(equipment.monthlyPayment)}/mo — ${paymentsLeft} payments left`;
    }
    return equipment.financingType.charAt(0).toUpperCase() + equipment.financingType.slice(1);
  };

  return (
    <div className="space-y-5">
      {/* Status & Allocation Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={equipment.status} />
        {equipment.allocationType === 'owner_perk' && (
          <Badge variant="outline" className="text-warning border-warning/50">
            <User className="h-3 w-3 mr-1" />
            Owner Perk
          </Badge>
        )}
        {equipment.allocationType === 'overhead_only' && (
          <Badge variant="outline" className="text-info border-info/50">
            <Building2 className="h-3 w-3 mr-1" />
            Overhead Only
          </Badge>
        )}
      </div>

      {/* REPLACEMENT COST HERO CARD */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-medium text-muted-foreground">Replacement Cost</p>
        <p className="text-2xl font-bold font-mono-nums tracking-tight">
          {formatCurrency(equipment.replacementCostUsed)}
        </p>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-medium' : ''}>
            {equipment.estimatedYearsLeft.toFixed(1)} years left
          </span>
          <span>
            Resale: {formatCurrency(equipment.expectedResaleUsed)}
            {equipment.expectedResaleOverride !== null && (
              <span className="ml-1">(custom)</span>
            )}
          </span>
        </div>
      </div>

      {/* FINANCIAL SNAPSHOT */}
      <div className="space-y-1.5 max-w-sm">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Cost Basis</span>
          <span className="text-sm font-semibold font-mono-nums">{formatCurrency(equipment.totalCostBasis)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Allocation</span>
          <span className="text-sm font-medium font-mono-nums">
            {formatPercent(equipment.cogsPercent)} COGS / {formatPercent(equipment.overheadPercent)} OH
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Financing</span>
          <span className="text-sm font-medium">{getFinancingStatus()}</span>
        </div>
      </div>

      <Separator />

      {/* ACTION BUTTONS */}
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onDocuments}
        >
          <FileText className="h-4 w-4 mr-2" />
          Documents
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onAttachments}
        >
          <Package className="h-4 w-4 mr-2" />
          Attachments
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-medium text-foreground">{equipment.name}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onConfirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
