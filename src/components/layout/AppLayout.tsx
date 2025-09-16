import { SidebarGlobal } from "@/components/layout/SidebarGlobal";
import { SidebarCliente } from "@/components/layout/SidebarCliente";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isClientRoute = location.pathname.startsWith('/cliente/');
  const isOnboardingRoute = location.pathname.includes('/onboarding');
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  
  // Only apply padding on desktop, mobile uses overlay
  const getContentPadding = () => {
    if (isMobile) return "pl-[var(--content-gutter-x)] sm:[--content-gutter-x:4px] md:[--content-gutter-x:6px] lg:[--content-gutter-x:8px]"; 
    return collapsed ? "lg:pl-[72px] pl-[var(--content-gutter-x)] sm:[--content-gutter-x:4px] md:[--content-gutter-x:6px] lg:[--content-gutter-x:8px]" : "lg:pl-[280px] pl-[var(--content-gutter-x)] sm:[--content-gutter-x:4px] md:[--content-gutter-x:6px] lg:[--content-gutter-x:8px]";
  };

  return (
    <>
      {/* Global header with trigger */}
      <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          <BrandLogo linkTo="/" />
        </div>
      </header>

      <div className="flex flex-1">
        {isClientRoute ? <SidebarCliente /> : <SidebarGlobal />}
        <main className={`flex-1 overflow-hidden pr-[var(--content-gutter-x)] py-3 transition-all duration-300 ${getContentPadding()} ${isOnboardingRoute ? 'bg-muted' : ''} min-h-[calc(100vh-56px)] sm:[--content-gutter-x:4px] md:[--content-gutter-x:6px] lg:[--content-gutter-x:8px]`}>
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}