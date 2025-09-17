import { useParams } from "react-router-dom";
import { DynamicBriefingForm } from "./DynamicBriefingForm";

export function ClientBriefingPage() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Briefing do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Complete as informações do briefing para personalizar o atendimento
        </p>
      </div>
      <DynamicBriefingForm clientId={clientId || ''} />
    </div>
  );
}