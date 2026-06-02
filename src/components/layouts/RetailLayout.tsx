import { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Recycle,
  HeartHandshake,
  Store,
  Users,
  History,
  Settings,
  Menu,
  X,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import logoUrl from "../../assets/fluxuspng.png";
import { useAuth } from "../../hooks/useAuth";

export const RetailLayout = () => {
  const { isManager } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Dashboard", path: "/retail/dashboard", icon: LayoutDashboard },
    { name: "Merma", path: "/retail/gestion-merma", icon: Recycle },
    { name: "Donaciones", path: "/retail/donaciones", icon: HeartHandshake },
    { name: "Locales", path: "/retail/locales", icon: Store },
    ...(isManager ? [{ name: "Usuarios y Roles", path: "/retail/accesos", icon: Users }] : []),
    { name: "Historial", path: "/retail/historial", icon: History },
    { name: "Configuración", path: "/retail/configuracion", icon: Settings },
  ];

  useEffect(() => {
    (async () => {
      try {
        const profileResponse = await api.get("/auth/profile");
        const profile = profileResponse.data || {};

        if (profile.retailCompanyId) {
          const companyResponse = await api.get(`/retail-companies/${profile.retailCompanyId}`);
          setCompanyName(companyResponse.data?.name || null);
        }

        const userId = parseJwtUserId();
        if (userId) {
          const userResponse = await api.get(`/auth/users/${userId}`);
          setUsername(userResponse.data?.username || null);
        }
      } catch {
        setCompanyName(null);
        setUsername(null);
      }
    })();
  }, []);

  const parseJwtUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200">
          <img 
            src={logoUrl} 
            alt="Fluxus Logo" 
            className="h-8 w-auto hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-5rem)]">
          <div className="py-6 flex-1 overflow-y-auto">
            <div className="px-4 mb-4">
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menú Principal</p>
          </div>
          <nav className="space-y-1 px-3">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 w-5 h-5 mr-3 transition-colors",
                      isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                    )}
                  />
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 mt-auto bg-white z-10">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate("/login");
            }}
            className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
          >
            <LogOut className="flex-shrink-0 w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200 z-10">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 mr-4 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex relative max-w-md w-full items-center">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {navLinks.find(link => location.pathname.startsWith(link.path))?.name || "Dashboard"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-2 py-1.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {companyName || "Empresa"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {username || "usuario"}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
