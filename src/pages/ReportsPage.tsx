import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportScheduler } from '@/components/reports/ReportScheduler';
import { SharedReports } from '@/components/reports/SharedReports';
import { WhatsAppIntegration } from '@/components/reports/WhatsAppIntegration';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Sistema de Relatórios</h1>
        <p className="text-muted-foreground">
          Painel global de relatórios, templates e automação para todos os clientes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="builder">Criar Relatório</TabsTrigger>
          <TabsTrigger value="scheduler">Automação</TabsTrigger>
          <TabsTrigger value="shared">Compartilhados</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ReportsDashboard />
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <ReportBuilder />
        </TabsContent>

        <TabsContent value="scheduler" className="mt-6">
          <ReportScheduler />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <SharedReports />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;