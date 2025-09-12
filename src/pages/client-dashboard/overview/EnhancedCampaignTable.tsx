import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useDataSource } from "@/hooks/useDataSource";
import { Campaign, MetricRow } from "@/types";
import { 
  Search, Settings, Download, ArrowUpDown, ArrowUp, ArrowDown, 
  ChevronDown, ChevronRight, Play, Pause, Square, Filter, X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EnhancedCampaignTableProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
}

interface CampaignWithMetrics extends Campaign {
  cpl?: number;
  ctr?: number;
  convRate?: number;
  cpc?: number;
  cpm?: number;
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  format: 'currency' | 'number' | 'percent' | 'text' | 'date';
}

interface CampaignFilters {
  searchText: string;
  status: string;
  platform: string;
  spendMin: string;
  spendMax: string;
  roasMin: string;
  cplMax: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'status', label: 'Status', visible: true, format: 'text' },
  { key: 'platform', label: 'Plataforma', visible: true, format: 'text' },
  { key: 'name', label: 'Campanha', visible: true, format: 'text' },
  { key: 'spend', label: 'Investimento', visible: true, format: 'currency' },
  { key: 'leads', label: 'Leads', visible: true, format: 'number' },
  { key: 'cpl', label: 'CPL', visible: true, format: 'currency' },
  { key: 'cpa', label: 'CPA', visible: true, format: 'currency' },
  { key: 'roas', label: 'ROAS', visible: true, format: 'number' },
  { key: 'clicks', label: 'Cliques', visible: false, format: 'number' },
  { key: 'impressions', label: 'Impressões', visible: false, format: 'number' },
  { key: 'ctr', label: 'CTR', visible: false, format: 'percent' },
  { key: 'conversions', label: 'Conversões', visible: false, format: 'number' },
  { key: 'revenue', label: 'Receita', visible: false, format: 'currency' },
  { key: 'cpc', label: 'CPC', visible: false, format: 'currency' },
  { key: 'cpm', label: 'CPM', visible: false, format: 'currency' },
  { key: 'convRate', label: 'Taxa Conv.', visible: false, format: 'percent' },
  { key: 'last_sync', label: 'Última Sync', visible: false, format: 'date' }
];

const columnHelper = createColumnHelper<CampaignWithMetrics>();

