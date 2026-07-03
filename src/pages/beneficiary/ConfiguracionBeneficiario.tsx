import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Building, MapPin, FileText, Save, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export const ConfiguracionBeneficiario = () => {
  const navigate = useNavigate();

  // Loader states
  const [loading, setLoading] = useState(true);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  // --- Credenciales State ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Local State ---
  const [institutionName, setInstitutionName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [notes, setNotes] = useState("");

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

  const loadBeneficiaryConfig = async () => {
    setLoading(true);
    try {
      const userId = parseJwtUserId();
      if (!userId) return;

      // 1. Fetch user account details
      const userRes = await api.get(`/auth/users/${userId}`);
      setUsername(userRes.data?.username || "");
      setEmail(userRes.data?.email || "");

      const beneficiaryId = userRes.data?.beneficiaryInstitutionId;
      if (beneficiaryId) {
        // 2. Fetch beneficiary institution
        const instRes = await api.get(`/beneficiary-institutions/${beneficiaryId}`);
        setInstitutionName(instRes.data?.name || "");

        // 3. Fetch headquarter info
        const hqsRes = await api.get("/beneficiary-institution-headquarters");
        const myHq = hqsRes.data?.find(
          (hq: any) => hq.beneficiaryInstitution?.beneficiaryInstitutionId === beneficiaryId
        );

        if (myHq) {
          setNotes(myHq.description || "");
          setAddressLine(myHq.address?.street1 || "");
        }
      }
    } catch (err) {
      console.error("Error loading beneficiary configuration", err);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaryConfig();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCreds(true);
    try {
      // Update profile (username, email)
      await api.put("/auth/profile", {
        username,
        email
      });

      // Update password if fields are filled
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          setIsSavingCreds(false);
          return;
        }
        if (!currentPassword) {
          toast.error("Debe ingresar su contraseña actual para cambiarla");
          setIsSavingCreds(false);
          return;
        }
        await api.put("/auth/change-password", {
          currentPassword,
          newPassword
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.success("Credenciales actualizadas correctamente");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar credenciales");
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleSaveLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocal(true);
    try {
      await api.put("/beneficiary-institutions/me", {
        name: institutionName,
        address: addressLine,
        notes: notes
      });
      toast.success("Información del local guardada");
      loadBeneficiaryConfig();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar información del local");
    } finally {
      setIsSavingLocal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configuración</h1>
          <p className="text-slate-500 mt-2">Administra tu cuenta y los detalles de tu institución.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors shadow-sm focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna 1: Credenciales */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Seguridad de la Cuenta</h2>
            <p className="text-sm text-slate-500 mt-1">Actualiza tu información de acceso y contraseña.</p>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Nombre de Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100"></div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Contraseña Actual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Ingrese contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Repetir nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSavingCreds}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 shadow-sm"
              >
                {isSavingCreds ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Credenciales
              </button>
            </div>
          </form>
        </div>

        {/* Columna 2: Información del Local */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Información del Local</h2>
            <p className="text-sm text-slate-500 mt-1">Detalles de tu sede principal para las recolecciones.</p>
          </div>

          <form onSubmit={handleSaveLocal} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Nombre de la Sede / Institución</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Dirección Principal</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-slate-400 w-5 h-5" />
                <textarea
                  rows={3}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Notas o Referencias</label>
              <div className="relative">
                <FileText className="absolute left-3 top-4 text-slate-400 w-5 h-5" />
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={isSavingLocal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70 shadow-sm"
              >
                {isSavingLocal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Información
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
