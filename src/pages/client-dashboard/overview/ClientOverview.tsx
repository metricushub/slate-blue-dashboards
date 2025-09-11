import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataSource } from "@/hooks/useDataSource";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types";
import { MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { MessageSquare, Brain } from "lucide-react";

// Components
import { DashboardHeader } from "./DashboardHeader";
import { FiltersToolbar } from "./FiltersToolbar";
import { MetricSelector } from "./MetricSelector";
import { KpiBoard } from "./KpiBoard";
import { TrendChart } from "./TrendChart";
import { Funnel } from "./Funnel";
import { OptimizationsModal } from "./OptimizationsModal";
import { ChatIaPanel } from "./ChatIaPanel";

// Import existing components that we'll continue to use
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { AlertList } from "@/components/dashboard/AlertList";

export function ClientOverview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  // State
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [period, setPeriod] = useState(30);
  const [platform, setPlatform] = useState<'all' | 'google' | 'meta'>('all');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  
  // Metrics
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_SELECTED_METRICS);
  
  // Modals and panels
  const [showOptimizationsModal, setShowOptimizationsModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Load client data
  useEffect(() => {
    const loadClient = async () => {
      if (!clientId) {
        navigate("/");
        return;
      }

      setLoading(true);
      try {
        const clients = await dataSource.getClients();
        const foundClient = clients.find(c => c.id === clientId);
        
        if (!foundClient) {
          toast({
            title: "Cliente não encontrado",
            description: "O cliente especificado não foi encontrado.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setClient(foundClient);
      } catch (error) {
        console.error('Failed to load client:', error);
        toast({
          title: "Erro ao carregar cliente",
          description: "Ocorreu um erro ao carregar os dados do cliente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId, dataSource, navigate, toast]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-[#1f2733]" />
          <Skeleton className="h-16 w-full bg-[#1f2733]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#1f2733]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Client not found
  if (!client) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#e6edf3] mb-2">Cliente não encontrado</h2>
          <p className="text-[#9fb0c3] mb-4">O cliente especificado não existe ou foi removido.</p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get active metric for chart (first selected metric or default)
  const activeMetric = selectedMetrics[0] || 'spend';

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <DashboardHeader 
          client={client}
          onRegisterOptimization={() => setShowOptimizationsModal(true)}
        />

        {/* Filters */}
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
          selectedMetrics={selectedMetrics}
          onMetricsChange={setSelectedMetrics}
          clientId={clientId!}
        />

        {/* KPI Board */}
        <KpiBoard
          selectedMetrics={selectedMetrics}
          clientId={clientId!}
          period={period}
          platform={platform}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            clientId={clientId!}
            period={period}
            platform={platform}
            granularity={granularity}
            selectedMetric={activeMetric}
          />
          <Funnel
            clientId={clientId!}
            period={period}
            platform={platform}
          />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#11161e] border border-[#1f2733] rounded-lg overflow-hidden">
            <CampaignTable clientId={clientId!} />
          </div>
          <div className="bg-[#11161e] border border-[#1f2733] rounded-lg overflow-hidden">
            <AlertList clientId={clientId!} />
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setShowChatPanel(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white shadow-lg shadow-[#22c55e]/25 border-0"
        size="sm"
      >
        <div className="flex items-center justify-center">
          <MessageSquare className="h-6 w-6" />
          <Brain className="h-3 w-3 absolute -top-1 -right-1" />
        </div>
      </Button>

      {/* Modals and Panels */}
      <OptimizationsModal
        isOpen={showOptimizationsModal}
        onClose={() => setShowOptimizationsModal(false)}
        clientId={clientId!}
        clientName={client.name}
      />

      <ChatIaPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        client={client}
      />
    </div>
  );
}