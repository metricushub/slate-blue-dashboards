import { GoogleAdsIntegration } from "@/components/integrations/GoogleAdsIntegration";

const ConfigDadosGoogleAds = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Configurações de Dados - Google Ads</h1>
        <p className="text-muted-foreground">
          Configure a integração com Google Ads para este cliente. Conecte sua conta, 
          sincronize campanhas e configure a ingestão automática de métricas.
        </p>
      </div>
      
      <GoogleAdsIntegration />
    </div>
  );
};

export default ConfigDadosGoogleAds;