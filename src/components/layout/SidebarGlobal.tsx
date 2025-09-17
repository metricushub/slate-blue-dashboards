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

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const getSubNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sm ml-4" : "hover:bg-sidebar-accent/50 text-sm ml-4";

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
                          className={getNavClasses({ isActive: isActive(item.url) })}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {expandedItems.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={getNavClasses({ isActive: isActive(item.url) })}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                  
                  {/* Subitens */}
                  {item.subItems && expandedItems.includes(item.title) && !collapsed && (
                    <div className="space-y-1">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuItem key={subItem.url}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={subItem.url}
                              className={getSubNavClasses({ isActive: isActive(subItem.url) })}
                            >
                              <FileText className="h-3 w-3" />
                              <span>{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
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