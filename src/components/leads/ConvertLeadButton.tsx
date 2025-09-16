import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { ClientCreationWizard } from '@/components/modals/ClientCreationWizard';
import { Lead, Client } from '@/types';
import { useDataSource } from '@/hooks/useDataSource';
import { LeadsStore } from '@/shared/db/leadsStore';
import { toast } from '@/hooks/use-toast';

interface ConvertLeadButtonProps {
  lead: Lead;
  onConversion?: () => void;
}

export function ConvertLeadButton({ lead, onConversion }: ConvertLeadButtonProps) {
  const [showWizard, setShowWizard] = useState(false);
  const { dataSource } = useDataSource();

  const handleConvertLead = async (client: Client) => {
    let clientId: string | null = null;
    let saved = false;
    
    try {
      clientId = client.id;
      
      // Salvar localmente primeiro (IndexedDB) 
      const { ClientsStore } = await import('@/shared/db/clientsStore');
      const localClient = { ...client, createdAt: new Date().toISOString() };
      await ClientsStore.upsertClient(localClient);
      saved = true;

      // Tentar salvar no dataSource também
      if (dataSource?.addClient) {
        try {
          await dataSource.addClient(client);
        } catch (error) {
          console.warn('Erro ao salvar no dataSource, mas cliente salvo localmente:', error);
        }
      }
        
      // Create onboarding automatically
      const { onboardingCardOperations } = await import('@/shared/db/onboardingStore');
      const { createCardFromTemplate, getTemplateByStage } = await import('@/shared/data/onboardingTemplates');
      
      // Create cards for all stages
      const stages = ['dados-gerais', 'financeiro', 'implementacao', 'briefing', 'configuracao'];
      for (const stage of stages) {
        const template = getTemplateByStage(stage);
        if (template) {
          const card = createCardFromTemplate(template, client.id, client.name, client.owner);
          await onboardingCardOperations.create(card);
        }
      }
      
      // Update lead to mark as converted - aguardar commit
      await LeadsStore.updateLead(lead.id, { 
        stage: 'Fechado',
        client_id: client.id 
      });

      // Salvar diagnóstico
      await ClientsStore.saveDiagnostic('onboardingPreCreate:last', {
        clientId,
        saved,
        redirect: `/cliente/${clientId}/onboarding?first=true`
      });
      
      setShowWizard(false);
      onConversion?.();
      
      toast({
        title: "Lead convertido!",
        description: `${lead.name} foi convertido em cliente com sucesso.`,
      });
      
      // Redirect só após tudo salvo
      window.location.href = `/cliente/${client.id}/onboarding?first=true`;
    } catch (error) {
      console.error("Error converting lead:", error);
      
      // Salvar diagnóstico de erro
      if (clientId) {
        const { ClientsStore } = await import('@/shared/db/clientsStore');
        await ClientsStore.saveDiagnostic('onboardingPreCreate:last', {
          clientId,
          saved,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      toast({
        title: "Erro",
        description: "Falha ao converter lead em cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowWizard(true)}
        className="bg-success hover:bg-success/90"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Converter em Cliente
      </Button>
      
      <ClientCreationWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onComplete={handleConvertLead}
        leadData={lead}
      />
    </>
  );
}