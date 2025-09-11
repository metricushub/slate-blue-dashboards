import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDataSource } from "@/hooks/useDataSource";
import { SheetsConfig } from "@/lib/data-source";
import { toast } from "@/hooks/use-toast";
import { Settings, Database, FileSpreadsheet, CheckCircle } from "lucide-react";

const SettingsPage = () => {
  const { sourceType, switchToMock, switchToSheets } = useDataSource();
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig>({
    clientsUrl: '',
    campaignsUrl: '',
    metricsUrl: '',
  });

  const handleSheetsConfigSave = () => {
    if (!sheetsConfig.clientsUrl || !sheetsConfig.campaignsUrl || !sheetsConfig.metricsUrl) {
      toast({
        title: "Erro",
        description: "Todos os campos de URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      switchToSheets(sheetsConfig);
      toast({
        title: "Sucesso",
        description: "Configuração do Google Sheets salva",
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Falha ao salvar configuração",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      {/* Data Source Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Fonte de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span>Fonte atual:</span>
            <Badge variant={sourceType === 'mock' ? 'secondary' : 'default'}>
              {sourceType === 'mock' ? 'Mock (Dados de teste)' : 'Google Sheets'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={sourceType === 'mock' ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4" />
                  <h3 className="font-semibold">Mock Adapter</h3>
                  {sourceType === 'mock' && <CheckCircle className="h-4 w-4 text-success" />}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Usa dados de exemplo gerados automaticamente. Ideal para testes e desenvolvimento.
                </p>
                <Button 
                  onClick={switchToMock} 
                  variant={sourceType === 'mock' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                >
                  {sourceType === 'mock' ? 'Em uso' : 'Usar Mock'}
                </Button>
              </CardContent>
            </Card>

            <Card className={sourceType === 'sheets' ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <h3 className="font-semibold">Google Sheets</h3>
                  {sourceType === 'sheets' && <CheckCircle className="h-4 w-4 text-success" />}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Conecta com planilhas do Google Sheets via URLs públicas de CSV.
                </p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="clients-url" className="text-xs">URL Clientes</Label>
                    <Input
                      id="clients-url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetsConfig.clientsUrl}
                      onChange={(e) => setSheetsConfig(prev => ({...prev, clientsUrl: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaigns-url" className="text-xs">URL Campanhas</Label>
                    <Input
                      id="campaigns-url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetsConfig.campaignsUrl}
                      onChange={(e) => setSheetsConfig(prev => ({...prev, campaignsUrl: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metrics-url" className="text-xs">URL Métricas</Label>
                    <Input
                      id="metrics-url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetsConfig.metricsUrl}
                      onChange={(e) => setSheetsConfig(prev => ({...prev, metricsUrl: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                  <Button onClick={handleSheetsConfigSave} size="sm" className="w-full">
                    Salvar e Usar Sheets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* CSV Format Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Formato das Planilhas CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Clientes (clients.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              id,name,status,stage,owner,last_update,logo_url,monthly_budget,budget_spent_month,goals_leads,goals_cpa,goals_roas,latest_leads,latest_cpa,latest_roas,ga4_last_event_at,tags
            </code>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Campanhas (campaigns.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              id,client_id,platform,name,status,spend,leads,cpa,roas
            </code>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Métricas Diárias (daily_metrics.csv)</h4>
            <code className="text-xs bg-muted p-2 rounded block">
              date,client_id,platform,campaign_id,impressions,clicks,spend,leads,revenue
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;