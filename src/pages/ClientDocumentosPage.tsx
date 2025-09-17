import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ClientDocumentosPage() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documentos do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie documentos e anexos do cliente
        </p>
      </div>
      
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos e Anexos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Documentos e anexos serão exibidos aqui</p>
            <p className="text-sm">Em breve: upload de arquivos, links úteis e recursos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}