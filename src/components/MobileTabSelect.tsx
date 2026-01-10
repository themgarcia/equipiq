import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TabOption {
  value: string;
  label: string;
  badge?: number;
}

interface MobileTabSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabOption[];
  className?: string;
}

export function MobileTabSelect({ value, onValueChange, tabs, className }: MobileTabSelectProps) {
  const selectedTab = tabs.find(t => t.value === value);
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedTab && (
            <span className="flex items-center gap-2">
              {selectedTab.label}
              {selectedTab.badge !== undefined && selectedTab.badge > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                  {selectedTab.badge}
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tabs.map(tab => (
          <SelectItem key={tab.value} value={tab.value}>
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
