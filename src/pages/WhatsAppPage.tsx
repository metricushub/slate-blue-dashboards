import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  Mic,
  Search,
  Users,
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCheck,
  Check,
  Star,
  UserPlus,
  TrendingUp,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LeadIntegration } from '@/components/whatsapp/LeadIntegration';
import { LeadSyncBanner } from '@/components/whatsapp/LeadSyncBanner';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  leadStage?: string;
  leadScore?: number;
  leadTemperature?: 'cold' | 'warm' | 'hot';
}

interface WhatsAppMessage {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  isRead: boolean;
  messageType: 'text' | 'image' | 'document' | 'audio';
}

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  const [contacts] = useState<WhatsAppContact[]>([
    {
      id: '1',
      name: 'João Silva',
      phone: '+55 11 99999-9999',
      lastMessage: 'Oi, gostaria de saber mais sobre o produto',
      timestamp: '14:32',
      unreadCount: 2,
      isOnline: true,
      leadStage: 'Interessado',
      leadScore: 85,
      leadTemperature: 'hot'
    },
    {
      id: '2',
      name: 'Maria Santos',
      phone: '+55 11 88888-8888',
      lastMessage: 'Qual o prazo de entrega?',
      timestamp: '13:45',
      unreadCount: 1,
      isOnline: false,
      leadStage: 'Negociação',
      leadScore: 92,
      leadTemperature: 'hot'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      phone: '+55 11 77777-7777',
      lastMessage: 'Obrigado pelas informações',
      timestamp: '12:15',
      unreadCount: 0,
      isOnline: true,
      leadStage: 'Qualificado',
      leadScore: 68,
      leadTemperature: 'warm'
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      phone: '+55 11 66666-6666',
      lastMessage: 'Vou pensar melhor...',
      timestamp: 'Ontem',
      unreadCount: 0,
      isOnline: false,
      leadStage: 'Objeção',
      leadScore: 45,
      leadTemperature: 'cold'
    }
  ]);

  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: '1',
      contactId: '1',
      content: 'Oi, vi seu anúncio no Facebook e gostaria de saber mais sobre o produto',
      timestamp: '14:30',
      isFromMe: false,
      isRead: true,
      messageType: 'text'
    },
    {
      id: '2',
      contactId: '1',
      content: 'Olá João! Que bom que você se interessou. Nosso produto oferece...',
      timestamp: '14:31',
      isFromMe: true,
      isRead: true,
      messageType: 'text'
    },
    {
      id: '3',
      contactId: '1',
      content: 'Oi, gostaria de saber mais sobre o produto',
      timestamp: '14:32',
      isFromMe: false,
      isRead: false,
      messageType: 'text'
    }
  ]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const contactMessages = messages.filter(msg => msg.contactId === selectedContact?.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [contactMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isFromMe: true,
      isRead: false,
      messageType: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    toast({
      title: "Mensagem enviada",
      description: `Mensagem enviada para ${selectedContact.name}`,
    });
  };

  const handleConnectWhatsApp = () => {
    setIsConnected(true);
    toast({
      title: "WhatsApp Conectado",
      description: "Conexão estabelecida com sucesso! Leads serão sincronizados automaticamente.",
    });
  };

  const handleLeadCreated = (leadId: string) => {
    toast({
      title: "Lead criado e sincronizado",
      description: "O lead foi adicionado ao CRM Kanban automaticamente",
    });
  };

  const handleLeadUpdated = (leadId: string, updates: any) => {
    toast({
      title: "Lead atualizado", 
      description: "As alterações foram sincronizadas com o CRM",
    });
  };

  const getLeadBadgeColor = (stage?: string) => {
    switch (stage) {
      case 'Interessado': return 'bg-blue-100 text-blue-800';
      case 'Qualificado': return 'bg-yellow-100 text-yellow-800';
      case 'Negociação': return 'bg-orange-100 text-orange-800';
      case 'Objeção': return 'bg-red-100 text-red-800';
      case 'Fechado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemperatureColor = (temp?: string) => {
    switch (temp) {
      case 'hot': return 'text-red-500';
      case 'warm': return 'text-yellow-500';
      case 'cold': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!isConnected) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="text-gray-600">Conecte seu WhatsApp para melhorar suas vendas</p>
            </div>

            <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">QR Code aparecerá aqui</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleConnectWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Simular Conexão WhatsApp
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em Menu &gt; WhatsApp Web</p>
                <p>3. Aponte seu telefone para esta tela</p>
                <p className="text-blue-600 font-medium">🚀 Leads serão sincronizados automaticamente!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4" />
              </Button>
              <Button 
                variant={showLeadPanel ? "default" : "ghost"} 
                size="sm"
                onClick={() => setShowLeadPanel(!showLeadPanel)}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-3 bg-blue-50 border-b">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-semibold text-blue-600">4</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-600">3</div>
              <div className="text-xs text-gray-600">Não lidas</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-green-600">78%</div>
              <div className="text-xs text-gray-600">Conversão</div>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <div className="flex items-center gap-1">
                      {contact.leadScore && (
                        <Star className={`w-3 h-3 ${getTemperatureColor(contact.leadTemperature)}`} />
                      )}
                      <span className="text-xs text-gray-500">{contact.timestamp}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">{contact.lastMessage}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {contact.leadStage && (
                        <Badge variant="secondary" className={`text-xs ${getLeadBadgeColor(contact.leadStage)}`}>
                          {contact.leadStage}
                        </Badge>
                      )}
                      {contact.leadScore && (
                        <span className="text-xs font-medium text-gray-600">
                          {contact.leadScore}%
                        </span>
                      )}
                    </div>
                    
                    {contact.unreadCount > 0 && (
                      <Badge variant="default" className="bg-green-500 text-white text-xs">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback>
                        {selectedContact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{selectedContact.phone}</span>
                        {selectedContact.isOnline && (
                          <span className="text-green-500">• online</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedContact.leadStage && (
                      <Badge className={getLeadBadgeColor(selectedContact.leadStage)}>
                        {selectedContact.leadStage}
                      </Badge>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={showLeadPanel ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setShowLeadPanel(!showLeadPanel)}
                      >
                        {showLeadPanel ? (
                          <PanelRightClose className="w-4 h-4" />
                        ) : (
                          <PanelRightOpen className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {contactMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isFromMe
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.isFromMe ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{message.timestamp}</span>
                        {message.isFromMe && (
                          message.isRead ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>

                  {messageInput.trim() ? (
                    <Button onClick={handleSendMessage} className="bg-green-500 hover:bg-green-600">
                      <Send className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm">
                      <Mic className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma conversa para começar</p>
                <p className="text-sm mt-2">💡 Clique no ícone <TrendingUp className="inline w-4 h-4" /> para gerenciar leads</p>
              </div>
            </div>
          )}
        </div>

        {/* Lead Integration Panel */}
        {showLeadPanel && selectedContact && (
          <div className="border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <LeadIntegration
              contact={selectedContact}
              onLeadCreated={handleLeadCreated}
              onLeadUpdated={handleLeadUpdated}
            />
          </div>
        )}
      </div>
      
      <LeadSyncBanner 
        isVisible={showSyncBanner}
        onClose={() => setShowSyncBanner(false)}
      />
    </div>
  );
}