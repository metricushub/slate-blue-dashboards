import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  TrendingUp, 
  Star, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  leadStage?: string;
  leadScore?: number;
  leadTemperature?: 'cold' | 'warm' | 'hot';
}

interface LeadData {
  name: string;
  phone: string;
  email: string;
  stage: string;
  source: string;
  value: string;
  temperature: 'cold' | 'warm' | 'hot';
  notes: string;
  priority: string;
}

interface LeadIntegrationProps {
  contact: WhatsAppContact;
  onLeadCreated?: (leadId: string) => void;
  onLeadUpdated?: (leadId: string, updates: any) => void;
}

export function LeadIntegration({ contact, onLeadCreated, onLeadUpdated }: LeadIntegrationProps) {
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadData, setLeadData] = useState<LeadData>({
    name: contact.name,
    phone: contact.phone,
    email: '',
    stage: 'Interessado',
    source: 'WhatsApp',
    value: '',
    temperature: contact.leadTemperature || 'warm',
    notes: '',
    priority: 'medium'
  });

  // Simular leads existentes vinculados
  const existingLead = contact.leadStage ? {
    id: `lead-${contact.id}`,
    name: contact.name,
    stage: contact.leadStage,
    score: contact.leadScore,
    value: 5000,
    createdAt: '2024-01-15',
    lastInteraction: '2024-01-16'
  } : null;

  const handleCreateLead = async () => {
    setIsCreatingLead(true);
    
    // Simular criação do lead
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newLeadId = `lead-${Date.now()}`;
    
    toast({
      title: "Lead criado com sucesso!",
      description: `${leadData.name} foi adicionado ao CRM Kanban`,
    });

    onLeadCreated?.(newLeadId);
    setIsCreatingLead(false);
  };

  const handleUpdateLeadStage = async (newStage: string) => {
    const updates = { stage: newStage };
    
    toast({
      title: "Lead atualizado",
      description: `Estágio alterado para ${newStage}`,
    });

    onLeadUpdated?.(existingLead!.id, updates);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Interessado': return 'bg-blue-100 text-blue-800';
      case 'Qualificado': return 'bg-yellow-100 text-yellow-800';
      case 'Negociação': return 'bg-orange-100 text-orange-800';
      case 'Objeção': return 'bg-red-100 text-red-800';
      case 'Fechado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'text-red-500';
      case 'warm': return 'text-yellow-500'; 
      case 'cold': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (existingLead) {
    return (
      <Card className="w-80 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Lead Vinculado
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Lead Info */}
          <div className="flex items-center justify-between">
            <Badge className={getStageColor(existingLead.stage)}>
              {existingLead.stage}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className={`h-3 h-3 ${getTemperatureColor(contact.leadTemperature || 'warm')}`} />
              <span className="text-sm font-medium">{existingLead.score}%</span>
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Valor: R$ {existingLead.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Criado: {existingLead.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Último contato: {existingLead.lastInteraction}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">Atualizar estágio:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateLeadStage('Qualificado')}
                className="text-xs"
              >
                Qualificar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateLeadStage('Negociação')}
                className="text-xs"
              >
                Negociar
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleUpdateLeadStage('Fechado')}
                className="text-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Fechar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUpdateLeadStage('Perdido')}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Perdeu
              </Button>
            </div>
          </div>

          {/* View in CRM */}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => window.open('/leads', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver no CRM Kanban
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-orange-600" />
          Criar Lead
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input
              value={leadData.name}
              onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Telefone</Label>
            <Input
              value={leadData.phone}
              onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={leadData.email}
              onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Estágio</Label>
              <Select
                value={leadData.stage}
                onValueChange={(value) => setLeadData(prev => ({ ...prev, stage: value }))}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interessado">Interessado</SelectItem>
                  <SelectItem value="Qualificado">Qualificado</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0"
                value={leadData.value}
                onChange={(e) => setLeadData(prev => ({ ...prev, value: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Temperatura</Label>
            <Select
              value={leadData.temperature}
              onValueChange={(value: 'cold' | 'warm' | 'hot') => setLeadData(prev => ({ ...prev, temperature: value }))}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-blue-500" />
                    Frio
                  </div>
                </SelectItem>
                <SelectItem value="warm">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    Morno
                  </div>
                </SelectItem>
                <SelectItem value="hot">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-red-500" />
                    Quente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Primeira mensagem via WhatsApp..."
              value={leadData.notes}
              onChange={(e) => setLeadData(prev => ({ ...prev, notes: e.target.value }))}
              className="text-sm resize-none h-16"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateLead}
          disabled={isCreatingLead}
          className="w-full text-sm bg-blue-600 hover:bg-blue-700"
        >
          {isCreatingLead ? (
            "Criando..."
          ) : (
            <>
              <ArrowRight className="h-3 w-3 mr-1" />
              Criar Lead no CRM
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}