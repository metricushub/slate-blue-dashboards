import { 
  Home, 
  Kanban,
  Users, 
  ClipboardList,
  Calendar,
  UserCog,
  Puzzle,
  Settings,
  ClipboardCheck,
  Layout,
  ChevronRight,
  MessageCircle,
  DollarSign,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Leads (CRM Kanban)", url: "/leads", icon: Kanban },
  { title: "WhatsApp Web", url: "/whatsapp", icon: MessageCircle },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Onboarding", url: "/onboarding", icon: ClipboardCheck },
  { title: "Tarefas e Anotações", url: "/tarefas-anotacoes", icon: ClipboardList },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Equipe", url: "/equipe", icon: UserCog },
  { title: "Integrações Gerais", url: "/integracoes", icon: Puzzle },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function SidebarGlobal() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
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
            Navegação
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