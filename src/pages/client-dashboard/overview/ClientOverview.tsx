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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Enhanced Components
import { DashboardHeader } from "./DashboardHeader";
import { EnhancedFiltersToolbar } from "./EnhancedFiltersToolbar";
import { EnhancedKpiBoard } from "./EnhancedKpiBoard";
import { EnhancedTrendChart } from "./EnhancedTrendChart";
import { FunnelV2 } from "./FunnelV2";
import { OptimizationsModal } from "./OptimizationsModal";
import { ChatIaPanel } from "./ChatIaPanel";
import { CustomizeModal } from "./CustomizeModal";

// Existing components
import { EnhancedCampaignTable } from "./EnhancedCampaignTable";
import { RecentOptimizations } from "./RecentOptimizations";
import { TasksAlertsModal, useNextTasks } from "./TasksAlertsModal";

export function ClientOverview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();  
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  // State
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizationsKey, setOptimizationsKey] = useState(0);
  
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

  // Get next tasks for overview
  const nextTasks = useNextTasks(clientId || "");

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
              
              {/* Floating Chat IA Button */}
              <Button
                onClick={() => setShowChatPanel(true)}
                className="animate-pulse bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
                title="Converse com os dados"
              >
                <Brain className="h-4 w-4" />
                Chat IA
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
                onMetricsChange={setSelectedMetrics}
                kpiMetrics={selectedMetrics}
              />
            </div>
            <div className="lg:col-span-1">
              <FunnelV2
                clientId={clientId!}
                period={period}
                platform={platform}
              />
            </div>
          </div>

          {/* Enhanced Campaign Table with Dynamic Columns */}
          <EnhancedCampaignTable 
            clientId={clientId!} 
            period={period}
            platform={platform}
          />

          {/* Recent Optimizations */}
          <RecentOptimizations key={optimizationsKey} clientId={clientId!} />

          {/* Next Tasks Preview */}
          {nextTasks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Próximas Tarefas ({nextTasks.length})
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowTasksModal(true)}
                  >
                    Ver Todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nextTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.owner && `${task.owner} • `}
                          {task.due_date && format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <Badge className={
                        task.priority === "Alta" ? "bg-red-100 text-red-800" :
                        task.priority === "Média" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>


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
        onOptimizationCreated={() => setOptimizationsKey(prev => prev + 1)}
      />

      <TasksAlertsModal
        isOpen={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        clientId={clientId!}
      />

      <ChatIaPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        client={client}
      />

      {/* Floating Chat IA Button - Desktop Only */}
      <div className="hidden lg:block">
        <Button
          onClick={() => setShowChatPanel(true)}
          className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 animate-pulse bg-blue-600 hover:bg-blue-700 text-white shadow-xl rounded-full w-12 h-12 p-0"
          title="Chat IA - Converse com os dados"
        >
          <Brain className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}