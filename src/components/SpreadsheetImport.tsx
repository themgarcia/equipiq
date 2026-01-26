import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table } from 'lucide-react';
import { AIIndicator } from '@/components/ui/ai-indicator';
import { SpreadsheetImportStructured } from '@/components/SpreadsheetImportStructured';
import { SpreadsheetImportAI } from '@/components/SpreadsheetImportAI';
import { ExtractedEquipmentBase, DocumentSummary, FieldConflict } from '@/types/equipment';

interface SpreadsheetImportProps {
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

export function SpreadsheetImport({ open, onOpenChange, onEquipmentExtracted }: SpreadsheetImportProps) {
  const [activeMode, setActiveMode] = useState<'structured' | 'ai'>('structured');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Spreadsheet</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import equipment data.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'structured' | 'ai')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structured" className="gap-2">
              <Table className="h-4 w-4" />
              Structured (Table)
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <AIIndicator showBadge={false} />
              AI (Messy Spreadsheet)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured" className="flex-1 overflow-hidden mt-4">
            <SpreadsheetImportStructured 
              onEquipmentExtracted={onEquipmentExtracted}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="ai" className="flex-1 overflow-hidden mt-4">
            <SpreadsheetImportAI
              onEquipmentExtracted={onEquipmentExtracted}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
