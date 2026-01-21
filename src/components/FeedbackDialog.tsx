import { useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VoiceDictationButton } from '@/components/ui/voice-dictation-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useElevenLabsScribe } from '@/hooks/useElevenLabsScribe';
import { 
  Loader2, 
  Send, 
  Camera, 
  X, 
  RefreshCw, 
  Bug, 
  Lightbulb, 
  MessageCircle, 
  HelpCircle,
  ImageIcon,
  CheckCircle2,
  MessageSquarePlus
} from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FeedbackDialogContent({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Screenshot state
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Page context
  const pageUrl = location.pathname;
  const pageTitle = document.title;

  // ElevenLabs voice dictation for description
  const descriptionScribe = useElevenLabsScribe({
    onTranscript: (text) => setDescription(text),
  });

  // Capture screenshot function
  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Small delay to ensure dialog is not captured
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Hide the dialog temporarily for capture
      const dialogOverlay = document.querySelector('[data-radix-dialog-overlay]');
      const dialogContent = document.querySelector('[data-radix-dialog-content]');
      
      if (dialogOverlay) (dialogOverlay as HTMLElement).style.visibility = 'hidden';
      if (dialogContent) (dialogContent as HTMLElement).style.visibility = 'hidden';
      
      // Capture the main content
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Lower scale for smaller file size
        ignoreElements: (element) => {
          // Ignore the feedback button and dialog
          return element.classList?.contains('fixed') && 
                 (element.getAttribute('aria-label') === 'Send feedback' ||
                  element.getAttribute('role') === 'dialog');
        }
      });
      
      // Show dialog again
      if (dialogOverlay) (dialogOverlay as HTMLElement).style.visibility = 'visible';
      if (dialogContent) (dialogContent as HTMLElement).style.visibility = 'visible';
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          setScreenshot(blob);
          setScreenshotPreview(URL.createObjectURL(blob));
        }
      }, 'image/png', 0.8);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast({
        title: 'Screenshot capture failed',
        description: 'You can still submit feedback without a screenshot.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  const removeScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const retakeScreenshot = () => {
    removeScreenshot();
    // Close dialog briefly to capture
    onOpenChange(false);
    setTimeout(() => {
      onOpenChange(true);
      // Capture after dialog reopens
      setTimeout(() => captureScreenshot(), 300);
    }, 500);
  };

  // Voice dictation handler
  const handleDescriptionVoiceToggle = useCallback(() => {
    if (descriptionScribe.isListening) {
      descriptionScribe.stopListening();
    } else {
      descriptionScribe.startListening();
    }
  }, [descriptionScribe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stop any active dictation
    descriptionScribe.stopListening();
    
    if (!user || !category || !description.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please select a category and provide a description.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate subject from description
    const autoSubject = description.trim().substring(0, 50) + (description.length > 50 ? '...' : '');

    setIsSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if exists
      if (screenshot) {
        const fileName = `${user.id}/${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, screenshot, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Screenshot upload failed:', uploadError);
          // Continue without screenshot
        } else {
          // Get signed URL for the screenshot
          const { data: urlData } = await supabase.storage
            .from('feedback-screenshots')
            .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry
          
          screenshotUrl = urlData?.signedUrl || null;
        }
      }

      // Insert feedback with screenshot URL and page context
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        category,
        subject: autoSubject,
        description: description.trim(),
        screenshot_url: screenshotUrl,
        page_url: pageUrl,
        page_title: pageTitle,
      });

      if (error) throw error;

      // Show success state
      setShowSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setShowSuccess(false);
        setCategory('');
        setDescription('');
        removeScreenshot();
        onOpenChange(false);
      }, 2000);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Cleanup on close
      if (!showSuccess) {
        removeScreenshot();
        setCategory('');
        setDescription('');
      }
      descriptionScribe.stopListening();
    }
    onOpenChange(newOpen);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Thank you!</h3>
            <p className="text-muted-foreground">
              Your feedback has been submitted. We appreciate you taking the time to help us improve.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts, reporting issues, or requesting features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Screenshot - Optional */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Screenshot (optional)
            </Label>
            {isCapturing ? (
              <div className="flex items-center justify-center h-24 border rounded-lg bg-muted/30">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Capturing...</span>
              </div>
            ) : screenshotPreview ? (
              <div className="relative group">
                <img 
                  src={screenshotPreview} 
                  alt="Screenshot preview" 
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={retakeScreenshot}
                    title="Retake screenshot"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={removeScreenshot}
                    title="Remove screenshot"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-10"
                onClick={captureScreenshot}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Screenshot
              </Button>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="What type of feedback is this?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Bug Report
                  </div>
                </SelectItem>
                <SelectItem value="feature">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Feature Request
                  </div>
                </SelectItem>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    General Feedback
                  </div>
                </SelectItem>
                <SelectItem value="question">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Question
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description with voice input */}
          <div className="space-y-2">
            <Label htmlFor="description">What's on your mind? *</Label>
            <div className="relative">
              <Textarea
                id="description"
                placeholder="Please provide as much detail as possible..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="pb-10"
              />
              <div className="absolute right-2 bottom-2">
                <VoiceDictationButton
                  isListening={descriptionScribe.isListening}
                  onToggle={handleDescriptionVoiceToggle}
                  disabled={descriptionScribe.isConnecting}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Floating feedback button component - exported for use in Layout
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  // Don't show on landing, auth, or feedback page
  const hiddenPaths = ['/', '/auth', '/feedback', '/privacy', '/terms'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Send feedback</p>
        </TooltipContent>
      </Tooltip>
      
      <FeedbackDialogContent open={open} onOpenChange={setOpen} />
    </>
  );
}

// Also export the dialog for direct use if needed
export { FeedbackDialogContent as FeedbackDialog };
