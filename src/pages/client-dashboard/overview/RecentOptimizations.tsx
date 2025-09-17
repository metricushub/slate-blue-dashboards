import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Optimization, OptimizationStatus } from "@/types";
import { optimizationOperations } from "@/shared/db/dashboardStore";
import { Target, Edit, Trash2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentOptimizationsProps {
  clientId: string;
}

interface ResultFormData {
  result_summary: string;
  status: OptimizationStatus;
}

const STATUS_COLORS = {
  "Planejada": "bg-blue-100 text-blue-800",
  "Em teste": "bg-yellow-100 text-yellow-800",
  "Concluída": "bg-green-100 text-green-800",
  "Abortada": "bg-red-100 text-red-800"
};

const STATUS_ICONS = {
  "Planejada": Plus,
  "Em teste": TrendingUp,
  "Concluída": TrendingUp,
  "Abortada": TrendingDown
};

export function RecentOptimizations({ clientId }: RecentOptimizationsProps) {
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<Optimization | null>(null);
  const { toast } = useToast();

  const [resultForm, setResultForm] = useState<ResultFormData>({
    result_summary: "",
    status: "Concluída"
  });

  // Load optimizations
  useEffect(() => {
    if (clientId) {
      loadOptimizations();
    }
  }, [clientId]);

  const loadOptimizations = async () => {
    setLoading(true);
    try {
      const data = await optimizationOperations.getByClient(clientId);
      // Show only the most recent 10 optimizations
      setOptimizations(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load optimizations:', error);
      toast({
        title: "Erro ao carregar otimizações",
        description: "Não foi possível carregar as otimizações recentes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = (optimization: Optimization) => {
    setSelectedOptimization(optimization);
    setResultForm({
      result_summary: optimization.result_summary || "",
      status: optimization.status === "Planejada" ? "Em teste" : optimization.status
    });
    setShowResultModal(true);
  };

  const handleSaveResult = async () => {
    if (!selectedOptimization) return;

    if (!resultForm.result_summary.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O resumo do resultado é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      await optimizationOperations.update(selectedOptimization.id, {
        result_summary: resultForm.result_summary,
        status: resultForm.status
      });

      toast({
        title: "Resultado atualizado",
        description: "O resultado da otimização foi salvo com sucesso."
      });

      await loadOptimizations();
      closeResultModal();
    } catch (error) {
      toast({
        title: "Erro ao salvar resultado",
        description: "Não foi possível salvar o resultado da otimização.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOptimization = async (optimizationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta otimização?")) return;

    try {
      await optimizationOperations.delete(optimizationId);
      toast({ title: "Otimização excluída com sucesso" });
      await loadOptimizations();
    } catch (error) {
      toast({
        title: "Erro ao excluir otimização",
        variant: "destructive"
      });
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setSelectedOptimization(null);
    setResultForm({
      result_summary: "",
      status: "Concluída"
    });
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
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Otimizações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Otimizações Recentes ({optimizations.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = `/cliente/${clientId}/otimizacoes`}
              className="text-xs"
            >
              Ver Central
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {optimizations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma otimização registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optimizations.map((optimization) => {
                const StatusIcon = STATUS_ICONS[optimization.status];
                return (
                  <div
                    key={optimization.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4 flex-shrink-0" />
                        <h4 className="font-medium truncate">{optimization.title}</h4>
                        <Badge className={STATUS_COLORS[optimization.status]}>
                          {optimization.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>Tipo: {optimization.type}</span>
                          {optimization.target_metric && (
                            <span>Meta: {optimization.target_metric}</span>
                          )}
                        </div>
                        
                        {optimization.review_date && (
                          <div>
                            Revisão: {format(new Date(optimization.review_date), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                        
                        {optimization.result_summary && (
                          <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                            {getImpactIcon(optimization)}
                            <span>{optimization.result_summary}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateResult(optimization)}
                        className="h-8 w-8 p-0"
                        title="Atualizar resultado"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => handleDeleteOptimization(optimization.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir otimização"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Call to action for Central de Otimizações */}
          {optimizations.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-purple-900 mb-1">
                    🚀 Turbine suas otimizações!
                  </h4>
                  <p className="text-xs text-purple-700">
                    Acesse a Central completa com IA, analytics e insights
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/cliente/${clientId}/otimizacoes`}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Ir para Central
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Update Modal */}
      <Dialog open={showResultModal} onOpenChange={closeResultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Resultado da Otimização</DialogTitle>
          </DialogHeader>

          {selectedOptimization && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded">
                <h4 className="font-medium">{selectedOptimization.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedOptimization.type}</p>
                {selectedOptimization.target_metric && (
                  <p className="text-sm text-muted-foreground">Meta: {selectedOptimization.target_metric}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={resultForm.status}
                  onValueChange={(value: OptimizationStatus) => 
                    setResultForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejada">Planejada</SelectItem>
                    <SelectItem value="Em teste">Em teste</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Abortada">Abortada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="result">Resumo do Resultado *</Label>
                <Textarea
                  id="result"
                  value={resultForm.result_summary}
                  onChange={(e) => setResultForm(prev => ({ ...prev, result_summary: e.target.value }))}
                  placeholder="Ex: CPL reduziu 15% de R$ 80 para R$ 68. ROAS melhorou de 2.5x para 3.2x. Teste será aplicado em outras campanhas."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Descreva o impacto observado nas métricas e próximos passos
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeResultModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveResult}>
                  Salvar Resultado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}