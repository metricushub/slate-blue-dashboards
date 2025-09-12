import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Download,
  Sun,
  Globe
} from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { toast } from "@/hooks/use-toast";

export function SettingsPage() {
  const { dataSource, sourceType, refreshCache } = useDataSource();

  const handleClearCache = async () => {
    try {
      await refreshCache();
      localStorage.clear();
      toast({
        title: "Cache limpo",
        description: "Todos os dados em cache foram removidos.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    const data = {
      metrics: localStorage.getItem('selected_metrics'),
      filters: localStorage.getItem('client_filters'),
      optimizations: Object.keys(localStorage).filter(key => key.startsWith('optimizations_')).map(key => ({
        key,
        data: localStorage.getItem(key)
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Backup exportado",
      description: "Os dados foram exportados com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema
        </p>
      </div>

      {/* Data Source Info */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary-light rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            Fonte de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {sourceType === 'sheets' ? 'Google Sheets' : 'Dados Mock'}
              </p>
              <p className="text-sm text-muted-foreground">
                {sourceType === 'sheets' 
                  ? 'Dados carregados automaticamente do Google Sheets'
                  : 'Dados de demonstração para desenvolvimento'
                }
              </p>
            </div>
            <Badge variant={sourceType === 'sheets' ? 'default' : 'secondary'}>
              {sourceType === 'sheets' ? 'Produção' : 'Desenvolvimento'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-warning-light rounded-lg">
              <RefreshCw className="w-5 h-5 text-warning" />
            </div>
            Gerenciamento de Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cache de Dados</p>
              <p className="text-sm text-muted-foreground">
                Limpar todos os dados armazenados localmente
              </p>
            </div>
            <Button variant="outline" onClick={handleClearCache}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Cache
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Backup de Dados</p>
              <p className="text-sm text-muted-foreground">
                Exportar configurações e otimizações salvas
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-secondary-light rounded-lg">
              <Sun className="w-5 h-5 text-secondary" />
            </div>
            Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">
                Alterar entre tema claro e escuro
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Sun className="w-4 h-4 mr-2" />
              Claro
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Idioma</p>
              <p className="text-sm text-muted-foreground">
                Alterar idioma da interface
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Português (BR)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}