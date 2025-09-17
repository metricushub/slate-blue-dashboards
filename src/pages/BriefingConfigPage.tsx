import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, Info } from 'lucide-react';
import { BriefingTemplateManager } from '@/components/briefing/BriefingTemplateManager';

export function BriefingConfigPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuração de Briefing</h1>
            <p className="text-muted-foreground">
              Gerencie templates de briefing personalizados para diferentes tipos de clientes
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-primary/10 rounded">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">1. Crie Templates</h4>
                <p className="text-muted-foreground">
                  Configure formulários com campos personalizados para diferentes tipos de briefing
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 bg-primary/10 rounded">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">2. Configure Campos</h4>
                <p className="text-muted-foreground">
                  Adicione diferentes tipos de campos: texto, seleção, data, número, etc.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 bg-primary/10 rounded">
                <div className="h-4 w-4 bg-primary rounded-full" />
              </div>
              <div>
                <h4 className="font-medium">3. Use no Onboarding</h4>
                <p className="text-muted-foreground">
                  Os templates aparecerão automaticamente no processo de onboarding dos clientes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Manager */}
      <BriefingTemplateManager />
    </div>
  );
}