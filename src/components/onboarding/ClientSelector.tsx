import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowRight } from 'lucide-react';
import { Client } from '@/types';

interface ClientSelectorProps {
  clients: Client[];
  onClientSelect: (clientId: string) => void;
  isLoading?: boolean;
}

export function ClientSelector({ clients, onClientSelect, isLoading }: ClientSelectorProps) {
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');

  const handleSelect = () => {
    if (selectedClientId) {
      onClientSelect(selectedClientId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Selecionar Cliente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Escolha um cliente para acessar o onboarding
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={selectedClientId} 
            onValueChange={setSelectedClientId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleSelect} 
            disabled={!selectedClientId || isLoading}
            className="w-full"
          >
            {isLoading ? (
              'Carregando...'
            ) : (
              <>
                Acessar Onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}