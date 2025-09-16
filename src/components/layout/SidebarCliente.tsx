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
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

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

  const link = (segment: string, fallback: string) =>
    resolvedClientId ? `/cliente/${resolvedClientId}/${segment}` : fallback;

  const navigationItems = [
    { title: "Visão e análise Geral", url: link("overview", "/clientes"), icon: LayoutDashboard },
    { title: "Central de Otimizações", url: link("otimizacoes", "/clientes"), icon: Wand2 },
    { title: "Tarefas e Alertas", url: link("tarefas-alertas", "/clientes"), icon: BellDot },
    { title: "Chat IA e Configuração", url: link("chat", "/clientes"), icon: MessageSquare },
    { title: "Anotações", url: link("anotacoes", "/clientes"), icon: StickyNote },
    { title: "Onboarding do Cliente", url: link("onboarding", "/onboarding"), icon: ClipboardCheck },
    { title: "Relatórios", url: link("relatorios", "/clientes"), icon: FileBarChart },
    { title: "Analytics", url: link("analytics", "/clientes"), icon: LineChart },
    { title: "Objetivos e Metas de KPI", url: link("objetivos", "/clientes"), icon: Target },
    { title: "Integração Planilha", url: link("integracao-planilha", "/clientes"), icon: TableProperties },
    { title: "Integração Google Ads", url: link("integracao-google-ads", "/clientes"), icon: BadgeDollarSign },
    { title: "Integração Meta", url: link("integracao-meta", "/clientes"), icon: BadgePercent },
  ];

  const isActive = (path: string) => {
    return currentPath === path;
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
      className={`transition-all duration-300 ${collapsed ? "w-14" : "w-64"}`}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}