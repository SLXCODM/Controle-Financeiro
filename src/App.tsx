import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Goals from "./pages/Goals";
import Savings from "./pages/Savings";
import Investments from "./pages/Investments";
import Settings from "./pages/Settings";
import AnnualSummary from "./pages/AnnualSummary";
import IncomeDistribution from "./pages/IncomeDistribution";
import RecurringTransactions from "./pages/RecurringTransactions";
import NotFound from "./pages/NotFound";
import { initializeAdMob } from "@/lib/admob";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeAdMob();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinanceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/annual" element={<AnnualSummary />} />
              <Route path="/distribution" element={<IncomeDistribution />} />
              <Route path="/recurring" element={<RecurringTransactions />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
