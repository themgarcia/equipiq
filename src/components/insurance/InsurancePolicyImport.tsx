import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ExtractedPolicyData } from "@/types/insurance";
import { AIIndicator } from "@/components/ui/ai-indicator";

interface InsurancePolicyImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyExtracted: (data: ExtractedPolicyData) => void;
}

interface UploadedFile {
  file: File;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

export function InsurancePolicyImport({ open, onOpenChange, onPolicyExtracted }: InsurancePolicyImportProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

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
    
    // Only allow one file for policy import
    if (validFiles.length > 0) {
      setFiles([validFiles[0]]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = () => {
    setFiles([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processDocument = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus("Analyzing insurance document...");

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
      const { file } = files[0];
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('parse-insurance-docs', {
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
        return;
      }

      if (data.error) {
        toast({
          title: "Extraction Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Pass extracted data to review component
      onPolicyExtracted({
        brokerInfo: data.brokerInfo,
        policyInfo: data.policyInfo,
        scheduledEquipment: data.scheduledEquipment || [],
      });
      
      setFiles([]);
      onOpenChange(false);
      
      toast({
        title: "Document Processed",
        description: `Extracted ${data.scheduledEquipment?.length || 0} equipment item(s) for review`,
      });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Processing Failed",
        description: "An unexpected error occurred while processing the document",
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
          <DialogTitle className="flex items-center gap-2">
            Import from Policy Document
            <AIIndicator size="sm" />
          </DialogTitle>
          <DialogDescription>
            Upload your insurance policy declaration page or equipment schedule. 
            AI will extract broker contact, policy details, and insured equipment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            onClick={() => document.getElementById('policy-file-input')?.click()}
          >
            <input
              id="policy-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drag & drop your policy document, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG, WebP • Max 10MB
            </p>
          </div>

          {/* File Display */}
          {files.length > 0 && (
            <div className="flex items-start justify-between gap-2 bg-muted/50 rounded-md px-3 py-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <span 
                  className="text-sm min-w-0 flex-1 break-all" 
                  title={files[0].file.name}
                >
                  {files[0].file.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ({(files[0].file.size / 1024 / 1024).toFixed(1)}MB)
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="flex gap-2 p-3 bg-muted/50 rounded-md min-w-0">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground min-w-0 break-words">
              AI will extract broker contact info, policy number, renewal dates, and all scheduled equipment 
              with their declared values. You'll review and confirm before applying.
            </p>
          </div>

          {/* Processing Status */}
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
              onClick={processDocument}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Document"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
