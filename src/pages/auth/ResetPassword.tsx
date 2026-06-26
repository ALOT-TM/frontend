import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../services/api";
import { isAxiosError } from "axios";
import { cn } from "../../utils/cn";
import logoUrl from "../../assets/fluxusmini.png";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // Step 1: Verify Token, Step 2: Set New Password
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Pre-fill email from query parameter if present
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("El correo electrónico es requerido.");
      return;
    }
    if (!token) {
      toast.error("Por favor ingresa el código de recuperación.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/verify-token", {
        email,
        token: token.trim().toUpperCase(),
      });
      toast.success("Código verificado", {
        description: "El código es válido. Por favor define tu nueva contraseña.",
      });
      setStep(2); // Go to step 2
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error("Código inválido", {
          description: error.response.data?.message || "El código ingresado es incorrecto o ha expirado.",
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPassword = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";

    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        token: token.trim().toUpperCase(),
        newPassword,
      });
      toast.success("Contraseña restablecida", {
        description: "Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.",
      });
      navigate("/login");
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error("Error al restablecer contraseña", {
          description: error.response.data?.message || "Ocurrió un error en el servidor.",
        });
      } else {
        toast.error("Error de conexión", {
          description: "No se pudo restablecer la contraseña. Inténtalo más tarde.",
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
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          {step === 1 ? "Validar Código" : "Nueva Contraseña"}
        </h2>
        <p className="text-slate-600 text-sm">
          {step === 1 
            ? "Ingresa el código que enviamos a tu correo para continuar" 
            : "Define la nueva contraseña de seguridad para tu cuenta"}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleVerifyToken} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@empresa.com"
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
                "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Código de Recuperación</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              maxLength={8}
              placeholder="ABC123XY"
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-center font-mono font-bold tracking-widest text-lg",
                "text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
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
            {isSubmitting ? "Validando..." : "Validar Código"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
            <input
              type="password"
              ref={passwordRef}
              required
              placeholder="Mínimo 6 caracteres"
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
                "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
            <input
              type="password"
              ref={confirmPasswordRef}
              required
              placeholder="Repite la contraseña"
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
                "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
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
            {isSubmitting ? "Restableciendo..." : "Restablecer Contraseña"}
          </button>
        </form>
      )}

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
