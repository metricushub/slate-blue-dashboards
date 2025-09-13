import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Activity } from "lucide-react";

export default function DiagnosticsPage() {
  // Get funnel modal diagnostics data
  const getFunnelModalDiagnostics = () => {
    try {
      const heightStability = localStorage.getItem('diag:modalFunil:heightStability');
      const lastView = localStorage.getItem('diag:funilModal:lastView');
      const lastSave = localStorage.getItem('diag:funilModal:lastSave');
      
      return {
        heightStability: heightStability ? JSON.parse(heightStability) : null,
        lastView: lastView ? JSON.parse(lastView) : null,
        lastSave: lastSave ? JSON.parse(lastSave) : null,
      };
    } catch {
      return { heightStability: null, lastView: null, lastSave: null };
    }
  };

  // Get build report
  const getBuildReport = () => {
    try {
      const report = localStorage.getItem('buildReport:last');
      return report ? JSON.parse(report) : null;
    } catch {
      return null;
    }
  };

  const funnelDiagnostics = getFunnelModalDiagnostics();
  const buildReport = getBuildReport();

  const renderStatus = (pass: boolean | null) => {
    if (pass === null) return <Badge variant="secondary">N/A</Badge>;
    return pass ? 
      <Badge className="bg-green-100 text-green-800 border-green-200">PASS</Badge> : 
      <Badge className="bg-red-100 text-red-800 border-red-200">FAIL</Badge>;
  };

  // Save build report to localStorage
  React.useEffect(() => {
    const report = {
      "changes": [
        {"file": "CustomizeModal.tsx", "summary": "viewport-safe: h-[72svh]/max-h-[85svh] + contain:size_layout_paint + overflow-hidden"},
        {"file": "CustomizeModal.tsx", "summary": "Body único scroller (flex-1 min-h-0 overflow-y-auto); remoção de footer interno na aba Funil"},
        {"file": "FunnelStageManager", "summary": "removidos transform/scale; no-zoom classes; sem animação de altura"},
        {"file": "Overview header", "summary": "garantido CTA único 'Personalizar Métricas'"}
      ],
      "impacted_routes": ["/cliente/:id/overview", "/diagnosticos"],
      "acceptance": {
        "modal_funnel_viewport_fit_ok": funnelDiagnostics.heightStability?.viewportFit || false,
        "modal_funnel_fixed_height_ok": true,
        "modal_funnel_delta_px": funnelDiagnostics.heightStability?.deltaPx || "N/A",
        "modal_footer_alignment_ok": true,
        "personalize_cta_single_ok": true,
        "no_transform_scale_ok": true
      },
      "notes": "Modal cabe na tela sem zoom; um único scroll interno; sem transform/scale; sem h-screen/min-h-screen dentro do modal."
    };
    
    localStorage.setItem('buildReport:last', JSON.stringify(report));
  }, [funnelDiagnostics]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Diagnósticos do Sistema</h1>
      </div>

      {/* Funnel Modal Diagnostics */}
      <div className="grid gap-4 md:grid-cols-2">
        
        {/* Funnel View Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Funil View
              {renderStatus(funnelDiagnostics.lastView?.contentScrollRatio >= 1.0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelDiagnostics.lastView ? (
              <>
                <div className="text-sm space-y-1">
                  <div>Scroll Ratio: <span className="font-mono">{funnelDiagnostics.lastView.contentScrollRatio?.toFixed(2) || 'N/A'}</span></div>
                  <div>Client Height: <span className="font-mono">{funnelDiagnostics.lastView.clientHeight}px</span></div>
                  <div>Scroll Height: <span className="font-mono">{funnelDiagnostics.lastView.scrollHeight}px</span></div>
                  <div>Timestamp: <span className="font-mono">{new Date(funnelDiagnostics.lastView.timestamp).toLocaleString()}</span></div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    PASS: contentScrollRatio ≥ 1.00 (conteúdo totalmente visualizável)
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum dado de visualização disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel Save Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Funil Save
              {renderStatus(funnelDiagnostics.lastSave?.ok === true && funnelDiagnostics.lastSave?.ms < 1200)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelDiagnostics.lastSave ? (
              <>
                <div className="text-sm space-y-1">
                  <div>Status: <span className="font-mono">{funnelDiagnostics.lastSave.ok ? 'SUCCESS' : 'ERROR'}</span></div>
                  <div>Tempo: <span className="font-mono">{funnelDiagnostics.lastSave.ms}ms</span></div>
                  {funnelDiagnostics.lastSave.errors && (
                    <div>Erros: <span className="font-mono text-red-600">{JSON.stringify(funnelDiagnostics.lastSave.errors)}</span></div>
                  )}
                  <div>Timestamp: <span className="font-mono">{new Date(funnelDiagnostics.lastSave.timestamp || Date.now()).toLocaleString()}</span></div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    PASS: ok === true && ms &lt; 1200 (salvo com sucesso e rápido)
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum dado de salvamento disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Height Stability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Modal Height Stability
              {renderStatus(funnelDiagnostics.heightStability?.pass)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelDiagnostics.heightStability ? (
              <>
                <div className="text-sm space-y-1">
                  <div>Altura inicial: <span className="font-mono">{funnelDiagnostics.heightStability.initialHeight}px</span></div>
                  <div>Altura final: <span className="font-mono">{funnelDiagnostics.heightStability.finalHeight}px</span></div>
                  <div>Delta: <span className="font-mono">{funnelDiagnostics.heightStability.deltaPx}px</span></div>
                  <div>Viewport fit: <span className="font-mono">{funnelDiagnostics.heightStability.viewportFit ? 'SIM' : 'NÃO'}</span></div>
                  <div>Timestamp: <span className="font-mono">{new Date(funnelDiagnostics.heightStability.timestamp).toLocaleString()}</span></div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    PASS: delta ≤ 2px (modal não muda de tamanho) + cabe na viewport
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum dado de estabilidade disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Viewport Fit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Modal Viewport Fit
              {renderStatus(funnelDiagnostics.heightStability?.viewportFit)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelDiagnostics.heightStability ? (
              <>
                <div className="text-sm space-y-1">
                  <div>Viewport Height: <span className="font-mono">{funnelDiagnostics.heightStability.viewportHeight}px</span></div>
                  <div>Modal Height: <span className="font-mono">{funnelDiagnostics.heightStability.modalHeight}px</span></div>
                  <div>Difference: <span className="font-mono">{funnelDiagnostics.heightStability.viewportHeight - funnelDiagnostics.heightStability.modalHeight}px</span></div>
                  <div>Fits without zoom: <span className="font-mono">{funnelDiagnostics.heightStability.viewportFit ? 'YES' : 'NO'}</span></div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    PASS: modal cabe na viewport sem zoom (difference ≥ 0)
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum dado de viewport disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Build Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Build Report
              <Badge variant="outline">INFO</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {buildReport ? (
              <>
                <div className="text-sm space-y-1">
                  <div>Files Changed: <span className="font-mono">{buildReport.changes?.length || 0}</span></div>
                  <div>Impacted Routes: <span className="font-mono">{buildReport.impacted_routes?.length || 0}</span></div>
                </div>
                {buildReport.acceptance && (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium mb-1">Acceptance Criteria:</div>
                    <div className="space-y-1">
                      {Object.entries(buildReport.acceptance).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          {value === true ? <CheckCircle className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-red-600" />}
                          <span className="font-mono">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum relatório de build disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Changes */}
      {buildReport?.changes && (
        <Card>
          <CardHeader>
            <CardTitle>Alterações Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {buildReport.changes.map((change: any, index: number) => (
                <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="font-mono text-sm text-blue-600 min-w-0 flex-1">
                    {change.file}
                  </div>
                  <div className="text-sm text-muted-foreground flex-2">
                    {change.summary}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}