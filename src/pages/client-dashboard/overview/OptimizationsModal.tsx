import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalFrame } from "./ModalFrame";
import { METRICS, MetricKey } from "@/shared/types/metrics";
import { Optimization } from "@/shared/types/optimizations";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useToast } from "@/hooks/use-toast";

interface OptimizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export function OptimizationsModal({ isOpen, onClose, clientId, clientName }: OptimizationsModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId,
    date: new Date().toISOString().split('T')[0],
    objective: '',
    action: '',
    targetMetric: '' as MetricKey,
    baseline: null as number | null,
    expected: null as number | null,
    notes: '',
    status: 'executed' as 'planned' | 'executed'
  });

  const handleSubmit = () => {
    if (!formData.objective || !formData.targetMetric) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o objetivo e a métrica-alvo.",
        variant: "destructive",
      });
      return;
    }

    const optimization: Optimization = {
      id: `opt_${Date.now()}`,
      ...formData,
      date: formData.date,
    };

    // Save to localStorage
    const key = `${STORAGE_KEYS_EXTENDED.OPTIMIZATIONS}:${clientId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as Optimization[];
    existing.push(optimization);
    localStorage.setItem(key, JSON.stringify(existing));

    toast({
      title: "Otimização registrada",
      description: "A otimização foi salva com sucesso.",
    });

    // Reset form and close
    setFormData({
      clientId,
      date: new Date().toISOString().split('T')[0],
      objective: '',
      action: '',
      targetMetric: '' as MetricKey,
      baseline: null,
      expected: null,
      notes: '',
      status: 'executed'
    });
    
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={!formData.objective || !formData.targetMetric}>
        Salvar Otimização
      </Button>
    </>
  );

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Otimização"
      footer={footer}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client">Cliente</Label>
          <Input id="client" value={clientName} disabled className="mt-1" />
        </div>
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="objective">Objetivo *</Label>
        <Input
          id="objective"
          placeholder="Ex: Reduzir CPA em campanhas de Google Ads"
          value={formData.objective}
          onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="action">Ação Executada</Label>
        <Textarea
          id="action"
          placeholder="Descreva as ações realizadas..."
          value={formData.action}
          onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="metric">Métrica-alvo *</Label>
          <Select 
            value={formData.targetMetric} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, targetMetric: value as MetricKey }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {Object.values(METRICS).map((metric) => (
                <SelectItem key={metric.key} value={metric.key}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="baseline">Baseline</Label>
          <Input
            id="baseline"
            type="number"
            step="0.01"
            placeholder="Valor atual"
            value={formData.baseline || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, baseline: e.target.value ? parseFloat(e.target.value) : null }))}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="expected">Meta</Label>
          <Input
            id="expected"
            type="number"
            step="0.01"
            placeholder="Valor esperado"
            value={formData.expected || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, expected: e.target.value ? parseFloat(e.target.value) : null }))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Observações adicionais..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          className="mt-1"
        />
      </div>
    </ModalFrame>
  );
}