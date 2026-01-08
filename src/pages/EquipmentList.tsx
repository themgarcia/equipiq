import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentForm } from '@/components/EquipmentForm';
import { EquipmentImport } from '@/components/EquipmentImport';
import { EquipmentImportReview } from '@/components/EquipmentImportReview';
import { EquipmentDocuments } from '@/components/EquipmentDocuments';
import { EquipmentAttachments } from '@/components/EquipmentAttachments';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight, Upload, FileText, Package, CornerDownRight, Sparkles, Archive } from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentCalculated } from '@/types/equipment';
import { categoryDefaults } from '@/data/categoryDefaults';

interface ExtractedEquipment {
  make: string;
  model: string;
  year: number | null;
  serialVin: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  salesTax: number | null;
  freightSetup: number | null;
  financingType: 'owned' | 'financed' | 'leased' | null;
  depositAmount: number | null;
  financedAmount: number | null;
  monthlyPayment: number | null;
  termMonths: number | null;
  buyoutAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
  sourceFile?: File;
}

const statuses: EquipmentStatus[] = ['Active', 'Sold', 'Retired', 'Lost'];

export default function EquipmentList() {
  const { calculatedEquipment, addEquipment, updateEquipment, deleteEquipment, attachmentsByEquipmentId } = useEquipment();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => 
    new Set(categoryDefaults.map(c => c.category))
  );
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [extractedEquipment, setExtractedEquipment] = useState<ExtractedEquipment[]>([]);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentsEquipmentId, setDocumentsEquipmentId] = useState<string>('');
  const [documentsEquipmentName, setDocumentsEquipmentName] = useState<string>('');
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentsEquipmentId, setAttachmentsEquipmentId] = useState<string>('');
  const [attachmentsEquipmentName, setAttachmentsEquipmentName] = useState<string>('');
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set());

  const toggleAttachments = (equipmentId: string) => {
    setExpandedAttachments(prev => {
      const next = new Set(prev);
      if (next.has(equipmentId)) {
        next.delete(equipmentId);
      } else {
        next.add(equipmentId);
      }
      return next;
    });
  };

  const handleEquipmentExtracted = (equipment: ExtractedEquipment[]) => {
    setExtractedEquipment(equipment);
    setIsReviewOpen(true);
  };

  const handleImportComplete = () => {
    setExtractedEquipment([]);
  };

  const handleOpenDocuments = (equipment: Equipment) => {
    setDocumentsEquipmentId(equipment.id);
    setDocumentsEquipmentName(equipment.name);
    setDocumentsOpen(true);
  };

  const handleOpenAttachments = (equipment: Equipment) => {
    setAttachmentsEquipmentId(equipment.id);
    setAttachmentsEquipmentName(equipment.name);
    setAttachmentsOpen(true);
  };

  // Add attachment totals to equipment
  const equipmentWithAttachments = useMemo(() => {
    return calculatedEquipment.map(eq => {
      const attachments = attachmentsByEquipmentId[eq.id] || [];
      const attachmentTotalValue = attachments.reduce((sum, a) => sum + a.value, 0);
      return {
        ...eq,
        attachmentTotalValue,
        totalCostBasisWithAttachments: eq.totalCostBasis + attachmentTotalValue,
      } as EquipmentCalculated;
    });
  }, [calculatedEquipment, attachmentsByEquipmentId]);

  const filteredEquipment = useMemo(() => {
    return equipmentWithAttachments.filter(equipment => {
      const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || equipment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [equipmentWithAttachments, searchQuery, statusFilter]);

  // Group equipment by category (already alphabetically sorted in categoryDefaults)
  const groupedEquipment = useMemo(() => {
    const groups: Record<string, typeof filteredEquipment> = {};
    
    // Initialize groups in alphabetical order from categoryDefaults
    categoryDefaults.forEach(cat => {
      groups[cat.category] = [];
    });
    
    // Populate groups
    filteredEquipment.forEach(equipment => {
      if (groups[equipment.category]) {
        groups[equipment.category].push(equipment);
      } else {
        // Handle any uncategorized equipment
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(equipment);
      }
    });
    
    // Filter out empty categories
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredEquipment]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddNew = () => {
    setEditingEquipment(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteEquipment(id);
    }
  };

  const handleFormSubmit = (data: Omit<Equipment, 'id'>) => {
    if (editingEquipment) {
      updateEquipment(editingEquipment.id, data);
    } else {
      addEquipment(data);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Equipment</h1>
            <p className="text-muted-foreground mt-1">
              Manage your equipment fleet and allocations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import from Documents</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Equipment</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="Active">Active</TabsTrigger>
              <TabsTrigger value="Sold">Sold</TabsTrigger>
              <TabsTrigger value="Retired">Retired</TabsTrigger>
              <TabsTrigger value="Lost">Lost</TabsTrigger>
              <TabsTrigger value="All">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Groups */}
        <div className="space-y-4">
          {groupedEquipment.length === 0 ? (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              No equipment found. Add your first piece of equipment to get started.
            </div>
          ) : (
            groupedEquipment.map(([category, items]) => (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          expandedCategories.has(category) ? '' : '-rotate-90'
                        }`} 
                      />
                      <span className="font-semibold">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        ({items.length} {items.length === 1 ? 'item' : 'items'})
                      </span>
                    </div>
                    <span className="text-sm font-mono-nums text-muted-foreground">
                      {formatCurrency(items.reduce((sum, e) => sum + (e.totalCostBasisWithAttachments || e.totalCostBasis), 0))}
                    </span>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="overflow-x-auto">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="table-header-cell">Name / Details</TableHead>
                            <TableHead className="table-header-cell w-[90px]">Status</TableHead>
                            <TableHead className="table-header-cell w-[120px] text-right">Cost Basis</TableHead>
                            <TableHead className="table-header-cell w-[70px] text-right">COGS %</TableHead>
                            <TableHead className="table-header-cell w-[110px] text-right">
                              <span className="text-warning">COGS $</span>
                            </TableHead>
                            <TableHead className="table-header-cell w-[110px] text-right">
                              <span className="text-warning">OH $</span>
                            </TableHead>
                            <TableHead className="table-header-cell w-[80px] text-right">Years Left</TableHead>
                            <TableHead className="table-header-cell w-[120px] text-right">Replacement</TableHead>
                            <TableHead className="table-header-cell w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(equipment => {
                            const equipmentAttachments = attachmentsByEquipmentId[equipment.id] || [];
                            const hasAttachments = equipmentAttachments.length > 0;
                            const isAttachmentsExpanded = expandedAttachments.has(equipment.id);
                            return (
                              <>
                                <TableRow key={equipment.id} className="group hover:bg-muted/30">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {hasAttachments && (
                                        <button 
                                          onClick={() => toggleAttachments(equipment.id)}
                                          className="p-0.5 hover:bg-muted rounded"
                                        >
                                          {isAttachmentsExpanded ? (
                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                          )}
                                        </button>
                                      )}
                                      <div className="truncate min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium truncate">{equipment.name}</p>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                {equipment.purchaseCondition === 'new' ? (
                                                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                                ) : (
                                                  <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                {equipment.purchaseCondition === 'new' ? 'Bought New' : 'Bought Used'}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          {hasAttachments && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                              ({equipmentAttachments.length})
                                            </span>
                                          )}
                                        </div>
                                        {equipment.assetId && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {equipment.assetId}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="w-[90px]">
                                    <StatusBadge status={equipment.status} />
                                  </TableCell>
                                  <TableCell className="w-[120px] text-right font-mono-nums">
                                    {formatCurrency(equipment.totalCostBasis)}
                                  </TableCell>
                                  <TableCell className="w-[70px] text-right font-mono-nums">
                                    {formatPercent(equipment.cogsPercent)}
                                  </TableCell>
                                  <TableCell className="w-[110px] text-right font-mono-nums bg-field-calculated">
                                    {formatCurrency(equipment.cogsAllocatedCost)}
                                  </TableCell>
                                  <TableCell className="w-[110px] text-right font-mono-nums bg-field-calculated">
                                    {formatCurrency(equipment.overheadAllocatedCost)}
                                  </TableCell>
                                  <TableCell className="w-[80px] text-right font-mono-nums">
                                    <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-semibold' : ''}>
                                      {equipment.estimatedYearsLeft}
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[120px] text-right font-mono-nums">
                                    {formatCurrency(equipment.replacementCostUsed)}
                                  </TableCell>
                                  <TableCell className="w-[50px]">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(equipment)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDocuments(equipment)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Documents
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenAttachments(equipment)}>
                                          <Package className="h-4 w-4 mr-2" />
                                          Attachments
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(equipment.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                                {/* Collapsible attachment rows */}
                                {hasAttachments && isAttachmentsExpanded && equipmentAttachments.map(attachment => (
                                  <TableRow 
                                    key={`att-${attachment.id}`} 
                                    className="bg-muted/20 hover:bg-muted/40"
                                  >
                                    <TableCell className="pl-8">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CornerDownRight className="h-3 w-3" />
                                        <span>{attachment.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[90px]">
                                      <span className="text-xs text-muted-foreground">Attachment</span>
                                    </TableCell>
                                    <TableCell className="w-[120px] text-right font-mono-nums text-muted-foreground">
                                      {formatCurrency(attachment.value)}
                                    </TableCell>
                                    <TableCell className="w-[70px]"></TableCell>
                                    <TableCell className="w-[110px]"></TableCell>
                                    <TableCell className="w-[110px]"></TableCell>
                                    <TableCell className="w-[80px]"></TableCell>
                                    <TableCell className="w-[120px]"></TableCell>
                                    <TableCell className="w-[50px]"></TableCell>
                                  </TableRow>
                                ))}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredEquipment.length} of {equipmentWithAttachments.length} items in {groupedEquipment.length} categories
          </p>
          <p>
            Total Value (incl. attachments): <span className="font-mono-nums font-medium text-foreground">
              {formatCurrency(filteredEquipment.reduce((sum, e) => sum + (e.totalCostBasisWithAttachments || e.totalCostBasis), 0))}
            </span>
          </p>
        </div>

        {/* Form Dialog */}
        <EquipmentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          equipment={editingEquipment}
          onSubmit={handleFormSubmit}
        />

        {/* Import Dialog */}
        <EquipmentImport
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onEquipmentExtracted={handleEquipmentExtracted}
        />

        {/* Import Review Dialog */}
        <EquipmentImportReview
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          extractedEquipment={extractedEquipment}
          onComplete={handleImportComplete}
        />

        {/* Documents Sheet */}
        <EquipmentDocuments
          open={documentsOpen}
          onOpenChange={setDocumentsOpen}
          equipmentId={documentsEquipmentId}
          equipmentName={documentsEquipmentName}
        />

        {/* Attachments Sheet */}
        <EquipmentAttachments
          open={attachmentsOpen}
          onOpenChange={setAttachmentsOpen}
          equipmentId={attachmentsEquipmentId}
          equipmentName={attachmentsEquipmentName}
        />
      </div>
    </Layout>
  );
}
