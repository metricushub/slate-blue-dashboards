import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Optimization } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  DollarSign,
  Percent,
  Users,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationDashboardProps {
  optimizations: Optimization[];
  onRefresh: () => void;
}

export default function OptimizationDashboard({ optimizations, onRefresh }: OptimizationDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Filter by period
  const filterByPeriod = (opts: Optimization[]) => {
    const now = new Date();
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return opts.filter(opt => new Date(opt.created_at) >= cutoff);
  };

  const filteredOptimizations = filterByPeriod(optimizations);

  // Categories for analysis
  const categories = {
    "Landing Page": { icon: Target, color: "text-blue-600", bg: "bg-blue-100" },
    "Campanhas": { icon: Zap, color: "text-purple-600", bg: "bg-purple-100" },
    "Criativos": { icon: Award, color: "text-pink-600", bg: "bg-pink-100" },
    "Públicos": { icon: Users, color: "text-green-600", bg: "bg-green-100" },
    "Bidding": { icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-100" },
    "Keywords": { icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-100" },
    "Estrutura": { icon: Target, color: "text-gray-600", bg: "bg-gray-100" },
    "Tracking": { icon: Activity, color: "text-red-600", bg: "bg-red-100" },
    "Outros": { icon: CheckCircle, color: "text-cyan-600", bg: "bg-cyan-100" }
  };

  // Analysis functions
  const getSuccessRate = () => {
    const completed = filteredOptimizations.filter(o => o.status === "Concluída");
    return filteredOptimizations.length > 0 ? 
      Math.round((completed.length / filteredOptimizations.length) * 100) : 0;
  };

  const getTopPerformingCategories = () => {
    const categoryStats = {};
    
    filteredOptimizations.forEach(opt => {
      if (opt.status === "Concluída" && opt.result_summary) {
        const category = opt.type || "Outros";
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, success: 0 };
        }
        categoryStats[category].count++;
        
        // Simple heuristic for success
        const summary = opt.result_summary.toLowerCase();
        if (summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument')) {
          categoryStats[category].success++;
        }
      }
    });

    return Object.entries(categoryStats)
      .map(([category, stats]: [string, any]) => ({
        category,
        successRate: Math.round((stats.success / stats.count) * 100),
        count: stats.count
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  };

  const getRecentWins = () => {
    return filteredOptimizations
      .filter(opt => opt.status === "Concluída" && opt.result_summary)
      .filter(opt => {
        const summary = opt.result_summary?.toLowerCase() || "";
        return summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument');
      })
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 3);
  };

  const getUpcomingReviews = () => {
    const now = new Date();
    const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return optimizations
      .filter(opt => opt.review_date && new Date(opt.review_date) <= next7Days && new Date(opt.review_date) >= now)
      .sort((a, b) => new Date(a.review_date!).getTime() - new Date(b.review_date!).getTime());
  };

  const topCategories = getTopPerformingCategories();
  const recentWins = getRecentWins();
  const upcomingReviews = getUpcomingReviews();

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard de Performance</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === "7d" ? "7 dias" : period === "30d" ? "30 dias" : "90 dias"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Categorias com Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Complete mais otimizações para ver insights de performance</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCategories.map((cat, index) => {
                  const categoryInfo = categories[cat.category] || categories["Outros"];
                  const Icon = categoryInfo.icon;
                  
                  return (
                    <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryInfo.bg}`}>
                          <Icon className={`h-4 w-4 ${categoryInfo.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">{cat.count} otimizações</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={cat.successRate >= 70 ? "default" : cat.successRate >= 50 ? "secondary" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {cat.successRate >= 70 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            cat.successRate >= 50 ? 
                            <Clock className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          {cat.successRate}%
                        </Badge>
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Revisões Próximas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma revisão agendada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReviews.map(opt => (
                  <div key={opt.id} className="p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(opt.review_date!), "dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Vitórias Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentWins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Complete otimizações com resultados positivos para vê-las aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentWins.map(win => (
                <div key={win.id} className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm mb-1 text-green-900">{win.title}</h4>
                      <Badge variant="secondary" className="text-xs mb-2 bg-green-100 text-green-700">
                        {win.type}
                      </Badge>
                      <p className="text-xs text-green-700 leading-relaxed">
                        {win.result_summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}