import React, { useState } from "react";
import { User, Mail, Lock, Building, MapPin, FileText, Save, Loader2, LogOut, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

export const ConfiguracionBeneficiario = () => {
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCreds(true);
    setTimeout(() => {
      setIsSavingCreds(false);
      toast.success("Credenciales actualizadas correctamente");
    }, 1500);
  };

  const handleSaveLocal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocal(true);
    setTimeout(() => {
      setIsSavingLocal(false);
      toast.success("Información del local guardada");
    }, 1500);
  };

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
                  defaultValue="FundacionAyudaSur"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  defaultValue="contacto@fundacionayudasur.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100"></div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
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
              <label className="text-sm font-medium text-slate-700 block">Nombre de la Institución / Sede</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  defaultValue="Fundación Ayuda Sur - Sede Central"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Dirección Principal</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-slate-400 w-5 h-5" />
                <textarea
                  rows={3}
                  defaultValue="Av. Los Pinos 456, Surco. Edificio B, Primer Piso."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Notas o Referencias (Opcional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-4 text-slate-400 w-5 h-5" />
                <textarea
                  rows={3}
                  defaultValue="Puerta verde al lado de la comisaría. Timbre 2."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
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
