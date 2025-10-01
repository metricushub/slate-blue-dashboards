import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Client } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FiltersToolbar } from "@/components/dashboard/FiltersToolbar";
import { MetricSelector } from "@/components/dashboard/MetricSelector";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { AlertList } from "@/components/dashboard/AlertList";
import { ChatIaPanel } from "./overview/ChatIaPanel";
import { toast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { dataSource } = useDataSource();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [period, setPeriod] = useState(30);
  const [platform, setPlatform] = useState<'all' | 'google' | 'meta'>('all');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

  // Selected metric
  const [selectedMetric, setSelectedMetric] = useState('LEADS');
  
  // Chat IA state
  const [isChatOpen, setIsChatOpen] = useState(false);

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const clients = await dataSource.getClients();
      const foundClient = clients.find(c => c.id === clientId);
      
      if (!foundClient) {
        toast({
          title: "Cliente não encontrado",
          description: "O cliente solicitado não foi localizado.",
          variant: "destructive",
        });
        return;
      }

      setClient(foundClient);
    } catch (error) {
      console.error("Error loading client:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId, dataSource]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à Home
          </Button>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Cliente não encontrado</h2>
          <p className="text-muted-foreground">
            O cliente solicitado não foi localizado no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="relative">
          <DashboardHeader client={client} />
          
          {/* Floating AI Chat Button */}
          <div className="absolute top-6 right-6">
            <Button
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white shadow-lg"
            >
              <Bot className="h-4 w-4 mr-2" />
              Chat IA
            </Button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <FiltersToolbar
          period={period}
          platform={platform}
          granularity={granularity}
          onPeriodChange={setPeriod}
          onPlatformChange={setPlatform}
          onGranularityChange={setGranularity}
        />

        {/* Metric Selector */}
        <MetricSelector
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          clientId={client.id}
        />

        {/* KPIs */}
        <KPIGrid
          clientId={client.id}
          period={period}
          platform={platform}
          selectedMetric={selectedMetric}
        />

        {/* Trend Chart */}
        <TrendChart
          clientId={client.id}
          period={period}
          platform={platform}
          granularity={granularity}
          selectedMetric={selectedMetric}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Table */}
          <div className="lg:col-span-2">
            <CampaignTable clientId={client.id} />
          </div>

          {/* Alerts */}
          <div>
            <AlertList clientId={client.id} />
          </div>
        </div>
      </div>
      
      {/* Chat IA Panel */}
      <ChatIaPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        client={client} 
      />
    </div>
  );
};

export default ClientDashboard;