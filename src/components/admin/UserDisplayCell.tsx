import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserDisplayCellProps {
  userId: string | null;
  displayName: {
    name: string;
    company: string | null;
    isUnknown: boolean;
  };
  onUserClick?: (userId: string) => void;
}

export function UserDisplayCell({ userId, displayName, onUserClick }: UserDisplayCellProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast({ title: 'User ID copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleClick = () => {
    if (userId && onUserClick) {
      onUserClick(userId);
    }
  };

  const isClickable = !!onUserClick && !!userId;

  const content = (
    <div className="flex items-center gap-1.5 group min-w-0">
      <div 
        className={`flex flex-col min-w-0 ${isClickable ? 'cursor-pointer hover:underline' : ''}`}
        onClick={isClickable ? handleClick : undefined}
      >
        <span className={`font-medium truncate ${displayName.isUnknown ? 'text-muted-foreground font-mono text-xs' : ''}`}>
          {displayName.name}
        </span>
        {displayName.company && (
          <span className="text-xs text-muted-foreground truncate">
            {displayName.company}
          </span>
        )}
      </div>
      {userId && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded shrink-0"
          title="Copy User ID"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );

  if (!userId) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default max-w-[200px]">
          {content}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs">
        {userId}
      </TooltipContent>
    </Tooltip>
  );
}
