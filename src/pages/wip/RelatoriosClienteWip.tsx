import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportScheduler } from '@/components/reports/ReportScheduler';
import { SharedReports } from '@/components/reports/SharedReports';
import { WhatsAppIntegration } from '@/components/reports/WhatsAppIntegration';

const RelatoriosClienteWip = () => {
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">
          Sistema completo de relatórios com dashboard, automação e compartilhamento
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
          <ReportsDashboard clientId={clientId} />
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <ReportBuilder clientId={clientId} />
        </TabsContent>

        <TabsContent value="scheduler" className="mt-6">
          <ReportScheduler clientId={clientId} />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <SharedReports clientId={clientId} />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppIntegration clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosClienteWip;