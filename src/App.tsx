/* Main Application Entry */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { EquipmentProvider } from "@/contexts/EquipmentContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EquipmentList from "./pages/EquipmentList";
import CategoryLifespans from "./pages/CategoryLifespans";
import FMSExport from "./pages/FMSExport";
import BuyVsRentAnalysis from "./pages/BuyVsRentAnalysis";
import CashflowAnalysis from "./pages/CashflowAnalysis";
import Definitions from "./pages/Definitions";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Billing from "./pages/Settings/Billing";
import Feedback from "./pages/Feedback";
import InsuranceControl from "./pages/InsuranceControl";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ConfirmDeleteAccount from "./pages/ConfirmDeleteAccount";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <AdminModeProvider>
            <ImpersonationProvider>
              <EquipmentProvider>
                <Toaster />
                <Sonner />
              <BrowserRouter>
              <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/confirm-delete" element={<ConfirmDeleteAccount />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/equipment" element={
                    <ProtectedRoute>
                      <EquipmentList />
                    </ProtectedRoute>
                  } />
                  <Route path="/categories" element={
                    <ProtectedRoute>
                      <CategoryLifespans />
                    </ProtectedRoute>
                  } />
                  <Route path="/export" element={
                    <ProtectedRoute>
                      <FMSExport />
                    </ProtectedRoute>
                  } />
                  <Route path="/buy-vs-rent" element={
                    <ProtectedRoute>
                      <BuyVsRentAnalysis />
                    </ProtectedRoute>
                  } />
                  <Route path="/cashflow" element={
                    <ProtectedRoute>
                      <CashflowAnalysis />
                    </ProtectedRoute>
                  } />
                  <Route path="/definitions" element={
                    <ProtectedRoute>
                      <Definitions />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/billing" element={
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  } />
                  <Route path="/feedback" element={
                    <ProtectedRoute>
                      <Feedback />
                    </ProtectedRoute>
                  } />
                  <Route path="/insurance" element={
                    <ProtectedRoute>
                      <InsuranceControl />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </EquipmentProvider>
            </ImpersonationProvider>
          </AdminModeProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
