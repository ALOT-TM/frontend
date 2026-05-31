import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeartHandshake, Inbox, Search, Star, Building2, ChevronRight, ChevronLeft, ArrowLeft, 
  PackageCheck, AlertTriangle, X, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, ClipboardList, Clock, Truck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";

// --- Tipos y Mocks ---
interface Institution {
  id: string;
  name: string;
  type: string;
  isFavorite: boolean;
}

interface MermaItem {
  id: string;
  product: string;
  maxStock: number;
}

interface RequestedItem {
  id: string;
  product: string;
  requestedQty: number;
}

interface Peticion {
  id: string;
  institutionName: string;
  date: string;
  items: RequestedItem[];
}

interface DonationRecord {
  id: string;
  product: string;
  institutionName: string;
  qty: number;
  status: "Procesando" | "Donado";
  deliveryDate: string;
}

const mockInstitutions: Institution[] = [
  { id: "1", name: "Comedor Popular Esperanza", type: "Comedor Social", isFavorite: true },
  { id: "2", name: "ONG Alimentos para Todos", type: "Organización No Gubernamental", isFavorite: false },
  { id: "3", name: "Hogar de Niños San José", type: "Orfanato", isFavorite: true },
  { id: "4", name: "Asociación Vecinos Solidarios", type: "Asociación Vecinal", isFavorite: false },
  { id: "5", name: "Banco de Alimentos Lima", type: "Banco de Alimentos", isFavorite: true },
  { id: "6", name: "Refugio Animales San Francisco", type: "Refugio Animal", isFavorite: false },
];

const mockMermaDonable: MermaItem[] = [
  { id: "m1", product: "Lote de Manzanas", maxStock: 45 },
  { id: "m2", product: "Cajas de Leche Evaporada", maxStock: 20 },
  { id: "m3", product: "Panadería Variada", maxStock: 150 },
  { id: "m4", product: "Yogurt Natural (Pack 6)", maxStock: 30 },
  { id: "m5", product: "Vegetales Mixtos (Sacos)", maxStock: 12 },
];

const mockPeticiones: Peticion[] = [
  {
    id: "p1",
    institutionName: "Comedor Popular Esperanza",
    date: "2026-05-30 08:30 AM",
    items: [
      { id: "pi1", product: "Lote de Manzanas", requestedQty: 10 },
      { id: "pi2", product: "Cajas de Leche Evaporada", requestedQty: 5 },
    ]
  },
  {
    id: "p2",
    institutionName: "Hogar de Niños San José",
    date: "2026-05-29 03:45 PM",
    items: [
      { id: "pi3", product: "Panadería Variada", requestedQty: 50 },
      { id: "pi4", product: "Yogurt Natural (Pack 6)", requestedQty: 10 },
    ]
  }
];

const mockDonationRecords: DonationRecord[] = [
  { id: "dr1", product: "Cajas de Leche Evaporada", institutionName: "Comedor Popular Esperanza", qty: 5, status: "Procesando", deliveryDate: "-" },
  { id: "dr2", product: "Lote de Manzanas", institutionName: "Hogar de Niños San José", qty: 10, status: "Donado", deliveryDate: "2026-05-28" },
  { id: "dr3", product: "Panadería Variada", institutionName: "Banco de Alimentos Lima", qty: 30, status: "Procesando", deliveryDate: "-" },
  { id: "dr4", product: "Vegetales Mixtos (Sacos)", institutionName: "ONG Alimentos para Todos", qty: 12, status: "Donado", deliveryDate: "2026-05-25" },
];

