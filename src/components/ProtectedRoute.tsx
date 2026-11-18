import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getProfileApi } from "../api/authService";
import LoadingSpinner from "./ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "admin" | "mahasiswa";
  /** Override redirect target. Default: /login untuk unauth, role-based untuk wrong role */
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRole,
  redirectTo,
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

      if (user) {
        if (
          typeof user === "object" &&
          typeof user.role === "string" &&
          user.role.trim() !== ""
        ) {
          if (isMounted) setIsChecking(false);
          return;
        }
        await logout();
        if (isMounted) setIsChecking(false);
        return;
      }

      if (token.startsWith("dev-token-")) {
        await logout();
        if (isMounted) setIsChecking(false);
        return;
      }

      try {
        const res = await getProfileApi();
        const profileData = res?.data ?? (res as unknown as typeof res.data);
        if (
          profileData &&
          typeof profileData === "object" &&
          typeof profileData.role === "string" &&
          profileData.role.trim() !== ""
        ) {
          setAuth(profileData, token);
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    void verifyUser();
    return () => { isMounted = false; };
  }, [token, user, setAuth, logout]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Memverifikasi sesi akun..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to={redirectTo ?? "/login"} replace />;
  }

  const userRole =
    typeof user === "object" && user !== null && typeof user.role === "string"
      ? user.role.toLowerCase().trim()
      : undefined;

  if (!userRole) {
    return <Navigate to={redirectTo ?? "/login"} replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return (
      <Navigate
        to={redirectTo ?? (userRole === "admin" ? "/admin" : "/")}
        replace
      />
    );
  }

  return <>{children}</>;
}
