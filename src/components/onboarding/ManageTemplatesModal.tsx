import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplateEditor } from './TemplateEditor';
import { Settings } from 'lucide-react';

interface ManageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTemplatesModal({ open, onOpenChange }: ManageTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Templates
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <TemplateEditor
            open={open}
            onOpenChange={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}