import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ImportMode } from "@/types/equipment";

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
  suggestedCategory?: string | null;
  sourceFile?: File;
  sourceFiles?: File[];
  sourceDocumentIndices?: number[];
}

interface DocumentSummary {
  fileName: string;
  extracted: string[];
  itemsFound: string[];
}

interface FieldConflict {
  field: string;
  values: any[];
  sources: string[];
  resolved: any;
}

interface EquipmentImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentExtracted: (equipment: ExtractedEquipment[], metadata?: {
    documentSummaries?: DocumentSummary[];
    conflicts?: FieldConflict[];
    processingNotes?: string;
    sourceFiles?: File[];
  }) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

export function EquipmentImport({ open, onOpenChange, onEquipmentExtracted }: EquipmentImportProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('single_asset');

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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles: UploadedFile[] = [];
    
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }
      
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.heic')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push({ file });
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processDocuments = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    // Get current session to ensure we have a valid token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in again to process documents",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Prepare all source files for attachment
      const allSourceFiles = files.map(f => f.file);
      
      if (importMode === 'single_asset' || files.length > 1) {
        // BATCH MODE: Send all documents in a single request
        setProcessingStatus(`Processing ${files.length} document${files.length > 1 ? 's' : ''} together...`);

        // Convert all files to base64
        const documents = await Promise.all(
          files.map(async ({ file }) => ({
            base64: await fileToBase64(file),
            type: file.type || 'application/pdf',
            fileName: file.name,
          }))
        );

        const { data, error } = await supabase.functions.invoke('parse-equipment-docs', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            documents,
            mode: importMode,
          },
        });

        if (error) {
          console.error('Error processing documents:', error);
          toast({
            title: "Processing Error",
            description: `Failed to process documents: ${error.message}`,
            variant: "destructive",
          });
          setIsProcessing(false);
          setProcessingStatus("");
          return;
        }

        if (data.error) {
          toast({
            title: "Extraction Error",
            description: data.error,
            variant: "destructive",
          });
          setIsProcessing(false);
          setProcessingStatus("");
          return;
        }

        if (data.equipment && data.equipment.length > 0) {
          // Attach ALL source files to each equipment item
          const equipmentWithSources = data.equipment.map((eq: ExtractedEquipment) => ({
            ...eq,
            sourceFiles: allSourceFiles,
          }));

          onEquipmentExtracted(equipmentWithSources, {
            documentSummaries: data.documentSummaries,
            conflicts: data.conflicts,
            processingNotes: data.processingNotes,
            sourceFiles: allSourceFiles,
          });
          
          setFiles([]);
          onOpenChange(false);
          
          const primaryCount = data.equipment.filter((e: ExtractedEquipment) => e.suggestedType !== 'attachment').length;
          const attachmentCount = data.equipment.filter((e: ExtractedEquipment) => e.suggestedType === 'attachment').length;
          
          let description = `Extracted ${primaryCount} equipment item${primaryCount !== 1 ? 's' : ''}`;
          if (attachmentCount > 0) {
            description += ` and ${attachmentCount} attachment${attachmentCount !== 1 ? 's' : ''}`;
          }
          description += ` from ${files.length} document${files.length !== 1 ? 's' : ''} for review`;
          
          toast({
            title: "Documents Processed",
            description,
          });
        } else {
          toast({
            title: "No Equipment Found",
            description: "No equipment data could be extracted from the documents",
          });
        }
      } else {
        // SINGLE FILE, MULTI-ASSET MODE: Use legacy single document processing
        const { file } = files[0];
        setProcessingStatus(`Processing ${file.name}...`);

        const base64 = await fileToBase64(file);

        const { data, error } = await supabase.functions.invoke('parse-equipment-docs', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            documentBase64: base64,
            documentType: file.type || 'application/pdf',
            fileName: file.name,
          },
        });

        if (error) {
          console.error('Error processing document:', error);
          toast({
            title: "Processing Error",
            description: `Failed to process ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          setIsProcessing(false);
          setProcessingStatus("");
          return;
        }

        if (data.error) {
          toast({
            title: "Extraction Error",
            description: data.error,
            variant: "destructive",
          });
          setIsProcessing(false);
          setProcessingStatus("");
          return;
        }

        if (data.equipment && data.equipment.length > 0) {
          const equipmentWithSource = data.equipment.map((eq: ExtractedEquipment) => ({
            ...eq,
            sourceFile: file,
            sourceFiles: [file],
          }));
          
          onEquipmentExtracted(equipmentWithSource, {
            sourceFiles: [file],
          });
          
          setFiles([]);
          onOpenChange(false);
          
          toast({
            title: "Document Processed",
            description: `Extracted ${data.equipment.length} equipment item${data.equipment.length !== 1 ? 's' : ''} for review`,
          });
        } else {
          toast({
            title: "No Equipment Found",
            description: `No equipment data could be extracted from ${file.name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Processing Failed",
        description: "An unexpected error occurred while processing documents",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Import Equipment from Documents</DialogTitle>
          <DialogDescription>
            Upload purchase orders, invoices, financing agreements, or lease documents. 
            AI will extract equipment details for your review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Mode Toggle */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Import Mode:</p>
            <div className="flex gap-2">
              <Button
                variant={importMode === 'single_asset' ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1 h-auto py-2 px-3"
                onClick={() => setImportMode('single_asset')}
              >
                <div className="text-left">
                  <div className="font-medium text-xs">Single Asset</div>
                  <div className="text-[10px] text-muted-foreground">All docs = 1 equipment</div>
                </div>
              </Button>
              <Button
                variant={importMode === 'multi_asset' ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1 h-auto py-2 px-3"
                onClick={() => setImportMode('multi_asset')}
              >
                <div className="text-left">
                  <div className="font-medium text-xs">Multiple Assets</div>
                  <div className="text-[10px] text-muted-foreground">Each doc = separate item</div>
                </div>
              </Button>
            </div>
            {importMode === 'single_asset' && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Use this when uploading purchase agreement, registration, and financing docs for the same piece of equipment. All documents will be consolidated and attached.</span>
              </div>
            )}
          </div>

          {/* Drop Zone */}
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
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG, WebP • Max 10MB per file
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 flex-shrink-0">
              <p className="text-sm font-medium">
                Files to process ({files.length}):
                {importMode === 'single_asset' && files.length > 1 && (
                  <span className="font-normal text-muted-foreground ml-1">
                    (will be consolidated into 1 equipment record)
                  </span>
                )}
              </p>
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-2 bg-muted/50 rounded-md px-3 py-2"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <span 
                      className="text-sm min-w-0 flex-1 break-all" 
                      title={uploadedFile.file.name}
                    >
                      {uploadedFile.file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({(uploadedFile.file.size / 1024 / 1024).toFixed(1)}MB)
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="flex gap-2 p-3 bg-muted/50 rounded-md min-w-0">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground min-w-0 break-words">
              {importMode === 'single_asset' 
                ? "AI will analyze all documents together and extract the best-supported values. Any attachments (plows, buckets, etc.) will be detected automatically. All documents will be attached to the final record."
                : "AI will analyze each document separately and extract equipment information. You'll be able to review and edit before importing."
              }
            </p>
          </div>

          {/* Processing Status - always reserve space to prevent layout shift */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0 min-h-[1.25rem]">
            {isProcessing && (
              <>
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 mt-0.5" />
                <span className="break-all whitespace-normal min-w-0">{processingStatus}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processDocuments}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Process ${files.length} Document${files.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
