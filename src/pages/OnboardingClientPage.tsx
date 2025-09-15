import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { OnboardingKanban } from '@/components/onboarding/OnboardingKanban';
import { OnboardingFicha } from '@/components/onboarding/OnboardingFicha';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OnboardingClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';
  const focusSection = searchParams.get('section');

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    if (value === 'kanban') {
      params.delete('section');
    }
    setSearchParams(params);
  };
  
  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="ficha">Ficha</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="kanban" className="h-full mt-0">
          <OnboardingKanban clientId={clientId} />
        </TabsContent>
        
        <TabsContent value="ficha" className="h-full mt-0">
          <OnboardingFicha clientId={clientId} focusSection={focusSection} />
        </TabsContent>
      </Tabs>
    </div>
  );
}