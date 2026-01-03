import { useState } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { categoryDefaults } from '@/data/categoryDefaults';

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
}

const categories: EquipmentCategory[] = categoryDefaults.map(c => c.category);
const statuses: EquipmentStatus[] = ['Active', 'Sold', 'Retired', 'Lost'];

const defaultFormData: Omit<Equipment, 'id'> = {
  name: '',
  category: 'Truck / Vehicle',
  status: 'Active',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  purchaseDate: new Date().toISOString().split('T')[0],
  purchasePrice: 0,
  salesTax: 0,
  freightSetup: 0,
  otherCapEx: 0,
  cogsPercent: 80,
  replacementCostNew: 0,
};

export function EquipmentForm({ open, onOpenChange, equipment, onSubmit }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>(
    equipment ? { ...equipment } : { ...defaultFormData }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof Equipment, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (formData.purchasePrice <= 0) newErrors.purchasePrice = 'Must be greater than 0';
    if (formData.cogsPercent < 0 || formData.cogsPercent > 100) {
      newErrors.cogsPercent = 'Must be between 0 and 100';
    }
    if (formData.replacementCostNew <= 0) newErrors.replacementCostNew = 'Must be greater than 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Kubota KX040-4 Mini Excavator"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleChange('category', v as EquipmentCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                />
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

              <div className="col-span-2">
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Cost Basis
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  className={errors.purchasePrice ? 'border-destructive' : ''}
                />
              </div>

              <div>
                <Label htmlFor="salesTax">Sales Tax</Label>
                <Input
                  id="salesTax"
                  type="number"
                  value={formData.salesTax}
                  onChange={(e) => handleChange('salesTax', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="freightSetup">Freight / Setup</Label>
                <Input
                  id="freightSetup"
                  type="number"
                  value={formData.freightSetup}
                  onChange={(e) => handleChange('freightSetup', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="otherCapEx">Other CapEx</Label>
                <Input
                  id="otherCapEx"
                  type="number"
                  value={formData.otherCapEx}
                  onChange={(e) => handleChange('otherCapEx', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Allocation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Allocation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cogsPercent">% Used for COGS (0-100) *</Label>
                <Input
                  id="cogsPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.cogsPercent}
                  onChange={(e) => handleChange('cogsPercent', parseFloat(e.target.value) || 0)}
                  className={errors.cogsPercent ? 'border-destructive' : ''}
                />
                {errors.cogsPercent && <p className="text-xs text-destructive mt-1">{errors.cogsPercent}</p>}
              </div>
              <div>
                <Label>% Used for Overhead</Label>
                <Input
                  value={100 - formData.cogsPercent}
                  disabled
                  className="bg-field-calculated"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
              </div>
            </div>
          </div>

          {/* Replacement & Resale */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Replacement & Resale
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="replacementCostNew">Replacement Cost (Today) *</Label>
                <Input
                  id="replacementCostNew"
                  type="number"
                  value={formData.replacementCostNew}
                  onChange={(e) => handleChange('replacementCostNew', parseFloat(e.target.value) || 0)}
                  className={errors.replacementCostNew ? 'border-destructive' : ''}
                />
              </div>

              <div>
                <Label htmlFor="usefulLifeOverride">Useful Life Override (years)</Label>
                <Input
                  id="usefulLifeOverride"
                  type="number"
                  value={formData.usefulLifeOverride || ''}
                  onChange={(e) => handleChange('usefulLifeOverride', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty for category default"
                />
              </div>

              <div>
                <Label htmlFor="expectedResaleOverride">Expected Resale Override ($)</Label>
                <Input
                  id="expectedResaleOverride"
                  type="number"
                  value={formData.expectedResaleOverride || ''}
                  onChange={(e) => handleChange('expectedResaleOverride', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
          </div>

          {/* Disposal (if sold) */}
          {formData.status === 'Sold' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Disposal
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                    value={formData.salePrice || ''}
                    onChange={(e) => handleChange('salePrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

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
