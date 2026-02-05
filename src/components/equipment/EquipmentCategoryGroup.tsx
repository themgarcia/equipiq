import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/calculations';
import { EquipmentCalculated, EquipmentAttachment } from '@/types/equipment';
import { EquipmentTableRow } from './EquipmentTableRow';
import { EquipmentMobileCard } from './EquipmentMobileCard';

interface EquipmentCategoryGroupProps {
  category: string;
  items: EquipmentCalculated[];
  isExpanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
  attachmentsByEquipmentId: Record<string, EquipmentAttachment[]>;
  expandedAttachments: Set<string>;
  onToggleAttachments: (equipmentId: string) => void;
  onSelectEquipment: (equipment: EquipmentCalculated) => void;
}

export function EquipmentCategoryGroup({
  category,
  items,
  isExpanded,
  onToggle,
  isMobile,
  attachmentsByEquipmentId,
  expandedAttachments,
  onToggleAttachments,
  onSelectEquipment,
}: EquipmentCategoryGroupProps) {
  const totalValue = items.reduce((sum, e) => sum + e.totalCostBasis, 0);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-3">
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
            />
            <span className="font-semibold">{category}</span>
            <span className="text-sm text-muted-foreground">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <span className="text-sm font-mono-nums text-muted-foreground">
            {formatCurrency(totalValue)}
          </span>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {isMobile ? (
            <div className="divide-y">
              {items.map(equipment => (
                <EquipmentMobileCard
                  key={equipment.id}
                  equipment={equipment}
                  attachments={attachmentsByEquipmentId[equipment.id] || []}
                  onClick={() => onSelectEquipment(equipment)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="table-header-cell">Name / Details</TableHead>
                    <TableHead className="table-header-cell w-[90px]">Status</TableHead>
                    <TableHead className="table-header-cell w-[120px] text-right">Cost Basis</TableHead>
                    <TableHead className="table-header-cell w-[80px] text-right hidden md:table-cell">Years Left</TableHead>
                    <TableHead className="table-header-cell w-[120px] text-right hidden md:table-cell">Replacement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(equipment => (
                    <EquipmentTableRow
                      key={equipment.id}
                      equipment={equipment}
                      attachments={attachmentsByEquipmentId[equipment.id] || []}
                      isExpanded={expandedAttachments.has(equipment.id)}
                      onToggleExpand={() => onToggleAttachments(equipment.id)}
                      onClick={() => onSelectEquipment(equipment)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
