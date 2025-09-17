import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Optimization } from "@/types";
import { optimizationOperations } from "@/shared/db/dashboardStore";
import { NewOptimizationModal } from "@/components/modals/NewOptimizationModal";
import {
  Wand2,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  BarChart3,
  Clock,
  Award,
  AlertTriangle,
  Zap,
  Calendar,
  Filter,
  Search,
  Users,
  DollarSign,
  Percent,
  Activity
} from "lucide-react";

// Components
import OptimizationDashboard from "./optimizations/OptimizationDashboard";
import OptimizationTimeline from "./optimizations/OptimizationTimeline";
import OptimizationKanban from "./optimizations/OptimizationKanban";
import AIInsightsPanel from "./optimizations/AIInsightsPanel";
import PerformanceAnalytics from "./optimizations/PerformanceAnalytics";

interface MetricCard {
  title: string;
  value: string;
  trend: number;
  icon: React.ComponentType<any>;
  color: string;
}

export default function CentralOtimizacoes() {
  const { clientId } = useParams<{ clientId: string }>();
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      loadOptimizations();
    }
  }, [clientId]);

  const loadOptimizations = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const data = await optimizationOperations.getByClient(clientId);
      setOptimizations(data);
    } catch (error) {
      console.error('Failed to load optimizations:', error);
      toast({
        title: "Erro ao carregar otimizações",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOptimization = async (optimization: Omit<Optimization, 'id' | 'created_at'>) => {
    try {
      await optimizationOperations.create({
        ...optimization,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Optimization);
      
      toast({
        title: "Otimização criada",
        description: "A otimização foi criada com sucesso!"
      });
      
      await loadOptimizations();
    } catch (error) {
      toast({
        title: "Erro ao criar otimização",
        description: "Não foi possível criar a otimização.",
        variant: "destructive"
      });
    }
  };

  // Calculate metrics
  const metrics = (): MetricCard[] => {
    const completed = optimizations.filter(o => o.status === "Concluída");
    const inProgress = optimizations.filter(o => o.status === "Em teste");
    const planned = optimizations.filter(o => o.status === "Planejada");
    const aborted = optimizations.filter(o => o.status === "Abortada");
    
    const successRate = optimizations.length > 0 ? 
      Math.round((completed.length / optimizations.length) * 100) : 0;
    
    const avgImpact = completed.length > 0 ? "↑12.5%" : "0%";
    
    return [
      {
        title: "Total de Otimizações",
        value: optimizations.length.toString(),
        trend: optimizations.length > 0 ? 15 : 0,
        icon: Target,
        color: "text-blue-600"
      },
      {
        title: "Taxa de Sucesso",
        value: `${successRate}%`,
        trend: successRate > 70 ? 8 : successRate > 50 ? 2 : -5,
        icon: Award,
        color: "text-green-600"
      },
      {
        title: "Em Execução",
        value: inProgress.length.toString(),
        trend: inProgress.length > 0 ? 5 : 0,
        icon: Activity,
        color: "text-amber-600"
      },
      {
        title: "Impacto Médio",
        value: avgImpact,
        trend: completed.length > 0 ? 12.5 : 0,
        icon: TrendingUp,
        color: "text-emerald-600"
      }
    ];
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Central de Otimizações
              </h1>
              <p className="text-muted-foreground">
                O cérebro inteligente das suas campanhas - onde cada insight se transforma em resultado
              </p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setShowNewModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Otimização
        </Button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics().map((metric, index) => (
          <Card key={metric.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.trend !== 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          metric.trend > 0 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {metric.trend > 0 ? "+" : ""}{metric.trend}%
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity ${
                  index === 0 ? "from-blue-100 to-blue-200" :
                  index === 1 ? "from-green-100 to-green-200" :
                  index === 2 ? "from-amber-100 to-amber-200" :
                  "from-emerald-100 to-emerald-200"
                }`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-max">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Gestão</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <OptimizationDashboard 
            optimizations={optimizations}
            onRefresh={loadOptimizations}
          />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <OptimizationKanban 
            optimizations={optimizations}
            onUpdate={loadOptimizations}
            clientId={clientId!}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <OptimizationTimeline 
            optimizations={optimizations}
            onUpdate={loadOptimizations}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PerformanceAnalytics 
            optimizations={optimizations}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsightsPanel
            optimizations={optimizations}
            clientId={clientId!}
          />
        </TabsContent>
      </Tabs>

      {/* New Optimization Modal */}
      <NewOptimizationModal
        open={showNewModal}
        onOpenChange={setShowNewModal}
        onSave={handleCreateOptimization}
      />
    </div>
  );
}