import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check, Copy, AlertCircle, RefreshCw, FileText, ChevronDown, ChevronUp, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEquipment } from "@/contexts/EquipmentContext";
import { Equipment, EquipmentCategory, FinancingType, UpdatableField } from "@/types/equipment";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  suggestedType?: 'equipment' | 'attachment';
  suggestedParentIndex?: number | null;
  purchaseCondition?: 'new' | 'used' | null;
  suggestedCategory?: EquipmentCategory | null;
}

type DuplicateStatus = 'none' | 'exact' | 'potential';
type DuplicateFilter = 'all' | 'no-duplicates' | 'only-duplicates';
type DuplicateReason = 'serial' | 'year' | 'price' | 'date' | null;
type ImportMode = 'new' | 'update_existing' | 'skip' | 'attachment';

interface EditableEquipment extends ExtractedEquipment {
  tempId: string;
  selected: boolean;
  category: EquipmentCategory;
  duplicateStatus: DuplicateStatus;
  duplicateReason: DuplicateReason;
  matchedEquipmentId?: string;
  matchedEquipmentName?: string;
  matchedPurchaseDate?: string;
  matchedEquipment?: Equipment;
  importMode: ImportMode;
  updatableFields: UpdatableField[];
  // Attachment-specific fields
  suggestedType: 'equipment' | 'attachment';
  suggestedParentIndex: number | null;
  selectedParentId?: string; // ID of existing equipment as parent
  selectedParentTempId?: string; // tempId of equipment from this import batch
  yearDefaultedFromPurchase?: boolean;
}

interface EquipmentImportReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedEquipment: ExtractedEquipment[];
  onComplete: () => void;
  sourceFile?: File; // Original file that was parsed
}

const CATEGORIES: EquipmentCategory[] = [
  'Compaction (Heavy)',
  'Compaction (Light)',
  'Excavator – Compact (≤ 6 ton)',
  'Excavator – Mid-Size (6–12 ton)',
  'Excavator – Large (12+ ton)',
  'Handheld Power Tools',
  'Large Demo & Specialty Tools',
  'Lawn (Commercial)',
  'Lawn (Handheld)',
  'Loader – Skid Steer Mini',
  'Loader – Skid Steer',
  'Loader – Mid-Size',
  'Loader – Wheel / Large',
  'Shop / Other',
  'Snow Equipment',
  'Trailer',
  'Vehicle (Commercial)',
  'Vehicle (Light-Duty)',
];

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  serialVin: 'Serial/VIN',
  purchaseDate: 'Purchase Date',
  purchasePrice: 'Purchase Price',
  salesTax: 'Sales Tax',
  freightSetup: 'Freight/Setup',
  financingType: 'Financing Type',
  depositAmount: 'Deposit',
  financedAmount: 'Financed Amount',
  monthlyPayment: 'Monthly Payment',
  termMonths: 'Term (Months)',
  buyoutAmount: 'Buyout Amount',
  purchaseCondition: 'Purchase Condition',
};

// Normalize serial/VIN for comparison
const normalizeSerial = (serial: string | null | undefined): string => {
  if (!serial) return '';
  return serial.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Normalize make/model for fuzzy matching
const normalizeKey = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Parse date string safely
const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }
  return null;
};

// Calculate days difference between two dates
const daysDifference = (date1: Date, date2: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / msPerDay));
};

