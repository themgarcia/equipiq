import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentForm } from '@/components/EquipmentForm';
import { EquipmentImport } from '@/components/EquipmentImport';
import { EquipmentImportReview } from '@/components/EquipmentImportReview';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ChevronDown, Upload } from 'lucide-react';
import { Equipment, EquipmentStatus } from '@/types/equipment';
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
}

const statuses: EquipmentStatus[] = ['Active', 'Sold', 'Retired', 'Lost'];

export default function EquipmentList() {
  const { calculatedEquipment, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => 
    new Set(categoryDefaults.map(c => c.category))
  );
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [extractedEquipment, setExtractedEquipment] = useState<ExtractedEquipment[]>([]);

  const handleEquipmentExtracted = (equipment: ExtractedEquipment[]) => {
    setExtractedEquipment(equipment);
    setIsReviewOpen(true);
  };

  const handleImportComplete = () => {
    setExtractedEquipment([]);
  };

  const filteredEquipment = useMemo(() => {
    return calculatedEquipment.filter(equipment => {
      const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || equipment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [calculatedEquipment, searchQuery, statusFilter]);

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
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      {formatCurrency(items.reduce((sum, e) => sum + e.totalCostBasis, 0))}
                    </span>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="overflow-x-auto">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="table-header-cell">Name / Details</TableHead>
                            <TableHead className="table-header-cell w-[90px]">Status</TableHead>
                            <TableHead className="table-header-cell w-[100px] text-right">Cost Basis</TableHead>
                            <TableHead className="table-header-cell w-[70px] text-right">COGS %</TableHead>
                            <TableHead className="table-header-cell w-[90px] text-right">
                              <span className="text-warning">COGS $</span>
                            </TableHead>
                            <TableHead className="table-header-cell w-[90px] text-right">
                              <span className="text-warning">OH $</span>
                            </TableHead>
                            <TableHead className="table-header-cell w-[80px] text-right">Years Left</TableHead>
                            <TableHead className="table-header-cell w-[100px] text-right">Replacement</TableHead>
                            <TableHead className="table-header-cell w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(equipment => (
                            <TableRow key={equipment.id} className="group hover:bg-muted/30">
                              <TableCell>
                                <div className="truncate">
                                  <p className="font-medium truncate">{equipment.name}</p>
                                  {equipment.assetId && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {equipment.assetId}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-[90px]">
                                <StatusBadge status={equipment.status} />
                              </TableCell>
                              <TableCell className="w-[100px] text-right font-mono-nums">
                                {formatCurrency(equipment.totalCostBasis)}
                              </TableCell>
                              <TableCell className="w-[70px] text-right font-mono-nums">
                                {formatPercent(equipment.cogsPercent)}
                              </TableCell>
                              <TableCell className="w-[90px] text-right font-mono-nums bg-field-calculated">
                                {formatCurrency(equipment.cogsAllocatedCost)}
                              </TableCell>
                              <TableCell className="w-[90px] text-right font-mono-nums bg-field-calculated">
                                {formatCurrency(equipment.overheadAllocatedCost)}
                              </TableCell>
                              <TableCell className="w-[80px] text-right font-mono-nums">
                                <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-semibold' : ''}>
                                  {equipment.estimatedYearsLeft}
                                </span>
                              </TableCell>
                              <TableCell className="w-[100px] text-right font-mono-nums">
                                {formatCurrency(equipment.replacementCostNew)}
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
                          ))}
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
            Showing {filteredEquipment.length} of {calculatedEquipment.length} items in {groupedEquipment.length} categories
          </p>
          <p>
            Total Cost Basis: <span className="font-mono-nums font-medium text-foreground">
              {formatCurrency(filteredEquipment.reduce((sum, e) => sum + e.totalCostBasis, 0))}
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
      </div>
    </Layout>
  );
}
