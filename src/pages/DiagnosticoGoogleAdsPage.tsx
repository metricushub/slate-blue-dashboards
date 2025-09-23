import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink } from "lucide-react";

interface TestResult {
  loading: boolean;
  data: any | null;
  error: string | null;
}

const DiagnosticoGoogleAdsPage = () => {
  const [functionsHost, setFunctionsHost] = useState("https://zoahzxfjefjmkxylbfxf.functions.supabase.co");
  
  const [selftest, setSelftest] = useState<TestResult>({ loading: false, data: null, error: null });
  const [ping, setPing] = useState<TestResult>({ loading: false, data: null, error: null });
  const [syncAccounts, setSyncAccounts] = useState<TestResult>({ loading: false, data: null, error: null });
  const [listAccounts, setListAccounts] = useState<TestResult>({ loading: false, data: null, error: null });

  const executeTest = async (
    endpoint: string, 
    setter: React.Dispatch<React.SetStateAction<TestResult>>
  ) => {
    setter({ loading: true, data: null, error: null });
    
    try {
      const response = await fetch(`${functionsHost}${endpoint}`);
      const text = await response.text();
      
      if (response.ok) {
        try {
          const json = JSON.parse(text);
          setter({ loading: false, data: json, error: null });
        } catch {
          setter({ loading: false, data: text, error: null });
        }
      } else {
        setter({ loading: false, data: null, error: `Status ${response.status}: ${text}` });
      }
    } catch (error) {
      setter({ loading: false, data: null, error: `Erro de rede: ${error}` });
    }
  };

  const ResultDisplay = ({ result }: { result: TestResult }) => {
    if (result.loading) {
      return (
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-medium text-destructive">Erro:</p>
          <pre className="text-sm font-mono mt-2 text-destructive whitespace-pre-wrap">
            {result.error}
          </pre>
        </div>
      );
    }

    if (result.data) {
      return (
        <div className="p-4 bg-muted/50 rounded-md">
          <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
            {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="p-4 bg-muted/20 rounded-md">
        <span className="text-sm text-muted-foreground">Nenhum resultado ainda</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico Google Ads</h1>
        <p className="text-muted-foreground mt-2">
          Teste a integração com Google Ads e diagnostique problemas
        </p>
      </div>

      {/* Dica importante */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-sm text-amber-800">
          💡 <strong>Dica:</strong> Se você ver "Missing authorization header", você está usando /supabase.co/functions/v1. 
          Use o host com .functions. que está no campo acima.
        </p>
      </div>

      {/* Functions Host Input */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Configure o host das Edge Functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="functions-host">Functions Host</Label>
              <Input
                id="functions-host"
                value={functionsHost}
                onChange={(e) => setFunctionsHost(e.target.value)}
                placeholder="https://zoahzxfjefjmkxylbfxf.functions.supabase.co"
              />
            </div>
            <Button asChild>
              <a
                href={`${functionsHost}/google-oauth/start?next=/diagnostico-google-ads`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Conectar Google Ads
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1 - Selftest */}
        <Card>
          <CardHeader>
            <CardTitle>Selftest</CardTitle>
            <CardDescription>Verifica configuração dos secrets e ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => executeTest('/google-ads-ping?selftest=1', setSelftest)}
              disabled={selftest.loading}
              className="w-full"
            >
              {selftest.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                "Rodar selftest"
              )}
            </Button>
            <ResultDisplay result={selftest} />
          </CardContent>
        </Card>

        {/* Card 2 - Ping real */}
        <Card>
          <CardHeader>
            <CardTitle>Ping real</CardTitle>
            <CardDescription>Testa a conexão real com Google Ads API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => executeTest('/google-ads-ping', setPing)}
              disabled={ping.loading}
              className="w-full"
            >
              {ping.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                "Ping Google Ads"
              )}
            </Button>
            <ResultDisplay result={ping} />
          </CardContent>
        </Card>

        {/* Card 3 - Sincronizar contas */}
        <Card>
          <CardHeader>
            <CardTitle>Sincronizar contas</CardTitle>
            <CardDescription>Busca e salva todas as contas Google Ads disponíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => executeTest('/google-ads-sync-accounts', setSyncAccounts)}
              disabled={syncAccounts.loading}
              className="w-full"
            >
              {syncAccounts.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                "Sincronizar contas (upsert)"
              )}
            </Button>
            <ResultDisplay result={syncAccounts} />
          </CardContent>
        </Card>

        {/* Card 4 - Listar contas salvas */}
        <Card>
          <CardHeader>
            <CardTitle>Listar contas salvas</CardTitle>
            <CardDescription>Mostra as contas Google Ads já salvas no banco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => executeTest('/google-ads-accounts', setListAccounts)}
              disabled={listAccounts.loading}
              className="w-full"
            >
              {listAccounts.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                "Listar contas"
              )}
            </Button>
            <ResultDisplay result={listAccounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagnosticoGoogleAdsPage;