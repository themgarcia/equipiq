import { cn } from '@/lib/utils';

interface AIIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AIIndicator({ 
  size = 'sm',
  className 
}: AIIndicatorProps) {
  // Increased size mappings for legible star+text icon
  const dimensions = {
    sm: { width: 28, height: 28, fontSize: 9 },
    md: { width: 36, height: 36, fontSize: 11 },
    lg: { width: 48, height: 48, fontSize: 14 },
  };
  
  const { width, height, fontSize } = dimensions[size];
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={width} 
      height={height}
      className={cn("inline-block shrink-0", className)}
      aria-label="AI powered"
    >
      {/* Fatter 4-point star with solid purple fill for better contrast */}
      <path 
        d="M12 1L15 8L23 12L15 16L12 23L9 16L1 12L9 8L12 1Z"
        fill="#9333ea"
      />
      {/* AI text centered */}
      <text 
        x="12" 
        y="12.5" 
        textAnchor="middle" 
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        AI
      </text>
    </svg>
  );
}
