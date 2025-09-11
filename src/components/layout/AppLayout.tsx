import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      {/* Global header with trigger */}
      <header className="h-14 flex items-center border-b bg-card px-4 sticky top-0 z-50">
        <SidebarTrigger className="h-8 w-8" />
        <div className="ml-4">
          <h1 className="text-lg font-semibold text-foreground">
            Dashboard Marketing
          </h1>
        </div>
      </header>

      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-hidden px-6 py-6">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}