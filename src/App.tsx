import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

// Pages
import Dashboard from "./pages/Dashboard";
import AdminApprovalPage from "./pages/AdminApprovalPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import AdminItemsPage from "./pages/AdminItemsPage";
import AdminRoomsPage from "./pages/AdminRoomsPage";
import AdminLembagaPage from "./pages/AdminLembagaPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminReportsPage from "./pages/AdminReportsPage";

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Store
import { useAuthStore } from "./store/useAuthStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30 detik
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
          {/* ===== Rute Publik ===== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ===== Rute Mahasiswa ===== */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="mahasiswa">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute allowedRole="mahasiswa">
                <BookingDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ===== Rute Admin ===== */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminApprovalPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <AdminRoute>
                <AdminRoomsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <AdminRoute>
                <AdminItemsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/lembaga"
            element={
              <AdminRoute>
                <AdminLembagaPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AdminAuditPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />

          {/* ===== Fallback ===== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
