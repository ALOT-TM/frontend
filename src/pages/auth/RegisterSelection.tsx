import { useNavigate, Link } from "react-router-dom";
import { Building2, HeartHandshake, ArrowLeft } from "lucide-react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

export const RegisterSelection = () => {
  const navigate = useNavigate();

  return (
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Volver a inicio de sesión
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Únete a Fluxus</h2>
          <p className="text-slate-600">Selecciona el perfil que mejor describe a tu organización</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/register/retail")}
            className={cn(
              "flex flex-col items-center text-center p-8 rounded-2xl border border-slate-200",
              "bg-white hover:bg-slate-50",
              "transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
            )}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-8 h-8 text-primary transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Empresa Retail</h3>
            <p className="text-sm text-slate-600">
              Gestiona tu merma, reduce desperdicios y optimiza tus locales comerciales.
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/register/beneficiary")}
            className={cn(
              "flex flex-col items-center text-center p-8 rounded-2xl border border-slate-200",
              "bg-white hover:bg-slate-50",
              "transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
            )}
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
              <HeartHandshake className="w-8 h-8 text-accent transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Institución Beneficiaria</h3>
            <p className="text-sm text-slate-600">
              Recibe donaciones de productos en perfecto estado para ayudar a tu comunidad.
            </p>
          </motion.button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
  );
};
