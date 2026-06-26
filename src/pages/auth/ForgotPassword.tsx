import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../services/api";
import { isAxiosError } from "axios";
import { cn } from "../../utils/cn";
import logoUrl from "../../assets/fluxusmini.png";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value || "";
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Código enviado", {
        description: "Se ha enviado un código de recuperación a tu correo electrónico.",
      });
      // Redirect to the verification screen passing the email as state or query param
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error("Error al enviar código", {
          description: error.response.data?.message || "No se pudo procesar la solicitud.",
        });
      } else {
        toast.error("Error de conexión", {
          description: "No se pudo conectar con el servidor. Inténtalo más tarde.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src={logoUrl} 
            alt="Fluxus Logo" 
            className="h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Recuperar Contraseña</h2>
        <p className="text-slate-600 text-sm">
          Ingresa tu dirección de correo para recibir un código de recuperación
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
          <input
            type="email"
            ref={emailRef}
            required
            className={cn(
              "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
              "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all duration-200"
            )}
            placeholder="admin@empresa.com"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl",
            "transition-all duration-200 shadow-md hover:shadow-lg",
            "transform active:scale-[0.98]",
            "disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Enviando..." : "Enviar Código"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/login")}
          className="text-primary hover:text-primary/80 font-semibold text-sm transition-colors duration-200"
        >
          Volver al Inicio de Sesión
        </button>
      </div>
    </div>
  );
};
