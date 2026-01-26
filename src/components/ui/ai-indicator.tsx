import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIIndicatorProps {
  showBadge?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function AIIndicator({ 
  showBadge = true, 
  size = 'sm',
  className 
}: AIIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      className
    )}>
      <Sparkles className={cn(iconSize, "text-purple-500")} />
      {showBadge && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400">
          AI
        </span>
      )}
    </span>
  );
}
