import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, MapPin, Store, AlertTriangle, X, PackageX, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";

// Tipos
interface Local {
  id: number;
  name: string;
  address: string;
  city: string;
  merma: number;
}

interface Country {
  countryId: number;
  name: string;
}

interface AddressDto {
  addressId: number;
  street1: string;
  street2?: string | null;
  city: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: { countryId: number; name: string } | null;
}

interface RetailCompanyHeadquarterDto {
  retailCompanyHeadquarterId: number;
  description: string;
  retailCompany?: { retailCompanyId: number } | null;
  address?: AddressDto | null;
}

interface ProfileDto {
  retailCompanyId?: number | null;
}

interface Option {
  value: string;
  label: string;
}

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: Option[]; 
  value: string | number; 
  onChange: (val: string) => void; 
  placeholder: string; 
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
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 bg-white border rounded-xl text-sm focus:outline-none transition-all shadow-sm cursor-pointer flex items-center justify-between min-h-[42px]",
          isOpen ? "border-primary ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"
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
             initial={{ opacity: 0, y: -5 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -5 }}
             transition={{ duration: 0.15 }}
             className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto"
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

export const Locales = () => {
  const [locales, setLocales] = useState<Local[]>([]);
  const [headquarters, setHeadquarters] = useState<RetailCompanyHeadquarterDto[]>([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentLocal, setCurrentLocal] = useState<Local | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [retailCompanyId, setRetailCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: "", 
    street1: "", 
    street2: "", 
    city: "", 
    stateProvince: "",
    postalCode: "",
    countryId: ""
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [profileResponse, countriesResponse, headquartersResponse] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/countries"),
          api.get("/retail-company-headquarters"),
        ]);
        const profile = (profileResponse.data || {}) as ProfileDto;
        setRetailCompanyId(profile.retailCompanyId ?? null);
        setCountries(countriesResponse.data || []);
        const hqs = (headquartersResponse.data || []) as RetailCompanyHeadquarterDto[];
        setHeadquarters(hqs);
        setLocales(mapHeadquartersToLocales(hqs, profile.retailCompanyId ?? null));
      } catch {
        toast.error("No se pudieron cargar los locales.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Animaciones Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  // Manejo de Modal/Slide-over
  const openSlideOver = (local?: Local) => {
    if (local) {
      setCurrentLocal(local);
      const hq = headquarters.find(h => h.retailCompanyHeadquarterId === local.id);
      if (hq) {
        setFormData({ 
          description: hq.description, 
          street1: hq.address?.street1 || "", 
          street2: hq.address?.street2 || "", 
          city: hq.address?.city || "", 
          stateProvince: hq.address?.stateProvince || "",
          postalCode: hq.address?.postalCode || "",
          countryId: hq.address?.country?.countryId?.toString() || "" 
        });
      } else {
        setFormData({ 
          description: local.name, 
          street1: local.address, 
          street2: "", 
          city: local.city, 
          stateProvince: "",
          postalCode: "",
          countryId: "" 
        });
      }
    } else {
      setCurrentLocal(null);
      setFormData({ 
        description: "", 
        street1: "", 
        street2: "", 
        city: "", 
        stateProvince: "",
        postalCode: "",
        countryId: ""
      });
    }
    setIsSlideOverOpen(true);
  };

  const closeSlideOver = () => setIsSlideOverOpen(false);

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  // Acciones
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId) {
      toast.error("País requerido", { description: "Por favor, selecciona un país." });
      return;
    }
    if (!retailCompanyId) {
      toast.error("Empresa no disponible", { description: "No se pudo resolver la empresa actual." });
      return;
    }

    if (currentLocal) {
      const hq = headquarters.find(h => h.retailCompanyHeadquarterId === currentLocal.id);
      if (!hq || !hq.address) {
        toast.error("Error al editar", { description: "No se encontró la dirección del local." });
        return;
      }

      try {
        const addressPayload = {
          street1: formData.street1,
          street2: formData.street2 || null,
          city: formData.city,
          stateProvince: formData.stateProvince,
          postalCode: formData.postalCode || null,
          countryId: Number(formData.countryId),
        };

        // 1. Update the address
        await api.put(`/addresses/${hq.address.addressId}`, addressPayload);

        // 2. Update the headquarter
        await api.put(`/retail-company-headquarters/${currentLocal.id}`, {
          description: formData.description,
          addressId: hq.address.addressId
        });

        await reloadLocales(retailCompanyId);
        toast.success(`Local "${formData.description}" actualizado correctamente.`);
        closeSlideOver();
      } catch {
        toast.error("No se pudo actualizar el local.");
      }
      return;
    }

    try {
      const addressPayload = {
        street1: formData.street1,
        street2: formData.street2 || null,
        city: formData.city,
        stateProvince: formData.stateProvince,
        postalCode: formData.postalCode || null,
        countryId: Number(formData.countryId),
      };
      const addressResponse = await api.post("/addresses", addressPayload);
      const addressId = addressResponse.data?.addressId || addressResponse.data?.id;
      if (!addressId) {
        throw new Error("Address id missing");
      }
      await api.post("/retail-company-headquarters", {
        retailCompanyId,
        description: formData.description,
        addressId,
      });
      await reloadLocales(retailCompanyId);
      toast.success(`Local "${formData.description}" creado correctamente.`);
      closeSlideOver();
    } catch {
      toast.error("No se pudo crear el local.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/retail-company-headquarters/${deleteId}`);
      await reloadLocales(retailCompanyId);
      toast.success("Local eliminado correctamente.");
    } catch {
      toast.error("No se pudo eliminar el local.");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const mapHeadquartersToLocales = (
    headquarters: RetailCompanyHeadquarterDto[],
    companyId: number | null
  ): Local[] => {
    return headquarters
      .filter((item) => !companyId || item.retailCompany?.retailCompanyId === companyId)
      .map((item) => ({
        id: item.retailCompanyHeadquarterId,
        name: item.description,
        address: item.address?.street1 || "",
        city: item.address?.city || "",
        merma: 0,
      }));
  };

  const reloadLocales = async (companyId: number | null) => {
    const response = await api.get("/retail-company-headquarters");
    const hqs = (response.data || []) as RetailCompanyHeadquarterDto[];
    setHeadquarters(hqs);
    setLocales(mapHeadquartersToLocales(hqs, companyId));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Locales</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona la información y estado de tus sucursales.</p>
        </div>
        <button
          onClick={() => openSlideOver()}
          className="flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Añadir Nuevo Local
        </button>
      </div>

      {/* Grid de Tarjetas */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {isLoading && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Cargando locales...
          </div>
        )}
        {locales.map((local) => (
          <motion.div
            key={local.id}
            variants={cardVariants}
            className="group relative bg-white/80 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shrink-0 text-primary">
                <Store className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{local.name}</h3>
                <div className="flex items-center text-sm text-slate-500 mt-1">
                  <MapPin className="w-4 h-4 mr-1 shrink-0" />
                  <span className="truncate max-w-[200px]">{local.address}, {local.city}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Productos Mermados</p>
                <div className="flex items-center">
                  <PackageX className="w-4 h-4 text-slate-400 mr-1.5" />
                  <span className="text-lg font-bold text-slate-700">{local.merma}</span>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => openSlideOver(local)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Editar Local"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => confirmDelete(local.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar Local"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {locales.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No hay locales registrados</h3>
            <p className="text-slate-500 mt-1">Añade tu primer local para empezar a gestionar la merma.</p>
          </div>
        )}
      </motion.div>

      {/* Modal (Crear/Editar) */}
      {createPortal(
        <AnimatePresence>
          {isSlideOverOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSlideOver}
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
                  {currentLocal ? "Editar Local" : "Añadir Local"}
                </h3>
                <button onClick={closeSlideOver} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nombre de la Sucursal</label>
                    <input
                      required
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="Ej. Sucursal Miraflores"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Dirección Principal</label>
                      <input
                        required
                        type="text"
                        value={formData.street1}
                        onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Av. Larco 123"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Dirección Secundaria <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={formData.street2}
                        onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Dpto, Oficina, Piso..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ciudad / Municipio</label>
                      <input
                        required
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Ej. Lima"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Región / Provincia</label>
                      <input
                        required
                        type="text"
                        value={formData.stateProvince}
                        onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Ej. Lima Metropolitana"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">País</label>
                      <CustomSelect
                        value={formData.countryId}
                        onChange={(val) => setFormData({ ...formData, countryId: val })}
                        placeholder="Selecciona un país"
                        options={countries.map(c => ({ value: String(c.countryId), label: c.name }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Código Postal <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Ej. 15074"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={closeSlideOver}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-white bg-primary hover:bg-primary/90 font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Guardar
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

      {/* Modal de Confirmación de Eliminación */}
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
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Eliminar Local</h3>
              <p className="text-center text-slate-500 text-sm mb-6">
                ¿Estás seguro de que deseas eliminar este local? Esta acción no se puede deshacer.
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
