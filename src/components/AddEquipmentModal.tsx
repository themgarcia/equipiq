import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, Table, PenLine, ChevronRight, ChevronLeft } from 'lucide-react';
import { AIIndicator } from '@/components/ui/ai-indicator';
import { EquipmentImport } from '@/components/EquipmentImport';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { EquipmentForm } from '@/components/EquipmentForm';
import { DocumentSummary, FieldConflict, Equipment } from '@/types/equipment';

// Use a permissive type to match what EquipmentImport returns
interface ExtractedEquipmentAny {
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
  suggestedCategory?: string | null;
  sourceFile?: File;
  sourceFiles?: File[];
  sourceDocumentIndices?: number[];
}

interface AddEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentExtracted: (
    equipment: ExtractedEquipmentAny[], 
    documentSummaries?: DocumentSummary[],
    conflicts?: FieldConflict[],
    processingNotes?: string,
    sourceFiles?: File[]
  ) => void;
  onManualSubmit: (equipment: Omit<Equipment, 'id'>) => void;
}

type SelectedOption = 'none' | 'manual' | 'documents' | 'spreadsheet';

export function AddEquipmentModal({ 
  open, 
  onOpenChange, 
  onEquipmentExtracted,
  onManualSubmit,
}: AddEquipmentModalProps) {
  const [selectedOption, setSelectedOption] = useState<SelectedOption>('none');

  const handleBack = () => {
    setSelectedOption('none');
  };

  const handleClose = () => {
    setSelectedOption('none');
    onOpenChange(false);
  };

  const handleManualSubmit = (data: Omit<Equipment, 'id'>) => {
    onManualSubmit(data);
    handleClose();
  };

  // Render based on selected option
  if (selectedOption === 'manual') {
    return (
      <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) handleBack(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 -mt-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to options
            </button>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Enter equipment details manually.
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm
            open={true}
            onOpenChange={(isOpen) => { if (!isOpen) handleBack(); }}
            onSubmit={handleManualSubmit}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (selectedOption === 'documents') {
    return (
      <EquipmentImport 
        open={true} 
        onOpenChange={(isOpen) => {
          if (!isOpen) handleBack();
        }}
        onEquipmentExtracted={(eq, summaries, conflicts, notes, files) => {
          onEquipmentExtracted(eq, summaries, conflicts, notes, files);
          handleClose();
        }}
        onBack={handleBack}
      />
    );
  }

  if (selectedOption === 'spreadsheet') {
    return (
      <SpreadsheetImport
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleBack();
        }}
        onEquipmentExtracted={(eq, summaries, conflicts, notes, files) => {
          onEquipmentExtracted(eq, summaries, conflicts, notes, files);
          handleClose();
        }}
        onBack={handleBack}
      />
    );
  }

  // Main selection view
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Equipment</DialogTitle>
          <DialogDescription>
            Choose how you'd like to add equipment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {/* Manual Entry Option */}
          <button
            onClick={() => setSelectedOption('manual')}
            className="w-full p-4 rounded-lg border bg-card text-left hover:bg-accent hover:border-accent-foreground/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <PenLine className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">Manual Data Entry</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter equipment details by hand.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </div>
          </button>

          {/* Document Import Option */}
          <button
            onClick={() => setSelectedOption('documents')}
            className="w-full p-4 rounded-lg border bg-card text-left hover:bg-accent hover:border-accent-foreground/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">Import from Documents</span>
                  <AIIndicator />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload photos, PDFs, or scans of invoices, spec sheets, or purchase documents.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </div>
          </button>

          {/* Spreadsheet Import Option */}
          <button
            onClick={() => setSelectedOption('spreadsheet')}
            className="w-full p-4 rounded-lg border bg-card text-left hover:bg-accent hover:border-accent-foreground/20 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <Table className="h-5 w-5 mt-0.5 text-muted-foreground group-hover:text-foreground" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">Import from Spreadsheet</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a CSV or Excel file with your equipment list.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
