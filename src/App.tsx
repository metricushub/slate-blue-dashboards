import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import HomePage from "./features/home/home-page";
import ClientsPage from "./pages/ClientsPage";
import LeadsPage from "./pages/LeadsPage";
import OptimizationsPage from "./pages/OptimizationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ClientDashboard from "./pages/client-dashboard/ClientDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-dashboard">
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/otimizacoes" element={<OptimizationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="/cliente/:clientId/overview" element={<ClientDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
