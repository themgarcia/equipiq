import { cn } from "@/lib/utils";

interface EquipIQIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EquipIQIcon({ size = 'md', className }: EquipIQIconProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <img
      src="/equipiq-icon-v2.png"
      alt="equipIQ"
      className={cn(sizeClasses[size], 'rounded', className)}
    />
  );
}
