import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Check, Copy, AlertCircle, RefreshCw, FileText, ChevronDown, ChevronUp, Link, Package, DollarSign, CreditCard, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEquipment } from "@/contexts/EquipmentContext";
import { Equipment, EquipmentCategory, FinancingType, UpdatableField, DocumentSummary, FieldConflict } from "@/types/equipment";
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
  sourceFile?: File;
  sourceFiles?: File[]; // For merged items with multiple source documents
  sourceDocumentIndices?: number[];
}

type DuplicateStatus = 'none' | 'exact' | 'potential';
type DuplicateFilter = 'all' | 'no-duplicates' | 'only-duplicates';
type DuplicateReason = 'serial' | 'year' | 'price' | 'date' | null;
type ImportModeType = 'new' | 'update_existing' | 'skip' | 'attachment';

// Batch duplicate: potential match within the same import batch
interface BatchDuplicateGroup {
  primaryIndex: number;
  duplicateIndices: number[];
  reason: string;
}

// Attachment action when duplicate is found
type AttachmentActionType = 'create' | 'skip' | 'update_existing' | 'import_anyway';

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
  importMode: ImportModeType;
  updatableFields: UpdatableField[];
  // Attachment-specific fields
  suggestedType: 'equipment' | 'attachment';
  suggestedParentIndex: number | null;
  selectedParentId?: string; // ID of existing equipment as parent
  selectedParentTempId?: string; // tempId of equipment from this import batch
  yearDefaultedFromPurchase?: boolean;
  // Batch duplicate tracking
  batchDuplicateOf?: string; // tempId of item this was merged into
  mergedFrom?: string[]; // tempIds of items merged into this one
  // Field source tracking
  fieldSources?: Record<string, string>;
  // Conflict resolutions (user overrides)
  conflictResolutions?: Record<string, any>;
  // Original AI values (for reset)
  originalValues?: Partial<ExtractedEquipment>;
  // Editable attachment fields (used when importMode === 'attachment')
  attachmentName?: string;
  attachmentValue?: number;
  attachmentSerial?: string;
  attachmentDescription?: string;
  // Attachment duplicate detection
  matchedAttachmentId?: string;
  matchedAttachmentName?: string;
  attachmentDuplicateStatus?: 'none' | 'match';
  // What to do when attachment is a duplicate
  attachmentAction?: AttachmentActionType;
}

interface EquipmentImportReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedEquipment: ExtractedEquipment[];
  documentSummaries?: DocumentSummary[];
  conflicts?: FieldConflict[];
  processingNotes?: string;
  sourceFiles?: File[];
  onComplete: () => void;
  /** Entry source for tracking: 'ai_document' for document/AI imports, 'spreadsheet' for structured spreadsheet imports */
  entrySource?: 'ai_document' | 'spreadsheet';
}

// Derive CATEGORIES from the canonical taxonomy
import { categoryDefaults } from "@/data/categoryDefaults";
const CATEGORIES: EquipmentCategory[] = categoryDefaults.map(c => c.category);

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  make: 'Make',
  model: 'Model',
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

// Tokenize attachment name for fuzzy matching
const tokenizeAttachmentName = (name: string): string[] => {
  const stopWords = ['with', 'kit', 'mounted', 'system', 'style', 'type', 'series', 'and', 'for', 'the', 'a', 'an'];
  return name
    .toLowerCase()
    .split(/[\s\-_\/,]+/)
    .filter(t => t.length >= 2 && !stopWords.includes(t));
};

// Check if extracted attachment matches an existing one
const attachmentMatches = (
  extractedMake: string,
  extractedModel: string,
  extractedSerial: string | undefined | null,
  existingAttachment: { name: string; serialNumber?: string }
): boolean => {
  // Priority 1: Serial number match (if both have serials)
  if (extractedSerial && existingAttachment.serialNumber) {
    const normExtracted = normalizeSerial(extractedSerial);
    const normExisting = normalizeSerial(existingAttachment.serialNumber);
    if (normExtracted && normExisting && normExtracted === normExisting) {
      return true;
    }
  }
  
  // Priority 2: Name token overlap
  const extractedTokens = tokenizeAttachmentName(`${extractedMake} ${extractedModel}`);
  const existingTokens = tokenizeAttachmentName(existingAttachment.name);
  
  if (extractedTokens.length === 0 || existingTokens.length === 0) return false;
  
  const intersection = extractedTokens.filter(t => existingTokens.includes(t));
  const minLen = Math.min(extractedTokens.length, existingTokens.length);
  
  // Require at least 2 shared tokens OR 66% overlap
  return intersection.length >= 2 || (minLen > 0 && intersection.length / minLen >= 0.66);
};

// Guess category based on make/model — returns v6 taxonomy strings
const guessCategory = (make: string, model: string): EquipmentCategory => {
  const combined = `${make} ${model}`.toLowerCase();
  
  if (combined.includes('mower') || combined.includes('ztr') || combined.includes('z-turn') || 
      combined.includes('turf') || combined.includes('lawn')) {
    return 'Lawn — Mower — Ride-On' as EquipmentCategory;
  }
  if (combined.includes('truck') || combined.includes('f-150') || combined.includes('f150') || 
      combined.includes('f-250') || combined.includes('silverado') || combined.includes('ram') ||
      combined.includes('pickup') || combined.includes('van')) {
    if (combined.includes('dump') || combined.includes('commercial') || combined.includes('f-550') ||
        combined.includes('f-450') || combined.includes('flatbed')) {
      return 'Fleet — Truck — Cab Over' as EquipmentCategory;
    }
    return 'Fleet — Truck — 3/4 Ton' as EquipmentCategory;
  }
  if (combined.includes('trailer')) return 'Fleet — Trailer — Flat Deck' as EquipmentCategory;
  if (combined.includes('trimmer') || combined.includes('edger') || combined.includes('weed') ||
      combined.includes('blower') || combined.includes('chainsaw') || combined.includes('hedge')) {
    return 'Lawn — Handheld — Trimmer' as EquipmentCategory;
  }
  if (combined.includes('mini skid') || combined.includes('dingo') || combined.includes('mini-skid')) {
    return 'Construction — Loader — Stand-On' as EquipmentCategory;
  }
  if (combined.includes('skid') || combined.includes('track loader') || combined.includes('ctl')) {
    return 'Construction — Loader — Skid Steer' as EquipmentCategory;
  }
  if (combined.includes('wheel loader')) return 'Construction — Loader — Wheel' as EquipmentCategory;
  if (combined.includes('excavator') || combined.includes('mini ex') || combined.includes('digger')) {
    return 'Construction — Excavator — Compact' as EquipmentCategory;
  }
  if (combined.includes('compactor') || combined.includes('roller') || combined.includes('plate') || 
      combined.includes('rammer') || combined.includes('tamping') || combined.includes('tamper')) {
    if (combined.includes('walk') || combined.includes('plate') || combined.includes('jumping') || 
        combined.includes('rammer') || combined.includes('tamping') || combined.includes('tamper')) {
      return 'Construction — Compactor — Plate/Rammer' as EquipmentCategory;
    }
    return 'Construction — Compactor — Roller' as EquipmentCategory;
  }
  if (combined.includes('plow') || combined.includes('salt') || combined.includes('snow')) {
    return 'Snow — Plow' as EquipmentCategory;
  }
  if (combined.includes('drill') || combined.includes('saw') || combined.includes('grinder') ||
      combined.includes('hammer')) {
    return 'Construction — Saw — Cut-Off' as EquipmentCategory;
  }
  if (combined.includes('breaker') || combined.includes('demo') || combined.includes('concrete')) {
    return 'Construction — Concrete — Vibrator' as EquipmentCategory;
  }
  
  return 'Construction — Other' as EquipmentCategory;
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

// Format currency for display
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '$0';
  return `$${value.toLocaleString()}`;
};

