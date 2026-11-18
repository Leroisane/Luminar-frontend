import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import AdminApprovalPage from "./pages/AdminApprovalPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function SessionSync() {
  const syncProfile = useAuthStore((state) => state.syncProfile);

  useEffect(() => {
    void syncProfile();
  }, [syncProfile]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SessionSync />
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rute Terproteksi Mahasiswa */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="mahasiswa">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Rute Terproteksi Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
