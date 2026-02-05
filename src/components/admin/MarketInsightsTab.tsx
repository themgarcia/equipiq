import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, DollarSign, MapPin } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

export interface MarketInsight {
  name: string;
  value: number;
  label?: string;
}

interface MarketInsightsTabProps {
  industryStats: MarketInsight[];
  companySizeStats: MarketInsight[];
  revenueStats: MarketInsight[];
  regionStats: MarketInsight[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function MarketInsightsTab({
  industryStats,
  companySizeStats,
  revenueStats,
  regionStats,
}: MarketInsightsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Industry Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industry Distribution
          </CardTitle>
          <CardDescription>Users by industry type</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {industryStats.length > 0 ? (
            <ChartContainer config={{}} className="h-full w-full">
              <BarChart 
                data={industryStats} 
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                          <p className="font-medium">{data.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} companies
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No industry data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Size Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Size
          </CardTitle>
          <CardDescription>Distribution by field employees</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {companySizeStats.length > 0 ? (
            <ChartContainer config={{}} className="h-full w-full">
              <PieChart>
                <Pie
                  data={companySizeStats}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ label, value }) => `${label}: ${value}`}
                >
                  {companySizeStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No company size data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Distribution
          </CardTitle>
          <CardDescription>Companies by annual revenue range</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {revenueStats.length > 0 ? (
            <ChartContainer config={{}} className="h-full w-full">
              <BarChart data={revenueStats}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <ChartTooltip 
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                          <p className="font-medium">{data.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} companies
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Regions
          </CardTitle>
          <CardDescription>Geographic distribution of users</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {regionStats.length > 0 ? (
            <ChartContainer config={{}} className="h-full w-full">
              <BarChart 
                data={regionStats} 
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                          <p className="font-medium">{data.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.value} users
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No region data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
