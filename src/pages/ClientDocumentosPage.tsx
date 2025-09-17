import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Link, Trash2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url?: string;
}

interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  addedDate: string;
}

export default function ClientDocumentosPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '', category: '' });

  // Carregar documentos salvos do localStorage
  useEffect(() => {
    const savedDocs = localStorage.getItem(`client-docs-${clientId}`);
    const savedLinks = localStorage.getItem(`client-links-${clientId}`);
    
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    }
  }, [clientId]);

  // Salvar no localStorage
  const saveDocuments = (newDocs: DocumentFile[]) => {
    localStorage.setItem(`client-docs-${clientId}`, JSON.stringify(newDocs));
    setDocuments(newDocs);
  };

  const saveLinks = (newLinks: UsefulLink[]) => {
    localStorage.setItem(`client-links-${clientId}`, JSON.stringify(newLinks));
    setLinks(newLinks);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const newDoc: DocumentFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        url: fileUrl
      };

      const updatedDocs = [...documents, newDoc];
      saveDocuments(updatedDocs);
    });

    toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    setShowUploadDialog(false);
  };

  const handleAddLink = () => {
    if (!newLink.title || !newLink.url) {
      toast.error('Título e URL são obrigatórios');
      return;
    }

    const link: UsefulLink = {
      id: crypto.randomUUID(),
      title: newLink.title,
      url: newLink.url,
      description: newLink.description,
      category: newLink.category || 'Geral',
      addedDate: new Date().toISOString()
    };

    const updatedLinks = [...links, link];
    saveLinks(updatedLinks);
    setNewLink({ title: '', url: '', description: '', category: '' });
    setShowLinkDialog(false);
    toast.success('Link adicionado com sucesso!');
  };

  const removeDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    saveDocuments(updatedDocs);
    toast.success('Documento removido');
  };

  const removeLink = (id: string) => {
    const updatedLinks = links.filter(link => link.id !== id);
    saveLinks(updatedLinks);
    toast.success('Link removido');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documentos do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie documentos e anexos do cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos e Anexos
              </div>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Documentos</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Selecionar Arquivos</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento enviado ainda</p>
                <p className="text-sm">Clique em "Upload" para enviar arquivos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Links Úteis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                Links Úteis
              </div>
              <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Link className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Link Útil</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="link-title">Título *</Label>
                      <Input
                        id="link-title"
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        placeholder="Ex: Painel Google Ads"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-url">URL *</Label>
                      <Input
                        id="link-url"
                        type="url"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="https://exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-category">Categoria</Label>
                      <Input
                        id="link-category"
                        value={newLink.category}
                        onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                        placeholder="Ex: Google Ads, Analytics, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-description">Descrição</Label>
                      <Textarea
                        id="link-description"
                        value={newLink.description}
                        onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                        placeholder="Descrição opcional do link"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddLink} className="w-full">
                      Adicionar Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{link.title}</h4>
                          {link.category && (
                            <Badge variant="secondary" className="text-xs">
                              {link.category}
                            </Badge>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-xs text-muted-foreground mb-2">{link.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          {link.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link adicionado ainda</p>
                <p className="text-sm">Clique em "Adicionar" para criar links úteis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}