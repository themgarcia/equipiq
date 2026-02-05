/* Main Application Entry */
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { EquipmentProvider } from "@/contexts/EquipmentContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";

// Critical path - eager loaded
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ConfirmDeleteAccount from "./pages/ConfirmDeleteAccount";

// Lazy loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const EquipmentList = lazy(() => import("./pages/EquipmentList"));
const CategoryLifespans = lazy(() => import("./pages/CategoryLifespans"));
const FMSExport = lazy(() => import("./pages/FMSExport"));
const BuyVsRentAnalysis = lazy(() => import("./pages/BuyVsRentAnalysis"));
const CashflowAnalysis = lazy(() => import("./pages/CashflowAnalysis"));
const Definitions = lazy(() => import("./pages/Definitions"));
const Changelog = lazy(() => import("./pages/Changelog"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Billing = lazy(() => import("./pages/Settings/Billing"));
const Feedback = lazy(() => import("./pages/Feedback"));
const InsuranceControl = lazy(() => import("./pages/InsuranceControl"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AdminModeProvider>
              <ImpersonationProvider>
                <EquipmentProvider>
                  <OnboardingProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          {/* Public routes - eager loaded */}
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/terms" element={<TermsOfService />} />
                          <Route path="/privacy" element={<PrivacyPolicy />} />
                          <Route path="/confirm-delete" element={<ConfirmDeleteAccount />} />
                          
                          {/* Protected routes - lazy loaded */}
                          <Route path="/dashboard" element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/get-started" element={
                            <ProtectedRoute>
                              <GetStarted />
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
                          <Route path="/changelog" element={
                            <ProtectedRoute>
                              <Changelog />
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
                          
                          {/* Admin routes - lazy loaded */}
                          <Route path="/admin" element={
                            <AdminRoute>
                              <AdminDashboard />
                            </AdminRoute>
                          } />
                          
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </OnboardingProvider>
                </EquipmentProvider>
              </ImpersonationProvider>
            </AdminModeProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
