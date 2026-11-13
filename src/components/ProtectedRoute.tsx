import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getProfileApi } from "../api/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "admin" | "mahasiswa";
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { token, user, setAuth, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setIsChecking(false);
        return;
      }

      if (!user) {
        try {
          const res = await getProfileApi();
          const profileData = res?.data || res;
          setAuth(profileData, token);
        } catch {
          logout();
        }
      }
      setIsChecking(false);
    };

    verifyUser();
  }, [token, user, setAuth, logout]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm text-gray-500">
        Memverifikasi sesi akun...
      </div>
    );
  }

  // Jika belum login, lempar ke /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Cek kesesuaian role jika dibatasi
  const userRole = user?.role?.toLowerCase();
  if (allowedRole && userRole && userRole !== allowedRole) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
}
