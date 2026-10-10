import { useState, useEffect, useMemo } from 'react';
import { formatBenchmarkRange } from '@/lib/benchmarkUtils';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import { useCategoryDefaultsTable } from '@/hooks/useCategoryDefaultsTable';
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
import { Check, X, Pencil, ChevronRight, RotateCcw } from 'lucide-react';
import { CategoryDefaults } from '@/types/equipment';
import { useDeviceType } from '@/hooks/use-mobile';
import { parseRequiredNumber, bigLifeChangeWarning } from '@/lib/numericInput';

export default function CategoryLifespans() {
  const { categoryDefaults: sessionDefaults, updateCategoryDefaults, categoryOverrides, resetCategoryField } = useEquipment();
  const { data: tableData } = useCategoryDefaultsTable();
  const { markStepComplete } = useOnboarding();
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  const { distanceUnit } = useDistanceUnit();

  // List, order and benchmarks come from the database table. Editable fields
  // (life, resale, notes) keep today's in-session edit behaviour on top.
  const categoryDefaults = useMemo(() => {
    const base = tableData?.rows ?? sessionDefaults;
    const session = new Map(sessionDefaults.map((c) => [c.category, c]));
    return base.map((row) => {
      const s = session.get(row.category);
      return s
        ? { ...row, defaultUsefulLife: s.defaultUsefulLife, defaultResalePercent: s.defaultResalePercent, notes: s.notes }
        : row;
    });
  }, [tableData, sessionDefaults]);
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  // Text as typed; converted only on save so fast typing is never lost or turned into 0.
  const [editValues, setEditValues] = useState<{ life: string; resale: string; notes: string }>({ life: '', resale: '', notes: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [lifeWarning, setLifeWarning] = useState<string | null>(null);
  const sharedDefaultLife = (cat: string | null | undefined) =>
    (tableData?.rows ?? []).find(r => r.category === cat)?.defaultUsefulLife;
  const sharedRow = (cat: string | null | undefined) =>
    (tableData?.rows ?? []).find(r => r.category === cat);
  // Same pattern and wording as the Operating Costs rows: show the shared default and a reset link.
  const defaultNote = (cat: string, field: 'life' | 'resale') => {
    const o = categoryOverrides[cat];
    const has = field === 'life' ? o?.defaultUsefulLife !== undefined : o?.defaultResalePercent !== undefined;
    const shared = sharedRow(cat);
    if (!has || !shared) return null;
    const label = field === 'life' ? `${shared.defaultUsefulLife} yrs` : `${shared.defaultResalePercent}%`;
    return (
      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span className="text-xs text-muted-foreground">Category default: {label}</span>
        <button type="button" className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
          onClick={(e) => { e.stopPropagation(); resetCategoryField(cat, field); cancelEdit(); }}>
          <RotateCcw className="h-3 w-3" /> Reset to default
        </button>
      </div>
    );
  };
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
        life: String(category.defaultUsefulLife),
        resale: String(category.defaultResalePercent),
        notes: category.notes,
      });
      setEditError(null);
      setLifeWarning(null);
      setEditSheetOpen(true);
    } else {
      setEditingCategory(category.category);
      setEditValues({
        life: String(category.defaultUsefulLife),
        resale: String(category.defaultResalePercent),
        notes: category.notes,
      });
      setEditError(null);
      setLifeWarning(null);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValues({ life: '', resale: '', notes: '' });
    setEditError(null);
    setLifeWarning(null);
    setEditSheetOpen(false);
    setSelectedCategory(null);
  };

  const saveEdit = () => {
    const categoryName = isPhone ? selectedCategory?.category : editingCategory;
    if (!categoryName) return;
    const life = parseRequiredNumber(editValues.life, 1, 30, 'Useful life');
    if (life.ok === false) { setEditError(life.error); return; }
    if (!Number.isInteger(life.value)) { setEditError('Useful life must be whole years.'); return; }
    const resale = parseRequiredNumber(editValues.resale, 0, 100, 'Resale %');
    if (resale.ok === false) { setEditError(resale.error); return; }
    // Ask once before saving a big change from the shared default (catches 10 typed as 1).
    const warning = bigLifeChangeWarning(life.value, sharedDefaultLife(categoryName));
    if (warning && lifeWarning !== warning) { setLifeWarning(warning); setEditError(null); return; }
    updateCategoryDefaults(categoryName, { defaultUsefulLife: life.value, defaultResalePercent: resale.value, notes: editValues.notes });
    cancelEdit();
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
              {category.benchmarkRange ? (
                <span className="text-muted-foreground"> · {formatBenchmarkRange(category.benchmarkType, category.benchmarkRange, distanceUnit)}</span>
              ) : (
                <span className="text-muted-foreground"> · Calendar-based</span>
              )}
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
              <TableHead className="table-header-cell text-center min-w-[100px] whitespace-nowrap">Useful Life (yrs)</TableHead>
              <TableHead className="table-header-cell text-center min-w-[80px] whitespace-nowrap">Resale %</TableHead>
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
                        inputMode="numeric"
                        aria-label="Useful life (years)"
                        value={editValues.life}
                        onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, life: v })); setLifeWarning(null); }}
                        className="w-20 mx-auto text-center"
                      />
                    ) : (
                      <div>
                        <span className="font-mono-nums">{category.defaultUsefulLife}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatBenchmarkRange(category.benchmarkType, category.benchmarkRange, distanceUnit)}
                        </p>
                        {defaultNote(category.category, 'life')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        inputMode="decimal"
                        aria-label="Resale %"
                        value={editValues.resale}
                        onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, resale: v })); }}
                        className="w-20 mx-auto text-center"
                      />
                    ) : (
                      <div>
                        <span className="font-mono-nums">{category.defaultResalePercent}%</span>
                        {defaultNote(category.category, 'resale')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isEditing ? (
                      <Input
                        value={editValues.notes}
                        onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, notes: v })); }}
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
        {(editError || lifeWarning) && (
          <div role="alert" className={`mb-4 rounded-md border p-3 text-sm ${editError ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-warning/30 bg-warning/10'}`}>
            {editError ?? <>{lifeWarning} Press the check mark again to save anyway.</>}
          </div>
        )}
                {isPhone ? MobileCardView() : DesktopTableView()}

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
                inputMode="numeric"
                aria-label="Useful life (years)"
                value={editValues.life}
                onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, life: v })); setLifeWarning(null); }}
              />
              {selectedCategory && defaultNote(selectedCategory.category, 'life')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resalePercent">Resale %</Label>
              <Input
                id="resalePercent"
                inputMode="decimal"
                aria-label="Resale %"
                value={editValues.resale}
                onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, resale: v })); }}
              />
              {selectedCategory && defaultNote(selectedCategory.category, 'resale')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Assumptions</Label>
              <Textarea
                id="notes"
                value={editValues.notes}
                onChange={(e) => { const v = e.target.value; setEditValues(prev => ({ ...prev, notes: v })); }}
                rows={3}
              />
            </div>
          </div>
          {(editError || lifeWarning) && (
            <p role="alert" className={`text-sm pb-2 ${editError ? 'text-destructive' : ''}`}>
              {editError ?? <>{lifeWarning} Tap Save again to save anyway.</>}
            </p>
          )}
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
