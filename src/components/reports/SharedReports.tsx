import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Link, 
  Eye, 
  Download, 
  Calendar, 
  Users, 
  Settings,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Lock,
  Unlock,
  Clock,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedReportsProps {
  clientId?: string;
}

interface SharedReport {
  id: string;
  name: string;
  type: 'link' | 'portal' | 'email';
  url?: string;
  isPublic: boolean;
  password?: string;
  expiresAt?: Date;
  viewCount: number;
  lastViewed?: Date;
  createdAt: Date;
  recipients?: string[];
}

const mockSharedReports: SharedReport[] = [
  {
    id: '1',
    name: 'Relatório Executivo - Dezembro 2024',
    type: 'link',
    url: 'https://reports.metricus.com/share/abc123',
    isPublic: true,
    viewCount: 12,
    lastViewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Performance Mensal - Novembro 2024',
    type: 'portal',
    isPublic: false,
    password: '****',
    viewCount: 8,
    lastViewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Relatório ROI - Q4 2024',
    type: 'email',
    isPublic: false,
    viewCount: 5,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    recipients: ['cliente@empresa.com', 'gestor@empresa.com']
  }
];

export function SharedReports({ clientId }: SharedReportsProps) {
  const [sharedReports, setSharedReports] = useState<SharedReport[]>(mockSharedReports);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [shareConfig, setShareConfig] = useState({
    type: 'link',
    isPublic: true,
    password: '',
    expiresIn: '30',
    allowDownload: true,
    requireLogin: false
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Aqui você pode adicionar um toast de sucesso
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'link': return Link;
      case 'portal': return Users;
      case 'email': return Mail;
      default: return Share2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'link': return 'Link Público';
      case 'portal': return 'Portal Cliente';
      case 'email': return 'Enviado por Email';
      default: return type;
    }
  };

  const revokeAccess = (reportId: string) => {
    setSharedReports(prev => prev.filter(report => report.id !== reportId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios Compartilhados</h2>
          <p className="text-muted-foreground">
            Gerencie links públicos, acessos e visualizações de relatórios
          </p>
        </div>
        
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Compartilhar Relatório</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Selecionar Relatório</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um relatório para compartilhar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Relatório Executivo - Dezembro 2024</SelectItem>
                    <SelectItem value="detailed">Relatório Detalhado - Novembro 2024</SelectItem>
                    <SelectItem value="roi">Análise ROI - Q4 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={shareConfig.type} onValueChange={(value) => 
                setShareConfig(prev => ({ ...prev, type: value }))
              }>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="link">Link Público</TabsTrigger>
                  <TabsTrigger value="portal">Portal Cliente</TabsTrigger>
                  <TabsTrigger value="email">Enviar Email</TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Link público</Label>
                    <Switch
                      checked={shareConfig.isPublic}
                      onCheckedChange={(checked) => 
                        setShareConfig(prev => ({ ...prev, isPublic: checked }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Expira em</Label>
                    <Select 
                      value={shareConfig.expiresIn} 
                      onValueChange={(value) => 
                        setShareConfig(prev => ({ ...prev, expiresIn: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Permitir download</Label>
                    <Switch
                      checked={shareConfig.allowDownload}
                      onCheckedChange={(checked) => 
                        setShareConfig(prev => ({ ...prev, allowDownload: checked }))
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="portal" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Senha de acesso</Label>
                    <Input
                      type="password"
                      value={shareConfig.password}
                      onChange={(e) => 
                        setShareConfig(prev => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Defina uma senha"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Exigir login</Label>
                    <Switch
                      checked={shareConfig.requireLogin}
                      onCheckedChange={(checked) => 
                        setShareConfig(prev => ({ ...prev, requireLogin: checked }))
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Destinatários</Label>
                    <Input placeholder="email1@exemplo.com, email2@exemplo.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mensagem personalizada (opcional)</Label>
                    <Input placeholder="Segue relatório mensal conforme solicitado..." />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  Cancelar
                </Button>
                <Button>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shared Reports List */}
      <div className="space-y-4">
        {sharedReports.map((report) => {
          const TypeIcon = getTypeIcon(report.type);
          
          return (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="h-5 w-5 text-chart-primary" />
                      <h3 className="font-semibold text-foreground">{report.name}</h3>
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                      {report.isPublic ? (
                        <Badge variant="secondary">
                          <Unlock className="mr-1 h-3 w-3" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="mr-1 h-3 w-3" />
                          Privado
                        </Badge>
                      )}
                    </div>

                    {report.url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {report.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(report.url!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {report.viewCount} visualizações
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Criado: {format(report.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                      </div>

                      {report.lastViewed && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Última visualização: {format(report.lastViewed, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}

                      {report.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Expira: {format(report.expiresAt, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    {report.recipients && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Enviado para: {report.recipients.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {report.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={report.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir
                        </a>
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>

                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => revokeAccess(report.id)}
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sharedReports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum relatório compartilhado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece compartilhando relatórios com seus clientes através de links seguros
            </p>
            <Button onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}