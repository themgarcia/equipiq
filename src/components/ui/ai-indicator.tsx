import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'icon-only';
  className?: string;
}

export function AIIndicator({ 
  size = 'sm',
  variant = 'badge',
  className 
}: AIIndicatorProps) {
  // Badge variant - pill with sparkle + AI text
  if (variant === 'badge') {
    const sizeClasses = {
      sm: 'h-5 text-[10px] px-1.5 gap-0.5',
      md: 'h-6 text-xs px-2 gap-1',
      lg: 'h-7 text-sm px-2.5 gap-1',
    };
    
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    };
    
    return (
      <span 
        className={cn(
          "inline-flex items-center rounded-full font-semibold",
          "bg-primary text-primary-foreground",
          sizeClasses[size],
          className
        )}
        aria-label="AI powered"
      >
        <Sparkles className={cn(iconSizes[size], "shrink-0")} />
        <span>AI</span>
      </span>
    );
  }
  
  // Icon-only variant - just the sparkle
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  return (
    <Sparkles 
      className={cn(iconSizes[size], "text-primary", className)} 
      aria-label="AI powered"
    />
  );
}
