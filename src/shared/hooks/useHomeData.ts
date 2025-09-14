import { useState, useEffect } from 'react';
import { dashboardDb, taskOperations, alertOperations, optimizationOperations } from '@/shared/db/dashboardStore';
import { LeadsStore } from '@/shared/db/leadsStore';
import { Task, AlertRule, Optimization, Lead } from '@/types';
import { useDataSource } from '@/hooks/useDataSource';

export interface HomeDataSummary {
  alerts: {
    total: number;
    byClient: Record<string, AlertRule[]>;
    bySeverity: Record<string, number>;
    urgent: AlertRule[];
  };
  tasks: {
    total: number;
    overdue: Task[];
    today: Task[];
    upcoming: Task[];
    byClient: Record<string, number>;
  };
  optimizations: {
    planned: Optimization[];
    testing: Optimization[];
    review: Optimization[];
    byClient: Record<string, number>;
  };
  leads: {
    total: number;
    byStage: Record<string, number>;
    stuck: Lead[];
    recent: Lead[];
  };
  activity: Array<{
    id: string;
    type: 'task' | 'optimization' | 'lead';
    title: string;
    clientName?: string;
    timestamp: string;
    action: string;
  }>;
}

export const useHomeData = () => {
  const [data, setData] = useState<HomeDataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dataSource } = useDataSource();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all clients for mapping names
      const clients = await dataSource.getClients();
      const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
      }, {} as Record<string, string>);

      // Get all tasks, alerts, optimizations
      const [allTasks, allAlerts, allOptimizations, allLeads] = await Promise.all([
        dashboardDb.tasks.toArray(),
        dashboardDb.alerts.toArray(),
        dashboardDb.optimizations.toArray(),
        LeadsStore.getAllLeads()
      ]);

      // Process tasks
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const overdue = allTasks.filter(task => 
        task.status !== 'Concluída' && 
        task.due_date && 
        new Date(task.due_date) < today
      );

      const todayTasks = allTasks.filter(task =>
        task.status !== 'Concluída' &&
        task.due_date &&
        new Date(task.due_date).toDateString() === today.toDateString()
      );

      const upcoming = allTasks.filter(task =>
        task.status !== 'Concluída' &&
        task.due_date &&
        new Date(task.due_date) > today &&
        new Date(task.due_date) <= nextWeek
      );

      const tasksByClient = allTasks.reduce((acc, task) => {
        acc[task.client_id] = (acc[task.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process alerts
      const enabledAlerts = allAlerts.filter(alert => alert.enabled);
      const bySeverity = enabledAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byClient = enabledAlerts.reduce((acc, alert) => {
        if (!acc[alert.client_id]) acc[alert.client_id] = [];
        acc[alert.client_id].push(alert);
        return acc;
      }, {} as Record<string, AlertRule[]>);

      const urgent = enabledAlerts
        .filter(alert => alert.severity === 'error')
        .slice(0, 10);

      // Process optimizations
      const planned = allOptimizations.filter(opt => opt.status === 'Planejada');
      const testing = allOptimizations.filter(opt => opt.status === 'Em teste');
      const review = allOptimizations.filter(opt => opt.status === 'Concluída'); // Assuming review means completed

      const optimizationsByClient = allOptimizations.reduce((acc, opt) => {
        acc[opt.client_id] = (acc[opt.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process leads
      const leadStats = await LeadsStore.getLeadsStats();
      const stuckThreshold = 30; // days
      const stuckDate = new Date(now.getTime() - stuckThreshold * 24 * 60 * 60 * 1000);
      
      const stuck = allLeads.filter(lead => 
        lead.stage !== 'Fechado' && 
        new Date(lead.updated_at || lead.created_at) < stuckDate
      );

      const recent = allLeads
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Generate activity feed
      const activity = [];
      
      // Recent completed tasks
      const recentTasks = allTasks
        .filter(task => task.status === 'Concluída' && task.updated_at)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5);

      activity.push(...recentTasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        title: task.title,
        clientName: clientMap[task.client_id],
        timestamp: task.updated_at!,
        action: 'marcada como concluída'
      })));

      // Recent optimization updates
      const recentOptimizations = allOptimizations
        .filter(opt => opt.updated_at)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 3);

      activity.push(...recentOptimizations.map(opt => ({
        id: `opt-${opt.id}`,
        type: 'optimization' as const,
        title: opt.title,
        clientName: clientMap[opt.client_id],
        timestamp: opt.updated_at!,
        action: `status alterado para ${opt.status}`
      })));

      // Sort activity by timestamp
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setData({
        alerts: {
          total: enabledAlerts.length,
          byClient,
          bySeverity,
          urgent
        },
        tasks: {
          total: allTasks.filter(t => t.status !== 'Concluída').length,
          overdue,
          today: todayTasks,
          upcoming,
          byClient: tasksByClient
        },
        optimizations: {
          planned,
          testing,
          review,
          byClient: optimizationsByClient
        },
        leads: {
          total: leadStats.total,
          byStage: leadStats.byStage,
          stuck,
          recent
        },
        activity: activity.slice(0, 10)
      });

    } catch (err) {
      console.error('Error loading home data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataSource]);

  const refreshData = () => {
    loadData();
  };

  return { data, loading, error, refreshData };
};