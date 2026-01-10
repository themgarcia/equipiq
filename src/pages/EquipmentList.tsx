import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useDeviceType } from '@/hooks/use-mobile';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentForm } from '@/components/EquipmentForm';
import { EquipmentFormContent } from '@/components/EquipmentFormContent';
import { EquipmentImport } from '@/components/EquipmentImport';
import { EquipmentImportReview } from '@/components/EquipmentImportReview';
import { EquipmentDocuments } from '@/components/EquipmentDocuments';
import { EquipmentDocumentsContent } from '@/components/EquipmentDocumentsContent';
import { EquipmentAttachments } from '@/components/EquipmentAttachments';
import { EquipmentAttachmentsContent } from '@/components/EquipmentAttachmentsContent';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { MobileTabSelect } from '@/components/MobileTabSelect';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight, Upload, FileText, Package, CornerDownRight, User, Building2 } from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentCalculated } from '@/types/equipment';
import { categoryDefaults } from '@/data/categoryDefaults';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type SheetView = 'details' | 'edit' | 'documents' | 'attachments';

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
  const { canUseAIParsing } = useSubscription();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone';
  
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
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedEquipmentForSheet, setSelectedEquipmentForSheet] = useState<EquipmentCalculated | null>(null);
  const [sheetView, setSheetView] = useState<SheetView>('details');

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Sold', label: 'Sold' },
    { value: 'Retired', label: 'Retired' },
    { value: 'Lost', label: 'Lost' },
    { value: 'All', label: 'All' },
  ];

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
            <Button 
              variant="outline" 
              onClick={() => {
                if (canUseAIParsing) {
                  setIsImportOpen(true);
                } else {
                  setShowUpgradePrompt(true);
                }
              }} 
              className="gap-2"
            >
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

          {isMobile ? (
            <MobileTabSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              tabs={statusOptions}
              className="w-full"
            />
          ) : (
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-auto flex-wrap justify-start gap-1">
                <TabsTrigger value="Active">Active</TabsTrigger>
                <TabsTrigger value="Sold">Sold</TabsTrigger>
                <TabsTrigger value="Retired">Retired</TabsTrigger>
                <TabsTrigger value="Lost">Lost</TabsTrigger>
                <TabsTrigger value="All">All</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
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
                    {isMobile ? (
                      /* Mobile Card View */
                      <div className="divide-y">
                        {items.map(equipment => {
                          const equipmentAttachments = attachmentsByEquipmentId[equipment.id] || [];
                          const hasAttachments = equipmentAttachments.length > 0;
                          return (
                            <div 
                              key={equipment.id}
                              className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                              onClick={() => setSelectedEquipmentForSheet(equipment)}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{equipment.name}</p>
                                  {hasAttachments && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      ({equipmentAttachments.length})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <StatusBadge status={equipment.status} />
                                  <span className="text-sm text-muted-foreground font-mono-nums">
                                    {formatCurrency(equipment.totalCostBasis)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Desktop Table View */
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
                            {items.map(equipment => {
                              const equipmentAttachments = attachmentsByEquipmentId[equipment.id] || [];
                              const hasAttachments = equipmentAttachments.length > 0;
                              const isAttachmentsExpanded = expandedAttachments.has(equipment.id);
                              return (
                                <>
                                  <TableRow key={equipment.id} className="group hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedEquipmentForSheet(equipment)}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {hasAttachments && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleAttachments(equipment.id);
                                            }}
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
                                            <p className="font-medium truncate text-sm md:text-base">{equipment.name}</p>
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
                                    <TableCell className="w-[130px]">
                                      <div className="flex items-center gap-1.5">
                                        <StatusBadge status={equipment.status} />
                                        {equipment.allocationType === 'owner_perk' && (
                                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">
                                            <User className="h-3 w-3 mr-0.5" />
                                            Perk
                                          </Badge>
                                        )}
                                        {equipment.allocationType === 'overhead_only' && (
                                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px] px-1.5 py-0">
                                            <Building2 className="h-3 w-3 mr-0.5" />
                                            OH
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[120px] text-right font-mono-nums">
                                      {formatCurrency(equipment.totalCostBasis)}
                                    </TableCell>
                                    <TableCell className="w-[80px] text-right font-mono-nums hidden md:table-cell">
                                      <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-semibold' : ''}>
                                        {equipment.estimatedYearsLeft.toFixed(1)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="w-[120px] text-right font-mono-nums hidden md:table-cell">
                                      {formatCurrency(equipment.replacementCostUsed)}
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
                                      <TableCell className="w-[80px] hidden md:table-cell"></TableCell>
                                      <TableCell className="w-[120px] hidden md:table-cell"></TableCell>
                                    </TableRow>
                                  ))}
                                </>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
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

        {/* Upgrade Prompt for AI Import */}
        <UpgradePrompt
          feature="AI Document Import"
          description="Automatically extract equipment details from purchase orders, invoices, and financing documents. Upgrade to Professional or Business to unlock this time-saving feature."
          variant="modal"
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
        />

        {/* Equipment Details Sheet */}
        <Sheet 
          open={!!selectedEquipmentForSheet} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEquipmentForSheet(null);
              setSheetView('details');
            }
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
            {selectedEquipmentForSheet && (
              <>
                <SheetHeader className="p-6 pb-4 border-b shrink-0">
                  {sheetView === 'details' ? (
                    <>
                      <SheetTitle>{selectedEquipmentForSheet.name}</SheetTitle>
                      <SheetDescription>
                        {selectedEquipmentForSheet.make} {selectedEquipmentForSheet.model} • {selectedEquipmentForSheet.year}
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
                            {selectedEquipmentForSheet.name}
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
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={selectedEquipmentForSheet.status} />
                          {selectedEquipmentForSheet.allocationType === 'owner_perk' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <User className="h-3 w-3 mr-1" />
                              Owner Perk
                            </Badge>
                          )}
                          {selectedEquipmentForSheet.allocationType === 'overhead_only' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              <Building2 className="h-3 w-3 mr-1" />
                              Overhead Only
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Cost Basis</p>
                            <p className="font-medium font-mono-nums">{formatCurrency(selectedEquipmentForSheet.totalCostBasis)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">COGS %</p>
                            <p className="font-medium font-mono-nums">{formatPercent(selectedEquipmentForSheet.cogsPercent)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">COGS $</p>
                            <p className="font-medium font-mono-nums">{formatCurrency(selectedEquipmentForSheet.cogsAllocatedCost)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Overhead $</p>
                            <p className="font-medium font-mono-nums">{formatCurrency(selectedEquipmentForSheet.overheadAllocatedCost)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Years Left</p>
                            <p className={`font-medium font-mono-nums ${selectedEquipmentForSheet.estimatedYearsLeft <= 1 ? 'text-warning' : ''}`}>
                              {selectedEquipmentForSheet.estimatedYearsLeft.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Replacement</p>
                            <p className="font-medium font-mono-nums">{formatCurrency(selectedEquipmentForSheet.replacementCostUsed)}</p>
                          </div>
                        </div>
                        
                        {selectedEquipmentForSheet.assetId && (
                          <div>
                            <p className="text-sm text-muted-foreground">Asset ID</p>
                            <p className="font-medium">{selectedEquipmentForSheet.assetId}</p>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setSheetView('edit')}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Equipment
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setSheetView('documents')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Documents
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setSheetView('attachments')}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Attachments
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => {
                              handleDelete(selectedEquipmentForSheet.id);
                              setSelectedEquipmentForSheet(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {sheetView === 'edit' && (
                      <EquipmentFormContent
                        equipment={selectedEquipmentForSheet}
                        onSubmit={(data) => {
                          updateEquipment(selectedEquipmentForSheet.id, data);
                          setSheetView('details');
                        }}
                        onCancel={() => setSheetView('details')}
                      />
                    )}

                    {sheetView === 'documents' && (
                      <EquipmentDocumentsContent
                        equipmentId={selectedEquipmentForSheet.id}
                        equipmentName={selectedEquipmentForSheet.name}
                      />
                    )}

                    {sheetView === 'attachments' && (
                      <EquipmentAttachmentsContent
                        equipmentId={selectedEquipmentForSheet.id}
                        equipmentName={selectedEquipmentForSheet.name}
                      />
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
