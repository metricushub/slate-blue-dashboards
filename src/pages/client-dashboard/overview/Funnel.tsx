import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricRow } from "@/types";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import { BarChart3, List, TrendingDown, TrendingUp } from "lucide-react";

interface FunnelProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
}

interface FunnelStage {
  name: string;
  value: number;
  rate?: number;
}

export function Funnel({ clientId, period, platform }: FunnelProps) {
  const { dataSource } = useDataSource();
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    const loadFunnelData = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const metrics = await dataSource.getMetrics(
          clientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Filter by platform
        const filteredMetrics = platform === 'all' 
          ? metrics 
          : metrics.filter(metric => metric.platform === platform);

        // Calculate totals
        const totalImpressions = filteredMetrics.reduce((sum, row) => sum + row.impressions, 0);
        const totalClicks = filteredMetrics.reduce((sum, row) => sum + row.clicks, 0);
        const totalLeads = filteredMetrics.reduce((sum, row) => sum + row.leads, 0);
        
        // Mock sales calculation (15% of leads for demo)
        const totalSales = Math.round(totalLeads * 0.15);

        // Calculate rates
        const clickRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
        const salesRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

        const funnelStages: FunnelStage[] = [
          { name: 'Impressões', value: totalImpressions },
          { name: 'Cliques', value: totalClicks, rate: clickRate },
          { name: 'Leads', value: totalLeads, rate: conversionRate },
          { name: 'Vendas', value: totalSales, rate: salesRate },
        ];

        setStages(funnelStages);
      } catch (error) {
        console.error('Failed to load funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [clientId, period, platform, dataSource]);

  if (loading) {
    return (
      <Card className="bg-card border border-border rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">Funil de Conversão</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('chart')}
              className={`${
                viewMode === 'chart' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } hover:bg-muted`}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={`${
                viewMode === 'table' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } hover:bg-muted`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {viewMode === 'chart' ? (
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-20">
                      {stage.name}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {new Intl.NumberFormat('pt-BR').format(stage.value)}
                    </span>
                  </div>
                  {stage.rate !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        stage.rate >= 2 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stage.rate.toFixed(1)}%
                      </span>
                      {stage.rate >= 2 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                      style={{ 
                        width: `${(stage.value / maxValue) * 100}%` 
                      }}
                    />
                  </div>
                  
                  {index < stages.length - 1 && (
                    <div className="absolute right-0 top-full mt-1">
                      <div className="text-xs text-muted-foreground">
                        →
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Etapa</TableHead>
                <TableHead className="text-muted-foreground">Volume</TableHead>
                <TableHead className="text-muted-foreground">Taxa</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage) => (
                <TableRow key={stage.name} className="border-border hover:bg-muted/50">
                  <TableCell className="text-foreground font-medium">
                    {stage.name}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {new Intl.NumberFormat('pt-BR').format(stage.value)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {stage.rate !== undefined ? `${stage.rate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {stage.rate !== undefined ? (
                      <div className="flex items-center gap-2">
                        {stage.rate >= 2 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 text-sm">Bom</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 text-sm">Baixo</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}