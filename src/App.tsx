import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EquipmentProvider } from "@/contexts/EquipmentContext";
import Index from "./pages/Index";
import EquipmentList from "./pages/EquipmentList";
import CategoryLifespans from "./pages/CategoryLifespans";
import LMNExport from "./pages/LMNExport";
import BuyVsRentAnalysis from "./pages/BuyVsRentAnalysis";
import Definitions from "./pages/Definitions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EquipmentProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/equipment" element={<EquipmentList />} />
            <Route path="/categories" element={<CategoryLifespans />} />
            <Route path="/export" element={<LMNExport />} />
            <Route path="/buy-vs-rent" element={<BuyVsRentAnalysis />} />
            <Route path="/definitions" element={<Definitions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EquipmentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
