import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ error, onRetry, isRetrying }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Erro no Carregamento</CardTitle>
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
            variant="outline"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Tentando novamente...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}