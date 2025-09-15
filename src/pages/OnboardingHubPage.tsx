import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingOverview } from '@/components/onboarding/OnboardingOverview';
import { OnboardingTemplatesManager } from '@/components/onboarding/OnboardingTemplatesManager';
import { ClipboardCheck, Users, Settings } from 'lucide-react';

export default function OnboardingHubPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Hub de Onboarding</h1>
          <p className="text-muted-foreground">
            Gerencie templates e acompanhe o progresso dos clientes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <OnboardingOverview />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <OnboardingTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}