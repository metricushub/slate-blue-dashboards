import { useState, useEffect } from 'react';
import { Lead, LeadStage } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Trash2, Save, User, Mail, Phone, Calendar, DollarSign, Link, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDataSource } from '@/hooks/useDataSource';
import { useToast } from '@/hooks/use-toast';

interface LeadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSave: (id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>) => void;
  onDelete: (id: string) => void;
}

const LEAD_STAGES: LeadStage[] = ["Novo", "Qualificação", "Proposta", "Fechado"];

export function LeadDrawer({ open, onOpenChange, lead, onSave, onDelete }: LeadDrawerProps) {
  const { dataSource, sourceType } = useDataSource();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    value: '',
    owner: '',
    stage: 'Novo' as LeadStage,
    notes: '',
    client_id: '',
  });

  // Resetar dados quando o lead muda
  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        utm_source: lead.utm_source || '',
        utm_medium: lead.utm_medium || '',
        utm_campaign: lead.utm_campaign || '',
        utm_content: lead.utm_content || '',
        value: lead.value?.toString() || '',
        owner: lead.owner || '',
        stage: lead.stage,
        notes: lead.notes || '',
        client_id: lead.client_id || '',
      });
    }
  }, [lead]);

  // Carregar clientes quando necessário
  useEffect(() => {
    if (open && dataSource) {
      dataSource.getClients().then(setClients).catch(console.error);
    }
  }, [open, dataSource]);

  const handleSave = async () => {
    if (!lead || !formData.name.trim()) return;

    setLoading(true);
    
    try {
      const updates: Partial<Omit<Lead, 'id' | 'created_at'>> = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        utm_source: formData.utm_source.trim() || undefined,
        utm_medium: formData.utm_medium.trim() || undefined,
        utm_campaign: formData.utm_campaign.trim() || undefined,
        utm_content: formData.utm_content.trim() || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        owner: formData.owner.trim() || undefined,
        stage: formData.stage,
        notes: formData.notes.trim() || undefined,
        client_id: formData.client_id || undefined,
      };

      await onSave(lead.id, updates);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!lead) return;

    try {
      // Criar uma cópia com novo ID
      const duplicatedLead = {
        ...formData,
        name: `${formData.name} (Cópia)`,
        value: formData.value ? parseFloat(formData.value) : undefined,
      };

      // Usar a função do parent para criar o lead
      const event = new CustomEvent('createLead', { detail: duplicatedLead });
      window.dispatchEvent(event);

      toast({
        title: "Lead duplicado",
        description: "Uma cópia do lead foi criada.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao duplicar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o lead.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    await onDelete(lead.id);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Novo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Qualificação':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Proposta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Fechado':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Detalhes do Lead</SheetTitle>
            <Badge className={getStageColor(lead.stage)}>
              {lead.stage}
            </Badge>
          </div>
          
          {sourceType === 'sheets' && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
              💡 Aba leads do Google Sheets é somente leitura. Edições ficam no dispositivo.
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Informações Básicas
            </div>

            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do lead"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner">Proprietário</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="Responsável"
                />
              </div>

              <div>
                <Label htmlFor="value">Valor Potencial (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => handleInputChange('stage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clients.length > 0 && (
                <div>
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum cliente</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* UTM Parameters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              Parâmetros UTM
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="utm_source" className="text-sm">UTM Source</Label>
                <Input
                  id="utm_source"
                  value={formData.utm_source}
                  onChange={(e) => handleInputChange('utm_source', e.target.value)}
                  placeholder="google, facebook..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_medium" className="text-sm">UTM Medium</Label>
                <Input
                  id="utm_medium"
                  value={formData.utm_medium}
                  onChange={(e) => handleInputChange('utm_medium', e.target.value)}
                  placeholder="cpc, organic..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_campaign" className="text-sm">UTM Campaign</Label>
                <Input
                  id="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={(e) => handleInputChange('utm_campaign', e.target.value)}
                  placeholder="spring-sale..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_content" className="text-sm">UTM Content</Label>
                <Input
                  id="utm_content"
                  value={formData.utm_content}
                  onChange={(e) => handleInputChange('utm_content', e.target.value)}
                  placeholder="logolink..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Notas
            </div>

            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o lead..."
              rows={4}
            />
          </div>

          <Separator />

          {/* Histórico */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Histórico
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Criado em:</span>
                <span>
                  {format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              {lead.updated_at && lead.updated_at !== lead.created_at && (
                <div className="flex justify-between">
                  <span>Última atualização:</span>
                  <span>
                    {format(new Date(lead.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}

              {selectedClient && (
                <div className="flex justify-between">
                  <span>Cliente vinculado:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedClient.name}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o lead "{lead.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}