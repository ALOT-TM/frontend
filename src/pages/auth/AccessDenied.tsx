import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (user?.actor === "RETAIL") {
      navigate("/retail/dashboard");
    } else if (user?.actor === "BENEFICIARY") {
      navigate("/beneficiary/buscar");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative z-10"
      >
        {/* Glow effect around the container */}
        <div className="absolute inset-0 rounded-3xl border border-red-500/20 pointer-events-none animate-pulse" />

        {/* Shield Icon container with dynamic ring animations */}
        <div className="flex justify-center mb-6 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.15, stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative"
          >
            <ShieldAlert className="w-10 h-10" />
          </motion.div>
        </div>

        {/* Text Details */}
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">403</h1>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Acceso Restringido</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          Lo sentimos, tu rol actual no cuenta con los privilegios suficientes para visualizar este apartado de Fluxus.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_25px_rgba(79,70,229,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
