import React from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingKanban } from '@/components/onboarding/OnboardingKanban';

export default function OnboardingClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  
  return <OnboardingKanban clientId={clientId} />;
}