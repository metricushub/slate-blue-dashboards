import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Target, 
  AlertCircle,
  Calendar,
  Users,
  Settings,
  Save,
  X
} from 'lucide-react';
import { Goal, GoalPeriod, GoalOperator, GOAL_CATEGORIES } from '@/types/goals';
import { METRICS, MetricKey } from '@/shared/types/metrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalsManagerProps {
  clientId?: string;
}

export function GoalsManager({ clientId }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric: '' as MetricKey,
    operator: 'gte' as GoalOperator,
    targetValue: '',
    maxValue: '',
    period: 'monthly' as GoalPeriod,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    priority: 'medium',
    category: '',
    enableAlerts: true,
    alertFrequency: 'daily',
    alertThreshold: '80',
    alertRecipients: ['']
  });

  const handleCreateGoal = () => {
    setFormData({
      name: '',
      description: '',
      metric: '' as MetricKey,
      operator: 'gte' as GoalOperator,
      targetValue: '',
      maxValue: '',
      period: 'monthly' as GoalPeriod,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      priority: 'medium',
      category: '',
      enableAlerts: true,
      alertFrequency: 'daily',
      alertThreshold: '80',
      alertRecipients: ['']
    });
    setEditingGoal(null);
    setShowCreateDialog(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setFormData({
      name: goal.name,
      description: goal.description || '',
      metric: goal.metric,
      operator: goal.operator,
      targetValue: goal.targetValue.toString(),
      maxValue: goal.maxValue?.toString() || '',
      period: goal.period,
      startDate: goal.startDate,
      endDate: goal.endDate || '',
      priority: goal.priority,
      category: goal.category || '',
      enableAlerts: goal.enableAlerts,
      alertFrequency: goal.alertFrequency,
      alertThreshold: goal.alertThreshold.toString(),
      alertRecipients: goal.alertRecipients
    });
    setEditingGoal(goal);
    setShowCreateDialog(true);
  };

  const handleSaveGoal = () => {
    const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: clientId || 'client-1',
      name: formData.name,
      description: formData.description,
      metric: formData.metric,
      operator: formData.operator,
      targetValue: parseFloat(formData.targetValue),
      maxValue: formData.maxValue ? parseFloat(formData.maxValue) : undefined,
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      status: 'active',
      priority: formData.priority as any,
      createdBy: 'user-1',
      enableAlerts: formData.enableAlerts,
      alertFrequency: formData.alertFrequency as any,
      alertThreshold: parseFloat(formData.alertThreshold),
      alertRecipients: formData.alertRecipients.filter(email => email.trim()),
      category: formData.category
    };

    if (editingGoal) {
      // Update existing goal
      setGoals(prev => prev.map(g => 
        g.id === editingGoal.id 
          ? { ...goalData, id: editingGoal.id, createdAt: editingGoal.createdAt, updatedAt: new Date().toISOString() }
          : g
      ));
    } else {
      // Create new goal
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setGoals(prev => [...prev, newGoal]);
    }

    setShowCreateDialog(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleDuplicateGoal = (goal: Goal) => {
    const duplicatedGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      name: `${goal.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    setGoals(prev => [...prev, duplicatedGoal]);
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      alertRecipients: [...prev.alertRecipients, '']
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      alertRecipients: prev.alertRecipients.map((rec, i) => i === index ? value : rec)
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alertRecipients: prev.alertRecipients.filter((_, i) => i !== index)
    }));
  };

  const getOperatorLabel = (operator: GoalOperator) => {
    switch (operator) {
      case 'gte': return 'Maior ou igual a';
      case 'lte': return 'Menor ou igual a';
      case 'eq': return 'Igual a';
      case 'range': return 'Entre';
      default: return operator;
    }
  };

  const getPeriodLabel = (period: GoalPeriod) => {
    switch (period) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return period;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Metas</h2>
          <p className="text-muted-foreground">
            Crie, edite e organize as metas de performance do cliente
          </p>
        </div>
        <Button onClick={handleCreateGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Modifique os parâmetros da meta existente' : 'Configure uma nova meta de performance para acompanhar'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="target">Meta</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nome da Meta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Meta de Leads Mensal"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo desta meta..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Fim (Opcional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="target" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric">Métrica</Label>
                  <Select value={formData.metric} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, metric: value as MetricKey }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(METRICS).filter(metric => metric && metric.label).map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator">Condição</Label>
                  <Select value={formData.operator} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, operator: value as GoalOperator }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">Maior ou igual a</SelectItem>
                      <SelectItem value="lte">Menor ou igual a</SelectItem>
                      <SelectItem value="eq">Igual a</SelectItem>
                      <SelectItem value="range">Entre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetValue">Valor da Meta</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                    placeholder="Ex: 150"
                  />
                </div>

                {formData.operator === 'range' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxValue">Valor Máximo</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      value={formData.maxValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxValue: e.target.value }))}
                      placeholder="Ex: 200"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select value={formData.period} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, period: value as GoalPeriod }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Ativar Alertas</Label>
                <Switch
                  checked={formData.enableAlerts}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, enableAlerts: checked }))
                  }
                />
              </div>

              {formData.enableAlerts && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alertFrequency">Frequência</Label>
                      <Select value={formData.alertFrequency} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, alertFrequency: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Imediato</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alertThreshold">Limite (%)</Label>
                      <Input
                        id="alertThreshold"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.alertThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: e.target.value }))}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Destinatários dos Alertas</Label>
                    {formData.alertRecipients.map((recipient, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={recipient}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          placeholder="email@exemplo.com"
                          type="email"
                          className="flex-1"
                        />
                        {formData.alertRecipients.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRecipient(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addRecipient} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Destinatário
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal}>
              <Save className="mr-2 h-4 w-4" />
              {editingGoal ? 'Atualizar' : 'Criar Meta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-chart-primary" />
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                    <Badge variant={getPriorityColor(goal.priority) === 'warning' ? 'outline' : getPriorityColor(goal.priority) as any}>
                      {goal.priority === 'critical' ? 'Crítica' : 
                       goal.priority === 'high' ? 'Alta' :
                       goal.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    {goal.category && (
                      <Badge variant="outline">{goal.category}</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{METRICS[goal.metric].label}</span>
                    <span>{getOperatorLabel(goal.operator)}</span>
                    <span className="font-medium">{goal.targetValue}</span>
                    <span>•</span>
                    <span>{getPeriodLabel(goal.period)}</span>
                    {goal.enableAlerts && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Alertas ativos</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditGoal(goal)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => handleDuplicateGoal(goal)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma meta configurada
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Configure as primeiras metas de performance para este cliente
              </p>
              <Button onClick={handleCreateGoal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}