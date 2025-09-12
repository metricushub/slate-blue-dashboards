import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Client, ClientContact, ClientAccess, OnboardingItem } from "@/types";

interface EnhancedClientRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Client) => void;
}

export function EnhancedClientRegistrationModal({
  open,
  onOpenChange,
  onSave,
}: EnhancedClientRegistrationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("geral");
  
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    website: "",
    segment: "",
    monthlyBudget: 0,
    budgetMonth: 0,
    budgetSpentMonth: 0,
    status: "onboarding",
    stage: "Onboarding: Setup",
    owner: "",
    lastUpdate: new Date().toISOString().split('T')[0],
    tags: [],
    goalsLeads: 0,
    goalsCPA: 0,
    goalsROAS: 0,
  });

  const [contacts, setContacts] = useState<ClientContact[]>([
    { 
      id: "1", 
      name: "", 
      email: "", 
      phone: "", 
      role: "", 
      isPrimary: true 
    }
  ]);

  const [access, setAccess] = useState<ClientAccess>({
    businessManager: "",
    ga4PropertyId: "",
    gtmContainerId: "",
    searchConsoleUrl: "",
    notes: "",
    hasGA4Access: false,
    hasGoogleAdsAccess: false,
    hasMetaAccess: false
  });

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const client: Client = {
      id: `client-${Date.now()}`,
      name: formData.name,
      website: formData.website,
      segment: formData.segment,
      monthlyBudget: formData.monthlyBudget || 0,
      budgetMonth: formData.monthlyBudget || 0,
      budgetSpentMonth: formData.budgetSpentMonth || 0,
      status: formData.status as Client['status'] || 'onboarding',
      stage: formData.stage as Client['stage'] || 'Onboarding: Setup',
      owner: formData.owner || '',
      lastUpdate: new Date().toISOString().split('T')[0],
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=0D8ABC&color=fff`,
      tags: formData.tags || [],
      contacts,
      access,
      goalsLeads: formData.goalsLeads || 0,
      goalsCPA: formData.goalsCPA || 0,
      goalsROAS: formData.goalsROAS || 0,
      onboarding: [
        {
          id: "1",
          title: "Configurar Google Ads",
          description: "Conectar conta e configurar campanhas iniciais",
          completed: false,
          required: true
        },
        {
          id: "2", 
          title: "Configurar Meta Ads",
          description: "Conectar conta e configurar campanhas do Facebook/Instagram",
          completed: false,
          required: true
        },
        {
          id: "3",
          title: "Instalar Google Analytics", 
          description: "Instalar GA4 e configurar eventos de conversão",
          completed: false,
          required: true
        }
      ]
    };

    onSave(client);
    onOpenChange(false);

    toast({
      title: "Cliente cadastrado",
      description: `${client.name} foi adicionado com sucesso.`,
    });

    // Reset form
    setFormData({
      name: "",
      website: "",
      segment: "",
      monthlyBudget: 0,
      budgetMonth: 0,
      budgetSpentMonth: 0,
      status: "onboarding",
      stage: "Onboarding: Setup",
      owner: "",
      tags: [],
      goalsLeads: 0,
      goalsCPA: 0,
      goalsROAS: 0,
    });
    setContacts([{ id: "1", name: "", email: "", phone: "", role: "", isPrimary: true }]);
    setAccess({
      businessManager: "",
      ga4PropertyId: "",
      gtmContainerId: "",
      searchConsoleUrl: "",
      notes: "",
      hasGA4Access: false,
      hasGoogleAdsAccess: false,
      hasMetaAccess: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
            <TabsTrigger value="metas">Metas/KPIs</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Cliente *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="segment">Segmento</Label>
                <Select
                  value={formData.segment || ""}
                  onValueChange={(value) => setFormData({ ...formData, segment: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="imobiliario">Imobiliário</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner">Responsável</Label>
                <Input
                  id="owner"
                  value={formData.owner || ""}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Nome do gestor de conta"
                />
              </div>

              <div>
                <Label htmlFor="monthlyBudget">Orçamento Mensal (R$)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={formData.monthlyBudget || 0}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  placeholder="5000"
                />
              </div>

              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={formData.stage || "Onboarding: Setup"}
                  onValueChange={(value) => setFormData({ ...formData, stage: value as Client['stage'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prospecção">Prospecção</SelectItem>
                    <SelectItem value="Onboarding: Docs">Onboarding: Docs</SelectItem>
                    <SelectItem value="Onboarding: Setup">Onboarding: Setup</SelectItem>
                    <SelectItem value="Rodando">Rodando</SelectItem>
                    <SelectItem value="Revisão">Revisão</SelectItem>
                    <SelectItem value="Encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contatos" className="space-y-4">
            <div>
              <Label>Contatos do Cliente</Label>
              {contacts.map((contact, index) => (
                <div key={contact.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <Input
                    placeholder="Nome"
                    value={contact.name}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].name = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].email = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                  <Input
                    placeholder="Telefone"
                    value={contact.phone || ""}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].phone = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                  <Input
                    placeholder="Cargo"
                    value={contact.role}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].role = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="acessos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ga4PropertyId">ID da Propriedade GA4</Label>
                <Input
                  id="ga4PropertyId"
                  value={access.ga4PropertyId || ""}
                  onChange={(e) => setAccess({ ...access, ga4PropertyId: e.target.value })}
                  placeholder="123456789"
                />
              </div>

              <div>
                <Label htmlFor="gtmContainerId">ID do Container GTM</Label>
                <Input
                  id="gtmContainerId"
                  value={access.gtmContainerId || ""}
                  onChange={(e) => setAccess({ ...access, gtmContainerId: e.target.value })}
                  placeholder="GTM-XXXXXXX"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goalsLeads">Meta de Leads/Mês</Label>
                <Input
                  id="goalsLeads"
                  type="number"
                  value={formData.goalsLeads || 0}
                  onChange={(e) => setFormData({ ...formData, goalsLeads: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="goalsCPA">CPA Alvo (R$)</Label>
                <Input
                  id="goalsCPA"
                  type="number"
                  value={formData.goalsCPA || 0}
                  onChange={(e) => setFormData({ ...formData, goalsCPA: parseFloat(e.target.value) || 0 })}
                  placeholder="50.00"
                />
              </div>

              <div>
                <Label htmlFor="goalsROAS">ROAS Alvo</Label>
                <Input
                  id="goalsROAS"
                  type="number"
                  step="0.1"
                  value={formData.goalsROAS || 0}
                  onChange={(e) => setFormData({ ...formData, goalsROAS: parseFloat(e.target.value) || 0 })}
                  placeholder="4.0"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Cadastrar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}