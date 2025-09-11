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
      <Card className="bg-[#11161e] border-[#1f2733]">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-[#1f2733] rounded mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-[#1f2733] rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <Card className="bg-[#11161e] border-[#1f2733]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#e6edf3]">Funil de Conversão</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('chart')}
              className={`${
                viewMode === 'chart' 
                  ? 'bg-[#1f2733] text-[#e6edf3]' 
                  : 'text-[#9fb0c3] hover:text-[#e6edf3]'
              } hover:bg-[#1f2733]`}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={`${
                viewMode === 'table' 
                  ? 'bg-[#1f2733] text-[#e6edf3]' 
                  : 'text-[#9fb0c3] hover:text-[#e6edf3]'
              } hover:bg-[#1f2733]`}
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
                    <span className="text-sm font-medium text-[#e6edf3] w-20">
                      {stage.name}
                    </span>
                    <span className="text-lg font-bold text-[#e6edf3]">
                      {new Intl.NumberFormat('pt-BR').format(stage.value)}
                    </span>
                  </div>
                  {stage.rate !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        stage.rate >= 2 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}>
                        {stage.rate.toFixed(1)}%
                      </span>
                      {stage.rate >= 2 ? (
                        <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[#ef4444]" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <div className="h-6 bg-[#1f2733] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-700"
                      style={{ 
                        width: `${(stage.value / maxValue) * 100}%` 
                      }}
                    />
                  </div>
                  
                  {index < stages.length - 1 && (
                    <div className="absolute right-0 top-full mt-1">
                      <div className="text-xs text-[#9fb0c3]">
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
              <TableRow className="border-[#1f2733] hover:bg-[#1f2733]/50">
                <TableHead className="text-[#9fb0c3]">Etapa</TableHead>
                <TableHead className="text-[#9fb0c3]">Volume</TableHead>
                <TableHead className="text-[#9fb0c3]">Taxa</TableHead>
                <TableHead className="text-[#9fb0c3]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage) => (
                <TableRow key={stage.name} className="border-[#1f2733] hover:bg-[#1f2733]/50">
                  <TableCell className="text-[#e6edf3] font-medium">
                    {stage.name}
                  </TableCell>
                  <TableCell className="text-[#e6edf3]">
                    {new Intl.NumberFormat('pt-BR').format(stage.value)}
                  </TableCell>
                  <TableCell className="text-[#e6edf3]">
                    {stage.rate !== undefined ? `${stage.rate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {stage.rate !== undefined ? (
                      <div className="flex items-center gap-2">
                        {stage.rate >= 2 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                            <span className="text-[#22c55e] text-sm">Bom</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-[#ef4444]" />
                            <span className="text-[#ef4444] text-sm">Baixo</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#9fb0c3] text-sm">-</span>
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