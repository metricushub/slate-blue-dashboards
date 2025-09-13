import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export type FunnelStage = {
  id: string;
  label: string;
  metric: string;
  color?: string;
  userLabel?: boolean;
};

export type FunnelPrefsV2 = {
  mode: 'Detalhado' | 'Compacto';
  showRates: boolean;
  comparePrevious: boolean;
  stages: FunnelStage[];
  colorByStage: boolean;
};

const FunnelStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Rótulo é obrigatório'),
  metric: z.string().min(1, 'Métrica é obrigatória'),
  color: z.string().optional(),
  userLabel: z.boolean().optional(),
});

const FunnelPrefsSchema = z.object({
  mode: z.enum(['Detalhado', 'Compacto']),
  showRates: z.boolean(),
  comparePrevious: z.boolean(),
  colorByStage: z.boolean(),
  stages: z.array(FunnelStageSchema).min(2, 'Mínimo de 2 estágios').max(8, 'Máximo de 8 estágios'),
});

export const defaultFunnelPrefsV2: FunnelPrefsV2 = {
  mode: 'Detalhado',
  showRates: true,
  comparePrevious: false,
  colorByStage: false,
  stages: [
    { id: 'stage1', label: 'Impressões', metric: 'impressions', color: '#64748b', userLabel: false },
    { id: 'stage2', label: 'Cliques', metric: 'clicks', color: '#10b981', userLabel: false },
    { id: 'stage3', label: 'Leads', metric: 'leads', color: '#f59e0b', userLabel: false },
    { id: 'stage4', label: 'Receita', metric: 'revenue', color: '#ef4444', userLabel: false },
  ],
};

export function useFunnelConfig(clientId: string, initialPrefs?: FunnelPrefsV2) {
  const { toast } = useToast();
  const [funnelPrefs, setFunnelPrefs] = useState<FunnelPrefsV2>(
    initialPrefs || defaultFunnelPrefsV2
  );
  const [originalPrefs, setOriginalPrefs] = useState<FunnelPrefsV2>(
    initialPrefs || defaultFunnelPrefsV2
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check if data is dirty
  useEffect(() => {
    const hasChanges = JSON.stringify(funnelPrefs) !== JSON.stringify(originalPrefs);
    setIsDirty(hasChanges);
  }, [funnelPrefs, originalPrefs]);

  const validateStage = useCallback((stage: FunnelStage, index: number): string | null => {
    try {
      FunnelStageSchema.parse(stage);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || `Erro no estágio ${index + 1}`;
      }
      return `Erro no estágio ${index + 1}`;
    }
  }, []);

  const validateAll = useCallback((): boolean => {
    try {
      FunnelPrefsSchema.parse(funnelPrefs);
      
      // Clear any existing errors
      setFieldErrors({});
      setErrorMsg('');
      
      // Validate individual stages
      const newFieldErrors: Record<string, string> = {};
      funnelPrefs.stages.forEach((stage, index) => {
        const error = validateStage(stage, index);
        if (error) {
          newFieldErrors[`stage-${index}`] = error;
        }
      });
      
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return false;
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        setErrorMsg(firstError?.message || 'Erro de validação');
        
        // Set field-specific errors
        const newFieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const fieldPath = err.path.join('.');
            newFieldErrors[fieldPath] = err.message;
          }
        });
        setFieldErrors(newFieldErrors);
      } else {
        setErrorMsg('Erro de validação desconhecido');
      }
      return false;
    }
  }, [funnelPrefs, validateStage]);

  const updatePrefs = useCallback((updates: Partial<FunnelPrefsV2>) => {
    setFunnelPrefs(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStage = useCallback((index: number, updates: Partial<FunnelStage>) => {
    setFunnelPrefs(prev => {
      const newStages = [...prev.stages];
      newStages[index] = { ...newStages[index], ...updates };
      return { ...prev, stages: newStages };
    });
  }, []);

  const addStage = useCallback(() => {
    if (funnelPrefs.stages.length >= 8) return;
    
    const newStageId = `stage${funnelPrefs.stages.length + 1}`;
    const newStage: FunnelStage = {
      id: newStageId,
      label: `Estágio ${funnelPrefs.stages.length + 1}`,
      metric: 'impressions',
      color: '#64748b',
      userLabel: false,
    };
    
    setFunnelPrefs(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
  }, [funnelPrefs.stages.length]);

  const removeStage = useCallback((index: number) => {
    if (funnelPrefs.stages.length <= 2) return;
    
    setFunnelPrefs(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }));
  }, [funnelPrefs.stages.length]);

  const moveStage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setFunnelPrefs(prev => {
      const newStages = [...prev.stages];
      const [movedStage] = newStages.splice(fromIndex, 1);
      newStages.splice(toIndex, 0, movedStage);
      return { ...prev, stages: newStages };
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    setIsSaving(true);
    setErrorMsg('');
    
    try {
      // Validate before saving
      if (!validateAll()) {
        return false;
      }

      // Persist to localStorage
      localStorage.setItem(`client:${clientId}:funnel_prefs@v2`, JSON.stringify(funnelPrefs));
      
      // Also save to quick backup
      localStorage.setItem(`funnelConfig:${clientId}`, JSON.stringify(funnelPrefs));
      
      // Simulate indexedDB save (if Dexie is set up)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const saveTime = Date.now() - startTime;
      
      // Record diagnostics
      localStorage.setItem('diag:funilModal:lastSave', JSON.stringify({
        ok: true,
        ms: saveTime,
        timestamp: Date.now(),
        clientId,
      }));
      
      // Update original to mark as clean
      setOriginalPrefs(funnelPrefs);
      setIsDirty(false);
      
      toast({
        title: "Funil atualizado",
        description: "As configurações foram salvas com sucesso.",
      });
      
      return true;
    } catch (error) {
      const saveTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Record failed save
      localStorage.setItem('diag:funilModal:lastSave', JSON.stringify({
        ok: false,
        ms: saveTime,
        timestamp: Date.now(),
        clientId,
        error: errorMessage,
      }));
      
      setErrorMsg(`Erro ao salvar: ${errorMessage}`);
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [clientId, funnelPrefs, validateAll, toast]);

  const reset = useCallback(() => {
    setFunnelPrefs(originalPrefs);
    setFieldErrors({});
    setErrorMsg('');
    setIsDirty(false);
  }, [originalPrefs]);

  return {
    funnelPrefs,
    isDirty,
    isSaving,
    errorMsg,
    fieldErrors,
    updatePrefs,
    updateStage,
    addStage,
    removeStage,
    moveStage,
    save,
    reset,
    validateAll,
  };
}