import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, ChevronLeft, ChevronRight, 
  CheckCircle2, XCircle, AlertTriangle, X, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";


type MermaStatus = "Donable" | "No Donable" | "Solicitado" | "Pendiente";

interface MermaItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  expiryDate: string | null;
  status: MermaStatus;
  reason?: string;
  reasonId?: number | null;
  customReason?: string;
  categoryId?: number | null;
  headquarterId?: number | null;
  headquarterName?: string;
  registerDate?: string;
  shrinkageValue?: number;
}

interface MermaFormData {
  product: string;
  quantity: number;
  expiryDate: string;
  reasonId: number | "";
  customReason: string;
  categoryId: number | "";
  headquarterId: number | "";
  shrinkageValue: number | "";
}

interface CategoryOption {
  categoryId: number;
  name: string;
}

interface ReasonOption {
  shrinkageReasonId: number;
  name: string;
}

interface HeadquarterOption {
  retailCompanyHeadquarterId: number;
  description: string;
}

interface ShrinkageDto {
  shrinkageId: number;
  name: string;
  quantity: number;
  expirationDate: string | null;
  status: string;
  category?: CategoryOption;
  shrinkageReason?: ReasonOption;
  retailCompanyHeadquarter?: HeadquarterOption;
  specificReason?: string | null;
  createdAt?: string;
  shrinkageValue?: number;
}

const StatusBadge = ({ status }: { status: MermaStatus }) => {
  const colors = {
    "Donable": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "No Donable": "bg-red-100 text-red-700 border-red-200",
    "Solicitado": "bg-amber-100 text-amber-700 border-amber-200",
    "Pendiente": "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border", colors[status])}>
      {status}
    </span>
  );
};

