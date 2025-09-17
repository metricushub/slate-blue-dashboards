import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalsDashboard } from '@/components/goals/GoalsDashboard';
import { GoalsManager } from '@/components/goals/GoalsManager';
import { GoalTemplates } from '@/components/goals/GoalTemplates';
import { GoalAlerts } from '@/components/goals/GoalAlerts';
import { GoalAnalytics } from '@/components/goals/GoalAnalytics';

const ObjetivosClienteWip = () => {
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Objetivos e Metas KPI</h1>
        <p className="text-muted-foreground">
          Configure metas, acompanhe progresso e receba alertas automáticos de performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="manager">Gerenciar</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <GoalsDashboard clientId={clientId} onCreateGoal={() => setActiveTab('manager')} />
        </TabsContent>

        <TabsContent value="manager" className="mt-6">
          <GoalsManager clientId={clientId} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <GoalTemplates clientId={clientId} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <GoalAlerts clientId={clientId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <GoalAnalytics clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObjetivosClienteWip;