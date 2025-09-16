import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientNotFoundProps {
  clientId: string;
}

export function ClientNotFound({ clientId }: ClientNotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Cliente não encontrado</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            O cliente com ID <code className="bg-muted px-2 py-1 rounded">{clientId}</code> não foi encontrado.
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique se o cliente existe ou se você tem permissão para acessá-lo.
          </p>
          <Button asChild className="w-full">
            <Link to="/onboarding" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Ir para o Hub de Onboarding
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}