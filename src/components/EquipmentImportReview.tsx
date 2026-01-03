import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEquipment } from "@/contexts/EquipmentContext";
import { EquipmentCategory, FinancingType } from "@/types/equipment";

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

interface EditableEquipment extends ExtractedEquipment {
  selected: boolean;
  category: EquipmentCategory;
}

interface EquipmentImportReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedEquipment: ExtractedEquipment[];
  onComplete: () => void;
}

const CATEGORIES: EquipmentCategory[] = [
  'Compaction (Heavy)',
  'Compaction (Light)',
  'Excavation',
  'Handheld Power Tools',
  'Large Demo & Specialty Tools',
  'Lawn (Commercial)',
  'Lawn (Handheld)',
  'Loader (Large / Wheel)',
  'Loader (Mid-Size)',
  'Loader (Mini-Skid)',
  'Loader (Skid / CTL)',
  'Shop / Other',
  'Snow Equipment',
  'Trailer',
  'Vehicle (Commercial)',
  'Vehicle (Light-Duty)',
];

// Guess category based on make/model
const guessCategory = (make: string, model: string): EquipmentCategory => {
  const combined = `${make} ${model}`.toLowerCase();
  
  if (combined.includes('mower') || combined.includes('ztr') || combined.includes('z-turn') || 
      combined.includes('turf') || combined.includes('lawn')) {
    return 'Lawn (Commercial)';
  }
  if (combined.includes('truck') || combined.includes('f-150') || combined.includes('f150') || 
      combined.includes('f-250') || combined.includes('silverado') || combined.includes('ram') ||
      combined.includes('pickup') || combined.includes('van')) {
    if (combined.includes('dump') || combined.includes('commercial') || combined.includes('f-550') ||
        combined.includes('f-450') || combined.includes('flatbed')) {
      return 'Vehicle (Commercial)';
    }
    return 'Vehicle (Light-Duty)';
  }
  if (combined.includes('trailer')) return 'Trailer';
  if (combined.includes('trimmer') || combined.includes('edger') || combined.includes('weed') ||
      combined.includes('blower') || combined.includes('chainsaw') || combined.includes('hedge')) {
    return 'Lawn (Handheld)';
  }
  if (combined.includes('skid') || combined.includes('track loader') || combined.includes('ctl')) {
    return 'Loader (Skid / CTL)';
  }
  if (combined.includes('mini skid') || combined.includes('dingo') || combined.includes('mini-skid')) {
    return 'Loader (Mini-Skid)';
  }
  if (combined.includes('wheel loader')) return 'Loader (Large / Wheel)';
  if (combined.includes('excavator') || combined.includes('mini ex') || combined.includes('digger')) {
    return 'Excavation';
  }
  if (combined.includes('compactor') || combined.includes('roller') || combined.includes('plate')) {
    if (combined.includes('walk') || combined.includes('plate') || combined.includes('jumping')) {
      return 'Compaction (Light)';
    }
    return 'Compaction (Heavy)';
  }
  if (combined.includes('plow') || combined.includes('salt') || combined.includes('snow')) {
    return 'Snow Equipment';
  }
  if (combined.includes('drill') || combined.includes('saw') || combined.includes('grinder') ||
      combined.includes('hammer')) {
    return 'Handheld Power Tools';
  }
  if (combined.includes('breaker') || combined.includes('demo') || combined.includes('concrete')) {
    return 'Large Demo & Specialty Tools';
  }
  
  return 'Shop / Other';
};

