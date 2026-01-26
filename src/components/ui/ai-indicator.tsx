import { cn } from '@/lib/utils';

interface AIIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AIIndicator({ 
  size = 'sm',
  className 
}: AIIndicatorProps) {
  // Size mappings for unified star+text icon
  const dimensions = {
    sm: { width: 20, height: 20, fontSize: 6 },
    md: { width: 28, height: 28, fontSize: 8 },
    lg: { width: 36, height: 36, fontSize: 10 },
  };
  
  const { width, height, fontSize } = dimensions[size];
  
  // Use unique gradient ID to avoid conflicts when multiple instances render
  const gradientId = `ai-gradient-${size}`;
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={width} 
      height={height}
      className={cn("inline-block shrink-0", className)}
      aria-label="AI powered"
    >
      {/* 4-point star path with gradient fill */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>
      </defs>
      <path 
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill={`url(#${gradientId})`}
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
