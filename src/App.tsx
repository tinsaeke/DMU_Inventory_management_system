import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DeanDashboard from "./pages/dashboards/DeanDashboard";
import DepartmentDashboard from "./pages/dashboards/DepartmentDashboard";
import StorekeeperDashboard from "./pages/dashboards/StorekeeperDashboard";
import StaffDashboard from "./pages/dashboards/StaffDashboard";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { validateConfig } from "./lib/config";
import { logger } from "./lib/logger";

// Validate configuration on app start
try {
  validateConfig();
  logger.info('Application configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', error);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>
              
              <Route path="/" element={<Index />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>
              
              {/* College Dean Routes */}
              <Route element={<ProtectedRoute allowedRoles={['college_dean']} />}>
                <Route path="/dean/*" element={<DeanDashboard />} />
              </Route>
              
              {/* Department Head Routes */}
              <Route element={<ProtectedRoute allowedRoles={['department_head']} />}>
                <Route path="/department/*" element={<DepartmentDashboard />} />
              </Route>
              
              {/* Storekeeper Routes */}
              <Route element={<ProtectedRoute allowedRoles={['storekeeper']} />}>
                <Route path="/store/*" element={<StorekeeperDashboard />} />
              </Route>
              
              {/* Staff Routes */}
              <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
                <Route path="/staff/*" element={<StaffDashboard />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
