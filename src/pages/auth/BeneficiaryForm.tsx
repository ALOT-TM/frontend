import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Building, Mail, MapPin, User, Lock, ChevronDown, Loader2, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../services/api";
import { isAxiosError } from "axios";

interface Option {
  value: string;
  label: string;
}

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon 
}: { 
  options: Option[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string; 
  icon?: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-all shadow-sm cursor-pointer flex items-center h-[42px] relative z-10",
          Icon ? "pl-10" : "pl-4",
          !value && "text-slate-500",
          isOpen && "border-accent ring-1 ring-accent"
        )}
      >
        {value ? options.find(o => o.value === value)?.label : placeholder}
      </div>
      <ChevronDown className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform z-10", isOpen && "rotate-180")} />
      
      <AnimatePresence>
        {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: -5 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -5 }}
             transition={{ duration: 0.15 }}
             className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
           >
             {options.map((opt) => (
               <div
                 key={opt.value}
                 onClick={() => { onChange(opt.value); setIsOpen(false); }}
                 className={cn(
                   "px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors",
                   value === opt.value ? "bg-accent/10 text-accent font-medium" : "text-slate-700"
                 )}
               >
                 {opt.label}
               </div>
             ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BeneficiaryForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [institutionName, setInstitutionName] = useState("");
  const [headquarterName, setHeadquarterName] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tipoInstitucion, setTipoInstitucion] = useState("");
  const [countryId, setCountryId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institutionOptions, setInstitutionOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!institutionName.trim()) {
        toast.error("Falta información", { description: "Ingresa el nombre de la institución.", id: "ben-val-1" });
        return;
      }
      if (!tipoInstitucion) {
        toast.error("Falta información", { description: "Selecciona el tipo de institución.", id: "ben-val-1" });
        return;
      }
    }

    if (step === 2) {
      if (!headquarterName.trim()) {
        toast.error("Falta información", { description: "Ingresa el nombre del local.", id: "ben-val-2" });
        return;
      }
      if (!street1.trim()) {
        toast.error("Falta información", { description: "Ingresa la dirección principal.", id: "ben-val-2" });
        return;
      }
      if (!city.trim()) {
        toast.error("Falta información", { description: "Ingresa la ciudad.", id: "ben-val-2" });
        return;
      }
      if (!stateProvince.trim()) {
        toast.error("Falta información", { description: "Ingresa el estado o provincia.", id: "ben-val-2" });
        return;
      }
      if (!postalCode.trim()) {
        toast.error("Falta información", { description: "Ingresa el código postal.", id: "ben-val-2" });
        return;
      }
      if (!countryId) {
        toast.error("Falta información", { description: "Selecciona un país.", id: "ben-val-2" });
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailIsValid = /^\S+@\S+\.\S+$/.test(email.trim());
    if (!emailIsValid) {
      toast.error("Correo inválido", { description: "Por favor, ingresa un correo electrónico válido.", id: "ben-val" });
      return;
    }
    if (institutionName.trim().length > 100) {
      toast.error("Nombre muy largo", { description: "El nombre de la institución no debe superar los 100 caracteres.", id: "ben-val" });
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 50) {
      toast.error("Usuario inválido", { description: "El username debe tener entre 3 y 50 caracteres.", id: "ben-val" });
      return;
    }
    if (password.length < 6) {
      toast.error("Contraseña muy corta", { description: "La contraseña debe tener al menos 6 caracteres.", id: "ben-val" });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error("Contraseña sin carácter especial", { description: "La contraseña debe incluir al menos un carácter especial (ej. !, @, #, $).", id: "ben-val" });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden", { description: "Asegúrate de escribir la misma contraseña en ambos campos.", id: "ben-val" });
      return;
    }

    if (!tipoInstitucion) {
      toast.error("Falta información", { description: "Selecciona el tipo de institución.", id: "ben-val" });
      return;
    }
    if (!countryId) {
      toast.error("Falta información", { description: "Selecciona un país.", id: "ben-val" });
      return;
    }

    setIsSubmitting(true);
    (async () => {
      try {
        const institutionResponse = await api.post("/beneficiary-institutions", {
          name: institutionName,
          institutionTypeId: Number(tipoInstitucion),
        });

        const addressResponse = await api.post("/addresses", {
          street1,
          street2: street2 || null,
          city,
          stateProvince,
          postalCode,
          countryId: Number(countryId),
        });

        await api.post("/beneficiary-institution-headquarters", {
          beneficiaryInstitutionId: institutionResponse.data?.beneficiaryInstitutionId,
          description: headquarterName,
          addressId: addressResponse.data?.addressId,
        });

        await api.post("/auth/register", {
          email,
          rawPassword: password,
          username,
          actor: "BENEFICIARY",
          retailCompanyId: null,
          beneficiaryInstitutionId: institutionResponse.data?.beneficiaryInstitutionId,
        });

        setIsSubmitted(true);
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          toast.error("Error al registrar", {
            description: error.response.data?.message || "Hubo un problema al procesar tu solicitud.",
            id: "ben-api"
          });
        } else {
          toast.error("Error de conexión", {
            description: "No se pudo conectar con el servidor. Inténtalo más tarde.",
            id: "ben-api"
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      try {
        const [institutionTypes, countries] = await Promise.all([
          api.get("/institution-types"),
          api.get("/countries"),
        ]);
        setInstitutionOptions(
          (institutionTypes.data || []).map((item: any) => ({
            value: String(item.institutionTypeId ?? item.id),
            label: item.name,
          }))
        );
        setCountryOptions(
          (countries.data || []).map((item: any) => ({
            value: String(item.countryId ?? item.id),
            label: item.name,
          }))
        );
      } catch (error) {
        toast.error("No se pudieron cargar los catalogos. Intenta mas tarde.");
      }
    })();
  }, []);

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden">
      
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex items-center justify-center p-8 rounded-3xl"
          >
            <div className="text-center max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-accent" />
              </motion.div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">¡Solicitud Recibida!</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Hemos recibido los datos de tu institución correctamente. Nuestro equipo está revisando tu solicitud. Te informaremos por correo electrónico una vez que tu cuenta sea verificada y aprobada para acceder al sistema.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors shadow-sm"
              >
                Volver al Inicio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={() => navigate("/register-selection")}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                step === i ? "bg-accent w-6" : step > i ? "bg-accent/50" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Registro de Beneficiario</h2>
        <p className="text-slate-500 text-sm">
          {step === 1 && "Paso 1: Información de la institución"}
          {step === 2 && "Paso 2: Ubicación del local"}
          {step === 3 && "Paso 3: Credenciales de acceso"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 flex flex-col justify-between">
        
        {/* Contenedor fluido para soportar responsive correctamente */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: INSTITUTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 w-full"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nombre de la Institución</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                    <input
                      type="text"
                      value={institutionName}
                      maxLength={100}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm h-[42px]"
                      placeholder="Ej. Comedor La Esperanza"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tipo de Institución</label>
                  <CustomSelect 
                    value={tipoInstitucion}
                    onChange={setTipoInstitucion}
                    placeholder="Selecciona una opción"
                    options={institutionOptions}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Nombre del local</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={headquarterName}
                        onChange={(e) => setHeadquarterName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                        placeholder="Ej. Sede Central Comuna 1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Dirección</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={street1}
                        onChange={(e) => setStreet1(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                        placeholder="Ej. Av. Primavera 1234"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Direccion complementaria</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={street2}
                        onChange={(e) => setStreet2(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                        placeholder="Ej. Dpto 302, oficina 12, piso 3"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Ciudad</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-all h-[42px] shadow-sm"
                      placeholder="Ej. Lima"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Estado / Provincia</label>
                    <input
                      type="text"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-all h-[42px] shadow-sm"
                      placeholder="Ej. Lima"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Código Postal</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-all h-[42px] shadow-sm"
                      placeholder="15038"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">País</label>
                    <CustomSelect 
                      value={countryId}
                      onChange={setCountryId}
                      placeholder="Seleccionar"
                      options={countryOptions}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CREDENTIALS */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 w-full"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                      placeholder="contacto@institucion.org"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      maxLength={50}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                      placeholder="admin_fundacion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 flex items-center justify-between gap-4 mt-auto">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
            >
              Atrás
            </button>
          ) : (
            <div></div> // Spacer to keep "Siguiente" aligned right
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 md:flex-none px-8 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl",
                "transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </button>
          )}
        </div>
        
        {/* Enlace de login persistente en todos los pasos */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="font-bold text-accent hover:text-accent/80 transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
