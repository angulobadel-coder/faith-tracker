import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import RegisterAttendance from "./pages/RegisterAttendance";
import Members from "./pages/Members";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import FingerprintEnroll from "./pages/FingerprintEnroll";
import MemberDashboard from "./pages/MemberDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === "member") return <Navigate to="/mi-panel" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function MemberRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "member") return <Navigate to="/" replace />;
  return <MemberDashboard />;
}

function AuthRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (user && role === "member") return <Navigate to="/mi-panel" replace />;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/mi-panel" element={<MemberRoute />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/registrar" element={<ProtectedRoute><RegisterAttendance /></ProtectedRoute>} />
          <Route path="/miembros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/alertas" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/huellas" element={<ProtectedRoute><FingerprintEnroll /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
