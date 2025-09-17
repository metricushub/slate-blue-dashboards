import { 
  Home, 
  Kanban,
  Users, 
  ClipboardList,
  UserCog,
  Puzzle,
  Settings,
  ClipboardCheck,
  Layout,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useState } from "react";

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

interface NavigationSubItem {
  title: string;
  url: string;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  subItems?: NavigationSubItem[];
}

const navigationItems: NavigationItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Leads (CRM Kanban)", url: "/leads", icon: Kanban },
  { title: "WhatsApp Web", url: "/whatsapp", icon: MessageCircle },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Onboarding", url: "/onboarding", icon: ClipboardCheck },
  { title: "Tarefas e Anotações", url: "/tarefas-anotacoes", icon: ClipboardList },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Equipe", url: "/equipe", icon: UserCog },
  { title: "Integrações Gerais", url: "/integracoes", icon: Puzzle },
  { title: "Configurações", url: "/configuracoes", icon: Settings, subItems: [
    { title: "Geral", url: "/configuracoes" },
    { title: "Templates de Briefing", url: "/configuracoes/briefing" }
  ]},
];

export function SidebarGlobal() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => 
      prev.includes(itemTitle) 
        ? prev.filter(title => title !== itemTitle)
        : [...prev, itemTitle]
    );
  };

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

  const getSubNavClassName = (path: string) => {
    const baseClasses = "flex items-center gap-3 px-6 py-1.5 rounded-lg transition-all duration-200 text-sm";
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-active text-primary font-medium`;
    }
    return `${baseClasses} text-muted-foreground hover:bg-sidebar-hover hover:text-foreground`;
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
                <div key={item.title}>
                  <SidebarMenuItem>
                    {item.subItems && !collapsed ? (
                      <SidebarMenuButton asChild>
                        <button 
                          onClick={() => toggleExpanded(item.title)}
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                          {expandedItems.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                          {!collapsed && !item.subItems && isActive(item.url) && (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                  
                  {/* Subitens */}
                  {item.subItems && expandedItems.includes(item.title) && !collapsed && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.url}
                          to={subItem.url}
                          className={getSubNavClassName(subItem.url)}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{subItem.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}