import { useState, useEffect } from "react";

export interface DecodedToken {
  sub: string;
  email: string;
  actor: "RETAIL" | "BENEFICIARY";
  companyId?: number;
  beneficiaryInstitutionId?: number;
  roleId?: number;
  roleName?: string;
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
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

export const useAuth = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Helper flags for roles
  const rawRoleName = user?.roleName || "";
  const role = rawRoleName.toUpperCase().replace(/\s/g, "_");
  const isManager = role === "RETAIL_MANAGER" || role === "ROLE_RETAIL_MANAGER";
  const isOperator = role === "RETAIL_OPERATOR" || role === "ROLE_RETAIL_OPERATOR";
  const isAuditor = role === "RETAIL_AUDITOR" || role === "ROLE_RETAIL_AUDITOR" || role === "INSPECTOR_CALIDAD" || rawRoleName === "Inspector de Calidad";
  const isAnalyst = role === "RETAIL_ANALYST" || role === "ROLE_RETAIL_ANALYST";
  const isRsc = role === "RETAIL_RSC" || role === "ROLE_RETAIL_RSC";

  return {
    user,
    role,
    loading,
    logout,
    isManager,
    isOperator,
    isAuditor,
    isAnalyst,
    isRsc,
  };
};
