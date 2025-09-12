import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataSource } from "@/hooks/useDataSource";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types";
import { MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { MessageSquare, Brain, Settings } from "lucide-react";

// Components
import { DashboardHeader } from "./DashboardHeader";
import { FiltersToolbar } from "./FiltersToolbar";
import { KpiBoard } from "./KpiBoard";
import { TrendChart } from "./TrendChart";
import { Funnel } from "./Funnel";
import { OptimizationsModal } from "./OptimizationsModal";
import { ChatIaPanel } from "./ChatIaPanel";
import { CustomizeModal } from "./CustomizeModal";

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
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Load client data and persisted metrics
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

        // Load persisted metrics for this client
        const savedMetrics = localStorage.getItem(`${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`);
        if (savedMetrics) {
          try {
            const parsed = JSON.parse(savedMetrics) as MetricKey[];
            setSelectedMetrics(parsed.length > 0 ? parsed : DEFAULT_SELECTED_METRICS);
          } catch {
            setSelectedMetrics(DEFAULT_SELECTED_METRICS);
          }
        } else {
          setSelectedMetrics(DEFAULT_SELECTED_METRICS);
        }
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client not found
  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Cliente não encontrado</h2>
          <p className="text-sm text-slate-500 mb-4">O cliente especificado não existe ou foi removido.</p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <DashboardHeader 
              client={client}
              onRegisterOptimization={() => setShowOptimizationsModal(true)}
            />
            <Button
              variant="outline"
              onClick={() => setShowCustomizeModal(true)}
              className="flex items-center gap-2 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              ⚙️ Personalizar
            </Button>
          </div>

          {/* Filters */}
          <FiltersToolbar
            period={period}
            platform={platform}
            granularity={granularity}
            onPeriodChange={setPeriod}
            onPlatformChange={setPlatform}
            onGranularityChange={setGranularity}
          />

          {/* KPI Board */}
          <KpiBoard
            selectedMetrics={selectedMetrics}
            clientId={clientId!}
            period={period}
            platform={platform}
          />

          {/* Analysis Section - Chart + Funnel with matching heights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 flex">
              <TrendChart
                clientId={clientId!}
                period={period}
                platform={platform}
                granularity={granularity}
                selectedMetric={activeMetric}
              />
            </div>
            <div className="lg:col-span-1 flex">
              <Funnel
                clientId={clientId!}
                period={period}
                platform={platform}
              />
            </div>
          </div>

          {/* Campaigns Full Width */}
          <div className="w-full">
            <CampaignTable clientId={clientId!} />
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setShowChatPanel(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/25 border-0"
        size="sm"
      >
        <div className="flex items-center justify-center">
          <MessageSquare className="h-6 w-6" />
          <Brain className="h-3 w-3 absolute -top-1 -right-1" />
        </div>
      </Button>

      {/* Modals and Panels */}
      <CustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        clientId={clientId!}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
      />

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