// Check if two make/model pairs match (fuzzy)
const modelsMatch = (
  extractedMake: string, 
  extractedModel: string, 
  existingMake: string, 
  existingModel: string
): boolean => {
  const exMake = normalizeKey(extractedMake);
  const exModel = normalizeKey(extractedModel);
  const esMake = normalizeKey(existingMake);
  const esModel = normalizeKey(existingModel);
  
  if (exMake.length < 2 || esModel.length < 2) return false;
  
  const makeMatches = exMake === esMake || 
    (exMake.length >= 3 && esMake.includes(exMake)) || 
    (esMake.length >= 3 && exMake.includes(esMake));
  
  const modelMatches = exModel === esModel || 
    (exModel.length >= 3 && esModel.includes(exModel)) || 
    (esModel.length >= 3 && exModel.includes(esModel));
  
  return makeMatches && modelMatches;
};

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
  if (combined.includes('mini skid') || combined.includes('dingo') || combined.includes('mini-skid')) {
    return 'Loader – Skid Steer Mini';
  }
  if (combined.includes('skid') || combined.includes('track loader') || combined.includes('ctl')) {
    return 'Loader – Skid Steer';
  }
  if (combined.includes('wheel loader')) return 'Loader – Wheel / Large';
  if (combined.includes('excavator') || combined.includes('mini ex') || combined.includes('digger')) {
    return 'Excavator – Compact (≤ 6 ton)';
  }
if (combined.includes('compactor') || combined.includes('roller') || combined.includes('plate') || 
      combined.includes('rammer') || combined.includes('tamping') || combined.includes('tamper')) {
    if (combined.includes('walk') || combined.includes('plate') || combined.includes('jumping') || 
        combined.includes('rammer') || combined.includes('tamping') || combined.includes('tamper')) {
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

// Check if a field is empty/default in the existing equipment
const isFieldEmpty = (value: any, field: string): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'number' && value === 0) {
    // Some numeric fields being 0 is meaningful, others are "empty"
    const zeroMeansEmpty = ['salesTax', 'freightSetup', 'depositAmount', 'financedAmount', 'monthlyPayment', 'termMonths', 'buyoutAmount'];
    return zeroMeansEmpty.includes(field);
  }
  if (field === 'financingType' && value === 'owned') return false; // owned is a valid default
  return false;
};

// Get updatable fields by comparing existing vs extracted
const getUpdatableFields = (existing: Equipment, extracted: Partial<ExtractedEquipment>): UpdatableField[] => {
  const fields: UpdatableField[] = [];
  const checkFields: (keyof Equipment)[] = [
    'serialVin', 'purchaseDate', 'purchasePrice', 'salesTax', 'freightSetup',
    'financingType', 'depositAmount', 'financedAmount', 'monthlyPayment', 'termMonths', 'buyoutAmount',
    'purchaseCondition'
  ];

  for (const field of checkFields) {
    const existingValue = existing[field];
    const importedValue = extracted[field as keyof ExtractedEquipment];
    
    // Only show if existing is empty/default and imported has a value
    const existingEmpty = isFieldEmpty(existingValue, field);
    const importedHasValue = importedValue !== null && importedValue !== undefined && importedValue !== '';
    
    if (existingEmpty && importedHasValue) {
      fields.push({
        field,
        label: FIELD_LABELS[field] || field,
        existingValue,
        importedValue,
        willUpdate: true,
      });
    }
  }

  return fields;
};

// Format value for display
const formatValue = (value: any, field: string): string => {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (field === 'purchasePrice' || field === 'salesTax' || field === 'freightSetup' || 
      field === 'depositAmount' || field === 'financedAmount' || field === 'monthlyPayment' || field === 'buyoutAmount') {
    return `$${Number(value).toLocaleString()}`;
  }
  if (field === 'termMonths') return `${value} months`;
  return String(value);
};

