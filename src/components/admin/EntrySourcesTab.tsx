import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PenLine, FileText, Table as TableIcon, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { UserDisplayCell } from '@/components/admin/UserDisplayCell';

interface UserEntryStats {
  userId: string;
  email: string;
  manual: number;
  aiDocument: number;
  spreadsheet: number;
  total: number;
}

interface AggregateStats {
  total: number;
  manual: number;
  aiDocument: number;
  spreadsheet: number;
}

export function EntrySourcesTab() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserEntryStats[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats>({
    total: 0,
    manual: 0,
    aiDocument: 0,
    spreadsheet: 0,
  });
  const { fetchProfiles, getDisplayName } = useUserProfiles();

  useEffect(() => {
    fetchEntrySourceData();
  }, []);

  const fetchEntrySourceData = async () => {
    try {
      setLoading(true);

      // Fetch all equipment with entry_source grouped by user
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('user_id, entry_source');

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(equipment?.map(e => e.user_id) || [])];
      
      // Fetch user profiles
      await fetchProfiles(userIds);

      // Calculate per-user stats
      const statsMap = new Map<string, UserEntryStats>();
      
      equipment?.forEach(eq => {
        if (!statsMap.has(eq.user_id)) {
          statsMap.set(eq.user_id, {
            userId: eq.user_id,
            email: '',
            manual: 0,
            aiDocument: 0,
            spreadsheet: 0,
            total: 0,
          });
        }
        
        const stat = statsMap.get(eq.user_id)!;
        stat.total++;
        
        switch (eq.entry_source) {
          case 'ai_document':
            stat.aiDocument++;
            break;
          case 'spreadsheet':
            stat.spreadsheet++;
            break;
          default:
            stat.manual++;
        }
      });

      // Convert to array and sort by total desc
      const statsArray = Array.from(statsMap.values())
        .sort((a, b) => b.total - a.total);

      setUserStats(statsArray);

      // Calculate aggregate stats
      const aggregate: AggregateStats = {
        total: equipment?.length || 0,
        manual: equipment?.filter(e => !e.entry_source || e.entry_source === 'manual').length || 0,
        aiDocument: equipment?.filter(e => e.entry_source === 'ai_document').length || 0,
        spreadsheet: equipment?.filter(e => e.entry_source === 'spreadsheet').length || 0,
      };
      setAggregateStats(aggregate);

    } catch (error) {
      console.error('Failed to fetch entry source data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aggregate Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Entry</CardTitle>
            <PenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.manual}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(aggregateStats.manual, aggregateStats.total)} of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Document Import</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.aiDocument}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(aggregateStats.aiDocument, aggregateStats.total)} of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spreadsheet Import</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.spreadsheet}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(aggregateStats.spreadsheet, aggregateStats.total)} of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Sources by User</CardTitle>
          <CardDescription>
            Breakdown of how each user adds equipment to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No equipment data found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Manual</TableHead>
                  <TableHead className="text-right">AI Document</TableHead>
                  <TableHead className="text-right">Spreadsheet</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((stat) => {
                  const displayInfo = getDisplayName(stat.userId);
                  return (
                    <TableRow key={stat.userId}>
                      <TableCell>
                        <UserDisplayCell 
                          userId={stat.userId}
                          displayName={displayInfo}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{stat.manual}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatPercent(stat.manual, stat.total)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{stat.aiDocument}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatPercent(stat.aiDocument, stat.total)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{stat.spreadsheet}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatPercent(stat.spreadsheet, stat.total)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stat.total}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
