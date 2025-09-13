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
import { SettingsPage } from "./pages/SettingsPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { ClientOverview } from "./pages/client-dashboard/overview/ClientOverview";
import NotFound from "./pages/NotFound";

// WIP Pages - Global
import CalendarioWip from "./pages/wip/CalendarioWip";
import EquipeWip from "./pages/wip/EquipeWip";

// WIP Pages - Cliente
import CentralOtimizacoesWip from "./pages/wip/CentralOtimizacoesWip";
import TarefasAlertasWip from "./pages/wip/TarefasAlertasWip";
import ChatIaConfigWip from "./pages/wip/ChatIaConfigWip";
import AnotacoesClienteWip from "./pages/wip/AnotacoesClienteWip";
import OnboardingClienteWip from "./pages/wip/OnboardingClienteWip";
import RelatoriosClienteWip from "./pages/wip/RelatoriosClienteWip";
import AnalyticsClienteWip from "./pages/wip/AnalyticsClienteWip";
import ObjetivosClienteWip from "./pages/wip/ObjetivosClienteWip";
import IntegracaoPlanilhaWip from "./pages/wip/IntegracaoPlanilhaWip";
import IntegracaoGoogleAdsWip from "./pages/wip/IntegracaoGoogleAdsWip";
import IntegracaoMetaWip from "./pages/wip/IntegracaoMetaWip";

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
                {/* Global Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/calendario" element={<CalendarioWip />} />
                <Route path="/equipe" element={<EquipeWip />} />
                <Route path="/otimizacoes" element={<OptimizationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/integracoes" element={<IntegrationsPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                
                {/* Client Routes */}
                <Route path="/cliente/:clientId/overview" element={<ClientOverview />} />
                <Route path="/cliente/:clientId/otimizacoes" element={<CentralOtimizacoesWip />} />
                <Route path="/cliente/:clientId/tarefas-alertas" element={<TarefasAlertasWip />} />
                <Route path="/cliente/:clientId/chat" element={<ChatIaConfigWip />} />
                <Route path="/cliente/:clientId/anotacoes" element={<AnotacoesClienteWip />} />
                <Route path="/cliente/:clientId/onboarding" element={<OnboardingClienteWip />} />
                <Route path="/cliente/:clientId/relatorios" element={<RelatoriosClienteWip />} />
                <Route path="/cliente/:clientId/analytics" element={<AnalyticsClienteWip />} />
                <Route path="/cliente/:clientId/objetivos" element={<ObjetivosClienteWip />} />
                <Route path="/cliente/:clientId/integracao-planilha" element={<IntegracaoPlanilhaWip />} />
                <Route path="/cliente/:clientId/integracao-google-ads" element={<IntegracaoGoogleAdsWip />} />
                <Route path="/cliente/:clientId/integracao-meta" element={<IntegracaoMetaWip />} />
                
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
