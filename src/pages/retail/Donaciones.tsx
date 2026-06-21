import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeartHandshake, Inbox, Search, Star, Building2, ChevronRight, ChevronLeft, ArrowLeft, 
  PackageCheck, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, ClipboardList, Clock, Truck
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
  shrinkageId?: number;
  status?: string;
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
  status: "Procesando" | "Donado" | "Aceptado" | "Rechazado" | "Solicitado";
  deliveryDate: string;
}

const unwrapValue = (field: any) => {
  if (field && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
};

const unwrapAmount = (field: any) => {
  if (field && typeof field === "object" && "amount" in field) {
    return field.amount;
  }
  return field;
};

export const mockInstitutions: Institution[] = [
  { id: "1", name: "Comedor Popular Esperanza", type: "Comedor Social", isFavorite: true },
  { id: "2", name: "ONG Alimentos para Todos", type: "Organización No Gubernamental", isFavorite: false },
  { id: "3", name: "Hogar de Niños San José", type: "Orfanato", isFavorite: true },
  { id: "4", name: "Asociación Vecinos Solidarios", type: "Asociación Vecinal", isFavorite: false },
  { id: "5", name: "Banco de Alimentos Lima", type: "Banco de Alimentos", isFavorite: true },
  { id: "6", name: "Refugio Animales San Francisco", type: "Refugio Animal", isFavorite: false },
];

export const mockMermaDonable: MermaItem[] = [
  { id: "m1", product: "Lote de Manzanas", maxStock: 45 },
  { id: "m2", product: "Cajas de Leche Evaporada", maxStock: 20 },
  { id: "m3", product: "Panadería Variada", maxStock: 150 },
  { id: "m4", product: "Yogurt Natural (Pack 6)", maxStock: 30 },
  { id: "m5", product: "Vegetales Mixtos (Sacos)", maxStock: 12 },
];

export const mockPeticiones: Peticion[] = [
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

export const mockDonationRecords: DonationRecord[] = [
  { id: "dr1", product: "Cajas de Leche Evaporada", institutionName: "Comedor Popular Esperanza", qty: 5, status: "Procesando", deliveryDate: "-" },
  { id: "dr2", product: "Lote de Manzanas", institutionName: "Hogar de Niños San José", qty: 10, status: "Donado", deliveryDate: "2026-05-28" },
  { id: "dr3", product: "Panadería Variada", institutionName: "Banco de Alimentos Lima", qty: 30, status: "Procesando", deliveryDate: "-" },
  { id: "dr4", product: "Vegetales Mixtos (Sacos)", institutionName: "ONG Alimentos para Todos", qty: 12, status: "Donado", deliveryDate: "2026-05-25" },
];

import { useRef } from "react";
import { api } from "../../services/api";

export const Donaciones = () => {
  const [activeTab, setActiveTab] = useState<"crear" | "peticiones" | "registro">("crear");

  // --- Estado Tab 1: Crear Donación ---
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [mermas, setMermas] = useState<MermaItem[]>([]);
  const [instSearch, setInstSearch] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [mermaSearch, setMermaSearch] = useState("");
  const [_isSubmitting, setIsSubmitting] = useState(false);
  
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
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [expandedPeticionId, setExpandedPeticionId] = useState<string | null>(null);
  // Estado para la aprobación parcial (peticionId -> array of requestedItemId)
  const [selectedForApproval, setSelectedForApproval] = useState<Record<string, string[]>>({});
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(null);

  // --- Estado Tab 3: Registro ---
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);

  // --- APIs Data Loaders ---
  const reloadMerma = async () => {
    try {
      const response = await api.get("/shrinkages/donable");
      const shrinkages = (response.data || []) as any[];
      setMermas(
        shrinkages.map((s) => ({
          id: String(s.shrinkageId),
          product: s.name,
          maxStock: s.quantity,
        }))
      );
    } catch {
      setMermas([]);
    }
  };

  const reloadInstitutions = async () => {
    try {
      const response = await api.get("/beneficiary-institutions");
      const list = response.data || [];
      const storedFavs = localStorage.getItem('favorite_institutions');
      const favoriteIds: string[] = storedFavs ? JSON.parse(storedFavs) : [];
      
      setInstitutions(
        list.map((bi: any) => {
          const instId = String(bi.beneficiaryInstitutionId);
          return {
            id: instId,
            name: bi.name,
            type: bi.institutionType?.name || "Sin tipo",
            isFavorite: favoriteIds.includes(instId),
          };
        })
      );
    } catch {
      setInstitutions([]);
    }
  };

  const loadPeticiones = async () => {
    try {
      const response = await api.get("/requests/company");
      const requests = response.data || [];
      
      const resolved = await Promise.all(requests.map(async (req: any) => {
        const benId = unwrapValue(req.beneficiaryReferenceId);
        const shrId = unwrapValue(req.shrinkageReferenceId);
        const requestId = unwrapValue(req.donationRequestId) || req.id;
        
        let institutionName = `Beneficiario #${benId}`;
        try {
          const benRes = await api.get(`/beneficiary-institutions/${benId}`);
          if (benRes.data?.name) {
            institutionName = benRes.data.name;
          }
        } catch {}
        
        let product = `Merma #${shrId}`;
        let maxQty = 1;
        try {
          const shrRes = await api.get(`/shrinkages/${shrId}`);
          if (shrRes.data?.name) {
            product = shrRes.data.name;
            maxQty = shrRes.data.quantity;
          }
        } catch {}
        
        return {
          id: String(requestId),
          institutionName,
          date: req.createdAt ? new Date(req.createdAt).toLocaleString() : "Recientemente",
          items: [
            {
              id: String(requestId),
              product,
              requestedQty: maxQty,
              shrinkageId: shrId,
              status: req.status,
            }
          ]
        };
      }));

      // Group resolved items by institutionName
      const groups: Record<string, Peticion> = {};
      resolved.forEach((item) => {
        const key = item.institutionName;
        if (!groups[key]) {
          groups[key] = {
            id: item.id,
            institutionName: item.institutionName,
            date: item.date,
            items: [],
          };
        }
        groups[key].items.push({
          id: item.items[0].id,
          product: item.items[0].product,
          requestedQty: item.items[0].requestedQty,
          shrinkageId: item.items[0].shrinkageId,
          status: item.items[0].status,
        });
      });
      
      setPeticiones(Object.values(groups));
    } catch {
      setPeticiones([]);
    }
  };

  const reloadDonations = async () => {
    try {
      const [donationsRes, requestsRes] = await Promise.all([
        api.get("/donations/company").catch(() => ({ data: [] })),
        api.get("/requests/company").catch(() => ({ data: [] }))
      ]);
      const donations = donationsRes.data || [];
      const requests = requestsRes.data || [];
      
      const resolvedDonations = await Promise.all(donations.map(async (d: any) => {
        const shrId = unwrapValue(d.items?.[0]?.shrinkageReferenceId) || unwrapValue(d.shrinkageReferenceId);
        const benId = unwrapValue(d.beneficiaryReferenceId);
        
        let institutionName = `Beneficiario #${benId}`;
        try {
          const benRes = await api.get(`/beneficiary-institutions/${benId}`);
          if (benRes.data?.name) {
            institutionName = benRes.data.name;
          }
        } catch {}
        
        let product = `Merma #${shrId}`;
        try {
          const shrRes = await api.get(`/shrinkages/${shrId}`);
          if (shrRes.data?.name) {
            product = shrRes.data.name;
          }
        } catch {}
        
        return {
          id: String(unwrapValue(d.donationId) || d.id),
          product,
          institutionName,
          qty: unwrapAmount(d.quantity) || 0,
          status: (d.status === "CONFIRMED" || d.status === "PICKED_UP" || d.status === "DONATED") ? "Donado" : (d.status === "REJECTED" || d.status === "CANCELLED") ? "Rechazado" : "Procesando",
          deliveryDate: unwrapValue(d.scheduledPickupDate) || unwrapValue(d.scheduledDeliveryDate) || "-",
        };
      }));

      // Add pending/accepted/rejected requests to the log
      const completedRequests = requests.filter((r: any) => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "REJECTED" || r.status === "CANCELLED");
      const resolvedRequests = await Promise.all(completedRequests.map(async (r: any) => {
        const shrId = unwrapValue(r.shrinkageReferenceId);
        const benId = unwrapValue(r.beneficiaryReferenceId);
        
        let institutionName = `Beneficiario #${benId}`;
        try {
          const benRes = await api.get(`/beneficiary-institutions/${benId}`);
          if (benRes.data?.name) {
            institutionName = benRes.data.name;
          }
        } catch {}
        
        let product = `Merma #${shrId}`;
        let maxQty = 1;
        try {
          const shrRes = await api.get(`/shrinkages/${shrId}`);
          if (shrRes.data?.name) {
            product = shrRes.data.name;
            maxQty = shrRes.data.quantity;
          }
        } catch {}

        return {
          id: `req-${unwrapValue(r.donationRequestId) || r.id}`,
          product,
          institutionName,
          qty: maxQty,
          status: r.status === "PENDING" ? "Solicitado" : r.status === "ACCEPTED" ? "Aceptado" : "Rechazado",
          deliveryDate: "-",
        };
      }));
      
      setDonationRecords([...resolvedDonations, ...resolvedRequests] as DonationRecord[]);
    } catch {
      setDonationRecords([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([reloadInstitutions(), reloadMerma(), loadPeticiones(), reloadDonations()]);
    };
    init();
  }, []);

  // Cleanup reserved items on unmount
  const donationQuantitiesRef = useRef(donationQuantities);
  useEffect(() => {
    donationQuantitiesRef.current = donationQuantities;
  }, [donationQuantities]);

  useEffect(() => {
    return () => {
      const current = donationQuantitiesRef.current;
      const reservedIds = Object.keys(current).filter(id => current[id] > 0);
      if (reservedIds.length > 0) {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Verify the user is still a RETAIL actor to avoid role mismatch errors on logout/switch
        try {
          const parts = token.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            if (payload.actor !== "RETAIL") {
              return;
            }
          }
        } catch (e) {
          return;
        }

        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        reservedIds.forEach(id => {
          const url = `${import.meta.env.VITE_API_URL}/shrinkages/${id}/donable`;
          // We must use fetch with Authorization headers since the endpoint requires RETAIL actor permissions.
          // navigator.sendBeacon does not support custom headers, so we use fetch with keepalive.
          fetch(url, { 
            method: "PATCH", 
            keepalive: true,
            headers
          }).catch(err => console.error("Error releasing reservation on unmount", err));
        });
      }
    };
  }, []);

  const releaseAllReserved = async (currentQuantities: Record<string, number> = donationQuantities) => {
    const reservedIds = Object.keys(currentQuantities).filter(id => currentQuantities[id] > 0);
    if (reservedIds.length === 0) return;
    try {
      await Promise.all(
        reservedIds.map(id => api.patch(`/shrinkages/${id}/donable`))
      );
      setDonationQuantities({});
      await reloadMerma();
      toast.info("Reservas de productos liberadas.");
    } catch {
      toast.error("Error al liberar las reservas.");
    }
  };

  const handleToggleProduct = async (item: MermaItem) => {
    const qty = donationQuantities[item.id] || 0;
    try {
      if (qty === 0) {
        // Reserve
        await api.patch(`/shrinkages/${item.id}/in-process`);
        setDonationQuantities(prev => ({ ...prev, [item.id]: item.maxStock }));
        toast.success(`${item.product} reservado temporalmente.`);
      } else {
        // Release
        await api.patch(`/shrinkages/${item.id}/donable`);
        setDonationQuantities(prev => ({ ...prev, [item.id]: 0 }));
        toast.info(`${item.product} liberado.`);
      }
    } catch {
      toast.error("No se pudo actualizar la reserva del producto.");
    }
  };

  const handleTabChange = async (tab: "crear" | "peticiones" | "registro") => {
    if (activeTab === "crear" && step >= 2) {
      await releaseAllReserved();
    }
    setActiveTab(tab);
    setStep(1);
  };

  // --- Handlers Tab 1 ---
  const toggleFavorite = (id: string) => {
    setInstitutions(insts => {
      const updated = insts.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i);
      const favoriteIds = updated.filter(i => i.isFavorite).map(i => i.id);
      localStorage.setItem('favorite_institutions', JSON.stringify(favoriteIds));
      return updated;
    });
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
    return mermas.filter(m => m.product.toLowerCase().includes(mermaSearch.toLowerCase()));
  }, [mermas, mermaSearch]);

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

  const handleGoToStep3 = () => {
    const totalItems = Object.values(donationQuantities).filter(q => q > 0).length;
    if (totalItems === 0) {
      toast.error("Debes seleccionar al menos un producto para continuar.");
      return;
    }
    setStep(3);
  };

  const handleSubmitDonation = async () => {
    const selectedIds = Object.keys(donationQuantities).filter(id => donationQuantities[id] > 0);
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map(id => {
          const payload = {
            shrinkageReferenceId: { value: Number(id) },
            beneficiaryReferenceId: { value: Number(selectedInst?.id) },
            quantity: { amount: donationQuantities[id] },
            scheduledPickupDate: { value: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10) }
          };
          return api.post("/donations/create", payload);
        })
      );
      toast.success(`Donación ofrecida a ${selectedInst?.name} con éxito.`);
      setDonationQuantities({});
      setSelectedInst(null);
      setStep(1);
      await reloadMerma();
      await reloadDonations();
    } catch {
      toast.error("No se pudo registrar la donación.");
    } finally {
      setIsSubmitting(false);
    }
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
    
    const pendingItems = peticion.items.filter(i => i.status === "PENDING");
    const currentSelected = selectedForApproval[peticionId] || [];
    if (currentSelected.length === pendingItems.length) {
      setSelectedForApproval(prev => ({ ...prev, [peticionId]: [] })); // Deselect all
    } else {
      setSelectedForApproval(prev => ({ ...prev, [peticionId]: pendingItems.map(i => i.id) })); // Select all
    }
  };

  const handleAcceptRequests = async (peticionId: string) => {
    const selectedItems = selectedForApproval[peticionId] || [];
    if (selectedItems.length === 0) {
      toast.error("Selecciona al menos un producto para aceptar.");
      return;
    }
    setSubmittingRequestId(peticionId);
    try {
      const acceptedShrinkageIds = new Set<number | string>();
      peticiones.forEach((p) => {
        p.items.forEach((item) => {
          if (selectedItems.includes(item.id) && item.shrinkageId !== undefined) {
            acceptedShrinkageIds.add(item.shrinkageId);
          }
        });
      });

      await Promise.all(
        selectedItems.map((id) => api.patch(`/requests/${id}/accept`))
      );
      toast.success("Solicitudes aceptadas con éxito.");
      setSelectedForApproval((prev) => ({ ...prev, [peticionId]: [] }));

      await loadPeticiones();
      await reloadDonations();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data || "Ocurrió un error al aceptar las solicitudes.";
      toast.error(`Error: ${msg}`);
    } finally {
      setSubmittingRequestId(null);
    }
  };

  const handleRejectRequests = async (peticionId: string) => {
    const selectedItems = selectedForApproval[peticionId] || [];
    if (selectedItems.length === 0) {
      toast.error("Selecciona al menos un producto para rechazar.");
      return;
    }
    setSubmittingRequestId(peticionId);
    try {
      await Promise.all(
        selectedItems.map((id) => api.patch(`/requests/${id}/reject`))
      );
      toast.success("Solicitudes rechazadas.");
      setSelectedForApproval((prev) => ({ ...prev, [peticionId]: [] }));
      await loadPeticiones();
      await reloadDonations();
    } catch {
      toast.error("Ocurrió un error al rechazar las solicitudes.");
    } finally {
      setSubmittingRequestId(null);
    }
  };

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
            onClick={() => handleTabChange("crear")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "crear" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <HeartHandshake className="w-4 h-4 mr-2" />
            Donar
          </button>
          <button
            onClick={() => handleTabChange("peticiones")}
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
            onClick={() => handleTabChange("registro")}
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
                  onClick={async () => { await releaseAllReserved(); setStep(1); }}
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
                              onClick={() => handleToggleProduct(item)}
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
                    {mermas.filter(m => (donationQuantities[m.id] || 0) > 0).map(item => (
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
                              const isPending = item.status === "PENDING";
                              const isChecked = selectedItems.includes(item.id);
                              return (
                                <label key={item.id} className={cn("flex items-center p-3 bg-white border rounded-xl transition-colors", isPending ? "border-slate-200 cursor-pointer hover:border-primary/50" : "border-slate-100 opacity-60 cursor-not-allowed")}>
                                  <div onClick={() => isPending && toggleApprovalItem(peticion.id, item.id)} className="mr-4">
                                    {isPending ? (
                                      isChecked ? <CheckSquare className="w-6 h-6 text-primary" /> : <Square className="w-6 h-6 text-slate-300" />
                                    ) : (
                                      item.status === "ACCEPTED" ? <CheckSquare className="w-6 h-6 text-emerald-500" /> : <Square className="w-6 h-6 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className={cn("font-semibold", isPending ? "text-slate-800" : "text-slate-500 line-through")}>{item.product}</p>
                                    {!isPending && <p className={cn("text-xs font-bold", item.status === "ACCEPTED" ? "text-emerald-500" : "text-red-400")}>{item.status === "ACCEPTED" ? "Aceptado" : "Rechazado"}</p>}
                                  </div>
                                  <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                    Solicita: {item.requestedQty} und.
                                  </div>
                                </label>
                              );
                            })}
                          </div>

                          {peticion.items.some(i => i.status === "PENDING") && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200">
                              <button
                                onClick={() => handleSelectAllToggle(peticion.id)}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors w-full sm:w-auto text-left sm:text-center"
                              >
                                {selectedItems.length === peticion.items.filter(i => i.status === "PENDING").length ? "Deseleccionar Todo" : "Seleccionar Todo"}
                              </button>
                              
                              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <button 
                                  disabled={submittingRequestId === peticion.id}
                                  onClick={() => handleRejectRequests(peticion.id)}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors flex items-center justify-center"
                                >
                                  Rechazar
                                </button>
                                <button 
                                  disabled={submittingRequestId === peticion.id}
                                  onClick={() => handleAcceptRequests(peticion.id)}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center min-w-[120px]"
                                >
                                  {submittingRequestId === peticion.id && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  )}
                                  Aceptar ({selectedItems.length})
                                </button>
                              </div>
                            </div>
                          )}
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
          {donationRecords.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No hay registros</h3>
              <p className="text-slate-500 mt-1">Aún no se han procesado donaciones.</p>
            </div>
          ) : (
            donationRecords.map((record) => (
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
                      {record.status === "Rechazado" ? (
                        <span className="text-slate-400 font-normal">—</span>
                      ) : record.deliveryDate !== "-" ? (
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
                    record.status === "Solicitado" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    record.status === "Procesando" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                    record.status === "Aceptado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    record.status === "Rechazado" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-purple-50 text-purple-700 border-purple-200"
                  )}>
                    {record.status === "Solicitado" ? <Clock className="w-4 h-4 mr-2" /> :
                     record.status === "Procesando" ? <Truck className="w-4 h-4 mr-2" /> : 
                     record.status === "Aceptado" ? <CheckCircle2 className="w-4 h-4 mr-2" /> :
                     record.status === "Rechazado" ? <CheckCircle2 className="w-4 h-4 mr-2 opacity-50" /> :
                     <HeartHandshake className="w-4 h-4 mr-2" />}
                    {record.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

    </div>
  );
};
