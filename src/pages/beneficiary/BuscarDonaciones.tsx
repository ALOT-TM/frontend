import { useState, useMemo, useEffect } from "react";
import { Search, Package, Plus, Minus, ClipboardList, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBeneficiaryContext } from "../../components/layouts/BeneficiaryLayout";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { toast } from "sonner";

export const BuscarDonaciones = () => {
  const { addToCart, removeFromCart, cart } = useBeneficiaryContext();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [requestedShrinkageIds, setRequestedShrinkageIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedRetail, setSelectedRetail] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const unwrapValue = (field: any) => {
    if (field && typeof field === "object" && "value" in field) return field.value;
    return field;
  };

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

  const fetchRequestedShrinkageIds = async () => {
    const userId = parseJwtUserId();
    if (!userId) return new Set<number>();

    try {
      const userRes = await api.get(`/auth/users/${userId}`);
      const beneficiaryId = userRes.data?.beneficiaryInstitutionId;
      if (!beneficiaryId) return new Set<number>();

      const requestsRes = await api.get(`/requests?beneficiaryId=${beneficiaryId}`);
      return new Set<number>(
        (requestsRes.data || [])
          .map((request: any) => Number(unwrapValue(request.shrinkageReferenceId)))
          .filter((id: number) => Number.isFinite(id))
      );
    } catch (err) {
      console.error("Error loading beneficiary donation requests", err);
      return new Set<number>();
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [response, requestedIds] = await Promise.all([
        api.get("/shrinkages/donable"),
        fetchRequestedShrinkageIds()
      ]);
      
      const shrinkages = response.data || [];
      
      // Extract unique headquarter IDs from shrinkages
      const hqIds: number[] = Array.from(new Set(
        shrinkages.map((s: any) => s.retailCompanyHeadquarterId).filter(Boolean)
      ));
      
      // Fetch headquarter details in parallel
      const headquarterMap: Record<number, any> = {};
      await Promise.all(
        hqIds.map(async (hqId) => {
          try {
            const res = await api.get(`/retail-company-headquarters/${hqId}`);
            headquarterMap[hqId] = res.data;
          } catch (err) {
            console.error(`Error fetching headquarter ${hqId}`, err);
          }
        })
      );

      const mappedData = shrinkages.map((item: any) => {
        const hq = item.retailCompanyHeadquarterId ? headquarterMap[item.retailCompanyHeadquarterId] : null;
        return {
          id: Number(unwrapValue(item.shrinkageId)),
          product: item.name,
          category: item.category?.name || "Sin Categoría",
          quantity: item.quantity,
          retailCompany: hq?.retailCompany?.name || "Comercio",
          headquarterName: hq?.description || "Sede",
          expiryDate: item.expirationDate || "Sin Fecha",
          alreadyRequested: requestedIds.has(Number(unwrapValue(item.shrinkageId)))
        };
      });
      setRequestedShrinkageIds(requestedIds);
      setCatalog(mappedData);
    } catch (err) {
      console.error("Error loading donable shrinkages", err);
      toast.error("Error al cargar el catálogo de donaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(catalog.map(item => item.category)));
    return ["Todas", ...unique];
  }, [catalog]);

  const retailCompanies = useMemo(() => {
    const unique = Array.from(new Set(catalog.map(item => item.retailCompany)));
    return ["Todas", ...unique];
  }, [catalog]);

  // Helper to generate visible pages with ellipses
  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const matchSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === "Todas" || item.category === selectedCategory;
      const matchRetail = selectedRetail === "Todas" || item.retailCompany === selectedRetail;
      return matchSearch && matchCategory && matchRetail;
    });
  }, [catalog, searchTerm, selectedCategory, selectedRetail]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catálogo de Donaciones</h1>
        <p className="text-slate-500 mt-2">Encuentra productos disponibles y añádelos a tu solicitud.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 flex-1 md:flex-none">
          <div className="relative flex-1 sm:w-48">
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              className="w-full bg-slate-50 border-slate-200"
              themeColor="cyan"
            />
          </div>
          
          <div className="relative flex-1 sm:w-48">
            <CustomSelect
              value={selectedRetail}
              onChange={(val) => { setSelectedRetail(val); setCurrentPage(1); }}
              options={retailCompanies.map(retail => ({ value: retail, label: retail }))}
              className="w-full bg-slate-50 border-slate-200"
              themeColor="cyan"
            />
          </div>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${currentPage}-${itemsPerPage}-${searchTerm}-${selectedCategory}-${selectedRetail}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedItems.map((item) => {
              const inCart = cart.some((c) => c.id === item.id);
              const alreadyRequested = item.alreadyRequested || requestedShrinkageIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-white rounded-2xl border p-5 flex flex-col transition-all shadow-sm hover:shadow-md group",
                    alreadyRequested
                      ? "border-slate-200 bg-slate-50 opacity-75"
                      : inCart
                        ? "border-cyan-500 ring-1 ring-cyan-500"
                        : "border-slate-200"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
                      {item.category}
                    </span>
                    <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      Vence: {item.expiryDate}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{item.product}</h3>
                  <p className="text-sm text-slate-500 mb-4">{item.headquarterName}</p>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Package className="w-4 h-4 text-cyan-600" />
                      <span className="font-semibold">{item.quantity}</span>
                      <span className="text-sm text-slate-500">und. disponibles</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (alreadyRequested) {
                          toast.info("Ya solicitaste esta merma");
                          return;
                        }
                        inCart ? removeFromCart(item.id) : addToCart(item);
                      }}
                      disabled={alreadyRequested}
                      className={cn(
                        "p-2 rounded-xl transition-all focus:outline-none flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed",
                        alreadyRequested
                          ? "bg-slate-100 text-slate-500 border border-slate-200"
                          : inCart 
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" 
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      )}
                    >
                      {alreadyRequested ? (
                        <>
                          <ClipboardList className="w-4 h-4" />
                          <span className="text-sm font-semibold pr-1">Solicitado</span>
                        </>
                      ) : inCart ? (
                        <>
                          <Minus className="w-4 h-4" />
                          <span className="text-sm font-semibold pr-1">Quitar</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-semibold pr-1">Añadir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {filteredItems.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <ClipboardList className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No se encontraron productos</h3>
          <p className="text-slate-500 mt-2">Intenta modificar tus filtros de búsqueda.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm mt-8">
          
          <div className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto justify-center sm:justify-start">
            <span>Mostrar</span>
            <CustomSelect
              value={String(itemsPerPage)}
              onChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { value: "6", label: "6" },
                { value: "12", label: "12" },
                { value: "24", label: "24" },
                { value: "48", label: "48" }
              ]}
              containerClassName="mx-2 w-16"
              className="px-2 py-1 min-h-[32px] rounded-lg border-0 bg-slate-100 hover:bg-slate-200 text-center justify-center font-medium shadow-none"
              openUpwards={true}
              themeColor="cyan"
            />
            <span>por página</span>
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mr-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {getVisiblePages(currentPage, totalPages).map((page, i) => {
                if (page === '...') {
                  return (
                    <div key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-slate-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </div>
                  );
                }
                return (
                  <button
                    key={`page-${page}`}
                    onClick={() => setCurrentPage(Number(page))}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all border",
                      currentPage === page
                        ? "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm"
                        : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <div className="sm:hidden flex items-center px-4 text-sm font-medium text-slate-700">
              Página {currentPage} de {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm ml-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
