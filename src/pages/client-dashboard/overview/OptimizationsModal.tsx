import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalFrame } from "./ModalFrame";
import { METRICS, MetricKey } from "@/shared/types/metrics";
import { Optimization } from "@/shared/types/optimizations";
import { optimizationOperations } from "@/shared/db/dashboardStore";
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
    client_id: clientId,
    title: '',
    type: '',
    objective: '',
    target_metric: '' as MetricKey,
    hypothesis: '',
    campaigns: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    review_date: '',
    expected_impact: '',
    status: 'Planejada' as 'Planejada' | 'Em teste' | 'Concluída' | 'Abortada'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) {
      newErrors.title = "Título é obrigatório";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Data de início é obrigatória";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await optimizationOperations.create(formData);

      toast({
        title: "Otimização registrada",
        description: "A otimização foi salva com sucesso.",
      });

      // Reset form and close
      setFormData({
        client_id: clientId,
        title: '',
        type: '',
        objective: '',
        target_metric: '' as MetricKey,
        hypothesis: '',
        campaigns: [],
        start_date: new Date().toISOString().split('T')[0],
        review_date: '',
        expected_impact: '',
        status: 'Planejada'
      });
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('Failed to save optimization:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a otimização.",
        variant: "destructive",
      });
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>
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
          <Label htmlFor="start_date">Data de Início *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className={`mt-1 ${errors.start_date ? 'border-red-500' : ''}`}
          />
          {errors.start_date && (
            <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Ex: Otimização de CPA - Campanhas Google Search"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Teste A/B">Teste A/B</SelectItem>
              <SelectItem value="Estrutural">Estrutural</SelectItem>
              <SelectItem value="Criativo">Criativo</SelectItem>
              <SelectItem value="Bidding">Bidding</SelectItem>
              <SelectItem value="Segmentação">Segmentação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="metric">Métrica-alvo</Label>
          <Select 
            value={formData.target_metric} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, target_metric: value as MetricKey }))}
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
      </div>

      <div>
        <Label htmlFor="objective">Objetivo</Label>
        <Textarea
          id="objective"
          placeholder="Ex: Reduzir CPL em 20% nas campanhas de Google Ads..."
          value={formData.objective}
          onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="hypothesis">Teses/Hipóteses</Label>
        <Textarea
          id="hypothesis"
          placeholder="Ex: Ajustar lances por dispositivo deve melhorar a performance..."
          value={formData.hypothesis}
          onChange={(e) => setFormData(prev => ({ ...prev, hypothesis: e.target.value }))}
          rows={2}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="review_date">Data de Revisão</Label>
          <Input
            id="review_date"
            type="date"
            value={formData.review_date}
            onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="expected_impact">Impacto Esperado</Label>
          <Input
            id="expected_impact"
            placeholder="Ex: Redução de 20% no CPL"
            value={formData.expected_impact}
            onChange={(e) => setFormData(prev => ({ ...prev, expected_impact: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
    </ModalFrame>
  );
}