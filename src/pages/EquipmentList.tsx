import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EquipmentForm } from '@/components/EquipmentForm';
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Equipment, EquipmentCategory, EquipmentStatus } from '@/types/equipment';
import { categoryDefaults } from '@/data/categoryDefaults';

const categories: EquipmentCategory[] = ['All' as EquipmentCategory, ...categoryDefaults.map(c => c.category)];
const statuses: EquipmentStatus[] = ['Active', 'Sold', 'Retired', 'Lost'];

export default function EquipmentList() {
  const { calculatedEquipment, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();

  const filteredEquipment = useMemo(() => {
    return calculatedEquipment.filter(equipment => {
      const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || equipment.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || equipment.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [calculatedEquipment, searchQuery, categoryFilter, statusFilter]);

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
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Equipment</h1>
            <p className="text-muted-foreground mt-1">
              Manage your equipment fleet and allocations
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
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
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        {/* Table */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="table-header-cell">Name / Details</TableHead>
                  <TableHead className="table-header-cell">Category</TableHead>
                  <TableHead className="table-header-cell">Status</TableHead>
                  <TableHead className="table-header-cell text-right">Cost Basis</TableHead>
                  <TableHead className="table-header-cell text-right">COGS %</TableHead>
                  <TableHead className="table-header-cell text-right">
                    <span className="text-warning">COGS $</span>
                  </TableHead>
                  <TableHead className="table-header-cell text-right">Years Left</TableHead>
                  <TableHead className="table-header-cell text-right">Replacement</TableHead>
                  <TableHead className="table-header-cell w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No equipment found. Add your first piece of equipment to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map(equipment => (
                    <TableRow key={equipment.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {equipment.make} {equipment.model} • {equipment.year}
                            {equipment.assetId && ` • ${equipment.assetId}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{equipment.category}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={equipment.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(equipment.totalCostBasis)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatPercent(equipment.cogsPercent)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums bg-field-calculated">
                        {formatCurrency(equipment.cogsAllocatedCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-semibold' : ''}>
                          {equipment.estimatedYearsLeft}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(equipment.replacementCostNew)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredEquipment.length} of {calculatedEquipment.length} items
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
      </div>
    </Layout>
  );
}
