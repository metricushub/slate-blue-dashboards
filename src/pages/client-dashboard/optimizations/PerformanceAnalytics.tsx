import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Optimization } from "@/types";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  DollarSign,
  Percent,
  Users,
  Zap,
  Filter,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PerformanceAnalyticsProps {
  optimizations: Optimization[];
}

interface CategoryAnalysis {
  category: string;
  total: number;
  completed: number;
  successful: number;
  successRate: number;
  avgImpact: string;
  trend: "up" | "down" | "neutral";
}

interface TimeSeriesData {
  period: string;
  optimizations: number;
  successRate: number;
}

export default function PerformanceAnalytics({ optimizations }: PerformanceAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filter optimizations by time range
  const getFilteredOptimizations = () => {
    let filtered = [...optimizations];

    if (timeRange !== "all") {
      const now = new Date();
      const days = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : timeRange === "180d" ? 180 : 365;
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(opt => new Date(opt.created_at) >= cutoff);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(opt => opt.type === categoryFilter);
    }

    return filtered;
  };

  const filteredOptimizations = getFilteredOptimizations();

  // Analyze categories
  const analyzeCategoriesDone = (): CategoryAnalysis[] => {
    const categories = {};

    filteredOptimizations.forEach(opt => {
      const category = opt.type || "Outros";
      if (!categories[category]) {
        categories[category] = {
          category,
          total: 0,
          completed: 0,
          successful: 0,
          impacts: []
        };
      }

      categories[category].total++;
      
      if (opt.status === "Concluída") {
        categories[category].completed++;
        
        if (opt.result_summary) {
          const summary = opt.result_summary.toLowerCase();
          if (summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument')) {
            categories[category].successful++;
          }
          
          // Extract impact numbers (simplified)
          const impactMatch = summary.match(/(\d+)%/);
          if (impactMatch) {
            categories[category].impacts.push(parseInt(impactMatch[1]));
          }
        }
      }
    });

    return Object.values(categories).map((cat: any) => ({
      ...cat,
      successRate: cat.completed > 0 ? Math.round((cat.successful / cat.completed) * 100) : 0,
      avgImpact: cat.impacts.length > 0 ? 
        `${Math.round(cat.impacts.reduce((a, b) => a + b, 0) / cat.impacts.length)}%` : 
        "N/A",
      trend: cat.successful > cat.completed - cat.successful ? "up" : 
             cat.successful < cat.completed - cat.successful ? "down" : "neutral"
    })).sort((a, b) => b.successRate - a.successRate);
  };

  // Time series analysis
  const getTimeSeriesData = (): TimeSeriesData[] => {
    const monthlyData = {};

    filteredOptimizations.forEach(opt => {
      const monthKey = new Date(opt.created_at).toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          period: monthKey,
          optimizations: 0,
          completed: 0,
          successful: 0
        };
      }

      monthlyData[monthKey].optimizations++;
      
      if (opt.status === "Concluída") {
        monthlyData[monthKey].completed++;
        
        if (opt.result_summary) {
          const summary = opt.result_summary.toLowerCase();
          if (summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument')) {
            monthlyData[monthKey].successful++;
          }
        }
      }
    });

    return Object.values(monthlyData)
      .map((data: any) => ({
        ...data,
        successRate: data.completed > 0 ? Math.round((data.successful / data.completed) * 100) : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6); // Last 6 months
  };

  // Calculate overall metrics
  const getOverallMetrics = () => {
    const total = filteredOptimizations.length;
    const completed = filteredOptimizations.filter(o => o.status === "Concluída").length;
    const inProgress = filteredOptimizations.filter(o => o.status === "Em teste").length;
    const successful = filteredOptimizations.filter(o => {
      if (o.status !== "Concluída" || !o.result_summary) return false;
      const summary = o.result_summary.toLowerCase();
      return summary.includes('melhor') || summary.includes('reduz') || summary.includes('aument');
    }).length;

    const successRate = completed > 0 ? Math.round((successful / completed) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, successful, successRate, completionRate };
  };

  const categoryAnalysis = analyzeCategoriesDone();
  const timeSeriesData = getTimeSeriesData();
  const overallMetrics = getOverallMetrics();
  const uniqueTypes = Array.from(new Set(optimizations.map(opt => opt.type).filter(Boolean)));

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      "Landing Page": Target,
      "Campanhas": Zap,
      "Criativos": Award,
      "Públicos": Users,
      "Bidding": DollarSign,
      "Keywords": BarChart3,
      "Estrutura": Target,
      "Tracking": BarChart3,
      "Outros": Clock
    };
    return icons[category] || Clock;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics de Performance</h2>
        
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="180d">Últimos 6 meses</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{overallMetrics.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{overallMetrics.successRate}%</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conclusão</p>
                <p className="text-2xl font-bold">{overallMetrics.completionRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold">{overallMetrics.inProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível para análise</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryAnalysis.map(category => {
                  const Icon = getCategoryIcon(category.category);
                  
                  return (
                    <div key={category.category} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{category.category}</h4>
                            <p className="text-sm text-muted-foreground">
                              {category.total} otimizações • {category.completed} concluídas
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={category.successRate >= 70 ? "default" : 
                                   category.successRate >= 50 ? "secondary" : "destructive"}
                          >
                            {category.successRate}% sucesso
                          </Badge>
                          
                          {category.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {category.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Taxa de Sucesso</span>
                          <span>{category.avgImpact} impacto médio</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              category.successRate >= 70 ? "bg-green-500" :
                              category.successRate >= 50 ? "bg-yellow-500" : 
                              "bg-red-500"
                            }`}
                            style={{ width: `${category.successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Series */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolução ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Dados insuficientes para análise temporal</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSeriesData.map(data => (
                  <div key={data.period} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {new Date(data.period + "-01").toLocaleDateString("pt-BR", { 
                          month: "short", 
                          year: "numeric" 
                        })}
                      </p>
                      <Badge variant="outline">{data.optimizations}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Sucesso</span>
                        <span className="font-medium">{data.successRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${data.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}