import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userActor = user.actor; // "RETAIL" or "BENEFICIARY"
  const normalizedRole = role.startsWith("ROLE_") ? role.substring(5) : role;

  const isAllowed = 
    allowedRoles.includes(userActor) || 
    allowedRoles.includes(role) || 
    allowedRoles.includes(normalizedRole);

  if (!isAllowed) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
