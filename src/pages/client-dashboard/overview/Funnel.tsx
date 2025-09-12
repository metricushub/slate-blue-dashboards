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
  percentage: number; // Percentage of first stage for visual sizing
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

        // Calculate rates between stages
        const clickRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
        const salesRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

        const funnelStages: FunnelStage[] = [
          { 
            name: 'Impressões', 
            value: totalImpressions, 
            percentage: 100 
          },
          { 
            name: 'Cliques', 
            value: totalClicks, 
            rate: clickRate,
            percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
          },
          { 
            name: 'Leads', 
            value: totalLeads, 
            rate: conversionRate,
            percentage: totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0
          },
          { 
            name: 'Vendas', 
            value: totalSales, 
            rate: salesRate,
            percentage: totalImpressions > 0 ? (totalSales / totalImpressions) * 100 : 0
          },
        ];

        setStages(funnelStages);

        // Analytics track
        console.log('telemetry:funnel_data_loaded', { 
          clientId, 
          platform, 
          period,
          totalImpressions,
          totalClicks,
          totalLeads,
          totalSales
        });
      } catch (error) {
        console.error('Failed to load funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [clientId, period, platform, dataSource]);

  const handleToggleView = (mode: 'chart' | 'table') => {
    setViewMode(mode);
    console.log('telemetry:funnel_view_toggle', { clientId, mode });
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm h-[280px]">
        <CardContent className="p-5">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4 w-32"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm h-[240px] flex flex-col">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Funil de Conversão</CardTitle>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleView('chart')}
              className={`h-8 w-8 p-0 rounded ${
                viewMode === 'chart' 
                  ? 'bg-white text-slate-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleView('table')}
              className={`h-8 w-8 p-0 rounded ${
                viewMode === 'table' 
                  ? 'bg-white text-slate-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 flex-1">
        {viewMode === 'chart' ? (
          <div className="space-y-4">
            {stages.map((stage, index) => {
              // Calculate clip-path for funnel effect
              const topWidth = 100 - (index * 6); // Start at 100%, decrease by 6% each stage
              const bottomWidth = 100 - ((index + 1) * 6);
              const clipPath = `polygon(${(100 - topWidth) / 2}% 0%, ${50 + topWidth / 2}% 0%, ${50 + bottomWidth / 2}% 100%, ${(100 - bottomWidth) / 2}% 100%)`;
              
              return (
                <div key={stage.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide w-16">
                        {stage.name}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {new Intl.NumberFormat('pt-BR').format(stage.value)}
                      </span>
                    </div>
                    {stage.rate !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          stage.rate >= 2 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {stage.rate.toFixed(1)}%
                        </span>
                        {stage.rate >= 2 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative flex justify-center">
                    <div 
                      className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 relative rounded-md"
                      style={{ 
                        width: `${100 - (index * 20)}%` // Decrease by 20% each stage (100%, 80%, 60%, 40%)
                      }}
                    >
                      {/* Funnel shape overlay for visual effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-md" />
                    </div>
                  </div>
                  
                  {/* Connection arrow */}
                  {index < stages.length - 1 && (
                    <div className="flex justify-center mt-2 mb-1">
                      <div className="text-slate-400 text-xs">↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50">
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Etapa</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Volume</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Taxa</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((stage) => (
                  <TableRow key={stage.name} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-900 font-medium">
                      {stage.name}
                    </TableCell>
                    <TableCell className="text-slate-900 font-mono">
                      {new Intl.NumberFormat('pt-BR').format(stage.value)}
                    </TableCell>
                    <TableCell className="text-slate-900 font-mono">
                      {stage.rate !== undefined ? `${stage.rate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {stage.rate !== undefined ? (
                        <div className="flex items-center gap-2">
                          {stage.rate >= 2 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 text-xs font-medium">Bom</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              <span className="text-red-500 text-xs font-medium">Baixo</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}