export function EquipmentImportReview({ 
  open, 
  onOpenChange, 
  extractedEquipment,
  documentSummaries,
  conflicts,
  processingNotes,
  sourceFiles,
  onComplete,
  entrySource = 'ai_document',
}: EquipmentImportReviewProps) {
  const { addEquipment, updateEquipment, equipment, uploadDocument, getDocuments, addAttachment, getAttachments, updateAttachment } = useEquipment();
  const [isImporting, setIsImporting] = useState(false);
  const [duplicateFilter, setDuplicateFilter] = useState<DuplicateFilter>('all');
  const [attachSourceDocument, setAttachSourceDocument] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [batchDuplicateGroups, setBatchDuplicateGroups] = useState<BatchDuplicateGroup[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({});
  const [attachmentDuplicateChecked, setAttachmentDuplicateChecked] = useState<Set<string>>(new Set());
  
  const [editableEquipment, setEditableEquipment] = useState<EditableEquipment[]>([]);

  // Toggle section expansion
  const toggleSection = (tempId: string, section: string) => {
    setExpandedSections(prev => {
      const itemSections = prev[tempId] || new Set();
      const newSections = new Set(itemSections);
      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }
      return { ...prev, [tempId]: newSections };
    });
  };

  const isSectionExpanded = (tempId: string, section: string): boolean => {
    return expandedSections[tempId]?.has(section) || false;
  };

  // Reset item to original AI values
  const resetToAIValues = (tempId: string) => {
    setEditableEquipment(prev => prev.map(eq => {
      if (eq.tempId !== tempId || !eq.originalValues) return eq;
      return {
        ...eq,
        ...eq.originalValues,
        conflictResolutions: {},
      };
    }));
  };

  // Clear financing fields
  const clearFinancing = (tempId: string) => {
    setEditableEquipment(prev => prev.map(eq => {
      if (eq.tempId !== tempId) return eq;
      return {
        ...eq,
        financingType: 'owned',
        depositAmount: null,
        financedAmount: null,
        monthlyPayment: null,
        termMonths: null,
        buyoutAmount: null,
      };
    }));
  };

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

  // Check for potential duplicates within the import batch
  const checkForBatchDuplicates = useCallback((items: ExtractedEquipment[]): BatchDuplicateGroup[] => {
    const groups: BatchDuplicateGroup[] = [];
    const alreadyGrouped = new Set<number>();
    
    for (let i = 0; i < items.length; i++) {
      if (alreadyGrouped.has(i)) continue;
      
      const duplicateIndices: number[] = [];
      const reasons: string[] = [];
      
      for (let j = i + 1; j < items.length; j++) {
        if (alreadyGrouped.has(j)) continue;
        
        const a = items[i];
        const b = items[j];
        
        // Check if same make/model (fuzzy)
        const modelMatch = modelsMatch(a.make, a.model, b.make, b.model);
        
        // NEW: Check if same manufacturer with overlapping source documents
        // This catches AI fragmentation where same attachment is split into multiple items
        const aMake = normalizeKey(a.make);
        const bMake = normalizeKey(b.make);
        const sameMake = aMake === bMake && aMake.length >= 3;
        const overlappingDocs = a.sourceDocumentIndices?.some(
          idx => b.sourceDocumentIndices?.includes(idx)
        ) || false;
        
        // Additional signals they're the same equipment:
        const serialA = normalizeSerial(a.serialVin);
        const serialB = normalizeSerial(b.serialVin);
        const serialMatch = serialA && serialB && serialA === serialB;
        
        const yearMatch = a.year === b.year || !a.year || !b.year;
        
        // Complementary documents: one has purchase info, other has financing info
        const aHasPurchase = (a.purchasePrice && a.purchasePrice > 0);
        const bHasPurchase = (b.purchasePrice && b.purchasePrice > 0);
        const aHasFinancing = (a.financedAmount && a.financedAmount > 0) || 
                              (a.monthlyPayment && a.monthlyPayment > 0);
        const bHasFinancing = (b.financedAmount && b.financedAmount > 0) || 
                              (b.monthlyPayment && b.monthlyPayment > 0);
        const complementaryDocs = (aHasPurchase && !aHasFinancing && bHasFinancing) ||
                                   (bHasPurchase && !bHasFinancing && aHasFinancing);
        
        const dateA = parseDate(a.purchaseDate);
        const dateB = parseDate(b.purchaseDate);
        const datesClose = (!dateA || !dateB) ? true : daysDifference(dateA, dateB) <= 60;
        
        if (serialMatch) {
          duplicateIndices.push(j);
          reasons.push('same serial/VIN');
          alreadyGrouped.add(j);
        } else if (modelMatch && yearMatch && datesClose && complementaryDocs) {
          duplicateIndices.push(j);
          reasons.push('complementary documents (purchase + financing)');
          alreadyGrouped.add(j);
        } else if (modelMatch && yearMatch && datesClose) {
          duplicateIndices.push(j);
          reasons.push('same make/model with similar dates');
          alreadyGrouped.add(j);
        } 
        // NEW: Flag same-manufacturer items from same document as potential fragments
        else if (sameMake && overlappingDocs && yearMatch) {
          duplicateIndices.push(j);
          reasons.push('same manufacturer from same document - likely fragments of same item');
          alreadyGrouped.add(j);
        }
      }
      
      if (duplicateIndices.length > 0) {
        groups.push({
          primaryIndex: i,
          duplicateIndices,
          reason: [...new Set(reasons)].join(', '),
        });
        alreadyGrouped.add(i);
      }
    }
    
    return groups;
  }, []);

  // Merge two equipment items, combining their data
  const mergeEquipmentItems = useCallback((primary: EditableEquipment, secondary: EditableEquipment): EditableEquipment => {
    // Collect all source files
    const allSourceFiles: File[] = [];
    if (primary.sourceFiles?.length) {
      allSourceFiles.push(...primary.sourceFiles);
    } else if (primary.sourceFile) {
      allSourceFiles.push(primary.sourceFile);
    }
    if (secondary.sourceFiles?.length) {
      allSourceFiles.push(...secondary.sourceFiles);
    } else if (secondary.sourceFile) {
      allSourceFiles.push(secondary.sourceFile);
    }
    
    // Merge notes
    const mergedNotes = [primary.notes, secondary.notes].filter(Boolean).join(' | ');
    
    // Merge strategy: Take non-null values from both, prefer primary for conflicts
    return {
      ...primary,
      // Take secondary values if primary is empty
      serialVin: primary.serialVin || secondary.serialVin,
      year: primary.year || secondary.year,
      purchaseDate: primary.purchaseDate || secondary.purchaseDate,
      purchasePrice: primary.purchasePrice || secondary.purchasePrice,
      salesTax: primary.salesTax || secondary.salesTax,
      freightSetup: primary.freightSetup || secondary.freightSetup,
      purchaseCondition: primary.purchaseCondition || secondary.purchaseCondition,
      // Take financing from whichever has it
      financingType: (primary.financingType && primary.financingType !== 'owned') 
        ? primary.financingType 
        : ((secondary.financingType && secondary.financingType !== 'owned') ? secondary.financingType : primary.financingType),
      financedAmount: primary.financedAmount || secondary.financedAmount,
      monthlyPayment: primary.monthlyPayment || secondary.monthlyPayment,
      termMonths: primary.termMonths || secondary.termMonths,
      buyoutAmount: primary.buyoutAmount || secondary.buyoutAmount,
      depositAmount: primary.depositAmount || secondary.depositAmount,
      // Keep track of merged source files
      sourceFiles: allSourceFiles.length > 0 ? allSourceFiles : undefined,
      sourceFile: undefined, // Use sourceFiles instead
      notes: mergedNotes || null,
      // Track what was merged
      mergedFrom: [...(primary.mergedFrom || []), secondary.tempId],
      // Use higher confidence
      confidence: primary.confidence === 'high' || secondary.confidence === 'high' 
        ? 'high' 
        : (primary.confidence === 'medium' || secondary.confidence === 'medium' ? 'medium' : 'low'),
    };
  }, []);

  // Handle merging batch duplicates
  const handleMergeBatchDuplicates = useCallback(() => {
    if (batchDuplicateGroups.length === 0) return;
    
    setEditableEquipment(prev => {
      const newEquipment = [...prev];
      const toRemove = new Set<string>();
      
      for (const group of batchDuplicateGroups) {
        const primaryIdx = newEquipment.findIndex(eq => 
          prev.indexOf(eq) === group.primaryIndex || 
          eq.tempId === prev[group.primaryIndex]?.tempId
        );
        
        if (primaryIdx === -1) continue;
        
        let merged = { ...newEquipment[primaryIdx] };
        
        for (const dupIdx of group.duplicateIndices) {
          const secondary = prev[dupIdx];
          if (secondary) {
            merged = mergeEquipmentItems(merged, secondary);
            toRemove.add(secondary.tempId);
          }
        }
        
        newEquipment[primaryIdx] = merged;
      }
      
      // Remove merged items
      return newEquipment.filter(eq => !toRemove.has(eq.tempId));
    });
    
    setBatchDuplicateGroups([]);
    setShowMergeDialog(false);
    
    toast({
      title: "Items Merged",
      description: `Merged ${batchDuplicateGroups.reduce((acc, g) => acc + g.duplicateIndices.length, 0)} duplicate items`,
    });
  }, [batchDuplicateGroups, mergeEquipmentItems]);

  // Build field sources from document summaries
  const buildFieldSources = useCallback((docSummaries?: DocumentSummary[]): Record<string, string> => {
    if (!docSummaries) return {};
    const sources: Record<string, string> = {};
    for (const summary of docSummaries) {
      for (const field of summary.extracted) {
        // Map common field names
        const normalizedField = field.toLowerCase().replace(/[^a-z]/g, '');
        if (normalizedField.includes('serial') || normalizedField.includes('vin')) {
          sources['serialVin'] = summary.fileName;
        } else if (normalizedField.includes('price') || normalizedField.includes('amount')) {
          sources['purchasePrice'] = summary.fileName;
        } else if (normalizedField.includes('tax')) {
          sources['salesTax'] = summary.fileName;
        } else if (normalizedField.includes('payment') || normalizedField.includes('monthly')) {
          sources['monthlyPayment'] = summary.fileName;
        } else if (normalizedField.includes('term')) {
          sources['termMonths'] = summary.fileName;
        } else if (normalizedField.includes('date')) {
          sources['purchaseDate'] = summary.fileName;
        }
      }
    }
    return sources;
  }, []);

  // Helper function to check attachment duplicates for a given parent
  const checkAttachmentDuplicateForParent = useCallback(async (
    item: EditableEquipment,
    parentId: string
  ): Promise<{ matchedAttachmentId?: string; matchedAttachmentName?: string; isDuplicate: boolean }> => {
    try {
      const existingAttachments = await getAttachments(parentId);
      const checkName = item.attachmentName || `${item.make} ${item.model}`;
      const checkSerial = item.attachmentSerial || item.serialVin;
      
      for (const existing of existingAttachments) {
        if (attachmentMatches(checkName, '', checkSerial, existing)) {
          return {
            matchedAttachmentId: existing.id,
            matchedAttachmentName: existing.name,
            isDuplicate: true,
          };
        }
      }
    } catch (error) {
      console.error('Failed to check attachment duplicates:', error);
    }
    return { isDuplicate: false };
  }, [getAttachments]);

  // Initialize editable equipment when extractedEquipment changes
  useEffect(() => {
    const fieldSources = buildFieldSources(documentSummaries);
    
    const mapped = extractedEquipment.map((eq, index) => {
      const duplicateCheck = checkForDuplicates(eq);
      const hasUpdatableFields = duplicateCheck.updatableFields.length > 0;
      const suggestedType = eq.suggestedType || 'equipment';
      const suggestedParentIndex = eq.suggestedParentIndex ?? null;
      
      // Default mode: 
      // - attachment if AI suggests it
      // - update_existing if there are fields to update
      // - new otherwise (or skip for exact with no updates)
      let defaultMode: ImportModeType = 'new';
      if (suggestedType === 'attachment') {
        defaultMode = 'attachment';
      } else if (duplicateCheck.status === 'exact') {
        defaultMode = hasUpdatableFields ? 'update_existing' : 'skip';
      } else if (duplicateCheck.status === 'potential' && hasUpdatableFields) {
        defaultMode = 'update_existing';
      }
      
      // Compute year fallback from purchase date if year not extracted
      const purchaseYear = parseDate(eq.purchaseDate)?.getFullYear() ?? null;
      const yearWasMissing = eq.year === null || eq.year === undefined;
      const effectiveYear = yearWasMissing && purchaseYear ? purchaseYear : eq.year;
      
      return {
        ...eq,
        tempId: `import-${index}-${Date.now()}`,
        selected: defaultMode !== 'skip',
        category: eq.suggestedCategory || guessCategory(eq.make, eq.model),
        year: effectiveYear,
        yearDefaultedFromPurchase: yearWasMissing && purchaseYear !== null,
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
        // Initialize parent IDs (will be fixed up in next pass)
        selectedParentId: undefined as string | undefined,
        selectedParentTempId: suggestedParentIndex !== null ? `import-${suggestedParentIndex}-${Date.now()}` : undefined,
        fieldSources,
        originalValues: { ...eq },
        conflictResolutions: {},
        // Default attachment action
        attachmentAction: 'create' as AttachmentActionType,
        attachmentDuplicateStatus: 'none' as 'none' | 'match',
      };
    });
    
    // Fix parent tempId references now that we have all tempIds
    const tempIds = mapped.map(m => m.tempId);
    mapped.forEach((eq, index) => {
      if (eq.suggestedParentIndex !== null && eq.suggestedParentIndex >= 0 && eq.suggestedParentIndex < tempIds.length) {
        const suggestedParent = mapped[eq.suggestedParentIndex];
        
        // KEY FIX: If the suggested parent is a matched existing equipment, 
        // use selectedParentId (real ID) instead of selectedParentTempId
        if (suggestedParent && suggestedParent.matchedEquipmentId) {
          eq.selectedParentId = suggestedParent.matchedEquipmentId;
          eq.selectedParentTempId = undefined;
        } else {
          eq.selectedParentTempId = tempIds[eq.suggestedParentIndex];
          eq.selectedParentId = undefined;
        }
      }
    });
    
    setEditableEquipment(mapped);
    
    // Check for batch duplicates (items from this import that might be the same equipment)
    const batchDups = checkForBatchDuplicates(extractedEquipment);
    setBatchDuplicateGroups(batchDups);
    
    // Reset the attachment duplicate check tracking
    setAttachmentDuplicateChecked(new Set());
    
    // Auto-expand items with updatable fields or attachments
    const toExpand = new Set<string>();
    mapped.forEach(eq => {
      if (eq.updatableFields.length > 0 || eq.importMode === 'attachment') {
        toExpand.add(eq.tempId);
      }
    });
    setExpandedItems(toExpand);
    
    // Initialize section expansion - auto-expand basic info and any section with data
    const sectionExpansion: Record<string, Set<string>> = {};
    mapped.forEach(eq => {
      const sections = new Set<string>();
      sections.add('basic'); // Always expand basic
      // Auto-expand pricing if has data
      if (eq.purchasePrice || eq.salesTax || eq.freightSetup) {
        sections.add('pricing');
      }
      // Auto-expand financing if has data
      if (eq.financingType !== 'owned' && eq.financingType !== null) {
        sections.add('financing');
      }
      sectionExpansion[eq.tempId] = sections;
    });
    setExpandedSections(sectionExpansion);
  }, [extractedEquipment, checkForDuplicates, checkForBatchDuplicates, documentSummaries, buildFieldSources]);

  // Proactive attachment duplicate detection - runs after initialization
  useEffect(() => {
    const checkAttachmentDuplicates = async () => {
      const attachmentsWithParents = editableEquipment.filter(eq => 
        eq.importMode === 'attachment' && 
        eq.selectedParentId && // Has a real parent ID (not temp)
        !attachmentDuplicateChecked.has(eq.tempId)
      );
      
      if (attachmentsWithParents.length === 0) return;
      
      const newChecked = new Set(attachmentDuplicateChecked);
      const updates: { tempId: string; matchedId: string; matchedName: string }[] = [];
      
      for (const item of attachmentsWithParents) {
        newChecked.add(item.tempId);
        const result = await checkAttachmentDuplicateForParent(item, item.selectedParentId!);
        if (result.isDuplicate && result.matchedAttachmentId) {
          updates.push({
            tempId: item.tempId,
            matchedId: result.matchedAttachmentId,
            matchedName: result.matchedAttachmentName || '',
          });
        }
      }
      
      setAttachmentDuplicateChecked(newChecked);
      
      if (updates.length > 0) {
        setEditableEquipment(prev => prev.map(eq => {
          const update = updates.find(u => u.tempId === eq.tempId);
          if (!update) return eq;
          return {
            ...eq,
            matchedAttachmentId: update.matchedId,
            matchedAttachmentName: update.matchedName,
            attachmentDuplicateStatus: 'match',
            attachmentAction: 'skip', // Default to skip for duplicates
          };
        }));
      }
    };
    
    checkAttachmentDuplicates();
  }, [editableEquipment, attachmentDuplicateChecked, checkAttachmentDuplicateForParent]);

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

  const setImportMode = (tempId: string, mode: ImportModeType) => {
    setEditableEquipment(prev => 
      prev.map((eq) => {
        if (eq.tempId !== tempId) return eq;
        const updates: Partial<EditableEquipment> = {
          importMode: mode,
          selected: mode !== 'skip',
        };
        
        // Initialize attachment fields when switching to attachment mode
        if (mode === 'attachment') {
          updates.attachmentName = eq.attachmentName || `${eq.make} ${eq.model}`.trim();
          updates.attachmentValue = eq.attachmentValue ?? eq.purchasePrice ?? 0;
          updates.attachmentSerial = eq.attachmentSerial || eq.serialVin || '';
          updates.attachmentDescription = eq.attachmentDescription || eq.notes || '';
          // Reset duplicate status when switching modes
          updates.attachmentDuplicateStatus = 'none';
          updates.matchedAttachmentId = undefined;
          updates.matchedAttachmentName = undefined;
        }
        
        return { ...eq, ...updates };
      })
    );
  };

  const selectedCount = editableEquipment.filter(eq => eq.selected).length;
  const updateCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'update_existing').length;
  const newCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'new').length;
  const attachmentCount = editableEquipment.filter(eq => eq.selected && eq.importMode === 'attachment').length;

  // Get potential parents for attachment selection
  // Include: new items, update_existing items, AND skipped items that have a matched existing equipment
  const potentialParentsFromImport = editableEquipment.filter(eq => 
    eq.importMode === 'new' || 
    eq.importMode === 'update_existing' ||
    (eq.importMode === 'skip' && eq.matchedEquipmentId) // Skipped duplicates with real equipment
  );

  // Check for existing attachments when setting parent
  const setParentForAttachment = async (tempId: string, parentValue: string) => {
    // First update the parent selection
    const isTemp = parentValue.startsWith('temp:');
    const parentId = isTemp ? undefined : parentValue;
    const parentTempId = isTemp ? parentValue.replace('temp:', '') : undefined;
    
    // Update parent selection immediately
    setEditableEquipment(prev => prev.map(eq => {
      if (eq.tempId !== tempId) return eq;
      return { 
        ...eq, 
        selectedParentId: parentId, 
        selectedParentTempId: parentTempId,
        // Reset duplicate status while we check
        attachmentDuplicateStatus: 'none',
        matchedAttachmentId: undefined,
        matchedAttachmentName: undefined,
        attachmentAction: 'create',
      };
    }));
    
    // Get the equipment ID to check - either direct parentId OR resolve temp parent's matched ID
    let checkParentId = parentId;
    if (isTemp && parentTempId) {
      // Find the temp parent and see if it has a matchedEquipmentId
      const tempParent = editableEquipment.find(eq => eq.tempId === parentTempId);
      if (tempParent?.matchedEquipmentId) {
        checkParentId = tempParent.matchedEquipmentId;
      }
    }
    
    // Check for duplicates if we have a real equipment ID
    if (checkParentId) {
      try {
        const existingAttachments = await getAttachments(checkParentId);
        const item = editableEquipment.find(eq => eq.tempId === tempId);
        
        if (item && existingAttachments.length > 0) {
          // Use editable attachment fields if set, otherwise use extracted make/model
          const checkName = item.attachmentName || `${item.make} ${item.model}`;
          const checkSerial = item.attachmentSerial || item.serialVin;
          
          let matchedAttachment: { name: string; serialNumber?: string; id: string } | undefined;
          for (const existing of existingAttachments) {
            if (attachmentMatches(checkName, '', checkSerial, existing)) {
              matchedAttachment = existing;
              break;
            }
          }
          
          if (matchedAttachment) {
            setEditableEquipment(prev => prev.map(eq => {
              if (eq.tempId !== tempId) return eq;
              return {
                ...eq,
                matchedAttachmentId: matchedAttachment!.id,
                matchedAttachmentName: matchedAttachment!.name,
                attachmentDuplicateStatus: 'match',
                attachmentAction: 'skip', // Default to skip for duplicates but keep importMode
              };
            }));
          }
        }
      } catch (error) {
        console.error('Failed to check for attachment duplicates:', error);
      }
    }
  };

  // Set attachment action (for handling duplicates)
  const setAttachmentAction = (tempId: string, action: AttachmentActionType) => {
    setEditableEquipment(prev => prev.map(eq => {
      if (eq.tempId !== tempId) return eq;
      return {
        ...eq,
        attachmentAction: action,
        selected: action !== 'skip',
      };
    }));
  };

  // Resolve conflict with user selection
  const resolveConflict = (tempId: string, field: string, value: any) => {
    setEditableEquipment(prev => prev.map(eq => {
      if (eq.tempId !== tempId) return eq;
      return {
        ...eq,
        [field]: value,
        conflictResolutions: { ...eq.conflictResolutions, [field]: value },
      };
    }));
  };

  // Unified match alert component - used for ALL card types (equipment and attachments)
  const renderMatchAlert = (eq: EditableEquipment) => {
    // Equipment exact match
    if (eq.importMode !== 'attachment' && eq.duplicateStatus === 'exact') {
      return (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
          <Copy className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            Exact match: <strong>{eq.matchedEquipmentName}</strong> (same serial/VIN)
          </span>
        </div>
      );
    }
    
    // Equipment potential match
    if (eq.importMode !== 'attachment' && eq.duplicateStatus === 'potential') {
      let reasonText = 'similar to';
      if (eq.duplicateReason === 'year') {
        reasonText = 'same make/model/year as';
      } else if (eq.duplicateReason === 'price') {
        reasonText = 'same make/model, similar price as';
      } else if (eq.duplicateReason === 'date') {
        const dateInfo = eq.matchedPurchaseDate ? ` (purchased ${eq.matchedPurchaseDate})` : '';
        return (
          <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-2 rounded-md border border-warning/30">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Possible match: same make/model, date within 30 days of <strong>{eq.matchedEquipmentName}</strong>{dateInfo}
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-2 rounded-md border border-warning/30">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            Possible match: {reasonText} <strong>{eq.matchedEquipmentName}</strong>
          </span>
        </div>
      );
    }
    
    return null;
  };

  // Get document source badge for a field
  const getSourceBadge = (eq: EditableEquipment, field: string) => {
    const source = eq.fieldSources?.[field];
    if (!source) return null;
    return (
      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1 text-muted-foreground">
        <FileText className="h-2.5 w-2.5 mr-0.5" />
        {source.length > 15 ? source.substring(0, 12) + '...' : source}
      </Badge>
    );
  };

  // Count documents that will be attached
  const documentCount = useMemo(() => {
    let count = 0;
    for (const eq of editableEquipment.filter(e => e.selected)) {
      if (eq.sourceFiles?.length) {
        count += eq.sourceFiles.length;
      } else if (eq.sourceFile) {
        count += 1;
      }
    }
    return count;
  }, [editableEquipment]);

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

    const results = {
      succeeded: [] as string[],
      failed: [] as { name: string; error: string }[],
    };
    let updateCountResult = 0;
    let attachmentImportCount = 0;
    const tempIdToRealId: Map<string, string> = new Map();
    const uploadedDocumentKeys = new Set<string>(); // Track uploaded docs to prevent duplicates

    // First pass: Import all equipment (non-attachments) and updates
    for (const eq of toProcess) {
      try {
        if (eq.importMode === 'update_existing' && eq.matchedEquipmentId) {
          const updates: Partial<Equipment> = {};
          for (const field of eq.updatableFields) {
            if (field.willUpdate) {
              (updates as any)[field.field] = field.importedValue;
            }
          }
          if (Object.keys(updates).length > 0) {
            await updateEquipment(eq.matchedEquipmentId, updates);
            tempIdToRealId.set(eq.tempId, eq.matchedEquipmentId);
            updateCountResult++;
            results.succeeded.push(`${eq.make} ${eq.model} (updated)`);
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
            allocationType: 'operational',
          }, entrySource);  // Pass entrySource to track how equipment was added
          if (newId) {
            tempIdToRealId.set(eq.tempId, newId);
            results.succeeded.push(`${eq.make} ${eq.model}`);
          }
        }
      } catch (error) {
        results.failed.push({
          name: `${eq.make} ${eq.model}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Second pass: Import attachments based on attachmentAction
    for (const eq of toProcess.filter(e => e.importMode === 'attachment')) {
      try {
        // Skip if attachmentAction is 'skip'
        if (eq.attachmentAction === 'skip') {
          console.log(`Skipping attachment "${eq.attachmentName || eq.make + ' ' + eq.model}" per user selection`);
          continue;
        }
        
        let parentId = eq.selectedParentId;
        if (eq.selectedParentTempId) {
          parentId = tempIdToRealId.get(eq.selectedParentTempId);
        }
        // Also check if parent temp ID maps to a matched existing equipment
        if (!parentId && eq.selectedParentTempId) {
          const tempParent = editableEquipment.find(e => e.tempId === eq.selectedParentTempId);
          if (tempParent?.matchedEquipmentId) {
            parentId = tempParent.matchedEquipmentId;
          }
        }
        
        if (parentId) {
          const attachmentName = eq.attachmentName || `${eq.make} ${eq.model}`;
          const attachmentSerial = eq.attachmentSerial || eq.serialVin;
          
          // Handle update_existing action
          if (eq.attachmentAction === 'update_existing' && eq.matchedAttachmentId) {
            await updateAttachment(eq.matchedAttachmentId, {
              name: attachmentName,
              value: eq.attachmentValue ?? eq.purchasePrice ?? 0,
              serialNumber: attachmentSerial || undefined,
              description: eq.attachmentDescription || eq.notes || undefined,
            });
            results.succeeded.push(`${attachmentName} (attachment - updated)`);
            continue;
          }
          
          // Handle import_anyway - skip duplicate check
          if (eq.attachmentAction === 'import_anyway') {
            await addAttachment(parentId, {
              name: attachmentName,
              value: eq.attachmentValue ?? eq.purchasePrice ?? 0,
              serialNumber: attachmentSerial || undefined,
              description: eq.attachmentDescription || eq.notes || undefined,
            });
            attachmentImportCount++;
            results.succeeded.push(`${attachmentName} (attachment - imported as new)`);
            continue;
          }
          
          // Default 'create' action - re-check for duplicates as safety net
          const existingAttachments = await getAttachments(parentId);
          const isDuplicate = existingAttachments.some(existing => 
            attachmentMatches(attachmentName, '', attachmentSerial, existing)
          );
          
          if (isDuplicate) {
            console.log(`Attachment "${attachmentName}" already exists on parent, skipping to prevent duplicate`);
            results.succeeded.push(`${attachmentName} (attachment - skipped duplicate)`);
            continue;
          }
          
          await addAttachment(parentId, {
            name: attachmentName,
            value: eq.attachmentValue ?? eq.purchasePrice ?? 0,
            serialNumber: attachmentSerial || undefined,
            description: eq.attachmentDescription || eq.notes || undefined,
          });
          attachmentImportCount++;
          results.succeeded.push(`${attachmentName} (attachment)`);
        }
      } catch (error) {
        const attachmentName = eq.attachmentName || `${eq.make} ${eq.model}`;
        results.failed.push({
          name: attachmentName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Attach source documents - to new AND updated equipment, prevent duplicates
    if (attachSourceDocument) {
      // Include both new equipment AND updated existing equipment
      const equipmentWithDocuments = toProcess.filter(e => 
        (e.importMode === 'new' || e.importMode === 'update_existing') && 
        e.suggestedType !== 'attachment'
      );
      
      for (const eq of equipmentWithDocuments) {
        const filesToAttach: File[] = eq.sourceFiles?.length ? eq.sourceFiles : (eq.sourceFile ? [eq.sourceFile] : []);
        
        // For new items, get ID from tempIdToRealId
        // For updated items, use matchedEquipmentId directly
        const equipmentId = eq.importMode === 'update_existing' 
          ? eq.matchedEquipmentId 
          : tempIdToRealId.get(eq.tempId);
        
        if (equipmentId && filesToAttach.length > 0) {
          // Fetch existing documents to check for duplicates in database
          const existingDocs = await getDocuments(equipmentId);
          const existingFileNames = new Set(existingDocs.map(d => d.fileName));
          
          for (const file of filesToAttach) {
            // Skip if already uploaded in this session
            const uploadKey = `${equipmentId}:${file.name}`;
            if (uploadedDocumentKeys.has(uploadKey)) continue;
            
            // Skip if document already exists on this equipment
            if (existingFileNames.has(file.name)) {
              console.log(`Document ${file.name} already exists on equipment, skipping`);
              continue;
            }
            
            uploadedDocumentKeys.add(uploadKey);
            try {
              await uploadDocument(equipmentId, file);
            } catch (error) {
              console.error(`Failed to attach document ${file.name}:`, error);
            }
          }
        }
      }
      
      // ALSO attach source documents for attachments to their PARENT equipment
      const attachmentsWithDocuments = toProcess.filter(e => e.importMode === 'attachment');
      
      for (const eq of attachmentsWithDocuments) {
        const filesToAttach: File[] = eq.sourceFiles?.length ? eq.sourceFiles : (eq.sourceFile ? [eq.sourceFile] : []);
        
        // Resolve the parent equipment ID
        let parentEquipmentId = eq.selectedParentId;
        if (eq.selectedParentTempId) {
          parentEquipmentId = tempIdToRealId.get(eq.selectedParentTempId);
        }
        
        if (parentEquipmentId && filesToAttach.length > 0) {
          console.log(`Attaching ${filesToAttach.length} document(s) to parent equipment ${parentEquipmentId} for attachment "${eq.attachmentName || eq.make + ' ' + eq.model}"`);
          
          // Fetch existing documents to check for duplicates in database
          const existingDocs = await getDocuments(parentEquipmentId);
          const existingFileNames = new Set(existingDocs.map(d => d.fileName));
          
          for (const file of filesToAttach) {
            // Skip if already uploaded in this session
            const uploadKey = `${parentEquipmentId}:${file.name}`;
            if (uploadedDocumentKeys.has(uploadKey)) {
              console.log(`Document ${file.name} already uploaded in this session, skipping`);
              continue;
            }
            
            // Skip if document already exists on this equipment
            if (existingFileNames.has(file.name)) {
              console.log(`Document ${file.name} already exists on parent equipment, skipping`);
              continue;
            }
            
            uploadedDocumentKeys.add(uploadKey);
            try {
              await uploadDocument(parentEquipmentId, file);
              console.log(`Successfully attached document ${file.name} to parent equipment`);
            } catch (error) {
              console.error(`Failed to attach document ${file.name} to parent:`, error);
            }
          }
        }
      }
    }

    // Report results with partial failure handling
    if (results.failed.length === 0 && results.succeeded.length > 0) {
      const parts = [];
      const newCount = results.succeeded.filter(s => !s.includes('updated') && !s.includes('attachment')).length;
      if (newCount > 0) parts.push(`${newCount} new equipment`);
      if (updateCountResult > 0) parts.push(`${updateCountResult} updated`);
      if (attachmentImportCount > 0) parts.push(`${attachmentImportCount} attachment${attachmentImportCount !== 1 ? 's' : ''}`);
      
      toast({ title: "Import Successful", description: parts.join(', ') });
      onComplete();
      onOpenChange(false);
    } else if (results.succeeded.length > 0 && results.failed.length > 0) {
      toast({
        title: "Partial Import",
        description: `${results.succeeded.length} succeeded, ${results.failed.length} failed: ${results.failed.map(f => f.name).join(', ')}`,
      });
      onComplete();
      onOpenChange(false);
    } else if (results.failed.length > 0) {
      toast({
        title: "Import Failed",
        description: `All ${results.failed.length} items failed to import`,
        variant: "destructive",
      });
    }

    setIsImporting(false);
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><Check className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Low</Badge>;
    }
  };

  // Render a collapsible field section
  const renderFieldSection = (
    eq: EditableEquipment, 
    sectionId: string, 
    title: string, 
    icon: React.ReactNode, 
    summary: string | null,
    children: React.ReactNode
  ) => {
    const isExpanded = isSectionExpanded(eq.tempId, sectionId);
    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(eq.tempId, sectionId)}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-sm font-medium">{title}</span>
              {!isExpanded && summary && (
                <span className="text-xs text-muted-foreground ml-2">{summary}</span>
              )}
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 pr-2 pb-2 space-y-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
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
          {/* Conflict Resolution Banner */}
          {conflicts && conflicts.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-warning mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">AI detected conflicting values</span>
              </div>
              <div className="space-y-2">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-muted/30 rounded p-2 text-sm">
                    <p className="font-medium mb-1">{FIELD_LABELS[conflict.field] || conflict.field}</p>
                    <RadioGroup
                      value={editableEquipment[0]?.conflictResolutions?.[conflict.field] ?? conflict.resolved}
                      onValueChange={(value) => {
                        // Apply to the first equipment item (for single asset mode)
                        if (editableEquipment.length > 0) {
                          resolveConflict(editableEquipment[0].tempId, conflict.field, value);
                        }
                      }}
                      className="space-y-1"
                    >
                      {conflict.values.map((val, valIdx) => (
                        <div key={valIdx} className="flex items-center space-x-2">
                          <RadioGroupItem value={val} id={`conflict-${idx}-${valIdx}`} />
                          <Label htmlFor={`conflict-${idx}-${valIdx}`} className="text-xs flex items-center gap-2">
                            <span className="font-medium">{formatValue(val, conflict.field)}</span>
                            {conflict.sources[valIdx] && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {conflict.sources[valIdx]}
                              </Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Summaries */}
          {documentSummaries && documentSummaries.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {documentSummaries.length} source document{documentSummaries.length !== 1 ? 's' : ''} processed
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {documentSummaries.map((summary, idx) => (
                  <div key={idx} className="text-xs bg-muted/30 rounded p-2">
                    <span className="font-medium">{summary.fileName}</span>
                    {summary.itemsFound.length > 0 && (
                      <span className="text-muted-foreground ml-2">
                        → {summary.itemsFound.join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Batch Duplicate Detection Banner */}
          {batchDuplicateGroups.length > 0 && (
            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-info mb-2">
                <Link className="h-4 w-4" />
                <span className="font-medium">Potential duplicates detected in this import</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {batchDuplicateGroups.length === 1 
                  ? `${batchDuplicateGroups[0].duplicateIndices.length + 1} items appear to be the same equipment`
                  : `${batchDuplicateGroups.length} groups of items appear to be duplicates`
                } (e.g., purchase order + financing agreement for the same equipment). Would you like to merge them?
              </p>
              <div className="space-y-2">
                {batchDuplicateGroups.map((group, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                    <span className="font-medium">{extractedEquipment[group.primaryIndex]?.make} {extractedEquipment[group.primaryIndex]?.model}</span>
                    <span className="text-info ml-2">({group.duplicateIndices.length + 1} items - {group.reason})</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-3"
                onClick={handleMergeBatchDuplicates}
              >
                Merge Duplicate Items
              </Button>
            </div>
          )}

          {/* Duplicate Summary */}
          {duplicateCounts.total > 0 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">
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
          {editableEquipment.some(eq => eq.sourceFile || (eq.sourceFiles && eq.sourceFiles.length > 0)) && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Checkbox
                checked={attachSourceDocument}
                onCheckedChange={(checked) => setAttachSourceDocument(!!checked)}
              />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Attach source documents to their respective equipment items
              </span>
            </div>
          )}

          {/* Equipment List */}
          <ScrollArea className="h-[350px] pr-4">
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
                      ? 'border-warning/50 bg-warning/5'
                      : eq.confidence === 'low' 
                      ? 'border-warning/50 bg-warning/5' 
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
                        {/* Header - ALWAYS read-only for consistent card appearance */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {eq.importMode === 'attachment' 
                              ? (eq.attachmentName || `${eq.make} ${eq.model}`.trim() || 'Unnamed Attachment')
                              : `${eq.make} ${eq.model}`.trim() || 'Unknown Equipment'}
                          </span>
                          {eq.year && (
                            <span className="text-sm text-muted-foreground">({eq.year})</span>
                          )}
                        </div>
                        {/* Unified match warning - same style for all card types */}
                        {renderMatchAlert(eq)}
                        {eq.notes && (
                          <p className="text-xs text-muted-foreground">{eq.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(eq.confidence)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => resetToAIValues(eq.tempId)}
                        title="Reset to AI values"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
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
                    </div>
                  </div>

                  {/* AI Suggested Attachment Indicator */}
                  {eq.suggestedType === 'attachment' && eq.importMode !== 'attachment' && (
                    <div className="flex items-center gap-1.5 text-xs text-info bg-info/10 px-2 py-1 rounded ml-7">
                      <Link className="h-3 w-3" />
                      <span>AI suggests this may be an attachment</span>
                    </div>
                  )}

                  {/* Single Action Row - ONE unified control for import mode (same for all card types) */}
                  <div className="flex gap-1.5 pl-7 flex-wrap">
                    {eq.duplicateStatus !== 'none' && (
                      <Button
                        variant={eq.importMode === 'update_existing' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setImportMode(eq.tempId, 'update_existing')}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Use Existing Equipment
                        {eq.updatableFields.length > 0 && (
                          <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">
                            {eq.updatableFields.length} fields
                          </Badge>
                        )}
                      </Button>
                    )}
                    <Button
                      variant={eq.importMode === 'new' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'new')}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Add as New Equipment
                    </Button>
                    <Button
                      variant={eq.importMode === 'attachment' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'attachment')}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Add as Attachment
                      {eq.suggestedType === 'attachment' && <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4">Suggested</Badge>}
                    </Button>
                    <Button
                      variant={eq.importMode === 'skip' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setImportMode(eq.tempId, 'skip')}
                    >
                      Skip This Item
                    </Button>
                  </div>

                  {/* Attachment Section - Parent Selection and Details (shown when mode is attachment) */}
                  {eq.importMode === 'attachment' && (
                    <div className="pl-7 pt-2 space-y-3">
                      {/* Parent Equipment Selector */}
                      <div>
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
                                  .map(other => {
                                    // ALWAYS use temp: prefix for consistent unique values
                                    const value = `temp:${other.tempId}`;
                                    // Add status suffix to clarify what will happen
                                    const statusLabel = other.importMode === 'update_existing' || (other.importMode === 'skip' && other.matchedEquipmentId)
                                      ? '(will use existing)'
                                      : other.importMode === 'new'
                                        ? '(will be created)'
                                        : '';
                                    const displayName = `${other.year || ''} ${other.make} ${other.model}`.trim();
                                    return (
                                      <SelectItem key={other.tempId} value={value}>
                                        {displayName} {statusLabel}
                                      </SelectItem>
                                    );
                                  })}
                              </SelectGroup>
                            )}
                            {equipment.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Existing equipment</SelectLabel>
                                {equipment
                                  .filter(existing => {
                                    // Exclude if this equipment is already shown via an import item
                                    const isShownViaImport = potentialParentsFromImport.some(
                                      other => other.matchedEquipmentId === existing.id &&
                                               other.tempId !== eq.tempId
                                    );
                                    return !isShownViaImport;
                                  })
                                  .map(existing => (
                                    <SelectItem key={existing.id} value={existing.id}>
                                      {existing.year} {existing.make} {existing.model}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Attachment Details Section - shown when expanded */}
                      {expandedItems.has(eq.tempId) && (
                        <div className={`space-y-3 ${eq.attachmentAction === 'skip' ? 'opacity-50' : ''}`}>
                          {/* Attachment Duplicate Warning - inside expanded area */}
                          {eq.attachmentDuplicateStatus === 'match' && (
                            <div className="space-y-2 bg-muted/30 rounded-md p-3">
                              <div className="flex items-center gap-2 text-warning">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm">
                                  Matches existing attachment: <strong>{eq.matchedAttachmentName}</strong>
                                </span>
                              </div>
                              
                              {/* Duplicate handling buttons - clear, non-conflicting labels */}
                              <p className="text-xs text-muted-foreground">How to handle this duplicate:</p>
                              <div className="flex gap-1.5 flex-wrap">
                                <Button
                                  variant={eq.attachmentAction === 'skip' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setAttachmentAction(eq.tempId, 'skip')}
                                >
                                  Don't Add (Duplicate)
                                </Button>
                                <Button
                                  variant={eq.attachmentAction === 'update_existing' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setAttachmentAction(eq.tempId, 'update_existing')}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Update Existing Attachment
                                </Button>
                                <Button
                                  variant={eq.attachmentAction === 'import_anyway' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setAttachmentAction(eq.tempId, 'import_anyway')}
                                >
                                  Add as Another Copy
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Attachment Details Fields */}
                          <div className="border-t pt-3 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <Package className="h-3.5 w-3.5" />
                              Attachment Details
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground">Name *</label>
                                <Input
                                  value={eq.attachmentName || `${eq.make} ${eq.model}`}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'attachmentName', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Attachment name"
                                  disabled={eq.attachmentAction === 'skip'}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-muted-foreground">Value</label>
                                <Input
                                  type="number"
                                  value={eq.attachmentValue ?? eq.purchasePrice ?? ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'attachmentValue', e.target.value ? parseFloat(e.target.value) : 0)}
                                  className="h-8 text-sm"
                                  placeholder="$0.00"
                                  disabled={eq.attachmentAction === 'skip'}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-muted-foreground">Serial Number</label>
                                <Input
                                  value={eq.attachmentSerial ?? eq.serialVin ?? ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'attachmentSerial', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Serial number (optional)"
                                  disabled={eq.attachmentAction === 'skip'}
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <label className="text-xs text-muted-foreground">Description/Notes</label>
                                <Textarea
                                  value={eq.attachmentDescription ?? eq.notes ?? ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'attachmentDescription', e.target.value)}
                                  className="text-sm min-h-[60px]"
                                  placeholder="Additional notes (optional)"
                                  disabled={eq.attachmentAction === 'skip'}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Updatable Fields Comparison */}
                  {eq.duplicateStatus !== 'none' && eq.updatableFields.length > 0 && expandedItems.has(eq.tempId) && (
                    <div className="pl-7 pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Fields that can be updated:</p>
                      <div className="space-y-1 bg-muted/30 rounded p-2">
                        {eq.updatableFields.map((field) => (
                          <div key={field.field} className="flex items-center gap-2 text-xs">
                            <span className="text-success">●</span>
                            <span className="font-medium w-28">{field.label}:</span>
                            <span className="text-muted-foreground">{formatValue(field.existingValue, field.field)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-success font-medium">{formatValue(field.importedValue, field.field)}</span>
                            {getSourceBadge(eq, field.field)}
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

                  {/* Expanded Edit Fields for New Equipment */}
                  {eq.selected && eq.importMode === 'new' && expandedItems.has(eq.tempId) && (
                    <div className="pl-7 space-y-1">
                      {/* Basic Info Section - now includes Make/Model editing */}
                      {renderFieldSection(
                        eq,
                        'basic',
                        'Basic Information',
                        <Package className="h-4 w-4 text-muted-foreground" />,
                        !isSectionExpanded(eq.tempId, 'basic') ? `${eq.category}` : null,
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Make - editable here for new equipment */}
                          <div>
                            <label className="text-xs text-muted-foreground">Make *</label>
                            <Input
                              value={eq.make}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'make', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Make"
                            />
                          </div>
                          
                          {/* Model - editable here for new equipment */}
                          <div>
                            <label className="text-xs text-muted-foreground">Model *</label>
                            <Input
                              value={eq.model}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'model', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Model"
                            />
                          </div>
                          
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
                            <label className="text-xs text-muted-foreground flex items-center gap-1">
                              Year
                              {eq.yearDefaultedFromPurchase && (
                                <span className="inline-flex items-center gap-0.5 text-warning" title="Year defaulted from purchase date — please verify">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-[10px] font-medium">Review</span>
                                </span>
                              )}
                              {getSourceBadge(eq, 'year')}
                            </label>
                            <Input
                              type="number"
                              value={eq.year || ''}
                              onChange={(e) => {
                                const newYear = e.target.value ? parseInt(e.target.value) : null;
                                setEditableEquipment(prev => prev.map(item => 
                                  item.tempId === eq.tempId 
                                    ? { ...item, year: newYear, yearDefaultedFromPurchase: false }
                                    : item
                                ));
                              }}
                              className={`h-8 text-sm ${eq.yearDefaultedFromPurchase ? 'border-warning/50' : ''}`}
                              placeholder="Year"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground flex items-center">
                              Serial/VIN
                              {getSourceBadge(eq, 'serialVin')}
                            </label>
                            <Input
                              value={eq.serialVin || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'serialVin', e.target.value || null)}
                              className="h-8 text-sm"
                              placeholder="Serial/VIN"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground flex items-center">
                              Purchase Date
                              {getSourceBadge(eq, 'purchaseDate')}
                            </label>
                            <Input
                              type="date"
                              value={eq.purchaseDate || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'purchaseDate', e.target.value || null)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* Pricing Section */}
                      {renderFieldSection(
                        eq,
                        'pricing',
                        'Pricing',
                        <DollarSign className="h-4 w-4 text-muted-foreground" />,
                        !isSectionExpanded(eq.tempId, 'pricing') && eq.purchasePrice 
                          ? `${formatCurrency(eq.purchasePrice)}${eq.salesTax ? ` + ${formatCurrency(eq.salesTax)} tax` : ''}`
                          : null,
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground flex items-center">
                              Purchase Price
                              {getSourceBadge(eq, 'purchasePrice')}
                            </label>
                            <Input
                              type="number"
                              value={eq.purchasePrice || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'purchasePrice', e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="$0.00"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground flex items-center">
                              Sales Tax
                              {getSourceBadge(eq, 'salesTax')}
                            </label>
                            <Input
                              type="number"
                              value={eq.salesTax || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'salesTax', e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="$0.00"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground flex items-center">
                              Freight/Setup
                              {getSourceBadge(eq, 'freightSetup')}
                            </label>
                            <Input
                              type="number"
                              value={eq.freightSetup || ''}
                              onChange={(e) => updateEquipmentItem(eq.tempId, 'freightSetup', e.target.value ? parseFloat(e.target.value) : null)}
                              className="h-8 text-sm"
                              placeholder="$0.00"
                            />
                          </div>
                        </div>
                      )}

                      {/* Financing Section */}
                      {renderFieldSection(
                        eq,
                        'financing',
                        'Financing',
                        <CreditCard className="h-4 w-4 text-muted-foreground" />,
                        !isSectionExpanded(eq.tempId, 'financing') && eq.financingType !== 'owned' && eq.financingType !== null
                          ? `${eq.financingType === 'financed' ? 'Financed' : 'Leased'}${eq.monthlyPayment ? ` - ${formatCurrency(eq.monthlyPayment)}/mo` : ''}`
                          : (!isSectionExpanded(eq.tempId, 'financing') ? 'Owned (Cash)' : null),
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Select
                              value={eq.financingType || 'owned'}
                              onValueChange={(value) => updateEquipmentItem(eq.tempId, 'financingType', value)}
                            >
                              <SelectTrigger className="h-8 text-sm w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owned">Owned (Cash)</SelectItem>
                                <SelectItem value="financed">Financed</SelectItem>
                                <SelectItem value="leased">Leased</SelectItem>
                              </SelectContent>
                            </Select>
                            {(eq.financingType === 'financed' || eq.financingType === 'leased') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => clearFinancing(eq.tempId)}
                              >
                                Clear Financing
                              </Button>
                            )}
                          </div>

                          {(eq.financingType === 'financed' || eq.financingType === 'leased') && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground flex items-center">
                                  Deposit
                                  {getSourceBadge(eq, 'depositAmount')}
                                </label>
                                <Input
                                  type="number"
                                  value={eq.depositAmount || ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'depositAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-8 text-sm"
                                  placeholder="$0.00"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-muted-foreground flex items-center">
                                  Financed Amount
                                  {getSourceBadge(eq, 'financedAmount')}
                                </label>
                                <Input
                                  type="number"
                                  value={eq.financedAmount || ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'financedAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-8 text-sm"
                                  placeholder="$0.00"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-muted-foreground flex items-center">
                                  Monthly Payment
                                  {getSourceBadge(eq, 'monthlyPayment')}
                                </label>
                                <Input
                                  type="number"
                                  value={eq.monthlyPayment || ''}
                                  onChange={(e) => updateEquipmentItem(eq.tempId, 'monthlyPayment', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-8 text-sm"
                                  placeholder="$0.00"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-muted-foreground flex items-center">
                                  Term (Months)
                                  {getSourceBadge(eq, 'termMonths')}
                                </label>
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
                                  <label className="text-xs text-muted-foreground flex items-center">
                                    Buyout Amount
                                    {getSourceBadge(eq, 'buyoutAmount')}
                                  </label>
                                  <Input
                                    type="number"
                                    value={eq.buyoutAmount || ''}
                                    onChange={(e) => updateEquipmentItem(eq.tempId, 'buyoutAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="h-8 text-sm"
                                    placeholder="$0.00"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Collapsed summary for new equipment */}
                  {eq.selected && eq.importMode === 'new' && !expandedItems.has(eq.tempId) && (
                    <div className="pl-7 text-xs text-muted-foreground">
                      {eq.category} • {eq.purchasePrice ? formatCurrency(eq.purchasePrice) : 'No price'} 
                      {eq.financingType && eq.financingType !== 'owned' && ` • ${eq.financingType === 'financed' ? 'Financed' : 'Leased'}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Pre-Import Summary Panel */}
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-sm font-medium">Import Summary</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {newCount > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-success" />
                  <span>{newCount} new equipment</span>
                </div>
              )}
              {updateCount > 0 && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-info" />
                  <span>{updateCount} to update</span>
                </div>
              )}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-accent-foreground" />
                  <span>{attachmentCount} attachment{attachmentCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {attachSourceDocument && documentCount > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{documentCount} document{documentCount !== 1 ? 's' : ''} to attach</span>
                </div>
              )}
            </div>
            {selectedCount === 0 && (
              <p className="text-xs text-muted-foreground">No items selected for import</p>
            )}
          </div>

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
                  Processing...
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
