import { useNavigate, Link } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { cn } from "../../utils/cn";

export const RetailPricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Básico",
      price: "$49",
      description: "Ideal para un solo local pequeño.",
      features: [
        "Límite de 3 usuarios",
        "Límite de 2 roles",
        "Hasta 1,000 registros"
      ],
      highlighted: false,
    },
    {
      name: "Profesional",
      price: "$149",
      description: "Para empresas en crecimiento.",
      features: [
        "Límite de 15 usuarios",
        "Límite de 10 roles",
        "Hasta 10,000 registros"
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "A medida",
      description: "Soluciones a gran escala.",
      features: [
        "Usuarios ilimitados",
        "Roles ilimitados",
        "Registros ilimitados"
      ],
      highlighted: false,
    },
  ];

  return (
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl">
        <button
          onClick={() => navigate("/register-selection")}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Volver a selección
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Planes para Retail</h2>
          <p className="text-slate-600">Escala tu gestión de merma de acuerdo a tus necesidades</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative flex flex-col p-8 rounded-2xl border transition-all duration-300",
                plan.highlighted
                  ? "bg-white border-primary shadow-lg transform md:-translate-y-4"
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recomendado
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.price !== "A medida" && <span className="text-slate-500">/mes</span>}
                </div>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <Check className={cn("w-5 h-5 mr-3 shrink-0", plan.highlighted ? "text-primary" : "text-accent")} />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  navigate('/register/retail/checkout', { state: { plan } });
                }}
                className={cn(
                  "w-full py-3 px-4 font-bold rounded-xl transition-all duration-200",
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                )}
              >
                Seleccionar
              </button>
            </div>
          ))}
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
