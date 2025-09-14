import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '@/shared/hooks/useHomeData';
import { useDataSource } from '@/hooks/useDataSource';
import { DashboardHeader } from './components/DashboardHeader';
import { AlertsCenter } from './components/AlertsCenter';
import { TasksInbox } from './components/TasksInbox';
import { OptimizationsStrip } from './components/OptimizationsStrip';
import { CrmSnapshot } from './components/CrmSnapshot';
import { ActivityFeed } from './components/ActivityFeed';
import { PacingWidget } from './components/PacingWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Layout variants controlled by environment variable
const LAYOUT_VARIANT = import.meta.env.VITE_HOME_VARIANT || 'a';

const RadarDoDia = () => {
  const { data, loading, error, refreshData } = useHomeData();
  const { dataSource } = useDataSource();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Get client names for mapping
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  // Load client names on mount
  useState(() => {
    dataSource.getClients().then(clients => {
      const nameMap = clients.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
      }, {} as Record<string, string>);
      setClientNames(nameMap);
    });
  });

  const handleQuickAction = (type: 'task' | 'optimization' | 'note') => {
    switch (type) {
      case 'task':
        // Quick task creation is handled in TasksInbox
        toast({
          title: "Dica",
          description: "Use o botão 'Nova Tarefa' na seção de tarefas abaixo",
        });
        break;
      case 'optimization':
        // Navigate to general optimizations page
        navigate('/otimizacoes');
        break;
      case 'note':
        // Navigate to global notes/tasks page
        navigate('/tarefas-anotacoes');
        break;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement global search functionality
    if (query.trim()) {
      toast({
        title: "Busca Global",
        description: `Buscando por: ${query}`,
      });
    }
  };

  const handleSetupIntegration = () => {
    navigate('/integracoes');
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {error || 'Erro ao carregar dados do dashboard'}
          </p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Layout Variant A: Cards Empilhados (default)
  if (LAYOUT_VARIANT === 'a') {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          onQuickAction={handleQuickAction}
          onSearch={handleSearch}
        />
        
        <div className="space-y-6">
          <AlertsCenter alerts={data.alerts} clientNames={clientNames} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TasksInbox 
              tasks={data.tasks} 
              clientNames={clientNames}
              onRefresh={refreshData}
            />
            <CrmSnapshot leads={data.leads} />
          </div>
          
          <OptimizationsStrip 
            optimizations={data.optimizations}
            clientNames={clientNames}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed activity={data.activity} />
            <PacingWidget 
              hasIntegration={false} // TODO: Check actual integration status
              onSetupIntegration={handleSetupIntegration}
            />
          </div>
        </div>
      </div>
    );
  }

  // Layout Variant B: Layout em Colunas
  return (
    <div className="space-y-6">
      <DashboardHeader 
        onQuickAction={handleQuickAction}
        onSearch={handleSearch}
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <AlertsCenter alerts={data.alerts} clientNames={clientNames} />
          <PacingWidget 
            hasIntegration={false} // TODO: Check actual integration status
            onSetupIntegration={handleSetupIntegration}
          />
        </div>
        
        {/* Center Column */}
        <div className="space-y-6">
          <TasksInbox 
            tasks={data.tasks} 
            clientNames={clientNames}
            onRefresh={refreshData}
          />
          <CrmSnapshot leads={data.leads} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <OptimizationsStrip 
            optimizations={data.optimizations}
            clientNames={clientNames}
          />
          <ActivityFeed activity={data.activity} />
        </div>
      </div>
    </div>
  );
};

export default RadarDoDia;