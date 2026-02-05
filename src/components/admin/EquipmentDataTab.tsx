import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

export interface CategoryStats {
  category: string;
  count: number;
  avgPurchasePrice: number;
  totalValue: number;
  avgAge: number;
}

export interface FinancingStats {
  type: string;
  count: number;
  totalAmount: number;
  totalPurchaseValue: number;
}

interface EquipmentDataTabProps {
  categoryStats: CategoryStats[];
  financingStats: FinancingStats[];
  totalEquipment: number;
  formatCurrency: (value: number) => string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function EquipmentDataTab({
  categoryStats,
  financingStats,
  totalEquipment,
  formatCurrency,
}: EquipmentDataTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Equipment by Category</CardTitle>
            <CardDescription>Distribution across equipment categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <BarChart 
                data={categoryStats.map(cat => ({
                  ...cat,
                  percent: totalEquipment > 0 
                    ? ((cat.count / totalEquipment) * 100)
                    : 0,
                }))} 
                layout="vertical"
              >
                <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                          <p className="font-medium">{data.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.percent.toFixed(1)}% ({data.count} items)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percent" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financing Distribution</CardTitle>
            <CardDescription>Owned vs Financed vs Leased</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <PieChart>
                <Pie
                  data={financingStats}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ type, count }) => {
                    const total = financingStats.reduce((sum, s) => sum + s.count, 0);
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                    return `${type}: ${percent}%`;
                  }}
                >
                  {financingStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Analytics</CardTitle>
          <CardDescription>Detailed breakdown by equipment category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Avg Purchase Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Avg Age (Years)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryStats.map((cat) => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{cat.category}</TableCell>
                  <TableCell className="text-right">{cat.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.avgPurchasePrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.totalValue)}</TableCell>
                  <TableCell className="text-right">{cat.avgAge.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
