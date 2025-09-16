import { SidebarGlobal } from "@/components/layout/SidebarGlobal";
import { SidebarCliente } from "@/components/layout/SidebarCliente";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isClientRoute = location.pathname.startsWith('/cliente/');

  return (
    <>
      {/* Global header with trigger */}
      <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <BrandLogo linkTo="/" />
        </div>
      </header>

      <div className="flex flex-1">
        {isClientRoute ? <SidebarCliente /> : <SidebarGlobal />}
        <main className="flex-1 overflow-hidden px-6 py-6 lg:ml-64">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}