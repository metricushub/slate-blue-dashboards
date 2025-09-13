import { useState, useEffect, useCallback } from 'react';
import { MetricKey, DEFAULT_SELECTED_METRICS } from '@/shared/types/metrics';

export interface FunnelStagePrefs {
  id: string;
  label: string;
  metric: string;
  userLabel?: boolean;
}

export interface ClientPrefs {
  clientId: string;
  selectedMetrics: MetricKey[];
  funnelPrefs: {
    stages: FunnelStagePrefs[];
    mode: 'Detalhado' | 'Compacto';
    showRates: boolean;
    comparePrevious: boolean;
    colorByStage: boolean;
  };
  campaignTableCols: {
    [key: string]: boolean; // column visibility
  };
  lastUpdated: string;
}

const DEFAULT_FUNNEL_STAGES: FunnelStagePrefs[] = [
  { id: 'stage-1', label: 'Impressões', metric: 'impressions' },
  { id: 'stage-2', label: 'Cliques', metric: 'clicks' },
  { id: 'stage-3', label: 'Leads', metric: 'leads' }
];

const DEFAULT_TABLE_COLS = {
  campaign: true,
  status: true,
  impressions: true,
  clicks: true,
  ctr: false,
  spend: true,
  cpl: true,
  leads: false,
  roas: false
};

const getDefaultPrefs = (clientId: string): ClientPrefs => ({
  clientId,
  selectedMetrics: DEFAULT_SELECTED_METRICS.slice(0, 3), // Max 3 for chart
  funnelPrefs: {
    stages: DEFAULT_FUNNEL_STAGES,
    mode: 'Detalhado',
    showRates: true,
    comparePrevious: false,
    colorByStage: true
  },
  campaignTableCols: DEFAULT_TABLE_COLS,
  lastUpdated: new Date().toISOString()
});

export function useClientPrefs(clientId: string) {
  const [prefs, setPrefs] = useState<ClientPrefs>(() => getDefaultPrefs(clientId));
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem(`clientPrefs:${clientId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate limits
          parsed.selectedMetrics = (parsed.selectedMetrics || DEFAULT_SELECTED_METRICS).slice(0, 3);
          parsed.funnelPrefs = parsed.funnelPrefs || getDefaultPrefs(clientId).funnelPrefs;
          parsed.funnelPrefs.stages = (parsed.funnelPrefs.stages || DEFAULT_FUNNEL_STAGES).slice(0, 8);
          if (parsed.funnelPrefs.stages.length < 2) {
            parsed.funnelPrefs.stages = DEFAULT_FUNNEL_STAGES.slice(0, 2);
          }
          parsed.campaignTableCols = parsed.campaignTableCols || DEFAULT_TABLE_COLS;
          setPrefs(parsed);
        } else {
          setPrefs(getDefaultPrefs(clientId));
        }
      } catch (error) {
        console.warn('Failed to load client prefs:', error);
        setPrefs(getDefaultPrefs(clientId));
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [clientId]);

  // Get current preferences
  const get = useCallback(() => prefs, [prefs]);

  // Patch preferences (partial update)
  const patch = useCallback((updates: Partial<ClientPrefs>) => {
    setPrefs(prev => {
      const newPrefs = { ...prev, ...updates, lastUpdated: new Date().toISOString() };
      
      // Apply limits
      if (updates.selectedMetrics) {
        newPrefs.selectedMetrics = updates.selectedMetrics.slice(0, 3);
      }
      
      if (updates.funnelPrefs?.stages) {
        const stages = updates.funnelPrefs.stages.slice(0, 8);
        if (stages.length < 2) {
          // Don't allow less than 2 stages
          return prev;
        }
        newPrefs.funnelPrefs = { ...prev.funnelPrefs, ...updates.funnelPrefs, stages };
      } else if (updates.funnelPrefs) {
        newPrefs.funnelPrefs = { ...prev.funnelPrefs, ...updates.funnelPrefs };
      }
      
      setIsDirty(true);

      // Broadcast update so other hook instances react immediately (same tab)
      try {
        window.dispatchEvent(
          new CustomEvent('clientPrefs:update', {
            detail: { clientId: newPrefs.clientId, prefs: newPrefs }
          })
        );
      } catch (e) {
        // noop
      }

      return newPrefs;
    });
  }, []);

  // Save to localStorage
  const save = useCallback(async () => {
    try {
      localStorage.setItem(`clientPrefs:${clientId}`, JSON.stringify(prefs));
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Failed to save client prefs:', error);
      return false;
    }
  }, [clientId, prefs]);

  // Auto-save when dirty
  useEffect(() => {
    if (isDirty && !isLoading) {
      const timeoutId = setTimeout(save, 1000); // Auto-save after 1s
      return () => clearTimeout(timeoutId);
    }
  }, [isDirty, isLoading, save]);

  // Cross-component sync: listen for broadcasted updates and storage changes
  useEffect(() => {
    const onPrefsUpdate = (e: Event) => {
      const ce = e as CustomEvent<any>;
      const detail = (ce as any).detail;
      if (detail?.clientId === clientId) {
        setPrefs(detail.prefs);
        setIsDirty(false);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === `clientPrefs:${clientId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPrefs(parsed);
          setIsDirty(false);
        } catch {}
      }
    };

    window.addEventListener('clientPrefs:update', onPrefsUpdate as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('clientPrefs:update', onPrefsUpdate as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [clientId]);

  return {
    prefs,
    isLoading,
    isDirty,
    get,
    patch,
    save
  };
}