import { cn } from "@/lib/utils";

interface EquipIQIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EquipIQIcon({ size = 'md', className }: EquipIQIconProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-base',
    md: 'h-8 w-8 text-xl',
    lg: 'h-10 w-10 text-2xl'
  };

  const supSizeClasses = {
    sm: 'text-[0.55rem]',
    md: 'text-[0.7rem]',
    lg: 'text-[0.85rem]'
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        'flex items-center justify-center rounded font-bold',
        'bg-[hsl(38,92%,50%)]', // Always amber background (dark mode brand)
        className
      )}
    >
      <span className="text-[hsl(215,25%,15%)]">E</span>
      <sup className={cn('text-[hsl(215,25%,15%)] font-semibold -ml-0.5', supSizeClasses[size])}>iq</sup>
    </div>
  );
}
