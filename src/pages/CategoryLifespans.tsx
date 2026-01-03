import { useState } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Check, X, Pencil } from 'lucide-react';
import { CategoryDefaults } from '@/types/equipment';

export default function CategoryLifespans() {
  const { categoryDefaults, updateCategoryDefaults } = useEquipment();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CategoryDefaults>>({});

  const startEdit = (category: CategoryDefaults) => {
    setEditingCategory(category.category);
    setEditValues({
      defaultUsefulLife: category.defaultUsefulLife,
      defaultResalePercent: category.defaultResalePercent,
      notes: category.notes,
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (editingCategory) {
      updateCategoryDefaults(editingCategory, editValues);
      setEditingCategory(null);
      setEditValues({});
    }
  };

  return (
    <Layout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Category Lifespans</h1>
          <p className="text-muted-foreground mt-1">
            Manage default useful life and resale percentages for equipment categories
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-info/5 border border-info/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-info mb-2">How these defaults work</h3>
          <p className="text-sm text-muted-foreground">
            These values apply to all equipment in each category. Individual items with overrides set will use their custom values instead.
            Useful life represents <strong>competitive life</strong> (how long the equipment helps you compete), 
            not mechanical life. Resale percentages are intentionally conservative — any upside is a bonus.
          </p>
        </div>

        {/* Table */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="table-header-cell w-[250px]">Category</TableHead>
                <TableHead className="table-header-cell text-center w-[140px]">Useful Life (yrs)</TableHead>
                <TableHead className="table-header-cell text-center w-[140px]">Resale %</TableHead>
                <TableHead className="table-header-cell">Notes & Assumptions</TableHead>
                <TableHead className="table-header-cell w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryDefaults.map(category => {
                const isEditing = editingCategory === category.category;
                
                return (
                  <TableRow key={category.category} className="group">
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={editValues.defaultUsefulLife || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            defaultUsefulLife: parseInt(e.target.value) || 0 
                          }))}
                          className="w-20 mx-auto text-center"
                        />
                      ) : (
                        <span className="font-mono-nums">{category.defaultUsefulLife}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editValues.defaultResalePercent || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            defaultResalePercent: parseInt(e.target.value) || 0 
                          }))}
                          className="w-20 mx-auto text-center"
                        />
                      ) : (
                        <span className="font-mono-nums">{category.defaultResalePercent}%</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValues.notes || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            notes: e.target.value 
                          }))}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{category.notes}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-success"
                            onClick={saveEdit}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-sm text-muted-foreground">
          Changes to category defaults apply to all equipment in that category, except items with individual overrides set.
        </p>
      </div>
    </Layout>
  );
}
