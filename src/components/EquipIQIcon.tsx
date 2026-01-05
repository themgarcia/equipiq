import { cn } from "@/lib/utils";

interface EquipIQIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EquipIQIcon({ size = 'md', className }: EquipIQIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  return (
    <img
      src="/equipiq-icon.png"
      alt="equipIQ"
      className={cn(sizeClasses[size], 'rounded', className)}
    />
  );
}
