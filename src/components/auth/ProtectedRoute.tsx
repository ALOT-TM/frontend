import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const decodeToken = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const payload = decodeToken(token);
  if (!payload) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  const userRole = payload.actor; // "RETAIL" o "BENEFICIARY"

  if (!allowedRoles.includes(userRole)) {
    // Si intenta ingresar a retail pero es beneficiario, o viceversa, lo redirigimos a su base correcta
    if (userRole === "RETAIL") {
      return <Navigate to="/retail/dashboard" replace />;
    }
    if (userRole === "BENEFICIARY") {
      return <Navigate to="/beneficiary/buscar" replace />;
    }
    
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
