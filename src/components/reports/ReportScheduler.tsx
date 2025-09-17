import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Mail, 
  MessageSquare, 
  Users, 
  Settings,
  Play,
  Pause,
  Trash2,
  Plus,
  Bell,
  FileText,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportSchedulerProps {
  clientId?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  frequency: string;
  recipients: string[];
  channels: string[];
  nextRun: Date;
  isActive: boolean;
  lastSent?: Date;
}

const mockSchedules: ScheduledReport[] = [
  {
    id: '1',
    name: 'Relatório Semanal',
    template: 'Executivo',
    frequency: 'weekly',
    recipients: ['cliente@empresa.com', 'gestor@empresa.com'],
    channels: ['email', 'whatsapp'],
    nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isActive: true,
    lastSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Resumo Mensal',
    template: 'Detalhado',
    frequency: 'monthly',
    recipients: ['diretoria@empresa.com'],
    channels: ['email'],
    nextRun: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

export function ReportScheduler({ clientId }: ReportSchedulerProps) {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(mockSchedules);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    template: '',
    frequency: '',
    recipients: [''],
    channels: [],
    time: '09:00',
    message: ''
  });

  const toggleScheduleActive = (id: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id 
        ? { ...schedule, isActive: !schedule.isActive }
        : schedule
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };

  const addRecipient = () => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.map((rec, i) => i === index ? value : rec)
    }));
  };

  const removeRecipient = (index: number) => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const toggleChannel = (channel: string) => {
    setNewSchedule(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral'
    };
    return labels[frequency] || frequency;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automação de Relatórios</h2>
          <p className="text-muted-foreground">
            Configure envios automáticos por email e WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* New Schedule Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Nome do Agendamento</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Relatório Semanal do Cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template do Relatório</Label>
                <Select value={newSchedule.template} onValueChange={(value) => 
                  setNewSchedule(prev => ({ ...prev, template: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Relatório Executivo</SelectItem>
                    <SelectItem value="detailed">Relatório Detalhado</SelectItem>
                    <SelectItem value="roi">Relatório de ROI</SelectItem>
                    <SelectItem value="comparison">Relatório Comparativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={newSchedule.frequency} onValueChange={(value) => 
                  setNewSchedule(prev => ({ ...prev, frequency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário de Envio</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <Label>Destinatários</Label>
              {newSchedule.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="email@exemplo.com"
                    className="flex-1"
                  />
                  {newSchedule.recipients.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addRecipient} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Destinatário
              </Button>
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <Label>Canais de Envio</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSchedule.channels.includes('email')}
                    onCheckedChange={() => toggleChannel('email')}
                  />
                  <Mail className="h-4 w-4" />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSchedule.channels.includes('whatsapp')}
                    onCheckedChange={() => toggleChannel('whatsapp')}
                  />
                  <MessageSquare className="h-4 w-4" />
                  <Label>WhatsApp</Label>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem Personalizada (Opcional)</Label>
              <Textarea
                id="message"
                value={newSchedule.message}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Mensagem que acompanha o relatório..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Criar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{schedule.name}</h3>
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                      {schedule.isActive ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <Badge variant="outline">{getFrequencyLabel(schedule.frequency)}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Template: {schedule.template}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {schedule.recipients.length} destinatário(s)
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Próximo envio: {format(schedule.nextRun, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {schedule.channels.map((channel) => {
                      const Icon = getChannelIcon(channel);
                      return (
                        <div key={channel} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {channel === 'email' ? 'Email' : 'WhatsApp'}
                        </div>
                      );
                    })}
                  </div>

                  {schedule.lastSent && (
                    <p className="text-xs text-muted-foreground">
                      Último envio: {format(schedule.lastSent, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleScheduleActive(schedule.id)}
                  >
                    {schedule.isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Agora
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteSchedule(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedules.length === 0 && !showNewForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum agendamento configurado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Configure envios automáticos para manter seus clientes sempre informados
            </p>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Agendamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}