export function EquipmentImportReview({ 
  open, 
  onOpenChange, 
  extractedEquipment,
  onComplete,
  sourceFile
}: EquipmentImportReviewProps) {
  const { addEquipment, updateEquipment, equipment, uploadDocument, addAttachment } = useEquipment();
  const [isImporting, setIsImporting] = useState(false);
  const [duplicateFilter, setDuplicateFilter] = useState<DuplicateFilter>('all');
  const [attachSourceDocument, setAttachSourceDocument] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const [editableEquipment, setEditableEquipment] = useState<EditableEquipment[]>([]);

  // Duplicate checking function
  const checkForDuplicates = useCallback((extracted: Partial<EditableEquipment>): { 
    status: DuplicateStatus; 
    reason: DuplicateReason;
    matchedId?: string; 
    matchedName?: string;
    matchedPurchaseDate?: string;
    matchedEquipment?: Equipment;
    updatableFields: UpdatableField[];
  } => {
    const normalizedSerial = normalizeSerial(extracted.serialVin);
    
    for (const existing of equipment) {
      // Exact match: Serial/VIN (normalized)
      const existingSerialNorm = normalizeSerial(existing.serialVin);
      if (normalizedSerial && existingSerialNorm && normalizedSerial === existingSerialNorm) {
        const updatableFields = getUpdatableFields(existing, extracted);
        return { 
          status: 'exact', 
          reason: 'serial',
          matchedId: existing.id, 
          matchedName: `${existing.year} ${existing.make} ${existing.model}`,
          matchedEquipment: existing,
          updatableFields,
        };
      }
      
      // Check if make/model match (fuzzy)
      const sameModel = modelsMatch(
        extracted.make || '', 
        extracted.model || '', 
        existing.make, 
        existing.model
      );
      
      if (!sameModel) continue;
      
      // Potential match: Make + Model + Year
      if (extracted.year === existing.year) {
        const updatableFields = getUpdatableFields(existing, extracted);
        return { 
          status: 'potential', 
          reason: 'year',
          matchedId: existing.id, 
          matchedName: `${existing.year} ${existing.make} ${existing.model}`,
          matchedEquipment: existing,
          updatableFields,
        };
      }
      
      // Potential match: Make + Model with similar purchase price (within 10%)
      if (extracted.purchasePrice && existing.purchasePrice) {
        const priceDiff = Math.abs(extracted.purchasePrice - existing.purchasePrice) / existing.purchasePrice;
        if (priceDiff <= 0.1) {
          const updatableFields = getUpdatableFields(existing, extracted);
          return { 
            status: 'potential', 
            reason: 'price',
            matchedId: existing.id, 
            matchedName: `${existing.year} ${existing.make} ${existing.model}`,
            matchedEquipment: existing,
            updatableFields,
          };
        }
      }
      
      // Potential match: Make + Model with purchase date within 30 days
      const extractedDate = parseDate(extracted.purchaseDate);
      const existingDate = parseDate(existing.purchaseDate);
      if (extractedDate && existingDate) {
        const daysDiff = daysDifference(extractedDate, existingDate);
        if (daysDiff <= 30) {
          const updatableFields = getUpdatableFields(existing, extracted);
          return { 
            status: 'potential', 
            reason: 'date',
            matchedId: existing.id, 
            matchedName: `${existing.year} ${existing.make} ${existing.model}`,
            matchedPurchaseDate: existing.purchaseDate,
            matchedEquipment: existing,
            updatableFields,
          };
        }
      }
    }
    
    return { status: 'none', reason: null, updatableFields: [] };
  }, [equipment]);

  // Initialize editable equipment when extractedEquipment changes
  useEffect(() => {
    const mapped = extractedEquipment.map((eq, index) => {
      const duplicateCheck = checkForDuplicates(eq);
      const hasUpdatableFields = duplicateCheck.updatableFields.length > 0;
      const suggestedType = eq.suggestedType || 'equipment';
      const suggestedParentIndex = eq.suggestedParentIndex ?? null;
      
      // Default mode: 
      // - attachment if AI suggests it
      // - update_existing if there are fields to update
      // - new otherwise (or skip for exact with no updates)
      let defaultMode: ImportMode = 'new';
      if (suggestedType === 'attachment') {
        defaultMode = 'attachment';
      } else if (duplicateCheck.status === 'exact') {
        defaultMode = hasUpdatableFields ? 'update_existing' : 'skip';
      } else if (duplicateCheck.status === 'potential' && hasUpdatableFields) {
        defaultMode = 'update_existing';
      }
      
      return {
        ...eq,
        tempId: `import-${index}-${Date.now()}`,
        selected: defaultMode !== 'skip',
        category: eq.suggestedCategory || guessCategory(eq.make, eq.model),
        yearDefaultedFromPurchase: !eq.year && !!eq.purchaseDate,
        duplicateStatus: duplicateCheck.status,
        duplicateReason: duplicateCheck.reason,
        matchedEquipmentId: duplicateCheck.matchedId,
        matchedEquipmentName: duplicateCheck.matchedName,
        matchedPurchaseDate: duplicateCheck.matchedPurchaseDate,
        matchedEquipment: duplicateCheck.matchedEquipment,
        importMode: defaultMode,
        updatableFields: duplicateCheck.updatableFields,
        suggestedType,
        suggestedParentIndex,
        // Pre-select parent if AI suggested one
        selectedParentTempId: suggestedParentIndex !== null ? `import-${suggestedParentIndex}-${Date.now()}` : undefined,
      };
    });
    
    // Fix parent tempId references now that we have all tempIds
    const tempIds = mapped.map(m => m.tempId);
    mapped.forEach((eq, index) => {
      if (eq.suggestedParentIndex !== null && eq.suggestedParentIndex >= 0 && eq.suggestedParentIndex < tempIds.length) {
        eq.selectedParentTempId = tempIds[eq.suggestedParentIndex];
      }
    });
    
    setEditableEquipment(mapped);
    
    // Auto-expand items with updatable fields or attachments
    const toExpand = new Set<string>();
    mapped.forEach(eq => {
      if (eq.updatableFields.length > 0 || eq.importMode === 'attachment') {
        toExpand.add(eq.tempId);
      }
    });
    setExpandedItems(toExpand);
  }, [extractedEquipment, checkForDuplicates]);

  // Duplicate counts
  const duplicateCounts = useMemo(() => {
    const exact = editableEquipment.filter(eq => eq.duplicateStatus === 'exact').length;
    const potential = editableEquipment.filter(eq => eq.duplicateStatus === 'potential').length;
    const withUpdates = editableEquipment.filter(eq => eq.updatableFields.length > 0).length;
    return { exact, potential, total: exact + potential, withUpdates };
  }, [editableEquipment]);

  // Filtered equipment based on duplicate filter
  const filteredEquipment = useMemo(() => {
    switch (duplicateFilter) {
      case 'no-duplicates':
        return editableEquipment.filter(eq => eq.duplicateStatus === 'none');
      case 'only-duplicates':
        return editableEquipment.filter(eq => eq.duplicateStatus !== 'none');
      default:
        return editableEquipment;
    }
  }, [editableEquipment, duplicateFilter]);

  // Fields that should trigger re-checking duplicates
  const duplicateCheckFields: (keyof EditableEquipment)[] = [
    'make', 'model', 'year', 'serialVin', 'purchaseDate', 'purchasePrice'
  ];

  const updateEquipmentItem = (tempId: string, field: keyof EditableEquipment, value: any) => {
    setEditableEquipment(prev => 
      prev.map((eq) => {
        if (eq.tempId !== tempId) return eq;
        
        const updated = { ...eq, [field]: value };
        
        // Re-check duplicates if a relevant field changed
        if (duplicateCheckFields.includes(field)) {
          const duplicateCheck = checkForDuplicates(updated);
          updated.duplicateStatus = duplicateCheck.status;
          updated.duplicateReason = duplicateCheck.reason;
          updated.matchedEquipmentId = duplicateCheck.matchedId;
          updated.matchedEquipmentName = duplicateCheck.matchedName;
          updated.matchedPurchaseDate = duplicateCheck.matchedPurchaseDate;
          updated.matchedEquipment = duplicateCheck.matchedEquipment;
          updated.updatableFields = duplicateCheck.updatableFields;
          
          // Auto-adjust mode based on duplicate status
          if (duplicateCheck.status === 'none') {
            updated.importMode = 'new';
          } else if (duplicateCheck.status === 'exact' && duplicateCheck.updatableFields.length === 0) {
            updated.importMode = 'skip';
            updated.selected = false;
          }
        }
        
        return updated;
      })
    );
  };

  const toggleSelectAll = (selected: boolean) => {
    setEditableEquipment(prev => prev.map(eq => ({ 
      ...eq, 
      selected: eq.importMode === 'skip' ? false : selected 
    })));
  };

  const toggleExpanded = (tempId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tempId)) {
        newSet.delete(tempId);
      } else {
        newSet.add(tempId);
      }
      return newSet;
    });
  };

  const setImportMode = (tempId: string, mode: ImportMode) => {
    setEditableEquipment(prev => 
      prev.map((eq) => {
        if (eq.tempId !== tempId) return eq;
        return { 
          ...eq, 
          importMode: mode,
          selected: mode !== 'skip',
        };
      })
    );
  };

  const selectedCount = editableEquipment.filter(eq => eq.selected).length;
  const updateCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'update_existing').length;
  const newCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'new').length;
  const attachmentCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'attachment').length;

  // Get potential parents for attachment selection
  const potentialParentsFromImport = editableEquipment.filter(eq => 
    eq.importMode === 'new' || eq.importMode === 'update_existing'
  );

  const setParentForAttachment = (tempId: string, parentValue: string) => {
    setEditableEquipment(prev => 
      prev.map(eq => {
        if (eq.tempId !== tempId) return eq;
        // Check if it's a temp ID (from this import) or an existing equipment ID
        if (parentValue.startsWith('temp:')) {
          return { ...eq, selectedParentTempId: parentValue.replace('temp:', ''), selectedParentId: undefined };
        } else {
          return { ...eq, selectedParentId: parentValue, selectedParentTempId: undefined };
        }
      })
    );
  };

  const getDuplicateBadge = (eq: EditableEquipment) => {
    if (eq.duplicateStatus === 'exact') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          <Copy className="h-3 w-3" />
          <span>Matches "{eq.matchedEquipmentName}" (same serial/VIN)</span>
        </div>
      );
    }
    if (eq.duplicateStatus === 'potential') {
      let reasonText = 'similar to';
      if (eq.duplicateReason === 'year') {
        reasonText = 'same make/model/year as';
      } else if (eq.duplicateReason === 'price') {
        reasonText = 'same make/model, similar price as';
      } else if (eq.duplicateReason === 'date') {
        const dateInfo = eq.matchedPurchaseDate ? ` (purchased ${eq.matchedPurchaseDate})` : '';
        return (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3" />
            <span>Possible match: same make/model, date within 30 days of "{eq.matchedEquipmentName}"{dateInfo}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded">
          <AlertCircle className="h-3 w-3" />
          <span>Possible match: {reasonText} "{eq.matchedEquipmentName}"</span>
        </div>
      );
    }
    return null;
  };

  const handleImport = async () => {
    const toProcess = editableEquipment.filter(eq => eq.selected);
    if (toProcess.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to import or update",
        variant: "destructive",
      });
      return;
    }

    // Validate attachments have parents selected
    const attachmentsWithoutParents = toProcess.filter(eq => 
      eq.importMode === 'attachment' && !eq.selectedParentId && !eq.selectedParentTempId
    );
    if (attachmentsWithoutParents.length > 0) {
      toast({
        title: "Parent not selected",
        description: "Please select a parent equipment for all attachments",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    let newCount = 0;
    let updateCount = 0;
    let attachmentImportCount = 0;
    const importedEquipmentIds: string[] = [];
    const tempIdToRealId: Map<string, string> = new Map();

    try {
      // First pass: Import all equipment (non-attachments) and updates
      for (const eq of toProcess) {
        if (eq.importMode === 'update_existing' && eq.matchedEquipmentId) {
          // Build updates object with only the fields we want to fill in
          const updates: Partial<Equipment> = {};
          
          for (const field of eq.updatableFields) {
            if (field.willUpdate) {
              (updates as any)[field.field] = field.importedValue;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await updateEquipment(eq.matchedEquipmentId, updates);
            importedEquipmentIds.push(eq.matchedEquipmentId);
            tempIdToRealId.set(eq.tempId, eq.matchedEquipmentId);
            updateCount++;
          }
        } else if (eq.importMode === 'new') {
          const newId = await addEquipment({
            name: `${eq.make} ${eq.model}`,
            make: eq.make,
            model: eq.model,
            year: eq.year || (eq.purchaseDate ? new Date(eq.purchaseDate).getFullYear() : new Date().getFullYear()),
            category: eq.category,
            status: 'Active',
            serialVin: eq.serialVin || undefined,
            purchaseDate: eq.purchaseDate || new Date().toISOString().split('T')[0],
            purchasePrice: eq.purchasePrice || 0,
            salesTax: eq.salesTax || 0,
            freightSetup: eq.freightSetup || 0,
            otherCapEx: 0,
            cogsPercent: 100,
            replacementCostNew: 0,
            financingType: (eq.financingType as FinancingType) || 'owned',
            depositAmount: eq.depositAmount || 0,
            financedAmount: eq.financedAmount || 0,
            monthlyPayment: eq.monthlyPayment || 0,
            termMonths: eq.termMonths || 0,
            buyoutAmount: eq.buyoutAmount || 0,
            purchaseCondition: (eq.purchaseCondition as 'new' | 'used') || 'new',
          });
          if (newId) {
            importedEquipmentIds.push(newId);
            tempIdToRealId.set(eq.tempId, newId);
          }
          newCount++;
        }
      }

      // Second pass: Import attachments
      for (const eq of toProcess.filter(e => e.importMode === 'attachment')) {
        let parentId = eq.selectedParentId;
        
        // If parent was from this import batch, get its real ID
        if (eq.selectedParentTempId) {
          parentId = tempIdToRealId.get(eq.selectedParentTempId);
        }
        
        if (parentId) {
          await addAttachment(parentId, {
            name: `${eq.make} ${eq.model}`,
            value: eq.purchasePrice || 0,
            serialNumber: eq.serialVin || undefined,
            description: eq.notes || undefined,
          });
          attachmentImportCount++;
        }
      }

      // Attach source document if requested
      if (attachSourceDocument && sourceFile && importedEquipmentIds.length > 0) {
        // Attach to the first updated/imported item
        try {
          await uploadDocument(importedEquipmentIds[0], sourceFile, 'Source document from import');
        } catch (error) {
          console.error('Failed to attach source document:', error);
        }
      }

      // Build success message
      const parts = [];
      if (newCount > 0) parts.push(`${newCount} new equipment`);
      if (updateCount > 0) parts.push(`${updateCount} updated`);
      if (attachmentImportCount > 0) parts.push(`${attachmentImportCount} attachment${attachmentImportCount !== 1 ? 's' : ''}`);

      toast({
        title: "Import Successful",
        description: parts.join(', '),
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
            Review and edit the extracted data before importing. Items matching existing equipment can update missing fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duplicate Summary */}
          {duplicateCounts.total > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">
                {duplicateCounts.exact > 0 && `${duplicateCounts.exact} exact match${duplicateCounts.exact !== 1 ? 'es' : ''}`}
                {duplicateCounts.exact > 0 && duplicateCounts.potential > 0 && ', '}
                {duplicateCounts.potential > 0 && `${duplicateCounts.potential} potential match${duplicateCounts.potential !== 1 ? 'es' : ''}`}
                {duplicateCounts.withUpdates > 0 && ` (${duplicateCounts.withUpdates} with fields to update)`}
              </span>
            </div>
          )}

          {/* Select All & Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === editableEquipment.filter(eq => eq.importMode !== 'skip').length && selectedCount > 0}
                onCheckedChange={(checked) => toggleSelectAll(!!checked)}
              />
              <span className="text-sm">
                Select All ({selectedCount}/{editableEquipment.length} selected)
              </span>
            </div>
            
            {duplicateCounts.total > 0 && (
              <div className="flex gap-1">
                <Button
                  variant={duplicateFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDuplicateFilter('all')}
                  className="h-7 text-xs"
                >
                  Show All
                </Button>
                <Button
                  variant={duplicateFilter === 'no-duplicates' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDuplicateFilter('no-duplicates')}
                  className="h-7 text-xs"
                >
                  New Only
                </Button>
                <Button
                  variant={duplicateFilter === 'only-duplicates' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDuplicateFilter('only-duplicates')}
                  className="h-7 text-xs"
                >
                  Matches Only
                </Button>
              </div>
            )}
          </div>

          {/* Attach Source Document Option */}
          {sourceFile && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Checkbox
                checked={attachSourceDocument}
                onCheckedChange={(checked) => setAttachSourceDocument(!!checked)}
              />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Attach source document ({sourceFile.name}) to imported items
              </span>
            </div>
          )}

          {/* Equipment List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {filteredEquipment.map((eq) => (
                <div
                  key={eq.tempId}
                  className={`border rounded-lg p-4 space-y-3 ${
                    eq.importMode === 'skip'
                      ? 'opacity-50 bg-muted/30'
                      : eq.duplicateStatus === 'exact' 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : eq.duplicateStatus === 'potential'
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : eq.confidence === 'low' 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={eq.selected}
                        disabled={eq.importMode === 'skip' && eq.updatableFields.length === 0}
                        onCheckedChange={(checked) => updateEquipmentItem(eq.tempId, 'selected', !!checked)}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">{eq.make} {eq.model}</p>
                        {getDuplicateBadge(eq)}
                        {eq.notes && (
                          <p className="text-xs text-muted-foreground">{eq.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(eq.confidence)}
                      {eq.duplicateStatus !== 'none' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => toggleExpanded(eq.tempId)}
                        >
                          {expandedItems.has(eq.tempId) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* AI Suggested Attachment Indicator */}
                  {eq.suggestedType === 'attachment' && eq.importMode !== 'attachment' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-500/10 px-2 py-1 rounded ml-7">
                      <Link className="h-3 w-3" />
                      <span>AI suggests this may be an attachment</span>
                    </div>
                  )}

                  {/* Import Mode Selection - always show for all items */}
                  <div className="flex gap-2 pl-7 flex-wrap">
                    {eq.duplicateStatus !== 'none' && (
                      <Button
                        variant={eq.importMode === 'update_existing' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setImportMode(eq.tempId, 'update_existing')}
                        disabled={eq.updatableFields.length === 0}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Update Existing
                        {eq.updatableFields.length > 0 && ` (${eq.updatableFields.length} fields)`}
                      </Button>
                    )}
                    <Button
                      variant={eq.importMode === 'new' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'new')}
                    >
                      Import as Equipment
                    </Button>
                    <Button
                      variant={eq.importMode === 'attachment' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'attachment')}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Import as Attachment
                      {eq.suggestedType === 'attachment' && <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Suggested</Badge>}
                    </Button>
                    <Button
                      variant={eq.importMode === 'skip' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'skip')}
                    >
                      Skip
                    </Button>
                  </div>

                  {/* Parent Selection for Attachments */}
                  {eq.importMode === 'attachment' && (
                    <div className="pl-7 pt-2 space-y-2">
                      <label className="text-xs font-medium">Attach to:</label>
                      <Select
                        value={eq.selectedParentId || (eq.selectedParentTempId ? `temp:${eq.selectedParentTempId}` : '')}
                        onValueChange={(value) => setParentForAttachment(eq.tempId, value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select parent equipment..." />
                        </SelectTrigger>
                        <SelectContent>
                          {potentialParentsFromImport.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>From this import</SelectLabel>
                              {potentialParentsFromImport
                                .filter(other => other.tempId !== eq.tempId)
                                .map(other => (
                                  <SelectItem key={other.tempId} value={`temp:${other.tempId}`}>
                                    {other.make} {other.model} {other.year ? `(${other.year})` : ''}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                          {equipment.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Existing equipment</SelectLabel>
                              {equipment.map(existing => (
                                <SelectItem key={existing.id} value={existing.id}>
                                  {existing.year} {existing.make} {existing.model}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Updatable Fields Comparison */}
                  {eq.duplicateStatus !== 'none' && eq.updatableFields.length > 0 && expandedItems.has(eq.tempId) && (
                    <div className="pl-7 pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Fields that can be updated:</p>
                      <div className="space-y-1 bg-muted/30 rounded p-2">
                        {eq.updatableFields.map((field) => (
                          <div key={field.field} className="flex items-center gap-2 text-xs">
                            <span className="text-green-600">●</span>
                            <span className="font-medium w-28">{field.label}:</span>
                            <span className="text-muted-foreground">{formatValue(field.existingValue, field.field)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-green-600 font-medium">{formatValue(field.importedValue, field.field)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eq.duplicateStatus !== 'none' && eq.updatableFields.length === 0 && expandedItems.has(eq.tempId) && (
                    <div className="pl-7 pt-2">
                      <p className="text-xs text-muted-foreground">
                        No additional fields to update. The existing record already has all the data from this import.
                      </p>
                    </div>
                  )}

                  {eq.selected && eq.importMode === 'new' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-7">
                      <div>
                        <label className="text-xs text-muted-foreground">Category *</label>
                        <Select
                          value={eq.category}
                          onValueChange={(value) => updateEquipmentItem(eq.tempId, 'category', value)}
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
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'year', e.target.value ? parseInt(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="Year"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Serial/VIN</label>
                        <Input
                          value={eq.serialVin || ''}
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'serialVin', e.target.value || null)}
                          className="h-8 text-sm"
                          placeholder="Serial/VIN"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Purchase Date</label>
                        <Input
                          type="date"
                          value={eq.purchaseDate || ''}
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'purchaseDate', e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Purchase Price</label>
                        <Input
                          type="number"
                          value={eq.purchasePrice || ''}
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'purchasePrice', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Sales Tax</label>
                        <Input
                          type="number"
                          value={eq.salesTax || ''}
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'salesTax', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Freight/Setup</label>
                        <Input
                          type="number"
                          value={eq.freightSetup || ''}
                          onChange={(e) => updateEquipmentItem(eq.tempId, 'freightSetup', e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Financing</label>
                        <Select
                          value={eq.financingType || 'owned'}
                          onValueChange={(value) => updateEquipmentItem(eq.tempId, 'financingType', value)}
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
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'monthlyPayment', e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="$0.00"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground">Term (Months)</label>
                            <Input
                              type="number"
                              value={eq.termMonths || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'termMonths', e.target.value ? parseInt(e.target.value) : null)}
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
                                onChange={(e) => updateEquipmentItem(eq.tempId, 'buyoutAmount', e.target.value ? parseFloat(e.target.value) : null)}
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
          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-sm text-muted-foreground">
              {newCount > 0 && <span>{newCount} new</span>}
              {newCount > 0 && (updateCount > 0 || attachmentCount > 0) && <span>, </span>}
              {updateCount > 0 && <span>{updateCount} updates</span>}
              {updateCount > 0 && attachmentCount > 0 && <span>, </span>}
              {attachmentCount > 0 && <span>{attachmentCount} attachments</span>}
            </div>
            <div className="flex gap-2">
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
                    Processing...
                  </>
                ) : (
                  `Import ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}