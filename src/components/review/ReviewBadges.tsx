import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle } from 'lucide-react';

/** Shared review-screen pieces: used by the document import review and the division mapping review. */
export function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  switch (confidence) {
    case 'high':
      return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><Check className="h-3 w-3 mr-1" />High</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3 mr-1" />Medium</Badge>;
    default:
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Low</Badge>;
  }
}

export function SourceBadge({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1 text-muted-foreground">
      {children}
    </Badge>
  );
}

export function ConflictBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-warning/30 bg-warning/10 p-3 space-y-2">
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertTriangle className="h-4 w-4 text-warning" />
        {title}
      </div>
      {children}
    </div>
  );
}
