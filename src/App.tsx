import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/common/AuthProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import Dashboard from "./pages/dashboard";
import Admin from "./pages/admin";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Tickets from "./pages/tickets";
import Assets from "./pages/assets";
import AddAsset from "./pages/assets/add";
import EditAsset from "./pages/assets/edit";
import CheckOutAsset from "./pages/assets/checkout";
import CheckInAsset from "./pages/assets/checkin";
import AssetWarranty from "./pages/assets/warranty";
import AssetSoftware from "./pages/assets/software";
import AssetAudit from "./pages/assets/audit";
import Subscriptions from "./pages/subscriptions";
import Reports from "./pages/reports";
import Updates from "./pages/updates";
import Monitoring from "./pages/monitoring";
import Compliance from "./pages/compliance";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import NoAccess from "./pages/NoAccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ImpersonationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/no-access" element={<NoAccess />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
                    <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
                    <Route path="/assets/add" element={<ProtectedRoute><AddAsset /></ProtectedRoute>} />
                    <Route path="/assets/edit/:id" element={<ProtectedRoute><EditAsset /></ProtectedRoute>} />
                    <Route path="/assets/checkout/:id" element={<ProtectedRoute><CheckOutAsset /></ProtectedRoute>} />
                    <Route path="/assets/checkin/:id" element={<ProtectedRoute><CheckInAsset /></ProtectedRoute>} />
                    <Route path="/assets/warranty/:id" element={<ProtectedRoute><AssetWarranty /></ProtectedRoute>} />
                    <Route path="/assets/software/:id" element={<ProtectedRoute><AssetSoftware /></ProtectedRoute>} />
                    <Route path="/assets/audit/:id" element={<ProtectedRoute><AssetAudit /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
                    <Route path="/updates" element={<ProtectedRoute><Updates /></ProtectedRoute>} />
                    <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
                    <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </BrowserRouter>
        </ImpersonationProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
