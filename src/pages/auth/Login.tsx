import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../services/api";
import { isAxiosError } from "axios";
import { cn } from "../../utils/cn";
import logoUrl from "../../assets/fluxusmini.png";
import { decodeToken } from "../../components/auth/ProtectedRoute";

export const Login = () => {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", {
        email: emailRef.current?.value || "",
        rawPassword: passwordRef.current?.value || "",
      });
      const token = response.data?.token;
      if (!token) {
        throw new Error("Token missing");
      }
      localStorage.setItem("token", token);

      const payload = decodeToken(token);
      if (payload && payload.actor === "BENEFICIARY") {
        navigate("/beneficiary/buscar");
      } else {
        navigate("/retail/dashboard");
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403 || status === 404 || status === 400) {
          toast.error("Acceso denegado", {
            description: "El correo o la contraseña son incorrectos.",
            id: "login-error",
          });
        } else {
          toast.error("Error al iniciar sesión", {
            description: error.response.data?.message || `Ocurrió un error en el servidor (Código: ${status}).`,
            id: "login-error",
          });
        }
      } else {
        toast.error("Error de conexión", {
          description: "No se pudo conectar con el servidor. Inténtalo más tarde.",
          id: "login-error",
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
          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Fluxus</h2>
          <p className="text-slate-600 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Correo Electronico</label>
            <input
              type="email"
              ref={emailRef}
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
                "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
              placeholder="admin@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              ref={passwordRef}
              className={cn(
                "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl",
                "text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
              placeholder="••••••••"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            ¿No tienes una cuenta?{" "}
            <button
              onClick={() => navigate("/register-selection")}
              className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
            >
              Registrarse
            </button>
          </p>
        </div>
      </div>
  );
};
