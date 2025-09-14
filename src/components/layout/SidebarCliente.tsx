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

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function SidebarCliente() {
  const { state } = useSidebar();
  const location = useLocation();
  const { clientId } = useParams<{ clientId: string }>();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const navigationItems = [
    { title: "Visão e análise Geral", url: `/cliente/${clientId}/overview`, icon: LayoutDashboard },
    { title: "Central de Otimizações", url: `/cliente/${clientId}/otimizacoes`, icon: Wand2 },
    { title: "Tarefas e Alertas", url: `/cliente/${clientId}/tarefas-alertas`, icon: BellDot },
    { title: "Chat IA e Configuração", url: `/cliente/${clientId}/chat`, icon: MessageSquare },
    { title: "Anotações", url: `/cliente/${clientId}/anotacoes`, icon: StickyNote },
    { title: "Onboarding do Cliente", url: `/cliente/${clientId}/onboarding`, icon: ClipboardCheck },
    { title: "Relatórios", url: `/cliente/${clientId}/relatorios`, icon: FileBarChart },
    { title: "Analytics", url: `/cliente/${clientId}/analytics`, icon: LineChart },
    { title: "Objetivos e Metas de KPI", url: `/cliente/${clientId}/objetivos`, icon: Target },
    { title: "Integração Planilha", url: `/cliente/${clientId}/integracao-planilha`, icon: TableProperties },
    { title: "Integração Google Ads", url: `/cliente/${clientId}/integracao-google-ads`, icon: BadgeDollarSign },
    { title: "Integração Meta", url: `/cliente/${clientId}/integracao-meta`, icon: BadgePercent },
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