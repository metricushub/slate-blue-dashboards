import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemplateEditor } from './TemplateEditor';
import { Layout } from 'lucide-react';

export function OnboardingTemplatesManager() {
  const [showEditor, setShowEditor] = useState(false);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditor) {
        setShowEditor(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditor]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Gerenciamento de Templates</h2>
            <p className="text-sm text-muted-foreground">
              Crie, edite e organize templates de onboarding para seus clientes
            </p>
          </div>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          Gerenciar Templates
        </Button>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditor
        open={showEditor}
        onOpenChange={(open) => {
          setShowEditor(open);
          // Handle backdrop click and ESC key via the Dialog component
        }}
      />
      
      {/* Placeholder content */}
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Clique em "Gerenciar Templates" para criar e editar templates</p>
        </CardContent>
      </Card>
    </div>
  );
}