import React, { useState, useEffect } from "react";
import { ChevronDown, Package, MapPin, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../utils/cn";

type ChildStatus = "Solicitado" | "En Proceso" | "Rechazado" | "Recogido";
type ParentStatus = "En Proceso" | "Completada";

interface ChildItem {
  id: number;
  product: string;
  category: string;
  quantity: number;
  status: ChildStatus;
}

interface ParentDonation {
  id: string;
  date: string;
  headquarterName: string;
  status: ParentStatus;
  items: ChildItem[];
}

const initialDonations: ParentDonation[] = [
  {
    id: "DON-2026-001",
    date: "31 May 2026",
    headquarterName: "Supermercado Plaza - Local Sur",
    status: "En Proceso",
    items: [
      { id: 101, product: "Pan de Molde Blanco", category: "Panadería", quantity: 15, status: "En Proceso" },
      { id: 102, product: "Yogurt de Fresa 1L", category: "Lácteos", quantity: 8, status: "Recogido" },
    ],
  },
  {
    id: "DON-2026-002",
    date: "28 May 2026",
    headquarterName: "EcoMarket - Miraflores",
    status: "En Proceso",
    items: [
      { id: 201, product: "Manzanas Rojas", category: "Frutas", quantity: 20, status: "Rechazado" },
      { id: 202, product: "Arroz Extra 5kg", category: "Abarrotes", quantity: 5, status: "En Proceso" },
      { id: 203, product: "Galletas de Avena", category: "Snacks", quantity: 30, status: "Solicitado" },
    ],
  },
  {
    id: "DON-2026-003",
    date: "20 May 2026",
    headquarterName: "Tiendas del Sur - Chorrillos",
    status: "Completada",
    items: [
      { id: 301, product: "Leche Entera (Pack 6)", category: "Lácteos", quantity: 12, status: "Recogido" },
      { id: 302, product: "Tomates (Malla 1kg)", category: "Verduras", quantity: 25, status: "Recogido" },
    ],
  },
];

const StatusBadge = ({ status }: { status: ChildStatus | ParentStatus }) => {
  switch (status) {
    case "Solicitado":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200"><Clock className="w-3.5 h-3.5" /> Solicitado</span>;
    case "En Proceso":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg border border-amber-200"><AlertCircle className="w-3.5 h-3.5" /> En Proceso</span>;
    case "Rechazado":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200"><XCircle className="w-3.5 h-3.5" /> Rechazado</span>;
    case "Recogido":
    case "Completada":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-600 text-xs font-semibold rounded-lg border border-cyan-200"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
    default:
      return null;
  }
};

export const MisSeguimientos = () => {
  const [donations, setDonations] = useState<ParentDonation[]>(initialDonations);
  const [expandedId, setExpandedId] = useState<string | null>(initialDonations[0]?.id || null);



  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const markAsRecogido = (donationId: string, itemId: number) => {
    setDonations((prev) =>
      prev.map((donation) => {
        if (donation.id === donationId) {
          const newItems = donation.items.map((item) => {
            if (item.id === itemId) {
              toast.success(`Item marcado como Recogido`);
              return { ...item, status: "Recogido" as ChildStatus };
            }
            return item;
          });
          
          const allCompleted = newItems.every((item) => item.status === "Recogido" || item.status === "Rechazado");
          const newStatus: ParentStatus = allCompleted ? "Completada" : "En Proceso";
          
          return {
            ...donation,
            items: newItems,
            status: newStatus
          };
        }
        return donation;
      })
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Seguimientos</h1>
        <p className="text-slate-500 mt-2">Haz seguimiento a tus solicitudes de donación activas e históricas.</p>
      </div>

      <div className="space-y-4">
        {donations.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Package className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Aún no tienes solicitudes</h3>
            <p className="text-slate-500 mt-2">Visita el Catálogo de Donaciones para realizar tu primera solicitud.</p>
          </div>
        ) : (
          donations.map((donation) => {
            const isExpanded = expandedId === donation.id;
            const isCompleted = donation.status === "Completada";

            return (
              <div
                key={donation.id}
                className={cn(
                  "bg-white rounded-2xl border transition-all shadow-sm overflow-hidden",
                  isCompleted ? "border-cyan-200" : "border-amber-200"
                )}
              >
                {/* Parent Header */}
                <div
                  onClick={() => toggleExpand(donation.id)}
                  className={cn(
                    "p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50",
                    isCompleted ? "bg-cyan-50/30" : "bg-amber-50/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl flex-shrink-0",
                      isCompleted ? "bg-cyan-100 text-cyan-600" : "bg-amber-100 text-amber-600"
                    )}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-bold text-slate-900">{donation.id}</h2>
                        <StatusBadge status={donation.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {donation.date}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {donation.headquarterName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="text-sm font-medium">{donation.items.length} items</span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* Children Items */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-white">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 px-1">Detalle de la Solicitud</h3>
                        <div className="space-y-3">
                          {donation.items.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 mt-0.5">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight mb-1">{item.product}</p>
                                  <p className="text-xs text-slate-500">{item.category} • {item.quantity} unidades solicitadas</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                <StatusBadge status={item.status} />
                                
                                {item.status === "En Proceso" && (
                                  <button
                                    onClick={() => markAsRecogido(donation.id, item.id)}
                                    className="px-3 py-1.5 bg-white border border-cyan-200 text-cyan-600 hover:bg-cyan-50 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Recogido
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
