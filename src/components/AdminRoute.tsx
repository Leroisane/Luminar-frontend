import ProtectedRoute from "./ProtectedRoute";

interface AdminRouteProps {
  children: React.ReactNode;
}

/** Shorthand guard khusus role admin */
export default function AdminRoute({ children }: AdminRouteProps) {
  return <ProtectedRoute allowedRole="admin">{children}</ProtectedRoute>;
}
