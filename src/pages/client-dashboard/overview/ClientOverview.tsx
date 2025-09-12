import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataSource } from "@/hooks/useDataSource";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types";
import { MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS } from "@/shared/data-source/types";
import { MessageSquare, Brain, Settings, Target, CheckSquare } from "lucide-react";

// Enhanced Components
import { DashboardHeader } from "./DashboardHeader";
import { EnhancedFiltersToolbar } from "./EnhancedFiltersToolbar";
import { EnhancedKpiBoard } from "./EnhancedKpiBoard";
import { EnhancedTrendChart } from "./EnhancedTrendChart";
import { Funnel } from "./Funnel";
import { OptimizationsModal } from "./OptimizationsModal";
import { ChatIaPanel } from "./ChatIaPanel";
import { CustomizeModal } from "./CustomizeModal";

// Existing components
import { CampaignTable } from "@/components/dashboard/CampaignTable";

export function ClientOverview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();  
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  // State
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Enhanced filters
  const [period, setPeriod] = useState(30);
  const [platform, setPlatform] = useState<'all' | 'google' | 'meta'>('all');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  
  // Metrics (up to 9)
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(DEFAULT_SELECTED_METRICS);
  
  // Modals and panels
  const [showOptimizationsModal, setShowOptimizationsModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Load client data and persist settings
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

        // Load persisted metrics
        const savedMetrics = localStorage.getItem(`${STORAGE_KEYS.SELECTED_METRICS}:${clientId}`);
        if (savedMetrics) {
          try {
            const parsed = JSON.parse(savedMetrics) as MetricKey[];
            setSelectedMetrics(parsed.length > 0 ? parsed.slice(0, 9) : DEFAULT_SELECTED_METRICS);
          } catch {
            setSelectedMetrics(DEFAULT_SELECTED_METRICS);
          }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Cliente não encontrado</h2>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Enhanced Header with Action Buttons */}
          <div className="flex items-start justify-between">
            <DashboardHeader client={client} onRegisterOptimization={() => setShowOptimizationsModal(true)} />
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowCustomizeModal(true)} className="gap-2">
                <Settings className="h-4 w-4" />
                Personalizar
              </Button>
              <Button variant="outline" onClick={() => setShowOptimizationsModal(true)} className="gap-2">
                <Target className="h-4 w-4" />
                Otimizações
              </Button>
              <Button variant="outline" onClick={() => setShowTasksModal(true)} className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Tarefas & Alertas
              </Button>
            </div>
          </div>

          {/* Enhanced Filters */}
          <EnhancedFiltersToolbar
            period={period}
            platform={platform}
            granularity={granularity}
            onPeriodChange={setPeriod}
            onPlatformChange={setPlatform}
            onGranularityChange={setGranularity}
            campaigns={selectedCampaigns}
            onCampaignFilter={setSelectedCampaigns}
            customDateRange={customDateRange}
            onCustomDateChange={setCustomDateRange}
          />

          {/* Enhanced KPI Board (up to 9 metrics) */}
          <EnhancedKpiBoard
            selectedMetrics={selectedMetrics}
            clientId={clientId!}
            period={period}
            platform={platform}
            onCustomize={() => setShowCustomizeModal(true)}
          />

          {/* Enhanced Chart & Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <EnhancedTrendChart
                clientId={clientId!}
                period={period}
                platform={platform}
                granularity={granularity}
                selectedMetrics={selectedMetrics}
              />
            </div>
            <div className="lg:col-span-1">
              <Funnel
                clientId={clientId!}
                period={period}
                platform={platform}
              />
            </div>
          </div>

          {/* Campaign Table with Dynamic Columns */}
          <CampaignTable clientId={clientId!} />
        </div>
      </div>

      {/* Floating Chat IA Button */}
      <Button
        onClick={() => setShowChatPanel(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="sm"
      >
        <MessageSquare className="h-6 w-6" />
        <Brain className="h-3 w-3 absolute -top-1 -right-1" />
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