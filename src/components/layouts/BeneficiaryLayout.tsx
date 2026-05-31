import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useOutletContext } from "react-router-dom";
import { Search, ListChecks, Settings, ClipboardList, LogOut, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import logoUrl from "../../assets/fluxuspng.png";

// Interfaces for Cart
export interface CartItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  headquarterName: string;
}

type BeneficiaryContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
};

export const useBeneficiaryContext = () => {
  return useOutletContext<BeneficiaryContextType>();
};

export const BeneficiaryLayout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleLogout = () => {
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
  };

  const addToCart = (item: CartItem) => {
    if (!cart.find((c) => c.id === item.id)) {
      setCart([...cart, item]);
      toast.success("Añadido a tu solicitud");
    } else {
      toast.error("Este producto ya está en tu solicitud");
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const confirmRequest = () => {
    if (cart.length === 0) return;
    toast.success("¡Solicitud de donación enviada con éxito!");
    clearCart();
    setIsCartOpen(false);
    navigate("/beneficiary/seguimientos");
  };

  // Agrupar items por local
  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.headquarterName]) {
      acc[item.headquarterName] = [];
    }
    acc[item.headquarterName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const navLinks = [
    { name: "Buscar Donaciones", path: "/beneficiary/buscar", icon: Search },
    { name: "Mis Seguimientos", path: "/beneficiary/seguimientos", icon: ListChecks },
    { name: "Configuración", path: "/beneficiary/configuracion", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate("/beneficiary/buscar")}>
              <img src={logoUrl} alt="Fluxus Logo" className="h-8 w-auto hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Central Navigation (Desktop) */}
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2",
                      isActive
                        ? "bg-cyan-50 text-cyan-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors focus:outline-none"
                title="Mis Solicitudes"
              >
                <ClipboardList className="w-5 h-5" />
                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm"
                    >
                      {cart.length}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

              {/* User Profile */}
              <div className="hidden sm:flex flex-col items-end justify-center">
                <span className="text-sm font-bold text-slate-900 leading-tight">Fundación Ayuda Sur</span>
                <span className="text-xs text-slate-500">contacto@fundacionayudasur.org</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ cart, addToCart, removeFromCart, clearCart }} />
      </main>

      {/* Checkout Slide-Over */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-600" />
                  Resumen de Solicitud
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                    <ClipboardList className="w-12 h-12 opacity-20" />
                    <p>Tu lista de solicitudes está vacía</p>
                  </div>
                ) : (
                  Object.entries(groupedCart).map(([headquarter, items]) => (
                    <div key={headquarter} className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                        Recoger en: {headquarter}
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{item.product}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.category} • {item.quantity} und</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={confirmRequest}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ListChecks className="w-5 h-5" />
                  Confirmar Solicitud de Donación
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-40 pb-safe">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-colors",
                isActive ? "text-cyan-600" : "text-slate-500 hover:text-cyan-600"
              )
            }
          >
            <link.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{link.name.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
