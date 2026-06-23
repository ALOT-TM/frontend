import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, CreditCard, Lock, Building2, User, Mail, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { planService } from "../../services/planService";

interface Plan {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

export const RetailRegistration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const plan = location.state?.plan as Plan | undefined;

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Card states for Stripe simulation
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/26");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardName, setCardName] = useState("Retail Solutions");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const getPaymentMethodId = (num: string): string => {
    const cleanNumber = num.replace(/\s+/g, "");
    if (cleanNumber === "4242424242424242") return "pm_card_visa";
    if (cleanNumber === "4000000000000002") return "pm_card_chargeDeclined";
    if (cleanNumber === "4000000000000023") return "pm_card_chargeDeclinedExpiredCard";
    return "pm_invalid_card_format";
  };

  useEffect(() => {
    if (!plan) {
      navigate("/register/retail");
    }
  }, [plan, navigate]);


  if (!plan) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailIsValid = /^\S+@\S+\.\S+$/.test(email.trim());
    if (!emailIsValid) {
      toast.error("Correo inválido", { description: "Por favor, ingresa un correo electrónico válido.", id: "reg-val" });
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Usuario muy corto", { description: "El username debe tener al menos 3 caracteres.", id: "reg-val" });
      return;
    }
    if (password.length < 6) {
      toast.error("Contraseña muy corta", { description: "La contraseña debe tener al menos 6 caracteres.", id: "reg-val" });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden", { description: "Asegúrate de escribir la misma contraseña en ambos campos.", id: "reg-val" });
      return;
    }
    setStep(2);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      const companyResponse = await api.post("/retail-companies", {
        name: companyName,
      });

      const companyId = companyResponse.data?.retailCompanyId ?? companyResponse.data?.id;
      if (!companyId) {
        throw new Error("Company id missing");
      }

      // Vincular la compañía con el plan seleccionado creando la suscripción
      const paymentMethodId = getPaymentMethodId(cardNumber);
      await planService.startSubscription(companyId, plan.id, paymentMethodId);

      await api.post("/auth/register", {
        email,
        rawPassword: password,
        username,
        actor: "RETAIL",
        retailCompanyId: companyId,
        beneficiaryInstitutionId: null,
      });

      toast.success("Cuenta creada exitosamente");
      navigate("/login");
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const errMsg = error.response.data?.message || "No se pudo completar el registro. Revisa los datos.";
        setPaymentError(errMsg);
        toast.error("Error en el registro", {
          description: errMsg,
          id: "reg-api",
        });
      } else {
        const errMsg = "No se pudo conectar con el servidor. Inténtalo más tarde.";
        setPaymentError(errMsg);
        toast.error("Error de conexión", {
          description: errMsg,
          id: "reg-api",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Plan Summary */}
        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
          <button
            onClick={() => step === 1 ? navigate("/register/retail") : setStep(1)}
            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm mb-8 group w-fit focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            {step === 1 ? "Volver a planes" : "Volver a datos"}
          </button>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Plan seleccionado</h3>
            <div className={cn(
              "p-6 rounded-2xl border",
              plan.highlighted ? "bg-white border-primary shadow-md" : "bg-white border-slate-200"
            )}>
              <h4 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.price !== "A medida" && <span className="text-slate-500 text-sm">/mes</span>}
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-4 h-4 text-primary mr-2 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-700 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Form */}
        <div className="w-full md:w-2/3 p-8 relative overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Crea tu cuenta de empresa</h2>
                  <p className="text-slate-500 mt-1">Completa tus datos para comenzar a gestionar tu merma.</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-5 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Nombre de la Empresa</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="Ej. Supermercados del Centro"
                        />
                      </div>
                    </div>


                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="correo@empresa.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="adminretail"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md"
                    >
                      Continuar al Pago
                    </button>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                      ¿Ya tienes una cuenta?{" "}
                      <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                        Inicia sesión aquí
                      </Link>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Checkout Seguro</h2>
                  <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    Transacción cifrada de extremo a extremo.
                  </p>
                </div>

                {paymentError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-red-800">Error de pago</p>
                      <p className="text-red-700 mt-0.5">{paymentError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCheckoutSubmit} className="space-y-6 flex-1">
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Información de la Tarjeta</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(e.target.value);
                            setPaymentError(null);
                          }}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-t-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                          placeholder="Número de Tarjeta"
                        />
                      </div>
                      <div className="flex -mt-px">
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => {
                            setCardExpiry(e.target.value);
                            setPaymentError(null);
                          }}
                          className="w-1/2 px-4 py-2.5 bg-white border border-slate-200 rounded-bl-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm focus:z-10 relative"
                          placeholder="MM/AA"
                        />
                        <input
                          type="text"
                          required
                          value={cardCvc}
                          onChange={(e) => {
                            setCardCvc(e.target.value);
                            setPaymentError(null);
                          }}
                          className="w-1/2 px-4 py-2.5 bg-white border border-slate-200 -ml-px rounded-br-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm focus:z-10 relative"
                          placeholder="CVC"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nombre del Titular</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => {
                          setCardName(e.target.value);
                          setPaymentError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        placeholder="Nombre en la tarjeta"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando Pago...
                        </>
                      ) : (
                        `Registrarse y Pagar ${plan.price === 'A medida' ? '' : plan.price}`
                      )}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                      Al hacer clic, aceptas nuestros Términos de Servicio y Políticas de Privacidad.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
};
