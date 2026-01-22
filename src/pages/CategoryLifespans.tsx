import { useState, useEffect } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Pencil, ChevronRight } from 'lucide-react';
import { CategoryDefaults } from '@/types/equipment';
import { useDeviceType } from '@/hooks/use-mobile';

export default function CategoryLifespans() {
  const { categoryDefaults, updateCategoryDefaults } = useEquipment();
  const { markStepComplete } = useOnboarding();
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CategoryDefaults>>({});
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDefaults | null>(null);

  // Mark onboarding step on mount
  useEffect(() => {
    markStepComplete('step_methodology_reviewed');
  }, [markStepComplete]);

  const startEdit = (category: CategoryDefaults) => {
    if (isPhone) {
      setSelectedCategory(category);
      setEditValues({
        defaultUsefulLife: category.defaultUsefulLife,
        defaultResalePercent: category.defaultResalePercent,
        notes: category.notes,
      });
      setEditSheetOpen(true);
    } else {
      setEditingCategory(category.category);
      setEditValues({
        defaultUsefulLife: category.defaultUsefulLife,
        defaultResalePercent: category.defaultResalePercent,
        notes: category.notes,
      });
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValues({});
    setEditSheetOpen(false);
    setSelectedCategory(null);
  };

  const saveEdit = () => {
    const categoryName = isPhone ? selectedCategory?.category : editingCategory;
    if (categoryName) {
      updateCategoryDefaults(categoryName, editValues);
      cancelEdit();
    }
  };

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-3">
      {categoryDefaults.map(category => (
        <div
          key={category.category}
          onClick={() => startEdit(category)}
          className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
        >
          <div className="flex items-center justify-between">
            <p className="font-medium flex-1 min-w-0 truncate pr-2">{category.category}</p>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Life: </span>
              <span className="font-medium font-mono-nums">{category.defaultUsefulLife} yrs</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resale: </span>
              <span className="font-medium font-mono-nums">{category.defaultResalePercent}%</span>
            </div>
          </div>
          {category.notes && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {category.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  // Desktop table view
  const DesktopTableView = () => (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="table-header-cell min-w-[150px]">Category</TableHead>
              <TableHead className="table-header-cell text-center min-w-[100px]">Useful Life (yrs)</TableHead>
              <TableHead className="table-header-cell text-center min-w-[80px]">Resale %</TableHead>
              <TableHead className="table-header-cell min-w-[200px] hidden md:table-cell">Notes & Assumptions</TableHead>
              <TableHead className="table-header-cell w-[80px]"></TableHead>
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
                  <TableCell className="hidden md:table-cell">
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
                        className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
    </div>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold">Category Lifespans</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage default useful life and resale percentages for equipment categories
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-info/5 border border-info/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-info mb-2 text-sm sm:text-base">How these defaults work</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            These values apply to all equipment in each category. Individual items with overrides set will use their custom values instead.
            Useful life represents <strong>competitive life</strong> (how long the equipment helps you compete), 
            not mechanical life. Resale percentages are intentionally conservative — any upside is a bonus.
          </p>
        </div>

        {/* Content */}
        {isPhone ? <MobileCardView /> : <DesktopTableView />}

        {/* Footer Note */}
        <p className="mt-4 text-xs sm:text-sm text-muted-foreground">
          Changes to category defaults apply to all equipment in that category, except items with individual overrides set.
        </p>
      </div>

      {/* Mobile edit sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh]">
          <SheetHeader>
            <SheetTitle className="text-left truncate pr-4">{selectedCategory?.category}</SheetTitle>
            <SheetDescription>
              Edit category defaults
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usefulLife">Useful Life (years)</Label>
              <Input
                id="usefulLife"
                type="number"
                min="1"
                max="20"
                value={editValues.defaultUsefulLife || ''}
                onChange={(e) => setEditValues(prev => ({ 
                  ...prev, 
                  defaultUsefulLife: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resalePercent">Resale %</Label>
              <Input
                id="resalePercent"
                type="number"
                min="0"
                max="100"
                value={editValues.defaultResalePercent || ''}
                onChange={(e) => setEditValues(prev => ({ 
                  ...prev, 
                  defaultResalePercent: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Assumptions</Label>
              <Textarea
                id="notes"
                value={editValues.notes || ''}
                onChange={(e) => setEditValues(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={3}
              />
            </div>
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={cancelEdit} className="flex-1">
              Cancel
            </Button>
            <Button onClick={saveEdit} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