interface Option {
  value: string;
  label: string;
}

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  className,
  containerClassName,
  openUpwards
}: { 
  options: Option[]; 
  value: string | number; 
  onChange: (val: string) => void; 
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  openUpwards?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const selectedLabel = options.find(o => o.value === String(value))?.label;

  return (
    <div className={cn("relative", containerClassName)} ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 bg-white border rounded-xl text-sm focus:outline-none transition-all shadow-sm cursor-pointer flex items-center justify-between min-h-[42px]",
          isOpen ? "border-primary ring-1 ring-primary" : "border-slate-200 hover:border-slate-300",
          className
        )}
      >
        <span className={cn("truncate", !selectedLabel && "text-slate-500")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: openUpwards ? 5 : -5 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: openUpwards ? 5 : -5 }}
             transition={{ duration: 0.15 }}
             className={cn(
               "absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto",
               openUpwards ? "bottom-full mb-1" : "top-full mt-1"
             )}
           >
             {options.map((opt) => (
               <div
                 key={opt.value}
                 onClick={() => { onChange(opt.value); setIsOpen(false); }}
                 className={cn(
                   "px-4 py-2 text-sm cursor-pointer transition-colors",
                   String(value) === opt.value ? "bg-primary/5 text-primary font-semibold" : "text-slate-700 hover:bg-slate-50"
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

export const GestionMerma = () => {
  // State
  const [items, setItems] = useState<MermaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<MermaStatus | "Todos">("Todos");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [reasons, setReasons] = useState<ReasonOption[]>([]);
  const [headquarters, setHeadquarters] = useState<HeadquarterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MermaItem | null>(null);
  
  // Custom Selects State
  const [isFilterStatusOpen, setIsFilterStatusOpen] = useState(false);
  const filterStatusRef = useRef<HTMLDivElement>(null);

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const reasonRef = useRef<HTMLDivElement>(null);

  const mapBackendStatus = (status: string): MermaStatus => {
    switch (status) {
      case "DONABLE":
        return "Donable";
      case "NOT_DONABLE":
        return "No Donable";
      case "REQUESTED":
      case "IN_PROCESS":
      case "DONATED":
        return "Solicitado";
      case "NONE":
        return "Pendiente";
      default:
        return "Pendiente";
    }
  };

  const formatDateDash = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  };

  const mapShrinkageToItem = (shrinkage: ShrinkageDto): MermaItem => {
    return {
      id: shrinkage.shrinkageId,
      product: shrinkage.name,
      category: shrinkage.category?.name || "Sin categoría",
      categoryId: shrinkage.category?.categoryId || null,
      quantity: shrinkage.quantity,
      expiryDate: shrinkage.expirationDate ? formatDateDash(shrinkage.expirationDate) : null,
      status: mapBackendStatus(shrinkage.status),
      reason: shrinkage.shrinkageReason?.name,
      reasonId: shrinkage.shrinkageReason?.shrinkageReasonId || null,
      customReason: shrinkage.specificReason || "",
      headquarterId: shrinkage.retailCompanyHeadquarter?.retailCompanyHeadquarterId || null,
      headquarterName: shrinkage.retailCompanyHeadquarter?.description || "-",
      registerDate: formatDateDash(shrinkage.createdAt),
      shrinkageValue: shrinkage.shrinkageValue || 0,
    };
  };

  const reloadItems = async () => {
    const response = await api.get("/shrinkages/company");
    const shrinkages = (response.data || []) as ShrinkageDto[];
    setItems(shrinkages.map(mapShrinkageToItem));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterStatusRef.current && !filterStatusRef.current.contains(event.target as Node)) {
        setIsFilterStatusOpen(false);
      }
      if (reasonRef.current && !reasonRef.current.contains(event.target as Node)) {
        setIsReasonOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState<MermaFormData>({
    product: "",
    quantity: 1,
    expiryDate: "",
    customReason: "",
    reasonId: "",
    categoryId: "",
    headquarterId: "",
    shrinkageValue: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [shrinkagesResponse, categoriesResponse, reasonsResponse, headquartersResponse] = await Promise.all([
          api.get("/shrinkages/company"),
          api.get("/shrinkages/categories"),
          api.get("/shrinkages/reasons"),
          api.get("/retail-company-headquarters"),
        ]);
        const shrinkages = (shrinkagesResponse.data || []) as ShrinkageDto[];
        setCategories(categoriesResponse.data || []);
        setReasons(reasonsResponse.data || []);
        setHeadquarters(headquartersResponse.data || []);
        setItems(shrinkages.map(mapShrinkageToItem));
      } catch {
        toast.error("No se pudieron cargar las mermas.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "Todos" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, filterStatus, itemsPerPage]);

  // Actions
  const handleOpenModal = (item?: MermaItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        product: item.product,
        quantity: item.quantity,
        expiryDate: item.expiryDate || "",
        reasonId: item.reasonId || "",
        customReason: item.customReason || "",
        categoryId: item.categoryId || "",
        headquarterId: item.headquarterId || "",
        shrinkageValue: item.shrinkageValue ?? "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        product: "",
        quantity: 1,
        expiryDate: "",
        customReason: "",
        reasonId: "",
        categoryId: "",
        headquarterId: "",
        shrinkageValue: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      toast.error("Edición no disponible", { description: "Aún no existe un endpoint para editar mermas." });
      return;
    }
    if (!formData.headquarterId) {
      toast.error("Selecciona el local", { description: "Elige un local para registrar la merma.", id: "merma-headquarter" });
      return;
    }
    if (!formData.categoryId) {
      toast.error("Selecciona la categoría", { description: "Elige una categoría para continuar.", id: "merma-category" });
      return;
    }
    if (!formData.reasonId) {
      toast.error("Selecciona una razón", { description: "Por favor, especifica por qué se está enviando este producto a merma.", id: "merma-reason" });
      return;
    }
    if (formData.shrinkageValue === "" || formData.shrinkageValue < 0) {
      toast.error("Valor unitario no válido", { description: "Por favor, ingresa un valor unitario no negativo.", id: "merma-value" });
      return;
    }
    const selectedReason = reasons.find((reason) => reason.shrinkageReasonId === formData.reasonId);
    if (selectedReason?.name === "Otro" && !formData.customReason.trim()) {
      toast.error("Especifica la razón", { description: "Por favor, escribe la razón específica de la merma.", id: "merma-reason" });
      return;
    }
    try {
      const payload = {
        retailCompanyHeadquarterId: formData.headquarterId,
        categoryId: formData.categoryId,
        shrinkageReasonId: formData.reasonId,
        name: formData.product,
        quantity: formData.quantity,
        expirationDate: formData.expiryDate || null,
        specificReason: selectedReason?.name === "Otro" ? formData.customReason.trim() : null,
        pickupDate: null,
        shrinkageValue: Number(formData.shrinkageValue),
      };
      await api.post("/shrinkages", payload);
      await reloadItems();
      toast.success("Producto añadido a la merma.");
      setIsModalOpen(false);
    } catch {
      toast.error("No se pudo registrar la merma.");
    }
  };

  const quickChangeStatus = async (id: number, newStatus: MermaStatus) => {
    try {
      const statusEndpoint = newStatus === "Donable" ? "donable" : "not-donable";
      await api.patch(`/shrinkages/${id}/${statusEndpoint}`);
      await reloadItems();
      toast.success(`Estado actualizado a ${newStatus}.`);
    } catch {
      toast.error("No se pudo actualizar el estado.");
    }
  };

  const handleDelete = () => {
    toast.error("Eliminación no disponible");
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Merma</h2>
          <p className="text-sm text-slate-500 mt-1">Inventario detallado de productos mermados y su estado.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Añadir Producto
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-end">
        <div className="w-full xl:w-auto flex-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Buscar Producto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ej. Manzanas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="w-full sm:w-1/3 xl:w-auto relative" ref={filterStatusRef}>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Estado</label>
          <button 
            onClick={() => setIsFilterStatusOpen(!isFilterStatusOpen)}
            className={cn(
              "flex items-center justify-between w-full xl:w-48 bg-white border rounded-xl px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm",
              isFilterStatusOpen ? "border-primary" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <span className="font-medium text-slate-700 truncate">
              {filterStatus === "Todos" ? "Todos los Estados" : filterStatus}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isFilterStatusOpen ? "rotate-180" : "")} />
          </button>
          
          <AnimatePresence>
            {isFilterStatusOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 xl:right-auto xl:w-48 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
              >
                {["Todos", "Pendiente", "Donable", "No Donable", "Solicitado"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status as MermaStatus | "Todos");
                      setIsFilterStatusOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors truncate",
                      filterStatus === status 
                        ? "bg-primary/5 text-primary font-semibold" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {status === "Todos" ? "Todos los Estados" : status}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full sm:w-1/3 xl:w-auto">
          {isLoading && (
            <p className="text-xs text-slate-500">Cargando mermas...</p>
          )}
        </div>
      </div>

      {/* Advanced Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cant.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Val. Unit.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Local</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              <motion.tbody
                key={currentPage + filterStatus + searchTerm}
                initial="hidden"
                animate="show"
                exit="exit"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  },
                  exit: { opacity: 0, transition: { duration: 0.15 } }
                }}
                className="divide-y divide-slate-100"
              >
                {paginatedItems.map((item) => (
                  <motion.tr
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                    }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{item.product}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{item.quantity} und</td>
                    <td className="px-6 py-4 text-sm text-slate-600">S/. {(item.shrinkageValue ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.headquarterName || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.registerDate || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.expiryDate || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center h-8">
                        <AnimatePresence mode="wait">
                          {item.status !== "Pendiente" ? (
                            <motion.div
                              key="badge"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              <StatusBadge status={item.status} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="buttons"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <button 
                                onClick={() => quickChangeStatus(item.id, "Donable")}
                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 shadow-sm"
                                title="Marcar como Donable"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => quickChangeStatus(item.id, "No Donable")}
                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
                                title="Marcar como No Donable"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
              
            {paginatedItems.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos con los filtros actuales.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center text-sm text-slate-500">
            <span>Mostrar</span>
            <CustomSelect
              value={itemsPerPage}
              onChange={(val) => setItemsPerPage(Number(val))}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "50", label: "50" },
              ]}
              containerClassName="mx-2 w-20"
              className="px-2.5 py-1.5 min-h-[32px] rounded-lg border-slate-200"
              openUpwards={true}
            />
            <span>por página</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className="text-slate-500 mr-4">
              Página <span className="font-medium text-slate-900">{currentPage}</span> de <span className="font-medium text-slate-900">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar (Portal) */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingItem ? "Editar Producto" : "Añadir a Merma"}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nombre del Producto</label>
                      <input
                        required
                        type="text"
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Ej. Lote de Manzanas"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Cantidad (Unidades)</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Valor Unitario (S/.)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.shrinkageValue}
                        onChange={(e) => setFormData({ ...formData, shrinkageValue: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Fecha de Vencimiento</label>
                      <input
                        required
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 z-30">
                        <label className="text-sm font-medium text-slate-700">Local</label>
                        <CustomSelect
                          value={formData.headquarterId}
                          onChange={(val) => setFormData({ ...formData, headquarterId: Number(val) || "" })}
                          placeholder="Selecciona un local"
                          options={headquarters.map(h => ({ value: String(h.retailCompanyHeadquarterId), label: h.description }))}
                        />
                      </div>
                      <div className="space-y-1.5 z-20">
                        <label className="text-sm font-medium text-slate-700">Categoría</label>
                        <CustomSelect
                          value={formData.categoryId}
                          onChange={(val) => setFormData({ ...formData, categoryId: Number(val) || "" })}
                          placeholder="Selecciona una categoría"
                          options={categories.map(c => ({ value: String(c.categoryId), label: c.name }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative" ref={reasonRef}>
                      <label className="text-sm font-medium text-slate-700 block">Razón de Merma</label>
                      <button
                        type="button"
                        onClick={() => setIsReasonOpen(!isReasonOpen)}
                        className={cn(
                          "flex items-center justify-between w-full bg-white border rounded-xl px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm",
                          isReasonOpen ? "border-primary" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className={cn("font-medium truncate", !formData.reasonId ? "text-slate-400" : "text-slate-900")}>
                          {formData.reasonId ? reasons.find((reason) => reason.shrinkageReasonId === formData.reasonId)?.name : "Selecciona una razón"}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isReasonOpen ? "rotate-180" : "")} />
                      </button>

                      <AnimatePresence>
                        {isReasonOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                          >
                            {reasons.map((reason) => (
                              <button
                                key={reason.shrinkageReasonId}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, reasonId: reason.shrinkageReasonId });
                                  setIsReasonOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-sm transition-colors",
                                  formData.reasonId === reason.shrinkageReasonId
                                    ? "bg-primary/5 text-primary font-semibold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                {reason.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {reasons.find((reason) => reason.shrinkageReasonId === formData.reasonId)?.name === "Otro" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5"
                      >
                        <label className="text-sm font-medium text-slate-700">Especificar Razón</label>
                        <input
                          required
                          type="text"
                          value={formData.customReason || ""}
                          onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          placeholder="Ej. Problema de refrigeración"
                        />
                      </motion.div>
                    )}

                    <div className="pt-6 border-t border-slate-100 flex gap-3 mt-8">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 text-white bg-primary hover:bg-primary/90 font-medium rounded-xl transition-colors shadow-sm"
                      >
                        Guardar Producto
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal Confirmación Eliminación (Portal) */}
      {createPortal(
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Eliminar Registro</h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  ¿Estás seguro de que deseas eliminar este producto de la merma? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
