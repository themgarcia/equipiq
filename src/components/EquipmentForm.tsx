import { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, FinancingType, PurchaseCondition, AllocationType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Info, ShieldCheck, Truck, Building2, UserCircle } from 'lucide-react';
import { categoryDefaults, getCategoryDivisions, getCategoriesByDivision } from '@/data/categoryDefaults';

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
}

const divisions = getCategoryDivisions();
const statuses: EquipmentStatus[] = ['Active', 'Sold', 'Retired', 'Lost'];

const financingTypes: { value: FinancingType; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'financed', label: 'Financed' },
  { value: 'leased', label: 'Leased' },
];

const purchaseConditions: { value: PurchaseCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];

const allocationCards: { value: AllocationType; label: string; description: string; icon: typeof Truck }[] = [
  { value: 'operational', label: 'Yes — Field Equipment', description: 'Goes on estimates. Recovered through COGS and overhead.', icon: Truck },
  { value: 'overhead_only', label: 'No — Overhead', description: 'Business cost not tied to specific jobs. Recovered through overhead budget.', icon: Building2 },
  { value: 'owner_perk', label: 'No — Owner Perk', description: 'Personal use on company books. Included in insurance but excluded from job costing and FMS export.', icon: UserCircle },
];

const defaultFormData: Omit<Equipment, 'id'> = {
  name: '', // Will be auto-generated
  category: categoryDefaults[0]?.category || 'Fleet — Truck — Crew Cab 3/4 Ton',
  status: 'Active',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  purchaseDate: new Date().toISOString().split('T')[0],
  purchasePrice: 0,
  salesTax: 0,
  freightSetup: 0,
  otherCapEx: 0,
  cogsPercent: 100,
  replacementCostNew: 0,
  replacementCostAsOfDate: undefined,
  // Financing defaults
  financingType: 'owned',
  depositAmount: 0,
  financedAmount: 0,
  monthlyPayment: 0,
  termMonths: 0,
  buyoutAmount: 0,
  financingStartDate: undefined,
  // Purchase condition
  purchaseCondition: 'new',
  // Allocation type
  allocationType: 'operational',
};

// Numeric fields that need blur-based validation
const numericFields = [
  'year', 'purchasePrice', 'salesTax', 'freightSetup', 'otherCapEx',
  'cogsPercent', 'replacementCostNew', 'usefulLifeOverride', 'expectedResaleOverride',
  'salePrice', 'depositAmount', 'financedAmount', 'monthlyPayment',
  'termMonths', 'buyoutAmount', 'insuranceDeclaredValue'
] as const;

type NumericField = typeof numericFields[number];

