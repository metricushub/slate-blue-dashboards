import { 
  LayoutDashboard,
  Wand2,
  BellDot,
  MessageSquare,
  StickyNote,
  ClipboardCheck,
  FileBarChart,
  LineChart,
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
    { title: "Anotações", url: link("anotacoes", "/clientes"), icon: StickyNote },
    { title: "Relatórios", url: link("relatorios", "/clientes"), icon: FileBarChart },
    { title: "Analytics", url: link("analytics", "/clientes"), icon: LineChart },
    { title: "Objetivos e Metas de KPI", url: link("objetivos", "/clientes"), icon: Target },
  ];

  // Itens que vêm depois do Cadastro do Cliente
  const navigationItemsAfterCadastro = [
    { title: "Onboarding", url: link("onboarding", "/onboarding"), icon: ClipboardCheck },
  ];

  const cadastroSubItems = [
    { title: "Ficha Cadastral", url: link("cadastro", "/clientes"), icon: User },
    { title: "Briefing", url: link("cadastro/briefing", "/clientes"), icon: FileText },
    { title: "Documentos", url: link("cadastro/documentos", "/clientes"), icon: FileBarChart },
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

  const getNavClassName = (path: string) => {
    const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200";
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-active text-primary font-medium`;
    }
    return `${baseClasses} text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground`;
  };

  return (
    <Sidebar 
      className={`transition-all duration-300 ${collapsed ? "w-[72px] lg:w-[72px]" : "w-[280px] lg:w-[280px]"} lg:fixed lg:inset-y-0 lg:left-0 lg:z-50`}
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <BrandLogo 
          showText={!collapsed}
          linkTo="/"
          className={collapsed ? "justify-center" : ""}
        />
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Cliente
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
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
                      className={getNavClassName("")}
                    >
                      <User className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">Cadastro do Cliente</span>
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
                              <NavLink to={item.url} className={getNavClassName(item.url)}>
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.title}</span>
                                {isActive(item.url) && (
                                  <ChevronRight className="h-3 w-3 ml-auto" />
                                )}
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
                      className={getNavClassName("")}
                    >
                      <Database className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">Configurações de Dados</span>
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
                              <NavLink to={item.url} className={getNavClassName(item.url)}>
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.title}</span>
                                {isActive(item.url) && (
                                  <ChevronRight className="h-3 w-3 ml-auto" />
                                )}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
              
              {/* Itens após o Cadastro do Cliente */}
              {navigationItemsAfterCadastro.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}