import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router as WouterRouter, Switch } from "wouter";

import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/hooks/use-language";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import DashboardPage from "@/pages/_nav/dashboard";
import OrdersPage from "@/pages/_nav/orders";
import ReportsPage from "@/pages/reports";
import TeamPage from "@/pages/team";
import ReminderRulesPage from "@/pages/_nav/reminder-rules";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { MerchantProvider } from "./hooks/use-merchant";
import AbandonCartsPage from "./pages/_nav/abandon-carts";
import TemplatesPage from "./pages/_nav/templates";
import CampaignsPage from "./pages/_nav/campaigns";
import ImportContactsPage from "./pages/_nav/contacts";
import SettingsPage from "./pages/_nav/settings";
import AttributesPage from "./pages/_nav/attributes";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAdmin } = useRole();

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/campaigns" component={CampaignsPage} />
        <Route path="/abandon-carts" component={AbandonCartsPage} />
<Route path="/reminder-rules" component={ReminderRulesPage} />
<Route path="/contacts" component={ImportContactsPage} />
<Route path="/attributes" component={AttributesPage} />
<Route path="/settings" component={SettingsPage} />
        {isAdmin && <Route path="/reports" component={ReportsPage} />}
        {isAdmin && <Route path="/team" component={TeamPage} />}
       

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return isAuthenticated ? (
    <WouterRouter>
      <ProtectedRoutes />
    </WouterRouter>
  ) : (
    <LoginPage />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <RoleProvider>
              <MerchantProvider>
              <AuthGate />
              </MerchantProvider>
              <Toaster />
            </RoleProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}