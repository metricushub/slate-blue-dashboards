import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Search, Play, Pause, Square } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Campaign } from "@/types";
import { cn } from "@/lib/utils";

interface CampaignTableProps {
  clientId: string;
}

type SortField = keyof Pick<Campaign, 'name' | 'spend' | 'leads' | 'cpa' | 'roas'>;
type SortDirection = 'asc' | 'desc';

export function CampaignTable({ clientId }: CampaignTableProps) {
  const { dataSource } = useDataSource();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const campaignData = await dataSource.getCampaigns(clientId);
        setCampaigns(campaignData);
        setFilteredCampaigns(campaignData);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [clientId, dataSource]);

  useEffect(() => {
    let filtered = campaigns;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPlatformBadge = (platform: Campaign['platform']) => {
    const variants = {
      google: "bg-blue-100 text-blue-700 border-blue-200",
      meta: "bg-indigo-100 text-indigo-700 border-indigo-200",
      linkedin: "bg-cyan-100 text-cyan-700 border-cyan-200",
      tiktok: "bg-pink-100 text-pink-700 border-pink-200",
    };

    const labels = {
      google: "Google",
      meta: "Meta",
      linkedin: "LinkedIn", 
      tiktok: "TikTok",
    };

    return (
      <Badge className={variants[platform]}>
        {labels[platform]}
      </Badge>
    );
  };

  const getStatusIcon = (status: Campaign['status']) => {
    const icons = {
      active: <Play className="h-3 w-3 text-success" />,
      paused: <Pause className="h-3 w-3 text-warning" />,
      draft: <Square className="h-3 w-3 text-muted-foreground" />,
      ended: <Square className="h-3 w-3 text-destructive" />,
    };

    return icons[status];
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-slate-100 select-none text-xs font-medium text-slate-600 uppercase tracking-wide"
      onClick={() => {
        handleSort(field);
        console.log('telemetry:campaign_sort', { field, direction: sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc' });
      }}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <CardTitle className="text-lg font-semibold text-slate-900">Campanhas</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-5">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Campanhas ({filteredCampaigns.length})
          </CardTitle>
          <div className="text-xs text-slate-500">
            {campaigns.filter(c => c.status === 'active').length} ativas
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl border-slate-200"
          />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {campaigns.length === 0 ? "Nenhuma campanha encontrada" : "Nenhuma campanha corresponde à busca"}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50">
                  <SortableHeader field="name">Nome</SortableHeader>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Plataforma</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Status</TableHead>
                  <SortableHeader field="spend">Investimento</SortableHeader>
                  <SortableHeader field="leads">Leads</SortableHeader>
                  <SortableHeader field="cpa">CPL</SortableHeader>
                  <SortableHeader field="roas">ROAS</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900 max-w-xs">
                      <div className="truncate" title={campaign.name}>
                        {campaign.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPlatformBadge(campaign.platform)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(campaign.status)}
                        <span className="capitalize text-sm text-slate-600">
                          {campaign.status === 'active' && 'Ativa'}
                          {campaign.status === 'paused' && 'Pausada'}
                          {campaign.status === 'draft' && 'Rascunho'}
                          {campaign.status === 'ended' && 'Finalizada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-900">
                      R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-mono text-slate-900">
                      {campaign.leads.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-slate-900">
                      R$ {campaign.cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-mono font-medium",
                        campaign.roas >= 3 ? "text-green-600" : 
                        campaign.roas >= 2 ? "text-yellow-600" : "text-red-500"
                      )}>
                        {campaign.roas.toFixed(2)}x
                      </span>
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