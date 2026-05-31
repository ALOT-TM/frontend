import React, { useState, useMemo } from "react";
import { Search, Filter, Package, Plus, Minus, ClipboardList, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBeneficiaryContext } from "../../components/layouts/BeneficiaryLayout";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { cn } from "../../utils/cn";

// Mock data
const baseItems = [
  { product: "Pan de Molde Blanco", category: "Panadería" },
  { product: "Yogurt de Fresa 1L", category: "Lácteos" },
  { product: "Manzanas Rojas (Bolsa 1kg)", category: "Frutas" },
  { product: "Arroz Extra 5kg", category: "Abarrotes" },
  { product: "Leche Entera (Pack 6)", category: "Lácteos" },
  { product: "Galletas de Avena", category: "Snacks" },
  { product: "Cereal de Maíz", category: "Abarrotes" },
  { product: "Tomates (Malla 1kg)", category: "Verduras" },
  { product: "Queso Edam 250g", category: "Lácteos" },
  { product: "Fideos Spaghetti", category: "Abarrotes" }
];

const retailData = [
  { company: "Supermercado Plaza", hq: "Supermercado Plaza - Surco" },
  { company: "Supermercado Plaza", hq: "Supermercado Plaza - San Borja" },
  { company: "EcoMarket", hq: "EcoMarket - Miraflores" },
  { company: "EcoMarket", hq: "EcoMarket - San Isidro" },
  { company: "Tiendas del Sur", hq: "Tiendas del Sur - Chorrillos" },
  { company: "Tiendas del Sur", hq: "Tiendas del Sur - Barranco" }
];

const mockCatalog = Array.from({ length: 100 }, (_, i) => {
  const base = baseItems[i % baseItems.length];
  const retail = retailData[i % retailData.length];
  const dateOffset = (i * 7) % 90;
  
  // Format date correctly YYYY-MM-DD
  const date = new Date(2026, 5, 1 + dateOffset);
  const expiryDate = date.toISOString().slice(0, 10);
  
  return {
    id: i + 1,
    product: `${base.product} ${i > 9 ? `(Lote ${i})` : ''}`.trim(),
    category: base.category,
    quantity: (i % 25) + 5,
    retailCompany: retail.company,
    headquarterName: retail.hq,
    expiryDate
  };
});

const categories = ["Todas", "Panadería", "Lácteos", "Frutas", "Verduras", "Abarrotes", "Snacks"];
const retailCompanies = ["Todas", "Supermercado Plaza", "EcoMarket", "Tiendas del Sur"];

export const BuscarDonaciones = () => {
  const { addToCart, removeFromCart, cart } = useBeneficiaryContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedRetail, setSelectedRetail] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Helper to generate visible pages with ellipses
  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    return mockCatalog.filter((item) => {
      const matchSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === "Todas" || item.category === selectedCategory;
      const matchRetail = selectedRetail === "Todas" || item.retailCompany === selectedRetail;
      return matchSearch && matchCategory && matchRetail;
    });
  }, [searchTerm, selectedCategory, selectedRetail]);

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
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 flex flex-col transition-all shadow-sm hover:shadow-md group",
                  inCart ? "border-cyan-500 ring-1 ring-cyan-500" : "border-slate-200"
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
                    onClick={() => inCart ? removeFromCart(item.id) : addToCart(item)}
                    className={cn(
                      "p-2 rounded-xl transition-all focus:outline-none flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95",
                      inCart 
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" 
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    )}
                  >
                    {inCart ? (
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
