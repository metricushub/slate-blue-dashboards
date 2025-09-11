import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Optimization, OptimizationFormData } from "@/shared/types/optimizations";
import { METRICS, MetricKey } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Target, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export function OptimizationsModal({ isOpen, onClose, clientId, clientName }: OptimizationsModalProps) {
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OptimizationFormData>({
    defaultValues: {
      clientId,
      status: 'planned',
    },
  });

  // Load optimizations for this client
  useEffect(() => {
    if (isOpen && clientId) {
      const saved = localStorage.getItem(`${STORAGE_KEYS_EXTENDED.OPTIMIZATIONS}:${clientId}`);
      if (saved) {
        try {
          const parsedOptimizations = JSON.parse(saved) as Optimization[];
          setOptimizations(parsedOptimizations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
          console.error('Failed to load optimizations:', error);
        }
      }
    }
  }, [isOpen, clientId]);

  const onSubmit = (data: OptimizationFormData) => {
    const newOptimization: Optimization = {
      ...data,
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: data.date || new Date().toISOString().split('T')[0],
      clientId,
    };

    const updatedOptimizations = [newOptimization, ...optimizations];
    setOptimizations(updatedOptimizations);
    
    // Persist to localStorage
    localStorage.setItem(
      `${STORAGE_KEYS_EXTENDED.OPTIMIZATIONS}:${clientId}`, 
      JSON.stringify(updatedOptimizations)
    );

    toast({
      title: "Otimização registrada",
      description: "A otimização foi salva com sucesso.",
    });

    reset({
      clientId,
      status: 'planned',
      baseline: null,
      expected: null,
      notes: '',
      objective: '',
      action: '',
    });
    setShowForm(false);
  };

  const deleteOptimization = (id: string) => {
    const updatedOptimizations = optimizations.filter(opt => opt.id !== id);
    setOptimizations(updatedOptimizations);
    
    localStorage.setItem(
      `${STORAGE_KEYS_EXTENDED.OPTIMIZATIONS}:${clientId}`, 
      JSON.stringify(updatedOptimizations)
    );

    toast({
      title: "Otimização removida",
      description: "A otimização foi removida com sucesso.",
    });
  };

  const getStatusBadge = (status: Optimization['status']) => {
    const variants = {
      planned: { label: 'Planejada', className: 'bg-[#f59e0b] text-white' },
      executed: { label: 'Executada', className: 'bg-[#22c55e] text-white' },
    };

    const variant = variants[status];
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-[#0b0f14] border-[#1f2733]">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3] text-xl">
            Otimizações - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[70vh]">
          {/* Optimization Form */}
          <div className="w-1/2 space-y-4 overflow-y-auto">
            {!showForm ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Target className="h-16 w-16 text-[#9fb0c3] mb-4" />
                <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">
                  Registre uma nova otimização
                </h3>
                <p className="text-[#9fb0c3] text-center mb-6 max-w-sm">
                  Documente objetivos, ações e resultados esperados para acompanhar o progresso.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Nova Otimização
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#e6edf3]">Nova Otimização</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="text-[#9fb0c3] hover:text-[#e6edf3]"
                  >
                    Cancelar
                  </Button>
                </div>

                <div>
                  <Label htmlFor="date" className="text-[#e6edf3]">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="bg-[#11161e] border-[#1f2733] text-[#e6edf3]"
                  />
                </div>

                <div>
                  <Label htmlFor="objective" className="text-[#e6edf3]">Objetivo *</Label>
                  <Input
                    id="objective"
                    {...register('objective', { required: 'Objetivo é obrigatório' })}
                    placeholder="Ex: Reduzir CPA em 15%"
                    className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280]"
                  />
                  {errors.objective && (
                    <p className="text-[#ef4444] text-sm mt-1">{errors.objective.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="action" className="text-[#e6edf3]">Ação Executada</Label>
                  <Textarea
                    id="action"
                    {...register('action')}
                    placeholder="Descreva a ação realizada..."
                    className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280] resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-[#e6edf3]">Métrica-alvo *</Label>
                  <Select onValueChange={(value: MetricKey) => setValue('targetMetric', value)}>
                    <SelectTrigger className="bg-[#11161e] border-[#1f2733] text-[#e6edf3]">
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#11161e] border-[#1f2733]">
                      {Object.values(METRICS).map((metric) => (
                        <SelectItem 
                          key={metric.key} 
                          value={metric.key}
                          className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                        >
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.targetMetric && (
                    <p className="text-[#ef4444] text-sm mt-1">Métrica-alvo é obrigatória</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseline" className="text-[#e6edf3]">Baseline</Label>
                    <Input
                      id="baseline"
                      type="number"
                      step="0.01"
                      {...register('baseline', { valueAsNumber: true })}
                      placeholder="Valor atual"
                      className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expected" className="text-[#e6edf3]">Resultado Esperado</Label>
                    <Input
                      id="expected"
                      type="number"
                      step="0.01"
                      {...register('expected', { valueAsNumber: true })}
                      placeholder="Meta"
                      className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280]"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#e6edf3]">Status</Label>
                  <Select 
                    defaultValue="planned"
                    onValueChange={(value: 'planned' | 'executed') => setValue('status', value)}
                  >
                    <SelectTrigger className="bg-[#11161e] border-[#1f2733] text-[#e6edf3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#11161e] border-[#1f2733]">
                      <SelectItem 
                        value="planned"
                        className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                      >
                        Planejada
                      </SelectItem>
                      <SelectItem 
                        value="executed"
                        className="text-[#e6edf3] focus:bg-[#1f2733] focus:text-[#e6edf3]"
                      >
                        Executada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-[#e6edf3]">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Observações adicionais..."
                    className="bg-[#11161e] border-[#1f2733] text-[#e6edf3] placeholder:text-[#6b7280] resize-none"
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
                >
                  Salvar Otimização
                </Button>
              </form>
            )}
          </div>

          {/* Optimizations List */}
          <div className="w-1/2 border-l border-[#1f2733] pl-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#e6edf3]">
                Histórico ({optimizations.length})
              </h3>
            </div>

            <div className="space-y-3 overflow-y-auto h-full pb-4">
              {optimizations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Calendar className="h-12 w-12 text-[#6b7280] mb-3" />
                  <p className="text-[#9fb0c3] text-center">
                    Nenhuma otimização registrada ainda.
                  </p>
                </div>
              ) : (
                optimizations.map((optimization) => (
                  <Card key={optimization.id} className="bg-[#11161e] border-[#1f2733]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-[#e6edf3] mb-1">
                            {optimization.objective}
                          </h4>
                          <p className="text-sm text-[#9fb0c3]">
                            {format(new Date(optimization.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(optimization.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOptimization(optimization.id)}
                            className="text-[#ef4444] hover:text-[#dc2626] hover:bg-[#1f2733]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-[#60a5fa]" />
                          <span className="text-[#9fb0c3]">Métrica:</span>
                          <span className="text-[#e6edf3]">
                            {METRICS[optimization.targetMetric]?.label || optimization.targetMetric}
                          </span>
                        </div>
                        
                        {(optimization.baseline !== null || optimization.expected !== null) && (
                          <div className="flex items-center gap-4 text-xs">
                            {optimization.baseline !== null && (
                              <span className="text-[#9fb0c3]">
                                Baseline: <span className="text-[#e6edf3]">{optimization.baseline}</span>
                              </span>
                            )}
                            {optimization.expected !== null && (
                              <span className="text-[#9fb0c3]">
                                Meta: <span className="text-[#22c55e]">{optimization.expected}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {optimization.action && (
                          <>
                            <Separator className="my-2 bg-[#1f2733]" />
                            <p className="text-[#9fb0c3] text-xs leading-relaxed">
                              {optimization.action}
                            </p>
                          </>
                        )}

                        {optimization.notes && (
                          <p className="text-[#6b7280] text-xs italic">
                            {optimization.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}