import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  UserCircle,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { useRetailLayout } from "../../components/layouts/RetailLayout";
import { useAuth } from "../../hooks/useAuth";

export const Configuracion = () => {
  const [activeTab, setActiveTab] = useState<"usuario" | "empresa" | "seguridad" | "suscripcion">("usuario");
  const { setCompanyName: setHeaderCompanyName, setUsername: setHeaderUsername } = useRetailLayout();
  const { hasPermission } = useAuth();
  const isFullAccess = hasPermission("Todo el sistema");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const parts = formatted.split(" ");
    if (parts.length >= 3) {
      parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
    }
    return parts.join(" ");
  };

  // --- Perfil de Usuario State ---
  const [username, setUsername] = useState("");
  const [userRecoveryEmail, setUserRecoveryEmail] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);

  const parseJwtUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const userId = parseJwtUserId();
        if (userId) {
          const userResponse = await api.get(`/auth/users/${userId}`);
          const fetchedUsername = userResponse.data?.username || "";
          const fetchedEmail = userResponse.data?.email || "";
          const fetchedCreatedAt = userResponse.data?.createdAt || "";
          setUsername(fetchedUsername);
          setUserRecoveryEmail(fetchedEmail);
          setUserCreatedAt(fetchedCreatedAt);
          setInitialUsername(fetchedUsername);
          setInitialEmail(fetchedEmail);

          const companyId = userResponse.data?.retailCompanyId;
          if (companyId) {
            const companyResponse = await api.get(`/retail-companies/${companyId}`);
            const fetchedCompanyName = companyResponse.data?.name || "";
            setCompanyName(fetchedCompanyName);
            setInitialCompanyName(fetchedCompanyName);
          }
        }
      } catch (err) {
        console.error("Error loading user profile", err);
      }
    })();
  }, []);

  useEffect(() => {
    setHasUserChanges(
      username !== initialUsername || 
      userRecoveryEmail !== initialEmail
    );
  }, [username, userRecoveryEmail, initialUsername, initialEmail]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const response = await api.put("/auth/profile", {
        username,
        email: userRecoveryEmail
      });
      const updatedUser = response.data;
      setUsername(updatedUser.username);
      setUserRecoveryEmail(updatedUser.email);
      setInitialUsername(updatedUser.username);
      setInitialEmail(updatedUser.email);
      setHeaderUsername(updatedUser.username);
      toast.success("Perfil de usuario actualizado");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setIsSavingUser(false);
    }
  };

  // --- Configuración de Empresa State ---
  const [companyName, setCompanyName] = useState("");
  const [initialCompanyName, setInitialCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("+1 234 567 8900");
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [hasCompanyChanges, setHasCompanyChanges] = useState(false);

  useEffect(() => {
    setHasCompanyChanges(
      companyName !== initialCompanyName && 
      companyName !== ""
    );
  }, [companyName, initialCompanyName]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      const userId = parseJwtUserId();
      if (!userId) return;

      const userResponse = await api.get(`/auth/users/${userId}`);
      const companyId = userResponse.data?.retailCompanyId;
      if (companyId) {
        const response = await api.put(`/retail-companies/${companyId}`, {
          name: companyName
        });
        const updatedName = response.data?.name || "";
        setCompanyName(updatedName);
        setInitialCompanyName(updatedName);
        setHeaderCompanyName(updatedName);
        toast.success("Datos de empresa actualizados");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar la empresa");
    } finally {
      setIsSavingCompany(false);
    }
  };

  // --- Seguridad State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("La contraseña debe incluir al menos un carácter especial (ej. !, @, #, $)");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada correctamente");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setIsSavingPassword(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración de Empresa y Cuenta</h2>
        <p className="text-sm text-slate-500 mt-1">Administra la identidad de tu empresa, tu suscripción y credenciales.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Menú Lateral */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab("usuario")}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                activeTab === "usuario"
                  ? "bg-white text-primary shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
              )}
            >
              <UserCircle className="w-5 h-5 mr-3" />
              Perfil de Usuario
            </button>
            <button
              onClick={() => setActiveTab("empresa")}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                activeTab === "empresa"
                  ? "bg-white text-primary shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
              )}
            >
              <Building2 className="w-5 h-5 mr-3" />
              Config. de Empresa
            </button>
            <button
              onClick={() => setActiveTab("seguridad")}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                activeTab === "seguridad"
                  ? "bg-white text-primary shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
              )}
            >
              <Shield className="w-5 h-5 mr-3" />
              Seguridad
            </button>
            <button
              onClick={() => setActiveTab("suscripcion")}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                activeTab === "suscripcion"
                  ? "bg-white text-primary shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
              )}
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Suscripción
            </button>
          </nav>
        </aside>

        {/* Contenido */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            
            {/* PESTAÑA: Perfil de Usuario */}
            {activeTab === "usuario" && (
              <motion.div
                key="usuario"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } }}
                className="bg-white border border-slate-200/60 p-8 rounded-2xl shadow-sm"
              >
                <form onSubmit={handleSaveUser} className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-start gap-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ajustes Personales</h3>
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold tracking-tight">
                        <UserCircle className="w-10 h-10 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900">@{username}</p>
                        <p className="text-xs text-slate-500">Administrador de Cuenta</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Correo de recuperación</label>
                      <input
                        type="email"
                        value={userRecoveryEmail}
                        onChange={(e) => setUserRecoveryEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={!hasUserChanges || isSavingUser}
                      className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center shadow-sm"
                    >
                      {isSavingUser ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                      ) : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* PESTAÑA: Configuración de Empresa */}
            {activeTab === "empresa" && (
              <motion.div
                key="empresa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } }}
                className="bg-white border border-slate-200/60 p-8 rounded-2xl shadow-sm"
              >
                <form onSubmit={handleSaveCompany} className="space-y-8">
                  {/* Logo Section */}
                  <div className="flex flex-col items-start gap-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Identidad Corporativa</h3>
                    <div className="flex flex-col space-y-4">
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                        <Building2 className="w-8 h-8 text-slate-300" />
                      </div>
                      <button 
                        type="button" 
                        disabled={!isFullAccess}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm self-start disabled:opacity-50 disabled:cursor-not-allowed">
                        Cambiar logo
                      </button>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Razón Social / Nombre de Empresa</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={!isFullAccess}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Teléfono Corporativo</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        disabled={!isFullAccess}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Miembro desde</label>
                      <input
                        type="text"
                        value={formatDate(userCreatedAt)}
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={!hasCompanyChanges || isSavingCompany || !isFullAccess}
                      className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center shadow-sm"
                    >
                      {isSavingCompany ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                      ) : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* PESTAÑA: Seguridad */}
            {activeTab === "seguridad" && (
              <motion.div
                key="seguridad"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } }}
                className="bg-white border border-slate-200/60 p-8 rounded-2xl shadow-sm"
              >
                <div className="space-y-8">

                  {/* Password Form */}
                  <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Credenciales</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Contraseña Actual</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-900 shadow-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Confirmar Nueva Contraseña</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn(
                            "w-full pl-4 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all bg-white text-slate-900 shadow-sm",
                            confirmPassword && newPassword !== confirmPassword 
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                              : "border-slate-200 focus:border-primary focus:ring-primary"
                          )}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center shadow-sm"
                      >
                        {isSavingPassword ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Actualizando...</>
                        ) : "Actualizar Contraseña"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PESTAÑA: Suscripción */}
            {activeTab === "suscripcion" && (
              <motion.div
                key="suscripcion"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } }}
                className="bg-white border border-slate-200/60 p-8 rounded-2xl shadow-sm"
              >
                <div className="space-y-8">
                  {/* Plan Info */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-900 rounded-2xl text-white shadow-md">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold">Plan Enterprise</h3>
                      </div>
                      <p className="text-slate-400 text-sm">Tu suscripción se renueva el 15 de Octubre de 2026.</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <button 
                        disabled={!isFullAccess}
                        className="px-6 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Gestionar Plan
                      </button>
                    </div>
                  </div>

                  {/* Usage Bars */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Uso y Límites</h3>
                    
                    <div className="space-y-6">
                      {/* Locales */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">Locales utilizados</span>
                          <span className="text-slate-500"><strong className="text-slate-900">8</strong> de 10</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "80%" }} />
                        </div>
                      </div>

                      {/* Usuarios */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">Usuarios activos</span>
                          <span className="text-slate-500"><strong className="text-slate-900">5</strong> de 20</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: "25%" }} />
                        </div>
                      </div>

                      {/* Almacenamiento */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">Almacenamiento de merma</span>
                          <span className="text-slate-500"><strong className="text-slate-900">45%</strong> de 500GB</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: "45%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