export function EquipmentForm({ open, onOpenChange, equipment, onSubmit }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>(
    equipment ? { ...equipment } : { ...defaultFormData }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [financingOpen, setFinancingOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // Sync form data when dialog opens or equipment changes
  useEffect(() => {
    if (open) {
      const initialData = equipment ? { ...equipment } : { ...defaultFormData };
      
      // Auto-populate financing start date if equipment has financing but no start date
      if (initialData.financingType !== 'owned' && !initialData.financingStartDate) {
        initialData.financingStartDate = initialData.purchaseDate;
      }
      
      setFormData(initialData);
      setErrors({});
      setFinancingOpen(false);
      setInsuranceOpen(false);
      setRawInputs({});
    }
  }, [equipment, open]);

  const handleChange = (field: keyof Equipment, value: string | number | boolean | undefined) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-set financing start date when switching to financed/leased
      if (field === 'financingType' && value !== 'owned' && !prev.financingStartDate) {
        updated.financingStartDate = prev.purchaseDate;
      }
      
      // Auto-set replacementCostAsOfDate when replacementCostNew is entered/updated
      if (field === 'replacementCostNew') {
        if (value && Number(value) > 0) {
          updated.replacementCostAsOfDate = new Date().toISOString().split('T')[0];
        } else {
          updated.replacementCostAsOfDate = undefined;
        }
      }
      
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Get the display value for a numeric input field
  const getNumericInputValue = (field: NumericField, value: number | undefined): string => {
    if (field in rawInputs) return rawInputs[field];
    if (value === undefined || value === null) return '';
    if (value === 0) return '';
    return value.toString();
  };

  // Handle typing in numeric fields - just update the raw string
  const handleNumericInputChange = (field: NumericField, rawValue: string) => {
    setRawInputs(prev => ({ ...prev, [field]: rawValue }));
  };

  // Handle blur on numeric fields - parse and validate
  const handleNumericInputBlur = (field: NumericField, isInteger: boolean = false, allowUndefined: boolean = false) => {
    const rawValue = rawInputs[field];
    if (rawValue !== undefined) {
      if (rawValue.trim() === '' && allowUndefined) {
        handleChange(field, undefined);
      } else {
        const parsed = isInteger ? parseInt(rawValue) : parseFloat(rawValue);
        handleChange(field, isNaN(parsed) ? 0 : parsed);
      }
      setRawInputs(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (formData.purchasePrice <= 0) newErrors.purchasePrice = 'Must be greater than 0';
    if (formData.cogsPercent < 0 || formData.cogsPercent > 100) {
      newErrors.cogsPercent = 'Must be between 0 and 100';
    }
    // replacementCostNew is optional - we use purchase price as fallback
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Auto-generate name from Year Make Model
      const generatedName = `${formData.year} ${formData.make.trim()} ${formData.model.trim()}`;
      onSubmit({ ...formData, name: generatedName });
      onOpenChange(false);
      setFormData({ ...defaultFormData });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identification */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleChange('category', v as EquipmentCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {divisions.map(division => (
                      <SelectGroup key={division}>
                        <SelectLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{division}</SelectLabel>
                        {getCategoriesByDivision(division).map(cat => (
                          <SelectItem key={cat.category} value={cat.category}>
                            {cat.category.replace(`${division} — `, '')}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => handleChange('status', v as EquipmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => handleChange('make', e.target.value)}
                  placeholder="e.g., Kubota"
                  className={errors.make ? 'border-destructive' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g., KX040-4"
                  className={errors.model ? 'border-destructive' : ''}
                />
              </div>

              <div>
                <Label htmlFor="purchaseCondition">Purchase Condition</Label>
                <Select 
                  value={formData.purchaseCondition} 
                  onValueChange={(v) => handleChange('purchaseCondition', v as PurchaseCondition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseConditions.map(pc => (
                      <SelectItem key={pc.value} value={pc.value}>{pc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Model Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={getNumericInputValue('year', formData.year)}
                  onChange={(e) => handleNumericInputChange('year', e.target.value)}
                  onBlur={() => handleNumericInputBlur('year', true)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.purchaseCondition === 'used' ? 'Year manufactured (may differ from purchase date)' : 'Year manufactured'}
                </p>
              </div>

              <div>
                <Label htmlFor="assetId">Asset ID (optional)</Label>
                <Input
                  id="assetId"
                  value={formData.assetId || ''}
                  onChange={(e) => handleChange('assetId', e.target.value)}
                  placeholder="e.g., EXC-001"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="serialVin">Serial / VIN (optional)</Label>
                <Input
                  id="serialVin"
                  value={formData.serialVin || ''}
                  onChange={(e) => handleChange('serialVin', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cost Basis */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Cost Basis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="purchasePrice">Purchase Price (pre-tax) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={getNumericInputValue('purchasePrice', formData.purchasePrice)}
                  onChange={(e) => handleNumericInputChange('purchasePrice', e.target.value)}
                  onBlur={() => handleNumericInputBlur('purchasePrice')}
                  className={errors.purchasePrice ? 'border-destructive' : ''}
                />
              </div>

              <div>
                <Label htmlFor="salesTax">Sales Tax</Label>
                <Input
                  id="salesTax"
                  type="number"
                  value={getNumericInputValue('salesTax', formData.salesTax)}
                  onChange={(e) => handleNumericInputChange('salesTax', e.target.value)}
                  onBlur={() => handleNumericInputBlur('salesTax')}
                />
              </div>

              <div>
                <Label htmlFor="freightSetup">Freight / Setup</Label>
                <Input
                  id="freightSetup"
                  type="number"
                  value={getNumericInputValue('freightSetup', formData.freightSetup)}
                  onChange={(e) => handleNumericInputChange('freightSetup', e.target.value)}
                  onBlur={() => handleNumericInputBlur('freightSetup')}
                />
              </div>

              <div>
                <Label htmlFor="otherCapEx">Other CapEx</Label>
                <Input
                  id="otherCapEx"
                  type="number"
                  value={getNumericInputValue('otherCapEx', formData.otherCapEx)}
                  onChange={(e) => handleNumericInputChange('otherCapEx', e.target.value)}
                  onBlur={() => handleNumericInputBlur('otherCapEx')}
                />
              </div>
            </div>
          </div>

          {/* LMN Allocation */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                LMN Allocation
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Controls how this equipment flows into your LMN budget.</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Do you charge clients for this equipment?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {allocationCards.map(card => {
                  const Icon = card.icon;
                  const isSelected = formData.allocationType === card.value;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => {
                        handleChange('allocationType', card.value);
                        if (card.value === 'owner_perk') {
                          handleChange('cogsPercent', 0);
                        }
                      }}
                      className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground'}`}>{card.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{card.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cogsPercent">% Used for COGS (0-100) *</Label>
                <Input
                  id="cogsPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={getNumericInputValue('cogsPercent', formData.cogsPercent)}
                  onChange={(e) => handleNumericInputChange('cogsPercent', e.target.value)}
                  onBlur={() => handleNumericInputBlur('cogsPercent')}
                  className={errors.cogsPercent ? 'border-destructive' : ''}
                  disabled={formData.allocationType === 'owner_perk'}
                />
                {errors.cogsPercent && <p className="text-xs text-destructive mt-1">{errors.cogsPercent}</p>}
              </div>
              <div>
                <Label>% Used for Overhead</Label>
                <Input
                  value={formData.allocationType === 'owner_perk' ? 0 : 100 - formData.cogsPercent}
                  disabled
                  className="bg-field-calculated"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
              </div>
            </div>
          </div>

          {/* Replacement & Resale */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Replacement & Resale
            </h3>
          {formData.purchaseCondition === 'used' && !formData.replacementCostNew && (
              <div className="rounded-md border border-warning/50 bg-warning/10 p-3 flex gap-2">
                <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">You bought this used for ${formData.purchasePrice.toLocaleString()}.</p>
                  <p className="text-muted-foreground mt-1">What would a new equivalent cost today? This ensures your rates build enough reserve to actually replace it.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={formData.purchaseCondition === 'used' && !formData.replacementCostNew ? 'sm:col-span-2' : ''}>
                <Label htmlFor="replacementCostNew">
                  {formData.purchaseCondition === 'used' ? 'New Replacement Cost (Today) — Recommended' : 'Replacement Cost (Today)'}
                </Label>
                <Input
                  id="replacementCostNew"
                  type="number"
                  value={getNumericInputValue('replacementCostNew', formData.replacementCostNew)}
                  onChange={(e) => handleNumericInputChange('replacementCostNew', e.target.value)}
                  onBlur={() => handleNumericInputBlur('replacementCostNew')}
                  placeholder={formData.purchaseCondition === 'used' ? 'What would a new equivalent cost today?' : 'Auto-calculated with 3% inflation'}
                  className={formData.purchaseCondition === 'used' && !formData.replacementCostNew ? 'border-warning/50' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for inflation-adjusted estimate</p>
              </div>

              <div>
                <Label htmlFor="usefulLifeOverride">Useful Life Override (years)</Label>
                <Input
                  id="usefulLifeOverride"
                  type="number"
                  value={getNumericInputValue('usefulLifeOverride', formData.usefulLifeOverride)}
                  onChange={(e) => handleNumericInputChange('usefulLifeOverride', e.target.value)}
                  onBlur={() => handleNumericInputBlur('usefulLifeOverride', true, true)}
                  placeholder="Leave empty for category default"
                />
              </div>

              <div>
                <Label htmlFor="expectedResaleOverride">Expected Resale Override ($)</Label>
                <Input
                  id="expectedResaleOverride"
                  type="number"
                  value={getNumericInputValue('expectedResaleOverride', formData.expectedResaleOverride)}
                  onChange={(e) => handleNumericInputChange('expectedResaleOverride', e.target.value)}
                  onBlur={() => handleNumericInputBlur('expectedResaleOverride', false, true)}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
          </div>

          {/* Disposal (if sold) */}
          {formData.status === 'Sold' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Disposal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saleDate">Sale Date</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate || ''}
                    onChange={(e) => handleChange('saleDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={getNumericInputValue('salePrice', formData.salePrice ?? undefined)}
                    onChange={(e) => handleNumericInputChange('salePrice', e.target.value)}
                    onBlur={() => handleNumericInputBlur('salePrice')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Financing (Cashflow Visibility Only) */}
          <Collapsible open={financingOpen} onOpenChange={setFinancingOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
              <h3 className="text-sm font-medium text-muted-foreground">
                Financing (Cashflow Visibility Only)
              </h3>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${financingOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Disclaimer */}
              <div className="bg-muted/50 border rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Financing and deposits affect cashflow only. They do not change equipment pricing.</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financingType">Financing Type</Label>
                  <Select 
                    value={formData.financingType} 
                    onValueChange={(v) => handleChange('financingType', v as FinancingType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {financingTypes.map(ft => (
                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="financingStartDate">Financing Start Date</Label>
                  <Input
                    id="financingStartDate"
                    type="date"
                    value={formData.financingStartDate || ''}
                    onChange={(e) => handleChange('financingStartDate', e.target.value)}
                    disabled={formData.financingType === 'owned'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Defaults to purchase date</p>
                </div>

                <div>
                  <Label htmlFor="depositAmount">Deposit / Down Payment ($)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={getNumericInputValue('depositAmount', formData.depositAmount)}
                    onChange={(e) => handleNumericInputChange('depositAmount', e.target.value)}
                    onBlur={() => handleNumericInputBlur('depositAmount')}
                    disabled={formData.financingType === 'owned'}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="financedAmount">Financed Amount ($)</Label>
                  <Input
                    id="financedAmount"
                    type="number"
                    value={getNumericInputValue('financedAmount', formData.financedAmount)}
                    onChange={(e) => handleNumericInputChange('financedAmount', e.target.value)}
                    onBlur={() => handleNumericInputBlur('financedAmount')}
                    disabled={formData.financingType === 'owned'}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    value={getNumericInputValue('monthlyPayment', formData.monthlyPayment)}
                    onChange={(e) => handleNumericInputChange('monthlyPayment', e.target.value)}
                    onBlur={() => handleNumericInputBlur('monthlyPayment')}
                    disabled={formData.financingType === 'owned'}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="termMonths">Term (months)</Label>
                  <Input
                    id="termMonths"
                    type="number"
                    value={getNumericInputValue('termMonths', formData.termMonths)}
                    onChange={(e) => handleNumericInputChange('termMonths', e.target.value)}
                    onBlur={() => handleNumericInputBlur('termMonths', true)}
                    disabled={formData.financingType === 'owned'}
                    placeholder="0"
                  />
                </div>

                {formData.financingType === 'leased' && (
                  <div className="col-span-2">
                    <Label htmlFor="buyoutAmount">Buyout Amount ($)</Label>
                    <Input
                      id="buyoutAmount"
                      type="number"
                      value={getNumericInputValue('buyoutAmount', formData.buyoutAmount)}
                      onChange={(e) => handleNumericInputChange('buyoutAmount', e.target.value)}
                      onBlur={() => handleNumericInputBlur('buyoutAmount')}
                      placeholder="End-of-lease purchase option"
                    />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Insurance */}
          <Collapsible open={insuranceOpen} onOpenChange={setInsuranceOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Insurance
                </h3>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${insuranceOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="bg-muted/50 border rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Track this equipment on your insurance policy. Changes are logged for broker communication.</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="isInsured"
                    checked={formData.isInsured === true}
                    onCheckedChange={(checked) => {
                      handleChange('isInsured', checked === true ? true : (checked === false ? false : undefined));
                      // Auto-populate declared value if enabling insurance
                      if (checked === true && !formData.insuranceDeclaredValue) {
                        handleChange('insuranceDeclaredValue', formData.purchasePrice);
                      }
                    }}
                  />
                  <Label htmlFor="isInsured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    This equipment is insured
                  </Label>
                </div>

                <div>
                  <Label htmlFor="insuranceDeclaredValue">Declared Value ($)</Label>
                  <Input
                    id="insuranceDeclaredValue"
                    type="number"
                    value={getNumericInputValue('insuranceDeclaredValue', formData.insuranceDeclaredValue ?? undefined)}
                    onChange={(e) => handleNumericInputChange('insuranceDeclaredValue', e.target.value)}
                    onBlur={() => handleNumericInputBlur('insuranceDeclaredValue', false, true)}
                    placeholder={formData.purchasePrice?.toString() || '0'}
                    disabled={!formData.isInsured}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Value declared to your insurer</p>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="insuranceNotes">Insurance Notes</Label>
                  <Textarea
                    id="insuranceNotes"
                    value={formData.insuranceNotes || ''}
                    onChange={(e) => handleChange('insuranceNotes', e.target.value)}
                    placeholder="Policy reference, special coverage notes, etc."
                    disabled={!formData.isInsured}
                    rows={2}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {equipment ? 'Save Changes' : 'Add Equipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