export function EquipmentImportReview({ 
  open, 
  onOpenChange, 
  extractedEquipment,
  onComplete 
}: EquipmentImportReviewProps) {
  const { addEquipment } = useEquipment();
  const [isImporting, setIsImporting] = useState(false);
  
  const [editableEquipment, setEditableEquipment] = useState<EditableEquipment[]>(() =>
    extractedEquipment.map(eq => ({
      ...eq,
      selected: true,
      category: guessCategory(eq.make, eq.model),
    }))
  );

  const updateEquipment = (index: number, field: keyof EditableEquipment, value: any) => {
    setEditableEquipment(prev => 
      prev.map((eq, i) => i === index ? { ...eq, [field]: value } : eq)
    );
  };

  const toggleSelectAll = (selected: boolean) => {
    setEditableEquipment(prev => prev.map(eq => ({ ...eq, selected })));
  };

  const selectedCount = editableEquipment.filter(eq => eq.selected).length;

  const handleImport = async () => {
    const toImport = editableEquipment.filter(eq => eq.selected);
    if (toImport.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      for (const eq of toImport) {
        await addEquipment({
          name: `${eq.make} ${eq.model}`,
          make: eq.make,
          model: eq.model,
          year: eq.year || new Date().getFullYear(),
          category: eq.category,
          status: 'Active',
          serialVin: eq.serialVin || undefined,
          purchaseDate: eq.purchaseDate || new Date().toISOString().split('T')[0],
          purchasePrice: eq.purchasePrice || 0,
          salesTax: eq.salesTax || 0,
          freightSetup: eq.freightSetup || 0,
          otherCapEx: 0,
          cogsPercent: 80,
          replacementCostNew: eq.purchasePrice || 0,
          financingType: (eq.financingType as FinancingType) || 'owned',
          depositAmount: eq.depositAmount || 0,
          financedAmount: eq.financedAmount || 0,
          monthlyPayment: eq.monthlyPayment || 0,
          termMonths: eq.termMonths || 0,
          buyoutAmount: eq.buyoutAmount || 0,
        });
      }

      toast({
        title: "Import Successful",
        description: `${toImport.length} equipment item(s) imported successfully`,
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error importing equipment:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred while importing equipment",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Low</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Extracted Equipment</DialogTitle>
          <DialogDescription>
            Review and edit the extracted data before importing. Fields highlighted in yellow may need attention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === editableEquipment.length}
                onCheckedChange={(checked) => toggleSelectAll(!!checked)}
              />
              <span className="text-sm">
                Select All ({selectedCount}/{editableEquipment.length} selected)
              </span>
            </div>
          </div>

          {/* Equipment List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {editableEquipment.map((eq, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 space-y-3 ${
                    eq.confidence === 'low' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={eq.selected}
                        onCheckedChange={(checked) => updateEquipment(index, 'selected', !!checked)}
                      />
                      <div>
                        <p className="font-medium">{eq.make} {eq.model}</p>
                        {eq.notes && (
                          <p className="text-xs text-muted-foreground">{eq.notes}</p>
                        )}
                      </div>
                    </div>
                    {getConfidenceBadge(eq.confidence)}
                  </div>

                  {eq.selected && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-7">
                      <div>
                        <label className="text-xs text-muted-foreground">Category *</label>
                        <Select
                          value={eq.category}
                          onValueChange={(value) => updateEquipment(index, 'category', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Year</label>
                        <Input
                          type="number"
                          value={eq.year || ''}
                          onChange={(e) => updateEquipment(index, 'year', e.target.value ? parseInt(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="Year"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Serial/VIN</label>
                        <Input
                          value={eq.serialVin || ''}
                          onChange={(e) => updateEquipment(index, 'serialVin', e.target.value || null)}
                          className="h-8 text-sm"
                          placeholder="Serial/VIN"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Purchase Date</label>
                        <Input
                          type="date"
                          value={eq.purchaseDate || ''}
                          onChange={(e) => updateEquipment(index, 'purchaseDate', e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Purchase Price</label>
                        <Input
                          type="number"
                          value={eq.purchasePrice || ''}
                          onChange={(e) => updateEquipment(index, 'purchasePrice', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Sales Tax</label>
                        <Input
                          type="number"
                          value={eq.salesTax || ''}
                          onChange={(e) => updateEquipment(index, 'salesTax', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Freight/Setup</label>
                        <Input
                          type="number"
                          value={eq.freightSetup || ''}
                          onChange={(e) => updateEquipment(index, 'freightSetup', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Financing</label>
                        <Select
                          value={eq.financingType || 'owned'}
                          onValueChange={(value) => updateEquipment(index, 'financingType', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owned">Owned (Cash)</SelectItem>
                            <SelectItem value="financed">Financed</SelectItem>
                            <SelectItem value="leased">Leased</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(eq.financingType === 'financed' || eq.financingType === 'leased') && (
                        <>
                          <div>
                            <label className="text-xs text-muted-foreground">Monthly Payment</label>
                            <Input
                              type="number"
                              value={eq.monthlyPayment || ''}
                              onChange={(e) => updateEquipment(index, 'monthlyPayment', e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="$0.00"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground">Term (Months)</label>
                            <Input
                              type="number"
                              value={eq.termMonths || ''}
                              onChange={(e) => updateEquipment(index, 'termMonths', e.target.value ? parseInt(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="Months"
                            />
                          </div>

                          {eq.financingType === 'leased' && (
                            <div>
                              <label className="text-xs text-muted-foreground">Buyout Amount</label>
                              <Input
                                type="number"
                                value={eq.buyoutAmount || ''}
                                onChange={(e) => updateEquipment(index, 'buyoutAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                className="h-8 text-sm"
                                placeholder="$0.00"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
