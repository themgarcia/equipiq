import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedEquipmentBase, DocumentSummary, FieldConflict } from '@/types/equipment';
import { AIIndicator } from '@/components/ui/ai-indicator';

interface SpreadsheetImportAIProps {
  onEquipmentExtracted: (
    equipment: ExtractedEquipmentBase[], 
    documentSummaries?: DocumentSummary[],
    conflicts?: FieldConflict[],
    processingNotes?: string,
    sourceFiles?: File[]
  ) => void;
  onClose: () => void;
}

type Step = 'upload' | 'sheet' | 'range' | 'processing';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 200;
const MAX_COLS = 30;

export function SpreadsheetImportAI({ onEquipmentExtracted, onClose }: SpreadsheetImportAIProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetInfo, setSheetInfo] = useState<{ rows: number; cols: number } | null>(null);
  const [parsedGrid, setParsedGrid] = useState<any[][]>([]);
  const [maxRows, setMaxRows] = useState<number>(MAX_ROWS);
  const [maxCols, setMaxCols] = useState<number>(MAX_COLS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      setSheets(sheetNames);
      setSelectedSheet(sheetNames[0]);
      
      // Get first sheet info
      const sheet = workbook.Sheets[sheetNames[0]];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      setSheetInfo({
        rows: range.e.r + 1,
        cols: range.e.c + 1,
      });
      
      if (sheetNames.length === 1) {
        setStep('range');
      } else {
        setStep('sheet');
      }
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    
    try {
      const arrayBuffer = await file!.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      setSheetInfo({
        rows: range.e.r + 1,
        cols: range.e.c + 1,
      });
      setStep('range');
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to read the selected sheet.",
        variant: "destructive",
      });
    }
  };

  const extractGrid = async (): Promise<any[][]> => {
    const arrayBuffer = await file!.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets[selectedSheet];
    
    // Get all data as 2D array
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Apply row/col limits
    const boundedRows = data.slice(0, maxRows);
    const boundedGrid = boundedRows.map(row => 
      (row as any[]).slice(0, maxCols)
    );
    
    return boundedGrid;
  };

  const handleProcess = async () => {
    setStep('processing');
    setIsProcessing(true);
    setProcessingStatus('Preparing spreadsheet data...');

    try {
      const grid = await extractGrid();
      setParsedGrid(grid);

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in again to process documents",
          variant: "destructive",
        });
        setIsProcessing(false);
        setStep('range');
        return;
      }

      setProcessingStatus('Analyzing spreadsheet with AI...');

      const { data, error } = await supabase.functions.invoke('parse-equipment-spreadsheet', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          sheetName: selectedSheet,
          grid,
          fileName: file?.name,
          range: {
            rows: grid.length,
            cols: grid[0]?.length || 0,
          },
        },
      });

      if (error) {
        console.error('Error processing spreadsheet:', error);
        
        // Handle specific error codes
        if (error.message?.includes('429')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please try again in a few moments.",
            variant: "destructive",
          });
        } else if (error.message?.includes('402')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace to continue.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Processing Error",
            description: error.message || "Failed to process spreadsheet",
            variant: "destructive",
          });
        }
        setIsProcessing(false);
        setStep('range');
        return;
      }

      if (data.error) {
        toast({
          title: "Extraction Error",
          description: data.error,
          variant: "destructive",
        });
        setIsProcessing(false);
        setStep('range');
        return;
      }

      if (data.equipment && data.equipment.length > 0) {
        onEquipmentExtracted(
          data.equipment,
          [{
            fileName: file?.name || 'spreadsheet',
            extracted: ['AI extraction from spreadsheet'],
            itemsFound: data.equipment.map((e: ExtractedEquipmentBase) => `${e.make} ${e.model}`),
          }],
          [],
          data.processingNotes || `Extracted ${data.equipment.length} items from spreadsheet using AI`,
          file ? [file] : undefined
        );

        toast({
          title: "Spreadsheet Processed",
          description: `Extracted ${data.equipment.length} equipment items for review.`,
        });

        onClose();
      } else {
        toast({
          title: "No Equipment Found",
          description: data.warnings?.join('. ') || "No equipment data could be extracted from the spreadsheet.",
        });
        setIsProcessing(false);
        setStep('range');
      }
    } catch (error) {
      console.error('Error processing spreadsheet:', error);
      toast({
        title: "Processing Failed",
        description: "An unexpected error occurred while processing the spreadsheet",
        variant: "destructive",
      });
      setIsProcessing(false);
      setStep('range');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const needsTruncation = sheetInfo && (sheetInfo.rows > maxRows || sheetInfo.cols > maxCols);
  const cellCount = Math.min(sheetInfo?.rows || 0, maxRows) * Math.min(sheetInfo?.cols || 0, maxCols);

  return (
    <div className="space-y-4">
      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            <AIIndicator size="md" />
            <span className="text-muted-foreground">
              AI will analyze messy or report-style spreadsheets and extract equipment data.
            </span>
          </div>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
            onClick={() => document.getElementById('ai-spreadsheet-input')?.click()}
          >
            <input
              id="ai-spreadsheet-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isProcessing ? (
              <>
                <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-3 animate-spin" />
                <p className="text-sm font-medium">Processing file...</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  Drag & drop a spreadsheet here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  XLSX, XLS, CSV • Max 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step: Sheet Selection */}
      {step === 'sheet' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setFile(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Select Sheet to Analyze</Label>
            <Select value={selectedSheet} onValueChange={handleSheetSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map(sheet => (
                  <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step: Range Selection */}
      {step === 'range' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
            {selectedSheet && <span>• {selectedSheet}</span>}
          </div>
          
          {sheetInfo && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="text-sm">
                <span className="font-medium">Sheet size: </span>
                <span className="text-muted-foreground">
                  {sheetInfo.rows} rows × {sheetInfo.cols} columns
                </span>
              </div>
              
              {needsTruncation && (
                <div className="flex items-start gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Large sheet detected. To improve processing, the analysis will be limited to the first {maxRows} rows and {maxCols} columns.
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Max Rows</Label>
                  <Input
                    type="number"
                    value={maxRows}
                    onChange={(e) => setMaxRows(Math.min(MAX_ROWS, Math.max(1, parseInt(e.target.value) || MAX_ROWS)))}
                    min={1}
                    max={MAX_ROWS}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Columns</Label>
                  <Input
                    type="number"
                    value={maxCols}
                    onChange={(e) => setMaxCols(Math.min(MAX_COLS, Math.max(1, parseInt(e.target.value) || MAX_COLS)))}
                    min={1}
                    max={MAX_COLS}
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Cells to analyze: {cellCount.toLocaleString()}
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(sheets.length > 1 ? 'sheet' : 'upload')}>
              Back
            </Button>
            <Button onClick={handleProcess}>
              Analyze with AI
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="py-8 text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
          <div className="space-y-1">
            <p className="font-medium">{processingStatus}</p>
            <p className="text-sm text-muted-foreground">
              This may take a moment depending on the spreadsheet complexity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
