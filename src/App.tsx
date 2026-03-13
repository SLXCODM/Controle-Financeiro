import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { initializeAdMob } from "@/lib/admob";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="gradient-text text-2xl font-bold mb-2">SLX Finance</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <FinanceProvider>
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
      </Routes>
    </FinanceProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={loading ? null : user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
    try {
      initializeAdMob();
    } catch (e) {
      console.error('Failed to init AdMob:', e);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
