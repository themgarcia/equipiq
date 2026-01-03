import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EquipmentProvider } from "@/contexts/EquipmentContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EquipmentList from "./pages/EquipmentList";
import CategoryLifespans from "./pages/CategoryLifespans";
import LMNExport from "./pages/LMNExport";
import BuyVsRentAnalysis from "./pages/BuyVsRentAnalysis";
import CashflowAnalysis from "./pages/CashflowAnalysis";
import Definitions from "./pages/Definitions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <EquipmentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
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
                    <LMNExport />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </EquipmentProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
