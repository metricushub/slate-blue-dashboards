import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { Client } from '@/types';

interface ClientHeaderProps {
  client: Client;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
      <Link to="/clientes">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </Link>
      
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {client.logoUrl ? (
            <AvatarImage src={client.logoUrl} alt={`Logo de ${client.name}`} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getClientInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <Link 
            to={`/cliente/${client.id}`}
            className="text-lg font-semibold hover:text-primary transition-colors"
          >
            {client.name}
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{client.owner}</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-sm text-xs ${
              client.status === 'Ativo' || client.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : client.status === 'onboarding'
                ? 'bg-blue-100 text-blue-800'  
                : 'bg-gray-100 text-gray-800'
            }`}>
              {client.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}