export const Donaciones = () => {
  const [activeTab, setActiveTab] = useState<"crear" | "peticiones" | "registro">("crear");

  // --- Estado Tab 1: Crear Donación ---
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [institutions, setInstitutions] = useState<Institution[]>(mockInstitutions);
  const [instSearch, setInstSearch] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [mermaSearch, setMermaSearch] = useState("");
  
  // --- Paginación Merma (Paso 2) ---
  const [mermaCurrentPage, setMermaCurrentPage] = useState(1);
  const mermaPerPage = 4;
  
  // --- Paginación Instituciones ---
  const [instCurrentPage, setInstCurrentPage] = useState(1);
  const instPerPage = 3;
  
  // Cantidades a donar (mermaId -> quantity)
  const [donationQuantities, setDonationQuantities] = useState<Record<string, number>>({});
  const [donationMessage, setDonationMessage] = useState("");

  // --- Estado Tab 2: Peticiones ---
  const [peticiones, setPeticiones] = useState<Peticion[]>(mockPeticiones);
  const [expandedPeticionId, setExpandedPeticionId] = useState<string | null>(null);
  // Estado para la aprobación parcial (peticionId -> array of requestedItemId)
  const [selectedForApproval, setSelectedForApproval] = useState<Record<string, string[]>>({});
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmPeticionId, setConfirmPeticionId] = useState<string | null>(null);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectPeticionId, setRejectPeticionId] = useState<string | null>(null);

  // --- Handlers Tab 1 ---
  const toggleFavorite = (id: string) => {
    setInstitutions(insts => insts.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
  };

  const filteredInstitutions = useMemo(() => {
    return institutions.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(instSearch.toLowerCase());
      const matchesFav = showOnlyFavorites ? i.isFavorite : true;
      return matchesSearch && matchesFav;
    });
  }, [institutions, instSearch, showOnlyFavorites]);

  const totalInstPages = Math.ceil(filteredInstitutions.length / instPerPage);
  
  const paginatedInstitutions = useMemo(() => {
    const start = (instCurrentPage - 1) * instPerPage;
    return filteredInstitutions.slice(start, start + instPerPage);
  }, [filteredInstitutions, instCurrentPage, instPerPage]);

  useEffect(() => {
    setInstCurrentPage(1);
  }, [instSearch, showOnlyFavorites]);

  const filteredMerma = useMemo(() => {
    return mockMermaDonable.filter(m => m.product.toLowerCase().includes(mermaSearch.toLowerCase()));
  }, [mermaSearch]);

  const totalMermaPages = Math.ceil(filteredMerma.length / mermaPerPage);
  
  const paginatedMerma = useMemo(() => {
    const start = (mermaCurrentPage - 1) * mermaPerPage;
    return filteredMerma.slice(start, start + mermaPerPage);
  }, [filteredMerma, mermaCurrentPage, mermaPerPage]);

  useEffect(() => {
    setMermaCurrentPage(1);
  }, [mermaSearch]);

  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInst(inst);
    setDonationQuantities({});
    setDonationMessage("");
    setMermaSearch("");
    setStep(2);
  };

  const handleSetQuantity = (id: string, qty: number, max: number) => {
    const validQty = Math.max(0, Math.min(qty, max));
    setDonationQuantities(prev => ({ ...prev, [id]: validQty }));
  };

  const handleGoToStep3 = () => {
    const totalItems = Object.values(donationQuantities).filter(q => q > 0).length;
    if (totalItems === 0) {
      toast.error("Debes seleccionar al menos un producto para continuar.");
      return;
    }
    setStep(3);
  };

  const handleSubmitDonation = () => {
    toast.success(`Donación ofrecida a ${selectedInst?.name} con éxito.`);
    setStep(1);
    setSelectedInst(null);
  };

  // --- Handlers Tab 2 ---
  const toggleAccordion = (id: string) => {
    setExpandedPeticionId(expandedPeticionId === id ? null : id);
  };

  const toggleApprovalItem = (peticionId: string, itemId: string) => {
    setSelectedForApproval(prev => {
      const currentSelected = prev[peticionId] || [];
      if (currentSelected.includes(itemId)) {
        return { ...prev, [peticionId]: currentSelected.filter(id => id !== itemId) };
      } else {
        return { ...prev, [peticionId]: [...currentSelected, itemId] };
      }
    });
  };

  const handleSelectAllToggle = (peticionId: string) => {
    const peticion = peticiones.find(p => p.id === peticionId);
    if (!peticion) return;
    
    const currentSelected = selectedForApproval[peticionId] || [];
    if (currentSelected.length === peticion.items.length) {
      setSelectedForApproval(prev => ({ ...prev, [peticionId]: [] })); // Deselect all
    } else {
      setSelectedForApproval(prev => ({ ...prev, [peticionId]: peticion.items.map(i => i.id) })); // Select all
    }
  };

  const openRejectModal = (peticionId: string) => {
    setRejectPeticionId(peticionId);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (rejectPeticionId) {
      setPeticiones(prev => prev.filter(p => p.id !== rejectPeticionId));
      toast.success("Solicitud rechazada.");
    }
    setIsRejectModalOpen(false);
    setRejectPeticionId(null);
  };

  const openConfirmModal = (peticionId: string) => {
    const selected = selectedForApproval[peticionId] || [];
    if (selected.length === 0) {
      toast.error("Selecciona al menos un producto para donar.");
      return;
    }
    setConfirmPeticionId(peticionId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAccept = () => {
    if (confirmPeticionId) {
      setPeticiones(prev => prev.filter(p => p.id !== confirmPeticionId));
      toast.success("Donación aceptada y procesada con éxito.");
    }
    setIsConfirmModalOpen(false);
    setConfirmPeticionId(null);
  };

  const activePeticionForModal = peticiones.find(p => p.id === confirmPeticionId);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Donaciones</h2>
          <p className="text-sm text-slate-500 mt-1">Conecta tus excedentes con quienes más lo necesitan.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveTab("crear"); setStep(1); }}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "crear" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <HeartHandshake className="w-4 h-4 mr-2" />
            Donar
          </button>
          <button
            onClick={() => setActiveTab("peticiones")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "peticiones" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Inbox className="w-4 h-4 mr-2" />
            Peticiones
            {peticiones.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                {peticiones.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("registro")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "registro" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Registro
          </button>
        </div>
      </div>

      {/* --- TAB 1: CREAR DONACIÓN --- */}
      {activeTab === "crear" && (
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-800">Paso 1: Seleccionar Institución</h3>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar institución..."
                      value={instSearch}
                      onChange={(e) => setInstSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                    />
                  </div>
                  <label className="flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={showOnlyFavorites}
                      onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                    />
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors flex items-center px-1",
                      showOnlyFavorites ? "bg-amber-400" : "bg-slate-200"
                    )}>
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full transition-transform transform",
                        showOnlyFavorites ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                    <span className="ml-2 text-sm font-medium text-slate-600 flex items-center">
                      <Star className="w-4 h-4 mr-1 text-amber-400 fill-current" /> Favoritos
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                  {paginatedInstitutions.map((inst) => (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                      key={inst.id} 
                      className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative"
                    >
                      <button 
                      onClick={() => toggleFavorite(inst.id)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 transition-colors"
                    >
                      <Star className={cn("w-5 h-5 transition-colors", inst.isFavorite ? "text-amber-400 fill-current" : "text-slate-300")} />
                    </button>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{inst.name}</h4>
                    <p className="text-sm text-slate-500 mb-6">{inst.type}</p>
                    <button 
                      onClick={() => handleSelectInstitution(inst)}
                      className="w-full py-2.5 bg-slate-50 text-primary font-semibold rounded-xl group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center"
                    >
                      Elegir y Donar <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {paginatedInstitutions.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No se encontraron instituciones.
                  </div>
                )}
              </div>

              {/* Controles de Paginación */}
              {totalInstPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6">
                  <p className="text-sm text-slate-500">
                    Mostrando <span className="font-medium text-slate-900">{((instCurrentPage - 1) * instPerPage) + 1}</span> a <span className="font-medium text-slate-900">{Math.min(instCurrentPage * instPerPage, filteredInstitutions.length)}</span> de <span className="font-medium text-slate-900">{filteredInstitutions.length}</span> instituciones
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setInstCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={instCurrentPage === 1}
                      className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-700">
                      Página {instCurrentPage} de {totalInstPages}
                    </span>
                    <button
                      onClick={() => setInstCurrentPage(prev => Math.min(prev + 1, totalInstPages))}
                      disabled={instCurrentPage === totalInstPages}
                      className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setStep(1)}
                  className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Paso 2: Selección de Productos</h3>
                  <p className="text-sm text-slate-500">Ofreciendo donación a <strong className="text-primary">{selectedInst?.name}</strong></p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                {/* Lista de Merma Donable */}
                <div className="flex-1 p-6 flex flex-col h-[500px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <PackageCheck className="w-4 h-4 mr-2 text-emerald-500" />
                      Inventario Donable Disponible
                    </h4>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={mermaSearch}
                        onChange={(e) => setMermaSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                    <AnimatePresence mode="wait">
                    {paginatedMerma.map(item => {
                      const qty = donationQuantities[item.id] || 0;
                      return (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                          exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                          key={item.id} 
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-xl transition-all",
                            qty > 0 
                              ? "bg-primary/5 border-primary/30 shadow-[0_0_0_1px_rgba(37,99,235,0.1)]" 
                              : "border-slate-100 bg-slate-50/50"
                          )}
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{item.product}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Stock disponible: {item.maxStock} und.</p>
                          </div>
                          
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleSetQuantity(item.id, qty > 0 ? 0 : item.maxStock, item.maxStock)}
                              className={cn(
                                "px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm",
                                qty > 0 
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                                  : "bg-white text-primary border border-slate-200 hover:border-primary"
                              )}
                            >
                              {qty > 0 ? "Quitar" : "Añadir"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                    {paginatedMerma.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        No se encontraron productos que coincidan con la búsqueda.
                      </div>
                    )}
                  </div>
                  
                  {/* Controles de Paginación Merma */}
                  {totalMermaPages > 1 && (
                    <div className="mt-4 mb-2 flex items-center justify-between px-2">
                      <p className="text-xs text-slate-500">
                        Mostrando <span className="font-medium text-slate-900">{((mermaCurrentPage - 1) * mermaPerPage) + 1}</span> - <span className="font-medium text-slate-900">{Math.min(mermaCurrentPage * mermaPerPage, filteredMerma.length)}</span> de <span className="font-medium text-slate-900">{filteredMerma.length}</span>
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setMermaCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={mermaCurrentPage === 1}
                          className="p-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          {mermaCurrentPage} de {totalMermaPages}
                        </span>
                        <button
                          onClick={() => setMermaCurrentPage(prev => Math.min(prev + 1, totalMermaPages))}
                          disabled={mermaCurrentPage === totalMermaPages}
                          className="p-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 ml-2">
                      {Object.values(donationQuantities).filter(q => q > 0).length} productos seleccionados
                    </span>
                    <button 
                      onClick={handleGoToStep3}
                      className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm flex items-center"
                    >
                      Siguiente <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setStep(2)}
                  className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Paso 3: Mensaje y Confirmación</h3>
                  <p className="text-sm text-slate-500">Añade un mensaje para <strong className="text-primary">{selectedInst?.name}</strong></p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Resumen de Donación</h4>
                  <ul className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {mockMermaDonable.filter(m => (donationQuantities[m.id] || 0) > 0).map(item => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700">{item.product}</span>
                        <span className="font-bold text-primary">{donationQuantities[item.id]} und.</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Mensaje a la Institución (Opcional)</label>
                  <textarea 
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    placeholder="Ej. Esperamos que estos productos sean de gran ayuda..."
                    className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none bg-white"
                  />
                </div>
                
                <div className="mt-8 flex flex-col items-center">
                  <button 
                    onClick={handleSubmitDonation}
                    className="w-full sm:w-auto px-12 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center text-lg"
                  >
                    <HeartHandshake className="w-6 h-6 mr-3" />
                    Ofrecer Donación
                  </button>
                  <p className="text-xs text-center text-slate-500 mt-4 max-w-sm">
                    Se enviará una notificación a la institución para que acepte la oferta y coordine el recojo.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* --- TAB 2: PETICIONES RECIBIDAS --- */}
      {activeTab === "peticiones" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {peticiones.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">¡Todo al día!</h3>
              <p className="text-slate-500 mt-2">No tienes nuevas peticiones de donación pendientes por revisar.</p>
            </div>
          ) : (
            peticiones.map((peticion) => {
              const isExpanded = expandedPeticionId === peticion.id;
              const selectedItems = selectedForApproval[peticion.id] || [];
              
              return (
                <div key={peticion.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleAccordion(peticion.id)}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-4 shrink-0">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{peticion.institutionName}</h4>
                        <p className="text-sm text-slate-500">Recibido: {peticion.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 sm:mt-0">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-semibold rounded-full mr-4">
                        {peticion.items.length} productos pedidos
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Accordion Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50/50"
                      >
                        <div className="p-6">
                          <p className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Selecciona los productos a aprobar:</p>
                          <div className="space-y-2 mb-6">
                            {peticion.items.map(item => {
                              const isChecked = selectedItems.includes(item.id);
                              return (
                                <label key={item.id} className="flex items-center p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                                  <div onClick={() => toggleApprovalItem(peticion.id, item.id)} className="mr-4">
                                    {isChecked ? (
                                      <CheckSquare className="w-6 h-6 text-primary" />
                                    ) : (
                                      <Square className="w-6 h-6 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{item.product}</p>
                                  </div>
                                  <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                    Solicita: {item.requestedQty} und.
                                  </div>
                                </label>
                              );
                            })}
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200">
                            <button
                              onClick={() => handleSelectAllToggle(peticion.id)}
                              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors w-full sm:w-auto text-left sm:text-center"
                            >
                              {selectedItems.length === peticion.items.length ? "Deseleccionar Todo" : "Seleccionar Todo"}
                            </button>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                              <button 
                                onClick={() => openRejectModal(peticion.id)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors"
                              >
                                Rechazar
                              </button>
                              <button 
                                onClick={() => openConfirmModal(peticion.id)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors shadow-sm"
                              >
                                Aceptar ({selectedItems.length})
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* --- TAB 3: REGISTRO DE DONACIONES --- */}
      {activeTab === "registro" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {mockDonationRecords.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No hay registros</h3>
              <p className="text-slate-500 mt-1">Aún no se han procesado donaciones.</p>
            </div>
          ) : (
            mockDonationRecords.map((record) => (
              <div key={record.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">{record.product}</h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                      {record.qty} und.
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Building2 className="w-4 h-4 mr-1.5 shrink-0" />
                    {record.institutionName}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fecha Entrega</p>
                    <div className="flex items-center justify-end text-sm font-semibold text-slate-700">
                      {record.deliveryDate !== "-" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                          {record.deliveryDate}
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                          Por definir
                        </>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold border flex items-center min-w-[140px] justify-center",
                    record.status === "Procesando" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"
                  )}>
                    {record.status === "Procesando" ? <Truck className="w-4 h-4 mr-2" /> : <HeartHandshake className="w-4 h-4 mr-2" />}
                    {record.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Modal Aceptar Donación (Portal) */}
      {createPortal(
        <AnimatePresence>
          {isConfirmModalOpen && activePeticionForModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsConfirmModalOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Confirmar Donación</h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  Se donarán los siguientes productos a <strong className="text-slate-800">{activePeticionForModal.institutionName}</strong>:
                </p>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-y-auto mb-6 max-h-60">
                  <ul className="space-y-2">
                    {activePeticionForModal.items
                      .filter(item => (selectedForApproval[activePeticionForModal.id] || []).includes(item.id))
                      .map(item => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700">{item.product}</span>
                        <span className="text-slate-500 font-bold">{item.requestedQty} und.</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmAccept}
                    className="flex-1 px-4 py-2.5 text-white bg-primary hover:bg-primary/90 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Confirmar Envío
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal Rechazar Petición (Portal) */}
      {createPortal(
        <AnimatePresence>
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRejectModalOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Rechazar Solicitud</h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  ¿Estás seguro de que deseas rechazar esta solicitud? Esta acción no se puede deshacer.
                </p>

                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Sí, Rechazar
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
