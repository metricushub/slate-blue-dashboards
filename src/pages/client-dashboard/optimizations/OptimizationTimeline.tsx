import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Optimization } from "@/types";
import {
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter
} from "lucide-react";
import { format, isAfter, isBefore, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OptimizationTimelineProps {
  optimizations: Optimization[];
  onUpdate: () => void;
}

export default function OptimizationTimeline({ optimizations, onUpdate }: OptimizationTimelineProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  // Filter optimizations
  const getFilteredOptimizations = () => {
    let filtered = [...optimizations];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(opt => opt.type === filterType);
    }

    // Filter by period
    if (filterPeriod !== "all") {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filterPeriod) {
        case "7d":
          cutoffDate = subDays(now, 7);
          break;
        case "30d":
          cutoffDate = subDays(now, 30);
          break;
        case "3m":
          cutoffDate = subMonths(now, 3);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(opt => isAfter(new Date(opt.created_at), cutoffDate));
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const filteredOptimizations = getFilteredOptimizations();

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(optimizations.map(opt => opt.type).filter(Boolean)));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Planejada":
        return <Plus className="h-4 w-4 text-blue-600" />;
      case "Em teste":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "Concluída":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Abortada":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planejada":
        return "bg-blue-100 text-blue-800";
      case "Em teste":
        return "bg-amber-100 text-amber-800";
      case "Concluída":
        return "bg-green-100 text-green-800";
      case "Abortada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactIcon = (optimization: Optimization) => {
    if (!optimization.result_summary) return null;
    
    const summary = optimization.result_summary.toLowerCase();
    if (summary.includes('melhor') || summary.includes('aument') || summary.includes('reduz')) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (summary.includes('pior') || summary.includes('subiu') && summary.includes('cpl')) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const groupByMonth = (opts: Optimization[]) => {
    const groups: { [key: string]: Optimization[] } = {};
    
    opts.forEach(opt => {
      const monthKey = format(new Date(opt.created_at), "yyyy-MM", { locale: ptBR });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(opt);
    });
    
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  const monthlyGroups = groupByMonth(filteredOptimizations);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline de Otimizações</h2>
        
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {monthlyGroups.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhuma otimização encontrada</h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou crie novas otimizações para começar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          monthlyGroups.map(([monthKey, monthOptimizations]) => (
            <div key={monthKey} className="space-y-4">
              {/* Month Header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {format(new Date(monthKey + "-01"), "MMMM yyyy", { locale: ptBR })}
                  </h3>
                </div>
                <div className="h-px bg-border flex-1" />
                <Badge variant="secondary">
                  {monthOptimizations.length} otimizações
                </Badge>
              </div>

              {/* Month Optimizations */}
              <div className="space-y-4 ml-6">
                {monthOptimizations.map((optimization, index) => (
                  <div key={optimization.id} className="relative">
                    {/* Timeline Line */}
                    {index < monthOptimizations.length - 1 && (
                      <div className="absolute left-4 top-8 w-px h-8 bg-border" />
                    )}
                    
                    <Card className="hover:shadow-md transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Status Icon */}
                          <div className="mt-1">
                            {getStatusIcon(optimization.status)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium text-lg">{optimization.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(optimization.status)}>
                                    {optimization.status}
                                  </Badge>
                                  {optimization.type && (
                                    <Badge variant="outline">{optimization.type}</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right text-sm text-muted-foreground">
                                <div>
                                  {format(new Date(optimization.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                                {optimization.review_date && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    Revisão: {format(new Date(optimization.review_date), "dd/MM", { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Objective */}
                            {optimization.objective && (
                              <div className="text-sm text-muted-foreground">
                                <strong>Objetivo:</strong> {optimization.objective}
                              </div>
                            )}

                            {/* Target Metric */}
                            {optimization.target_metric && (
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="h-4 w-4 text-blue-600" />
                                <span><strong>Métrica alvo:</strong> {optimization.target_metric}</span>
                              </div>
                            )}

                            {/* Expected Impact */}
                            {optimization.expected_impact && !optimization.result_summary && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <TrendingUp className="h-4 w-4" />
                                <span><strong>Impacto esperado:</strong> {optimization.expected_impact}</span>
                              </div>
                            )}

                            {/* Result Summary */}
                            {optimization.result_summary && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-start gap-2">
                                  {getImpactIcon(optimization)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Resultado:</p>
                                    <p className="text-sm leading-relaxed">{optimization.result_summary}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Hypothesis */}
                            {optimization.hypothesis && (
                              <details className="text-sm">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  Ver hipótese
                                </summary>
                                <p className="mt-2 pl-4 border-l-2 border-muted text-muted-foreground">
                                  {optimization.hypothesis}
                                </p>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}