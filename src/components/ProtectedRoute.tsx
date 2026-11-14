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
    let isMounted = true;

    const verifyUser = async () => {
      if (!token) {
        if (isMounted) setIsChecking(false);
        return;
      }

      // Validasi objek user yang sudah ada di store / localStorage
      if (user) {
        if (
          typeof user === "object" &&
          typeof user.role === "string" &&
          user.role.trim() !== ""
        ) {
          if (isMounted) setIsChecking(false);
          return;
        }
        // Data user korup atau tidak punya role -> bersihkan sesi
        logout();
        if (isMounted) setIsChecking(false);
        return;
      }

      // Jika memakai token dev lokal tetapi data auth_user hilang -> paksa login ulang
      if (token.startsWith("dev-token-")) {
        logout();
        if (isMounted) setIsChecking(false);
        return;
      }

      // Verifikasi token asli ke backend saat user belum ada di store
      try {
        const res = await getProfileApi();
        const profileData = res?.data || res;

        if (
          typeof profileData === "object" &&
          profileData !== null &&
          typeof profileData.role === "string" &&
          profileData.role.trim() !== ""
        ) {
          setAuth(profileData, token);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [token, user, setAuth, logout]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm text-gray-500">
        Memverifikasi sesi akun...
      </div>
    );
  }

  // 1. Belum login -> paksa ke /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole =
    typeof user === "object" && user !== null && typeof user.role === "string"
      ? user.role.toLowerCase().trim()
      : undefined;

  // 2. Role kosong/tidak valid -> jangan pernah loloskan ke halaman terproteksi
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role tidak cocok dengan rute yang diketik di URL -> kembalikan ke dashboard aslinya
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
}
