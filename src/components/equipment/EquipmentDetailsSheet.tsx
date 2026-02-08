import { format } from 'date-fns';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentFormContent } from '@/components/EquipmentFormContent';
import { EquipmentDocumentsContent } from '@/components/EquipmentDocumentsContent';
import { EquipmentAttachmentsContent } from '@/components/EquipmentAttachmentsContent';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { parseLocalDate } from '@/lib/utils';
import { categoryDefaults } from '@/data/categoryDefaults';
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

  const handleDelete = () => {
    if (equipment && confirm('Are you sure you want to delete this equipment?')) {
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
            <>
              <SheetTitle>{equipment.name}</SheetTitle>
              <SheetDescription>
                {equipment.make} {equipment.model} • {equipment.year}
              </SheetDescription>
            </>
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
                onEdit={() => setSheetView('edit')}
                onDocuments={() => setSheetView('documents')}
                onAttachments={() => setSheetView('attachments')}
                onDelete={handleDelete}
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
      </SheetContent>
    </Sheet>
  );
}

// Internal component for the details view
import { useState } from 'react';

interface EquipmentDetailsViewProps {
  equipment: EquipmentCalculated;
  onEdit: () => void;
  onDocuments: () => void;
  onAttachments: () => void;
  onDelete: () => void;
}

function EquipmentDetailsView({
  equipment,
  onEdit,
  onDocuments,
  onAttachments,
  onDelete,
}: EquipmentDetailsViewProps) {
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

      {/* IDENTIFICATION */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Identification</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm font-medium">{equipment.category}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Condition</p>
            <p className="text-sm font-medium">{equipment.purchaseCondition}</p>
          </div>
          {equipment.serialVin && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Serial/VIN</p>
              <p className="text-sm font-medium font-mono">{equipment.serialVin}</p>
            </div>
          )}
          {equipment.assetId && (
            <div>
              <p className="text-xs text-muted-foreground">Asset ID</p>
              <p className="text-sm font-medium">{equipment.assetId}</p>
            </div>
          )}
        </div>
      </div>

      {/* PURCHASE & COST */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Purchase & Cost</h4>
        <div className="space-y-1.5 max-w-sm">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Purchase Date</span>
            <span className="text-sm font-medium">{format(parseLocalDate(equipment.purchaseDate), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Purchase Price</span>
            <span className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.purchasePrice)}</span>
          </div>
          {equipment.salesTax > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">+ Sales Tax</span>
              <span className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.salesTax)}</span>
            </div>
          )}
          {equipment.freightSetup > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">+ Freight/Setup</span>
              <span className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.freightSetup)}</span>
            </div>
          )}
          {equipment.otherCapEx > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">+ Other CapEx</span>
              <span className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.otherCapEx)}</span>
            </div>
          )}
          {equipment.attachmentTotalValue > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">+ Attachments</span>
              <span className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.attachmentTotalValue)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t">
            <span className="text-sm font-medium">Total Cost Basis</span>
            <span className="text-sm font-semibold font-mono-nums">{formatCurrency(equipment.totalCostBasis)}</span>
          </div>
        </div>
      </div>

      {/* ALLOCATIONS */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Allocations</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
          <div>
            <p className="text-xs text-muted-foreground">COGS</p>
            <p className="text-sm font-medium font-mono-nums">
              {formatPercent(equipment.cogsPercent)} ({formatCurrency(equipment.cogsAllocatedCost)})
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overhead</p>
            <p className="text-sm font-medium font-mono-nums">
              {formatPercent(equipment.overheadPercent)} ({formatCurrency(equipment.overheadAllocatedCost)})
            </p>
          </div>
        </div>
      </div>

      {/* LIFECYCLE */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Lifecycle</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
          <div>
            <p className="text-xs text-muted-foreground">Useful Life</p>
            <p className="text-sm font-medium font-mono-nums">
              {equipment.usefulLifeOverride ?? 
                (categoryDefaults.find(c => c.category === equipment.category)?.defaultUsefulLife ?? 10)} years
              {equipment.usefulLifeOverride && (
                <span className="text-xs text-muted-foreground ml-1">(custom)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Years Left</p>
            <p className={`text-sm font-medium font-mono-nums ${equipment.estimatedYearsLeft <= 1 ? 'text-warning' : ''}`}>
              {equipment.estimatedYearsLeft.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Replacement Cost</p>
            <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.replacementCostUsed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expected Resale</p>
            <p className="text-sm font-medium font-mono-nums">
              {formatCurrency(equipment.expectedResaleUsed)}
              {equipment.expectedResaleOverride !== null && (
                <span className="text-xs text-muted-foreground ml-1">(custom)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* FINANCING - Only show if not owned */}
      {equipment.financingType !== 'owned' && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Financing</h4>
           <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium capitalize">{equipment.financingType}</p>
            </div>
            {equipment.depositAmount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.depositAmount)}</p>
              </div>
            )}
            {equipment.financedAmount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Financed Amount</p>
                <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.financedAmount)}</p>
              </div>
            )}
            {equipment.monthlyPayment > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Monthly Payment</p>
                <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.monthlyPayment)}</p>
              </div>
            )}
            {equipment.termMonths > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Term</p>
                <p className="text-sm font-medium font-mono-nums">{equipment.termMonths} months</p>
              </div>
            )}
            {equipment.buyoutAmount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Buyout</p>
                <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.buyoutAmount)}</p>
              </div>
            )}
            {equipment.financingStartDate && (
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">{format(parseLocalDate(equipment.financingStartDate), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SALE INFO - Only show if sold */}
      {equipment.status === 'Sold' && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Sale Info</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
            {equipment.saleDate && (
              <div>
                <p className="text-xs text-muted-foreground">Sale Date</p>
                <p className="text-sm font-medium">{format(parseLocalDate(equipment.saleDate), 'MMM d, yyyy')}</p>
              </div>
            )}
            {equipment.salePrice !== null && equipment.salePrice !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Sale Price</p>
                <p className="text-sm font-medium font-mono-nums">{formatCurrency(equipment.salePrice)}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ACTION BUTTONS */}
      <div className="pt-4 border-t space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Equipment
        </Button>
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
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
