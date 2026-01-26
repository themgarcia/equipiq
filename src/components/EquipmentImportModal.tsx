import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, Table, ChevronRight } from 'lucide-react';
import { AIIndicator } from '@/components/ui/ai-indicator';
import { EquipmentImport } from '@/components/EquipmentImport';
import { SpreadsheetImport } from '@/components/SpreadsheetImport';
import { ExtractedEquipmentBase, DocumentSummary, FieldConflict } from '@/types/equipment';

interface EquipmentImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentExtracted: (
    equipment: ExtractedEquipmentBase[], 
    documentSummaries?: DocumentSummary[],
    conflicts?: FieldConflict[],
    processingNotes?: string,
    sourceFiles?: File[]
  ) => void;
}

export function EquipmentImportModal({ open, onOpenChange, onEquipmentExtracted }: EquipmentImportModalProps) {
  const [documentImportOpen, setDocumentImportOpen] = useState(false);
  const [spreadsheetImportOpen, setSpreadsheetImportOpen] = useState(false);

  const handleDocumentSelect = () => {
    onOpenChange(false);
    setDocumentImportOpen(true);
  };

  const handleSpreadsheetSelect = () => {
    onOpenChange(false);
    setSpreadsheetImportOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Equipment</DialogTitle>
            <DialogDescription>
              Choose how you'd like to import your equipment data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {/* Document Import Option */}
            <button
              onClick={handleDocumentSelect}
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
              onClick={handleSpreadsheetSelect}
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

      {/* Existing Document Import */}
      <EquipmentImport 
        open={documentImportOpen} 
        onOpenChange={setDocumentImportOpen}
        onEquipmentExtracted={onEquipmentExtracted}
      />

      {/* New Spreadsheet Import */}
      <SpreadsheetImport
        open={spreadsheetImportOpen}
        onOpenChange={setSpreadsheetImportOpen}
        onEquipmentExtracted={onEquipmentExtracted}
      />
    </>
  );
}
