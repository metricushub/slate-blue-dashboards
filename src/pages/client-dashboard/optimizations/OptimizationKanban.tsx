import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Optimization, OptimizationStatus } from "@/types";
import { optimizationOperations } from "@/shared/db/dashboardStore";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Calendar,
  Target,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationKanbanProps {
  optimizations: Optimization[];
  onUpdate: () => void;
  clientId: string;
}

interface KanbanColumn {
  status: OptimizationStatus;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const columns: KanbanColumn[] = [
  {
    status: "Planejada",
    title: "Planejadas",
    icon: Plus,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200"
  },
  {
    status: "Em teste",
    title: "Em Execução",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200"
  },
  {
    status: "Concluída",
    title: "Concluídas",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200"
  },
  {
    status: "Abortada",
    title: "Abortadas",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200"
  }
];

export default function OptimizationKanban({ optimizations, onUpdate, clientId }: OptimizationKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<Optimization | null>(null);
  const { toast } = useToast();

  const handleDragStart = (optimization: Optimization) => {
    setDraggedItem(optimization);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OptimizationStatus) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null);
      return;
    }

    try {
      await optimizationOperations.update(draggedItem.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Status atualizado",
        description: `Otimização movida para "${newStatus}"`
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive"
      });
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDelete = async (optimizationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta otimização?")) return;

    try {
      await optimizationOperations.delete(optimizationId);
      toast({ title: "Otimização excluída com sucesso" });
      onUpdate();
    } catch (error) {
      toast({
        title: "Erro ao excluir otimização",
        variant: "destructive"
      });
    }
  };

  const getOptimizationsByStatus = (status: OptimizationStatus) => {
    return optimizations.filter(opt => opt.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestão Visual</h2>
        <p className="text-sm text-muted-foreground">
          Arraste e solte para alterar o status das otimizações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => {
          const columnOptimizations = getOptimizationsByStatus(column.status);
          const Icon = column.icon;

          return (
            <div
              key={column.status}
              className="space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <Card className={`${column.bgColor} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${column.color}`} />
                      <span>{column.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnOptimizations.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Column Items */}
              <div className="space-y-3 min-h-[400px]">
                {columnOptimizations.map(optimization => (
                  <Card
                    key={optimization.id}
                    className="cursor-move hover:shadow-md transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300"
                    draggable
                    onDragStart={() => handleDragStart(optimization)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight flex-1">
                            {optimization.title}
                          </h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDelete(optimization.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Type Badge */}
                        {optimization.type && (
                          <Badge variant="outline" className="text-xs">
                            {optimization.type}
                          </Badge>
                        )}

                        {/* Target Metric */}
                        {optimization.target_metric && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>{optimization.target_metric}</span>
                          </div>
                        )}

                        {/* Review Date */}
                        {optimization.review_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(optimization.review_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}

                        {/* Result Summary */}
                        {optimization.result_summary && (
                          <div className="p-2 rounded text-xs bg-muted/50 text-muted-foreground leading-relaxed">
                            {optimization.result_summary.length > 100 
                              ? `${optimization.result_summary.substring(0, 100)}...`
                              : optimization.result_summary
                            }
                          </div>
                        )}

                        {/* Expected Impact */}
                        {optimization.expected_impact && !optimization.result_summary && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>{optimization.expected_impact}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {columnOptimizations.length === 0 && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg text-muted-foreground">
                    <div className="text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma otimização</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}