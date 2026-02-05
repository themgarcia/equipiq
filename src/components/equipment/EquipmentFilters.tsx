import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabSelect } from '@/components/MobileTabSelect';

interface EquipmentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isMobile: boolean;
}

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Sold', label: 'Sold' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Lost', label: 'Lost' },
  { value: 'All', label: 'All' },
];

export function EquipmentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  isMobile,
}: EquipmentFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="relative max-w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {isMobile ? (
        <MobileTabSelect
          value={statusFilter}
          onValueChange={onStatusChange}
          tabs={statusOptions}
          className="w-full"
        />
      ) : (
        <Tabs value={statusFilter} onValueChange={onStatusChange}>
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Sold">Sold</TabsTrigger>
            <TabsTrigger value="Retired">Retired</TabsTrigger>
            <TabsTrigger value="Lost">Lost</TabsTrigger>
            <TabsTrigger value="All">All</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}
