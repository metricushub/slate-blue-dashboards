import { SidebarGlobal } from "@/components/layout/SidebarGlobal";
import { SidebarCliente } from "@/components/layout/SidebarCliente";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isClientRoute = location.pathname.startsWith('/cliente/');
  const isOnboardingRoute = location.pathname.includes('/onboarding');

  return (
    <>
      {/* Global header with sidebar trigger */}
      <header className="h-14 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8" />
          <BrandLogo linkTo="/" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)] w-full">
        {/* Sidebar - will auto-adjust layout */}
        {isClientRoute ? <SidebarCliente /> : <SidebarGlobal />}
        
        {/* Main content - consistent padding for all pages */}
        <main className={`flex-1 pl-8 pr-6 py-6 ${isOnboardingRoute ? 'bg-muted' : ''}`}>
          {children}
        </main>
      </div>
    </>
  );
}