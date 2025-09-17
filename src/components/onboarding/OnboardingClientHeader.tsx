import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Client } from '@/types';
import { FinanceSummaryWidget } from '@/components/client/FinanceSummaryWidget';

interface OnboardingClientHeaderProps {
  client: Client;
}

export function OnboardingClientHeader({ client }: OnboardingClientHeaderProps) {
  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="border-b bg-card">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/onboarding" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={client.logoUrl} alt={client.name} />
              <AvatarFallback>
                {client.logoUrl ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  getClientInitials(client.name)
                )}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-xl font-semibold">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                Onboarding · {client.owner}
              </p>
            </div>
          </div>
        </div>
        
        <FinanceSummaryWidget clientId={client.id} />
      </div>
    </div>
  );
}