export function EnhancedCampaignTable({ clientId, period, platform }: EnhancedCampaignTableProps) {
  const { dataSource } = useDataSource();
  const { toast } = useToast();
  
  // Data states
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // UI states
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<CampaignFilters>({
    searchText: '',
    status: 'all',
    platform: 'all',
    spendMin: '',
    spendMax: '',
    roasMin: '',
    cplMax: ''
  });

  // Load column configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`campaigns:columns:${clientId}`);
    if (savedConfig) {
      try {
        setColumnConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Failed to load column config:', error);
      }
    }
  }, [clientId]);

  // Save column configuration to localStorage
  const saveColumnConfig = (config: ColumnConfig[]) => {
    setColumnConfig(config);
    localStorage.setItem(`campaigns:columns:${clientId}`, JSON.stringify(config));
  };

  // Load campaigns and metrics
  useEffect(() => {
    loadCampaignsData();
  }, [clientId, period, platform]);

  const loadCampaignsData = async () => {
    setLoading(true);
    try {
      const [campaignsData, metricsData] = await Promise.all([
        dataSource.getCampaigns(clientId),
        dataSource.getMetrics(clientId, period, platform)
      ]);

      // Filter campaigns by platform if specified
      const filteredCampaigns = platform === 'all' 
        ? campaignsData 
        : campaignsData.filter(c => c.platform.includes(platform));

      // Calculate derived metrics for each campaign
      const campaignsWithMetrics: CampaignWithMetrics[] = filteredCampaigns.map(campaign => {
        const campaignMetrics = metricsData.filter(m => m.campaignId === campaign.id && m.platform !== 'all');
        
        // Aggregate metrics for this campaign
        const aggregated = campaignMetrics.reduce((acc, metric) => ({
          impressions: acc.impressions + metric.impressions,
          clicks: acc.clicks + metric.clicks,
          spend: acc.spend + metric.spend,
          leads: acc.leads + metric.leads,
          revenue: acc.revenue + metric.revenue,
          conversions: acc.conversions + (metric.conversions || 0)
        }), { impressions: 0, clicks: 0, spend: 0, leads: 0, revenue: 0, conversions: 0 });

        // Calculate derived metrics
        const cpl = aggregated.leads > 0 ? aggregated.spend / aggregated.leads : 0;
        const cpa = aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : 0;
        const roas = aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : 0;
        const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
        const convRate = aggregated.clicks > 0 ? (aggregated.leads / aggregated.clicks) * 100 : 0;
        const cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;
        const cpm = aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0;

        return {
          ...campaign,
          ...aggregated,
          cpl,
          cpa: cpa > 0 ? cpa : undefined, // Only show if we have conversions
          roas,
          ctr,
          convRate,
          cpc,
          cpm
        };
      });

      setCampaigns(campaignsWithMetrics);
      setCampaignMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load campaigns data:', error);
      toast({
        title: "Erro ao carregar campanhas",
        description: "Não foi possível carregar os dados das campanhas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create table columns based on configuration
  const columns = useMemo(() => {
    const visibleColumns = columnConfig.filter(col => col.visible);
    
    return visibleColumns.map(col => {
      switch (col.key) {
        case 'status':
          return columnHelper.accessor('status', {
            header: 'Status',
            cell: ({ getValue }) => {
              const status = getValue();
              const icon = status === 'ENABLED' || status === 'active' ? Play :
                          status === 'PAUSED' || status === 'paused' ? Pause : Square;
              const color = status === 'ENABLED' || status === 'active' ? 'text-green-600' :
                           status === 'PAUSED' || status === 'paused' ? 'text-yellow-600' : 'text-gray-600';
              const Icon = icon;
              return (
                <div className="flex items-center gap-2">
                  <Icon className={`h-3 w-3 ${color}`} />
                  <span className="text-xs">{status}</span>
                </div>
              );
            }
          });

        case 'platform':
          return columnHelper.accessor('platform', {
            header: 'Plataforma',
            cell: ({ getValue }) => {
              const platform = getValue();
              const color = platform.includes('google') ? 'bg-blue-100 text-blue-800' :
                           platform.includes('meta') ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
              const label = platform.includes('google') ? 'Google' :
                           platform.includes('meta') ? 'Meta' : platform;
              return <Badge className={color}>{label}</Badge>;
            }
          });

        case 'name':
          return columnHelper.accessor('name', {
            header: 'Campanha',
            cell: ({ getValue, row }) => (
              <div className="max-w-xs">
                <div className="font-medium truncate">{getValue()}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const campaignId = row.original.id;
                    const newExpanded = new Set(expandedRows);
                    if (newExpanded.has(campaignId)) {
                      newExpanded.delete(campaignId);
                    } else {
                      newExpanded.add(campaignId);
                    }
                    setExpandedRows(newExpanded);
                  }}
                >
                  {expandedRows.has(row.original.id) ? (
                    <><ChevronDown className="h-3 w-3 mr-1" />Ocultar detalhes</>
                  ) : (
                    <><ChevronRight className="h-3 w-3 mr-1" />Ver detalhes</>
                  )}
                </Button>
              </div>
            )
          });

        default:
          return columnHelper.accessor(col.key as keyof CampaignWithMetrics, {
            header: col.label,
            cell: ({ getValue }) => {
              const value = getValue();
              if (value == null || value === 0) return '—';
              
              switch (col.format) {
                case 'currency':
                  return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(value));
                
                case 'percent':
                  return `${Number(value).toFixed(2)}%`;
                
                case 'number':
                  if (col.key === 'roas') {
                    const roasValue = Number(value);
                    const colorClass = roasValue >= 3 ? 'text-green-600' :
                                     roasValue >= 2 ? 'text-yellow-600' : 'text-red-600';
                    return <span className={colorClass}>{roasValue.toFixed(2)}x</span>;
                  }
                  return new Intl.NumberFormat('pt-BR').format(Number(value));
                
                case 'date':
                  return format(new Date(value as string), 'dd/MM/yy HH:mm', { locale: ptBR });
                
                default:
                  return String(value);
              }
            }
          });
      }
    });
  }, [columnConfig, expandedRows]);

  // Apply filters to campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Text search
      if (filters.searchText && !campaign.name.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && campaign.status !== filters.status) {
        return false;
      }

      // Platform filter (already applied in data loading, but kept for consistency)
      if (filters.platform !== 'all' && !campaign.platform.includes(filters.platform)) {
        return false;
      }

      // Spend range
      if (filters.spendMin && campaign.spend < Number(filters.spendMin)) {
        return false;
      }
      if (filters.spendMax && campaign.spend > Number(filters.spendMax)) {
        return false;
      }

      // ROAS minimum
      if (filters.roasMin && (campaign.roas || 0) < Number(filters.roasMin)) {
        return false;
      }

      // CPL maximum
      if (filters.cplMax && (campaign.cpl || 0) > Number(filters.cplMax)) {
        return false;
      }

      return true;
    });
  }, [campaigns, filters]);

  const table = useReactTable({
    data: filteredCampaigns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Export to CSV
  const exportToCsv = () => {
    const visibleColumns = columnConfig.filter(col => col.visible);
    const headers = visibleColumns.map(col => col.label);
    const rows = filteredCampaigns.map(campaign => 
      visibleColumns.map(col => {
        const value = campaign[col.key as keyof CampaignWithMetrics];
        return value != null ? String(value) : '';
      })
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campanhas_${clientId}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "CSV exportado com sucesso!" });
  };

  // Get daily metrics for expanded campaign
  const getCampaignDailyMetrics = (campaignId: string) => {
    return campaignMetrics.filter(m => m.campaignId === campaignId && m.platform !== 'all');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campanhas ({filteredCampaigns.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSelector(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Colunas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and basic filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campanhas..."
              value={filters.searchText}
              onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ENABLED">Ativo</SelectItem>
              <SelectItem value="PAUSED">Pausado</SelectItem>
              <SelectItem value="REMOVED">Removido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs">Investimento Mín.</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.spendMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, spendMin: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Investimento Máx.</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.spendMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, spendMax: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">ROAS Mín.</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={filters.roasMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, roasMin: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">CPL Máx.</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.cplMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, cplMax: e.target.value }))}
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    searchText: '',
                    status: 'all',
                    platform: 'all',
                    spendMin: '',
                    spendMax: '',
                    roasMin: '',
                    cplMax: ''
                  })}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium">
                        {header.isPlaceholder ? null : (
                          <div
                            className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-2' : ''}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <div className="text-muted-foreground">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <>
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Expanded row details */}
                    {expandedRows.has(row.original.id) && (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-3 bg-muted/30">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Métricas Diárias</h4>
                            <div className="max-h-40 overflow-y-auto">
                              <div className="grid grid-cols-8 gap-2 text-xs font-medium text-muted-foreground mb-2">
                                <div>Data</div>
                                <div>Impressões</div>
                                <div>Cliques</div>
                                <div>Investimento</div>
                                <div>Leads</div>
                                <div>Receita</div>
                                <div>CPL</div>
                                <div>ROAS</div>
                              </div>
                              {getCampaignDailyMetrics(row.original.id).slice(0, 7).map(metric => (
                                <div key={`${metric.date}-${metric.campaignId}`} className="grid grid-cols-8 gap-2 text-xs py-1">
                                  <div>{format(new Date(metric.date), 'dd/MM', { locale: ptBR })}</div>
                                  <div>{metric.impressions.toLocaleString('pt-BR')}</div>
                                  <div>{metric.clicks.toLocaleString('pt-BR')}</div>
                                  <div>R$ {metric.spend.toFixed(2)}</div>
                                  <div>{metric.leads}</div>
                                  <div>R$ {metric.revenue.toFixed(2)}</div>
                                  <div>{metric.leads > 0 ? `R$ ${(metric.spend / metric.leads).toFixed(2)}` : '—'}</div>
                                  <div>{metric.spend > 0 ? `${(metric.revenue / metric.spend).toFixed(2)}x` : '—'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredCampaigns.length} campanhas encontradas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <div className="text-sm">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Column Selector Dialog */}
      <Dialog open={showColumnSelector} onOpenChange={setShowColumnSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Colunas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {columnConfig.map((col, index) => (
                <div key={col.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={col.key}
                    checked={col.visible}
                    onCheckedChange={(checked) => {
                      const newConfig = [...columnConfig];
                      newConfig[index].visible = checked as boolean;
                      saveColumnConfig(newConfig);
                    }}
                  />
                  <Label htmlFor={col.key} className="text-sm font-normal">
                    {col.label}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const resetConfig = DEFAULT_COLUMNS.map(col => ({ ...col }));
                saveColumnConfig(resetConfig);
              }}
            >
              Restaurar Padrão
            </Button>
            <Button onClick={() => setShowColumnSelector(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}