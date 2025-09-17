import { 
  LayoutDashboard,
  Wand2,
  MessageSquare,
  ClipboardCheck,
  FileBarChart,
  Target,
  TableProperties,
  BadgeDollarSign,
  BadgePercent,
  ChevronRight,
  ChevronDown,
  User,
  FileText,
  Database,
} from "lucide-react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { BrandLogo } from "@/components/ui/brand-logo";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function SidebarCliente() {
  const { state } = useSidebar();
  const location = useLocation();
  const params = useParams<{ clientId?: string; id?: string }>();
  const rawRouteId = params.clientId || params.id;
  const currentPath = location.pathname;
  const fromPath = currentPath.match(/^\/cliente\/([^/]+)/)?.[1];
  const isValidId = (v?: string) => !!(v && v !== 'undefined' && v !== 'null' && v.trim() !== '');
  const resolvedClientId = isValidId(rawRouteId) ? rawRouteId! : (isValidId(fromPath) ? fromPath! : undefined);
  const collapsed = state === "collapsed";
  const [cadastroExpanded, setCadastroExpanded] = useState(false);
  const [configDadosExpanded, setConfigDadosExpanded] = useState(false);

  const link = (segment: string, fallback: string) =>
    resolvedClientId ? `/cliente/${resolvedClientId}/${segment}` : fallback;

  const navigationItems = [
    { title: "Visão e análise Geral", url: link("overview", "/clientes"), icon: LayoutDashboard },
    { title: "Central de Otimizações", url: link("otimizacoes", "/clientes"), icon: Wand2 },
    { title: "Tarefas e Anotações", url: link("tarefas-anotacoes", "/clientes"), icon: ClipboardCheck },
    { title: "Chat IA e Configuração", url: link("chat", "/clientes"), icon: MessageSquare },
    { title: "Relatórios", url: link("relatorios", "/clientes"), icon: FileBarChart },
    { title: "Objetivos e Metas de KPI", url: link("objetivos", "/clientes"), icon: Target },
  ];

  const cadastroSubItems = [
    { title: "Ficha Cadastral", url: link("cadastro", "/clientes"), icon: User },
    { title: "Briefing", url: link("cadastro/briefing", "/clientes"), icon: FileText },
    { title: "Documentos", url: link("cadastro/documentos", "/clientes"), icon: FileBarChart },
    { title: "Onboarding", url: link("onboarding", "/onboarding"), icon: ClipboardCheck },
  ];

  const configDadosSubItems = [
    { title: "Planilhas", url: link("config-dados/planilhas", "/clientes"), icon: TableProperties },
    { title: "Google Ads", url: link("config-dados/google-ads", "/clientes"), icon: BadgeDollarSign },
    { title: "Meta Ads", url: link("config-dados/meta-ads", "/clientes"), icon: BadgePercent },
  ];

  const isActive = (path: string) => {
    return currentPath === path;
  };

  const isCadastroSectionActive = () => {
    return cadastroSubItems.some(item => isActive(item.url));
  };

  const isConfigDadosSectionActive = () => {
    return configDadosSubItems.some(item => isActive(item.url));
  };

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <BrandLogo 
          showText={!collapsed}
          linkTo="/"
          className={collapsed ? "justify-center" : ""}
        />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Cliente
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses({ isActive: isActive(item.url) })}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Cadastro do Cliente com submenu */}
              <Collapsible 
                open={cadastroExpanded || isCadastroSectionActive()}
                onOpenChange={setCadastroExpanded}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={getNavClasses({ isActive: isCadastroSectionActive() })}
                    >
                      <User className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Cadastro do Cliente</span>
                          <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {cadastroSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={getNavClasses({ isActive: isActive(item.url) })}
                              >
                                <item.icon className="h-3 w-3" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Configurações de Dados com submenu */}
              <Collapsible 
                open={configDadosExpanded || isConfigDadosSectionActive()}
                onOpenChange={setConfigDadosExpanded}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={getNavClasses({ isActive: isConfigDadosSectionActive() })}
                    >
                      <Database className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Configurações de Dados</span>
                          <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {configDadosSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={getNavClasses({ isActive: isActive(item.url) })}
                              >
                                <item.icon className="h-3 w-3" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}