import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types';

interface OnboardingHeaderProps {
  client: Client;
  showBackButton?: boolean;
}

export function OnboardingHeader({ client, showBackButton = false }: OnboardingHeaderProps) {
  const navigate = useNavigate();
  
  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'inativo': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'paused': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-4 p-6 border-b bg-background/50">
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Hub
        </Button>
      )}
      
      <Avatar className="h-12 w-12">
        <AvatarImage src={client.logoUrl} alt={client.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getClientInitials(client.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {client.name}
          </h1>
          <Badge variant="secondary" className={getStatusColor(client.status)}>
            {client.status || 'Ativo'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          Responsável: {client.owner || 'Não definido'}
        </p>
      </div>
    </div>
  );
}