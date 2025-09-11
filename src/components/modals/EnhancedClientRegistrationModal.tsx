import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save } from "lucide-react";
import { Client, ClientContact, ClientAccess, OnboardingItem } from "@/types";
import { toast } from "@/hooks/use-toast";

interface EnhancedClientRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientRegistered: (client: Client) => void;
}

export function EnhancedClientRegistrationModal({ 
  open, 
  onOpenChange, 
  onClientRegistered 
}: EnhancedClientRegistrationModalProps) {
  const [activeTab, setActiveTab] = useState("geral");
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    website: "",
    segment: "",
    monthlyBudget: 0,
    budgetSpentMonth: 0,
    status: "onboarding",
    stage: "Setup inicial",
    owner: "",
    tags: [],
    contacts: [],
    access: {},
    onboarding: [
      { id: "1", task: "Configurar Google Ads", completed: false },
      { id: "2", task: "Configurar Meta Ads", completed: false },
      { id: "3", task: "Instalar Google Analytics", completed: false },
      { id: "4", task: "Configurar GTM", completed: false },
      { id: "5", task: "Definir metas e KPIs", completed: false },
    ],
    goalsLeads: 0,
    goalsCPA: 0,
    goalsROAS: 0,
  });

  const [contacts, setContacts] = useState<ClientContact[]>([
    { id: "1", name: "", email: "", phone: "", role: "", isPrimary: true }
  ]);

  const [access, setAccess] = useState<ClientAccess>({
    businessManager: "",
    ga4PropertyId: "",
    gtmContainerId: "",
    searchConsoleUrl: "",
    notes: "",
  });

  const [onboarding, setOnboarding] = useState<OnboardingItem[]>([
    { id: "1", task: "Configurar Google Ads", completed: false },
    { id: "2", task: "Configurar Meta Ads", completed: false },
    { id: "3", task: "Instalar Google Analytics", completed: false },
    { id: "4", task: "Configurar GTM", completed: false },
    { id: "5", task: "Definir metas e KPIs", completed: false },
  ]);

  const addContact = () => {
    const newContact: ClientContact = {
      id: Date.now().toString(),
      name: "",
      email: "",
      phone: "",
      role: "",
      isPrimary: false,
    };
    setContacts([...contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof ClientContact, value: string | boolean) => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(contact => contact.id !== id));
    }
  };

  const updateOnboardingItem = (id: string, completed: boolean) => {
    setOnboarding(onboarding.map(item =>
      item.id === id ? { ...item, completed, completedAt: completed ? new Date().toISOString() : undefined } : item
    ));
  };

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
      budgetSpentMonth: formData.budgetSpentMonth || 0,
      status: formData.status as Client['status'] || 'onboarding',
      stage: formData.stage || 'Setup inicial',
      owner: formData.owner || '',
      lastUpdate: new Date().toISOString(),
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=0D8ABC&color=fff`,
      tags: formData.tags || [],
      contacts: contacts.filter(c => c.name && c.email),
      access,
      onboarding,
      goalsLeads: formData.goalsLeads,
      goalsCPA: formData.goalsCPA,
      goalsROAS: formData.goalsROAS,
    };

    onClientRegistered(client);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: "",
      website: "",
      segment: "",
      monthlyBudget: 0,
      budgetSpentMonth: 0,
      status: "onboarding",
      stage: "Setup inicial",
      owner: "",
      tags: [],
    });
    setContacts([{ id: "1", name: "", email: "", phone: "", role: "", isPrimary: true }]);
    setAccess({ businessManager: "", ga4PropertyId: "", gtmContainerId: "", searchConsoleUrl: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-auto left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="metas">Metas/KPIs</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Cliente *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome da empresa"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="segment">Segmento</Label>
                <Select value={formData.segment || ""} onValueChange={(value) => setFormData({...formData, segment: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                    <SelectItem value="Imobiliário">Imobiliário</SelectItem>
                    <SelectItem value="Serviços">Serviços</SelectItem>
                    <SelectItem value="Fintech">Fintech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="monthlyBudget">Budget Mensal (R$)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={formData.monthlyBudget || ""}
                  onChange={(e) => setFormData({...formData, monthlyBudget: parseFloat(e.target.value) || 0})}
                  placeholder="10000"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || "onboarding"} onValueChange={(value) => setFormData({...formData, status: value as Client['status']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Em Onboarding</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="at_risk">Em Risco</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage || "Setup inicial"} onValueChange={(value) => setFormData({...formData, stage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Setup inicial">Setup inicial</SelectItem>
                    <SelectItem value="Otimização">Otimização</SelectItem>
                    <SelectItem value="Crescimento">Crescimento</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Expansão">Expansão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner">Responsável</Label>
                <Select value={formData.owner || ""} onValueChange={(value) => setFormData({...formData, owner: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ana Silva">Ana Silva</SelectItem>
                    <SelectItem value="Carlos Santos">Carlos Santos</SelectItem>
                    <SelectItem value="Mariana Costa">Mariana Costa</SelectItem>
                    <SelectItem value="Pedro Oliveira">Pedro Oliveira</SelectItem>
                    <SelectItem value="Juliana Lima">Juliana Lima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) => setFormData({
                    ...formData, 
                    tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="Google Ads, Meta Ads, E-commerce"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contatos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contatos</h3>
              <Button onClick={addContact} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </div>
            
            {contacts.map((contact, index) => (
              <div key={contact.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Contato {index + 1}</h4>
                  {contacts.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeContact(contact.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                      placeholder="Nome do contato"
                    />
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={contact.phone || ""}
                      onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label>Cargo</Label>
                    <Input
                      value={contact.role || ""}
                      onChange={(e) => updateContact(contact.id, "role", e.target.value)}
                      placeholder="Marketing Manager"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`primary-${contact.id}`}
                    checked={contact.isPrimary}
                    onCheckedChange={(checked) => updateContact(contact.id, "isPrimary", !!checked)}
                  />
                  <Label htmlFor={`primary-${contact.id}`}>Contato principal</Label>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="acessos" className="space-y-4">
            <h3 className="text-lg font-semibold">Acessos e Credenciais</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessManager">Business Manager URL</Label>
                <Input
                  id="businessManager"
                  value={access.businessManager || ""}
                  onChange={(e) => setAccess({...access, businessManager: e.target.value})}
                  placeholder="https://business.facebook.com/..."
                />
              </div>
              
              <div>
                <Label htmlFor="ga4PropertyId">Google Analytics 4 Property ID</Label>
                <Input
                  id="ga4PropertyId"
                  value={access.ga4PropertyId || ""}
                  onChange={(e) => setAccess({...access, ga4PropertyId: e.target.value})}
                  placeholder="GA_MEASUREMENT_ID"
                />
              </div>
              
              <div>
                <Label htmlFor="gtmContainerId">Google Tag Manager Container ID</Label>
                <Input
                  id="gtmContainerId"
                  value={access.gtmContainerId || ""}
                  onChange={(e) => setAccess({...access, gtmContainerId: e.target.value})}
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              
              <div>
                <Label htmlFor="searchConsoleUrl">Google Search Console URL</Label>
                <Input
                  id="searchConsoleUrl"
                  value={access.searchConsoleUrl || ""}
                  onChange={(e) => setAccess({...access, searchConsoleUrl: e.target.value})}
                  placeholder="https://search.google.com/search-console..."
                />
              </div>
              
              <div>
                <Label htmlFor="accessNotes">Observações sobre Acessos</Label>
                <Textarea
                  id="accessNotes"
                  value={access.notes || ""}
                  onChange={(e) => setAccess({...access, notes: e.target.value})}
                  placeholder="Informações adicionais sobre acessos..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-4">
            <h3 className="text-lg font-semibold">Checklist de Onboarding</h3>
            
            <div className="space-y-3">
              {onboarding.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`onboarding-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={(checked) => updateOnboardingItem(item.id, !!checked)}
                  />
                  <Label 
                    htmlFor={`onboarding-${item.id}`} 
                    className={item.completed ? "line-through text-muted-foreground" : ""}
                  >
                    {item.task}
                  </Label>
                  {item.completedAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Concluído em {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metas" className="space-y-4">
            <h3 className="text-lg font-semibold">Metas e KPIs</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goalsLeads">Meta de Leads (mensal)</Label>
                <Input
                  id="goalsLeads"
                  type="number"
                  value={formData.goalsLeads || ""}
                  onChange={(e) => setFormData({...formData, goalsLeads: parseInt(e.target.value) || 0})}
                  placeholder="100"
                />
              </div>
              
              <div>
                <Label htmlFor="goalsCPA">CPA Alvo (R$)</Label>
                <Input
                  id="goalsCPA"
                  type="number"
                  step="0.01"
                  value={formData.goalsCPA || ""}
                  onChange={(e) => setFormData({...formData, goalsCPA: parseFloat(e.target.value) || 0})}
                  placeholder="50.00"
                />
              </div>
              
              <div>
                <Label htmlFor="goalsROAS">ROAS Alvo</Label>
                <Input
                  id="goalsROAS"
                  type="number"
                  step="0.1"
                  value={formData.goalsROAS || ""}
                  onChange={(e) => setFormData({...formData, goalsROAS: parseFloat(e.target.value) || 0})}
                  placeholder="4.0"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Cadastrar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}