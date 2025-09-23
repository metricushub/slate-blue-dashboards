import { GoogleAdsIntegration } from "@/components/integrations/GoogleAdsIntegration";
import { ClientGoogleAdsLinker } from "@/components/integrations/ClientGoogleAdsLinker";
import { useParams } from "react-router-dom";

const ConfigDadosGoogleAds = () => {
  const { id: clientId } = useParams();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Configurações de Dados - Google Ads</h1>
        <p className="text-muted-foreground">
          Conecte sua conta geral do Google Ads, sincronize as contas acessíveis e vincule uma conta específica a este cliente.
        </p>
      </div>
      
      <GoogleAdsIntegration />

      {clientId && (
        <ClientGoogleAdsLinker clientId={clientId} />
      )}
    </div>
  );
};

export default ConfigDadosGoogleAds;