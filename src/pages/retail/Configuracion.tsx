import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Building2, 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  UserCircle,
  CreditCard,
  CheckCircle2,
  CalendarDays,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { useRetailLayout } from "../../components/layouts/RetailLayout";
import { useAuth } from "../../hooks/useAuth";
import { planService, type PlanDto, type SubscriptionDto } from "../../services/planService";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

export const Configuracion = () => {
  const [activeTab, setActiveTab] = useState<"usuario" | "empresa" | "seguridad" | "suscripcion">("usuario");
  const { setCompanyName: setHeaderCompanyName, setUsername: setHeaderUsername } = useRetailLayout();
  const { hasPermission } = useAuth();
  const isFullAccess = hasPermission("Todo el sistema");
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isManagingPlan, setIsManagingPlan] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

  const loadSubscription = useCallback(async () => {
    setIsLoadingSubscription(true);
    try {
      const availablePlans = await planService.getPlans();
      setPlans(availablePlans);

      try {
        setSubscription(await planService.getCurrentSubscription());
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setSubscription(null);
        } else {
          throw error;
        }
      }
    } catch {
      toast.error("No se pudo cargar la suscripción.");
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  const handleChangePlan = async (plan: PlanDto) => {
    if (!subscription || plan.planId === subscription.plan.planId) return;
    if (!window.confirm(`¿Cambiar del plan ${subscription.plan.name} al plan ${plan.name}?`)) return;

    setIsUpdatingSubscription(true);
    try {
      const updated = await planService.changeCurrentPlan(plan.planId);
      setSubscription(updated);
      toast.success(`Plan actualizado a ${updated.plan.name}.`);
    } catch {
      toast.error("No se pudo cambiar el plan.");
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !window.confirm("¿Cancelar la renovación de la suscripción?")) return;

    setIsUpdatingSubscription(true);
    try {
      setSubscription(await planService.cancelCurrentSubscription());
      toast.success("La renovación fue cancelada.");
    } catch {
      toast.error("No se pudo cancelar la renovación.");
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    setIsUpdatingSubscription(true);
    try {
      setSubscription(await planService.reactivateCurrentSubscription());
      toast.success("La suscripción fue reactivada.");
    } catch {
      toast.error("No se pudo reactivar la suscripción.");
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

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

  // --- Configuración de Empresa State ---
  const [companyName, setCompanyName] = useState("");
  const [initialCompanyName, setInitialCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("+1 234 567 8900");
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const hasUserChanges = username !== initialUsername || userRecoveryEmail !== initialEmail;
  const hasCompanyChanges = companyName !== initialCompanyName && companyName !== "";

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
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al actualizar perfil"));
    } finally {
      setIsSavingUser(false);
    }
  };

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
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al actualizar la empresa"));
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
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al actualizar contraseña"));
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
              onClick={() => {
                setActiveTab("suscripcion");
                void loadSubscription();
              }}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-900 rounded-2xl text-white shadow-md">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {isLoadingSubscription ? (
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                      ) : (
                        <CheckCircle2 className={cn(
                          "w-5 h-5",
                          subscription?.status === "ACTIVE" ? "text-emerald-400" : "text-amber-400"
                        )} />
                      )}
                      <h3 className="text-lg font-bold">
                        {isLoadingSubscription
                          ? "Cargando plan..."
                          : subscription
                            ? `Plan ${subscription.plan.name}`
                            : "Sin suscripción registrada"}
                      </h3>
                      {subscription && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold",
                          subscription.status === "ACTIVE"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-amber-400/15 text-amber-300"
                        )}>
                          {subscription.status === "ACTIVE" ? "Activa" : subscription.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <p>
                        {!subscription
                          ? "No se encontró una suscripción asociada a tu empresa."
                          : subscription.status === "CANCELLED"
                            ? `La renovación está cancelada. El acceso finaliza el ${formatDate(subscription.endDate || undefined)}.`
                            : `Tu suscripción se renueva el ${formatDate(subscription.endDate || undefined)}.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManagingPlan(true)}
                    disabled={!isFullAccess || isLoadingSubscription || !subscription}
                    className="shrink-0 px-6 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gestionar Plan
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isManagingPlan && subscription && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isUpdatingSubscription && setIsManagingPlan(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="manage-plan-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <h2 id="manage-plan-title" className="text-xl font-bold text-slate-900">Gestionar plan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Plan actual: <strong className="text-slate-700">{subscription.plan.name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManagingPlan(false)}
                  disabled={isUpdatingSubscription}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => {
                    const isCurrentPlan = plan.planId === subscription.plan.planId;
                    return (
                      <div
                        key={plan.planId}
                        className={cn(
                          "flex flex-col rounded-2xl border p-5 transition-colors",
                          isCurrentPlan ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                        )}
                      >
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                            {isCurrentPlan && (
                              <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
                                Actual
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-2xl font-extrabold text-slate-900">
                            ${Number(plan.price).toFixed(2)}
                            <span className="text-sm font-normal text-slate-500"> / mes</span>
                          </p>
                        </div>

                        <ul className="mb-6 space-y-2 text-sm text-slate-600">
                          <li>{plan.maxUsers >= 999 ? "Usuarios ilimitados" : `Hasta ${plan.maxUsers} usuarios`}</li>
                          <li>{plan.maxStorage >= 99999 ? "Registros ilimitados" : `Hasta ${plan.maxStorage.toLocaleString("es-PE")} registros`}</li>
                        </ul>

                        <button
                          type="button"
                          onClick={() => void handleChangePlan(plan)}
                          disabled={isCurrentPlan || isUpdatingSubscription || subscription.status !== "ACTIVE"}
                          className={cn(
                            "mt-auto rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            isCurrentPlan
                              ? "bg-slate-100 text-slate-500"
                              : "bg-primary text-white hover:bg-primary/90"
                          )}
                        >
                          {isCurrentPlan ? "Plan actual" : "Cambiar a este plan"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {subscription.status === "CANCELLED" ? "Renovación cancelada" : "Renovación automática"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {subscription.status === "CANCELLED"
                        ? `Tu acceso finaliza el ${formatDate(subscription.endDate || undefined)}.`
                        : `La próxima renovación es el ${formatDate(subscription.endDate || undefined)}.`}
                    </p>
                  </div>

                  {subscription.status === "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() => void handleReactivateSubscription()}
                      disabled={isUpdatingSubscription}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isUpdatingSubscription ? "Procesando..." : "Reactivar suscripción"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCancelSubscription()}
                      disabled={isUpdatingSubscription}
                      className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isUpdatingSubscription ? "Procesando..." : "Cancelar renovación"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
