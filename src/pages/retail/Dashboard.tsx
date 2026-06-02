import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Users, Shield, PackageX, HeartHandshake, Calendar, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { toast } from "sonner";

// Mock Data
const defaultTrendData = [
  { name: "Ene", merma: 0, donada: 0 },
  { name: "Feb", merma: 0, donada: 0 },
  { name: "Mar", merma: 0, donada: 0 },
  { name: "Abr", merma: 0, donada: 0 },
  { name: "May", merma: 0, donada: 0 },
  { name: "Jun", merma: 0, donada: 0 },
];

export const Dashboard = () => {
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Últimos 30 días");
  const filterRef = useRef<HTMLDivElement>(null);

  // Real API States
  const [totalShrinkageMonth, setTotalShrinkageMonth] = useState<number>(2390);
  const [totalLostValue, setTotalLostValue] = useState<number>(4500);
  const [donatedTotal, setDonatedTotal] = useState<number>(1800);
  const [activeUsers, setActiveUsers] = useState<number>(24);
  const [configuredRoles, setConfiguredRoles] = useState<number>(5);
  const [chartData, setChartData] = useState<any[]>(defaultTrendData);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/retail/dashboard/stats");
        const data = response.data;
        if (data) {
          setTotalShrinkageMonth(data.totalShrinkageMonth);
          setTotalLostValue(data.totalLostValue);
          setDonatedTotal(data.totalDonated);
          setActiveUsers(data.activeUsers);
          setConfiguredRoles(data.configuredRoles);
          if (data.monthlyEvolution && data.monthlyEvolution.length > 0) {
            setChartData(data.monthlyEvolution);
          }
        }
      } catch (err) {
        // Fallback to mocks if server is not fully up yet
      }
    })();
  }, []);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get("/retail/dashboard/report", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reporte_gestion.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Reporte de gestión descargado correctamente.");
    } catch {
      toast.error("No se pudo descargar el reporte.");
    }
  };

  const stats = useMemo(() => [
    {
      name: "Productos Mermados (Mes)",
      value: totalShrinkageMonth.toLocaleString("es-PE"),
      icon: PackageX,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Valor Perdido Estimado",
      value: `$${totalLostValue.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      name: "Productos Donados",
      value: donatedTotal.toLocaleString("es-PE"),
      icon: HeartHandshake,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      name: "Usuarios Activos",
      value: activeUsers.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Roles Configurados",
      value: configuredRoles.toString(),
      icon: Shield,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ], [totalShrinkageMonth, totalLostValue, donatedTotal, activeUsers, configuredRoles]);

  const dateOptions = [
    "Últimos 7 días",
    "Últimos 30 días",
    "Últimos 3 meses",
    "Este año",
    "Todo el tiempo",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen de Gestión</h2>
          <p className="text-sm text-slate-500 mt-1">Monitorea los indicadores clave de tu merma y donaciones.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl px-4 py-2 shadow-sm transition-colors focus:outline-none"
          >
            Descargar Reporte
          </button>
          
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
              className={cn(
                "flex items-center justify-between w-48 bg-white border rounded-xl px-3 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                isDateFilterOpen ? "border-primary" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <span className="text-sm font-medium text-slate-700">{selectedDateFilter}</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isDateFilterOpen ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {isDateFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                >
                  {dateOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedDateFilter(option);
                        setIsDateFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm transition-colors",
                        selectedDateFilter === option 
                          ? "bg-primary/5 text-primary font-semibold" 
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8"
      >
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Evolución de Merma vs Donaciones</h3>
          <p className="text-sm text-slate-500">Histórico de los últimos 6 meses (cantidad de productos).</p>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorMerma" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDonada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="merma"
                name="Mermados"
                stroke="#1e3a8a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMerma)"
              />
              <Area
                type="monotone"
                dataKey="donada"
                name="Donados"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDonada)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
