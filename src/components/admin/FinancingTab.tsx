import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet } from 'lucide-react';

export interface FinancingStats {
  type: string;
  count: number;
  totalAmount: number;
  totalPurchaseValue: number;
}

interface FinancingTabProps {
  financingStats: FinancingStats[];
  totalEquipment: number;
  formatCurrency: (value: number) => string;
}

export function FinancingTab({
  financingStats,
  totalEquipment,
  formatCurrency,
}: FinancingTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {financingStats.map((stat) => (
          <Card key={stat.type}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium capitalize">{stat.type}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
              <p className="text-xs text-muted-foreground">
                {stat.type === 'owned' 
                  ? `${formatCurrency(stat.totalPurchaseValue)} total value`
                  : stat.totalAmount > 0 
                    ? `${formatCurrency(stat.totalAmount)} financed`
                    : `${formatCurrency(stat.totalPurchaseValue)} total value`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financing Breakdown</CardTitle>
          <CardDescription>Detailed financing analytics across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Financing Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Financed Amount</TableHead>
                <TableHead className="text-right">% of Fleet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financingStats.map((stat) => (
                <TableRow key={stat.type}>
                  <TableCell className="font-medium capitalize">{stat.type}</TableCell>
                  <TableCell className="text-right">{stat.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(stat.totalPurchaseValue)}</TableCell>
                  <TableCell className="text-right">
                    {stat.type !== 'owned' ? formatCurrency(stat.totalAmount) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalEquipment > 0 
                      ? ((stat.count / totalEquipment) * 100).toFixed(1) + '%'
                      : '0%'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
