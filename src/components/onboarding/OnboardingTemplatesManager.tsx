import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateEditor } from './TemplateEditor';
import { Settings, Layout } from 'lucide-react';

export function OnboardingTemplatesManager() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Layout className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Gerenciamento de Templates</h2>
          <p className="text-sm text-muted-foreground">
            Crie, edite e organize templates de onboarding para seus clientes
          </p>
        </div>
      </div>

      {/* Template Editor */}
      <Card>
        <CardContent className="p-0">
          <TemplateEditor
            open={true}
            onOpenChange={() => {}} // Always open in this context
          />
        </CardContent>
      </Card>
    </div>
  );
}