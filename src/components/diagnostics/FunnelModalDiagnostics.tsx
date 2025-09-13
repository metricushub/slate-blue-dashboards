import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewDiagnostics {
  contentScrollRatio: number;
  clientHeight: number;
  scrollHeight: number;
  timestamp: number;
}

interface SaveDiagnostics {
  ok: boolean;
  ms: number;
  timestamp: number;
  clientId?: string;
  error?: string;
}

export function FunnelModalDiagnostics() {
  const [viewDiag, setViewDiag] = useState<ViewDiagnostics | null>(null);
  const [saveDiag, setSaveDiag] = useState<SaveDiagnostics | null>(null);

  useEffect(() => {
    // Load view diagnostics
    try {
      const viewData = localStorage.getItem('diag:funilModal:lastView');
      if (viewData) {
        setViewDiag(JSON.parse(viewData));
      }
    } catch (error) {
      console.warn('Failed to parse view diagnostics:', error);
    }

    // Load save diagnostics
    try {
      const saveData = localStorage.getItem('diag:funilModal:lastSave');
      if (saveData) {
        setSaveDiag(JSON.parse(saveData));
      }
    } catch (error) {
      console.warn('Failed to parse save diagnostics:', error);
    }
  }, []);

  const getViewStatus = (): 'PASS' | 'FAIL' | 'NO_DATA' => {
    if (!viewDiag) return 'NO_DATA';
    
    // PASS if content scroll ratio >= 1.00 (content is fully scrollable)
    // and there are no hidden overflows
    return viewDiag.contentScrollRatio >= 1.00 ? 'PASS' : 'FAIL';
  };

  const getSaveStatus = (): 'PASS' | 'FAIL' | 'NO_DATA' => {
    if (!saveDiag) return 'NO_DATA';
    
    // PASS if save was successful and took less than 1200ms
    return saveDiag.ok && saveDiag.ms < 1200 ? 'PASS' : 'FAIL';
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: 'PASS' | 'FAIL' | 'NO_DATA') => {
    const variants = {
      PASS: 'default',
      FAIL: 'destructive',
      NO_DATA: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Funil View Diagnostics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            Funil View
            {getStatusBadge(getViewStatus())}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {viewDiag ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Content Scroll Ratio</div>
                <div className="font-mono font-medium">
                  {viewDiag.contentScrollRatio.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Client Height</div>
                <div className="font-mono font-medium">
                  {viewDiag.clientHeight}px
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Scroll Height</div>
                <div className="font-mono font-medium">
                  {viewDiag.scrollHeight}px
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Timestamp</div>
                <div className="font-mono text-xs">
                  {formatTimestamp(viewDiag.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm py-4 text-center">
              Nenhum dado de visualização disponível
            </div>
          )}
          
          <div className="text-xs text-muted-foreground border-t pt-2">
            <strong>Critério:</strong> contentScrollRatio ≥ 1.00 (todo conteúdo acessível por scroll)
          </div>
        </CardContent>
      </Card>

      {/* Funil Save Diagnostics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            Funil Save
            {getStatusBadge(getSaveStatus())}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {saveDiag ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="font-medium">
                  {saveDiag.ok ? '✅ Sucesso' : '❌ Falha'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Tempo (ms)</div>
                <div className="font-mono font-medium">
                  {saveDiag.ms}ms
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Client ID</div>
                <div className="font-mono text-xs">
                  {saveDiag.clientId || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Timestamp</div>
                <div className="font-mono text-xs">
                  {formatTimestamp(saveDiag.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm py-4 text-center">
              Nenhum dado de salvamento disponível
            </div>
          )}
          
          {saveDiag?.error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border-l-2 border-destructive">
              <strong>Erro:</strong> {saveDiag.error}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground border-t pt-2">
            <strong>Critério:</strong> ok === true AND ms &lt; 1200
          </div>
        </CardContent>
      </Card>
    </div>
  );
}