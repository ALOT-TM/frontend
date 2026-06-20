import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Package, MapPin, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";

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
  realId: number;
  type: "request" | "donation";
  date: string;
  headquarterName: string;
  status: ParentStatus;
  items: ChildItem[];
}

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
  const [donations, setDonations] = useState<ParentDonation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Confirmation Form
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingDonationId, setConfirmingDonationId] = useState<number | null>(null);
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split("T")[0]);
  const [comment, setComment] = useState("");
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

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

  const unwrapValue = (field: any) => {
    if (!field) return null;
    return typeof field === "object" ? field.value : field;
  };

  const fetchFollowUps = async () => {
    try {
      const userId = parseJwtUserId();
      if (!userId) {
        setLoading(false);
        return;
      }
      
      const userRes = await api.get(`/auth/users/${userId}`);
      const beneficiaryId = userRes.data?.beneficiaryInstitutionId;
      if (!beneficiaryId) {
        setLoading(false);
        return;
      }

      const [requestsRes, donationsRes] = await Promise.all([
        api.get(`/requests?beneficiaryId=${beneficiaryId}`),
        api.get(`/donations/by-beneficiary/${beneficiaryId}`)
      ]);

      const requestsData = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      const donationsData = Array.isArray(donationsRes.data) ? donationsRes.data : [];

      // Extract unique shrinkage IDs using unwrapValue
      const shrinkageIds: number[] = Array.from(new Set([
        ...requestsData.map((r: any) => Number(unwrapValue(r.shrinkageReferenceId))).filter(Boolean),
        ...donationsData.map((d: any) => Number(unwrapValue(d.shrinkageReferenceId))).filter(Boolean)
      ]));

      // Fetch all shrinkages details in parallel
      const shrinkageMap: Record<number, any> = {};
      await Promise.all(
        shrinkageIds.map(async (id) => {
          try {
            const res = await api.get(`/shrinkages/${id}`);
            shrinkageMap[id] = res.data;
          } catch (err) {
            console.error(`Error fetching shrinkage ${id}`, err);
          }
        })
      );

      // Extract unique headquarter IDs from loaded shrinkages
      const hqIds: number[] = Array.from(new Set(
        Object.values(shrinkageMap)
          .map((s: any) => s?.retailCompanyHeadquarterId)
          .filter(Boolean)
      ));

      // Fetch all headquarters details in parallel
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

      const mappedRequests: ParentDonation[] = requestsData.map((req: any) => {
        const shrId = Number(unwrapValue(req.shrinkageReferenceId));
        const shrinkage = shrinkageMap[shrId];
        const hqId = shrinkage?.retailCompanyHeadquarterId;
        const headquarter = hqId ? headquarterMap[hqId] : null;

        const dateObj = req.createdAt ? new Date(req.createdAt) : new Date();
        const formattedDate = dateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
        
        let displayStatus: ChildStatus = "Solicitado";
        if (req.status === "ACCEPTED") displayStatus = "En Proceso";
        else if (req.status === "REJECTED") displayStatus = "Rechazado";
        else if (req.status === "CANCELLED") displayStatus = "Rechazado";

        return {
          id: `PET-${req.donationRequestId?.value || req.id}`,
          realId: req.donationRequestId?.value || req.id,
          type: "request",
          date: formattedDate,
          headquarterName: headquarter?.description || "Sede Desconocida",
          status: "En Proceso" as ParentStatus,
          items: [{
            id: req.id,
            product: shrinkage?.name || "Cargando...",
            category: shrinkage?.category?.name || "Sin Categoría",
            quantity: shrinkage?.quantity || 0,
            status: displayStatus
          }]
        };
      });

      const mappedDonations: ParentDonation[] = donationsData.map((don: any) => {
        const shrId = Number(unwrapValue(don.shrinkageReferenceId));
        const shrinkage = shrinkageMap[shrId];
        const hqId = shrinkage?.retailCompanyHeadquarterId;
        const headquarter = hqId ? headquarterMap[hqId] : null;

        const dateObj = don.createdAt ? new Date(don.createdAt) : new Date();
        const formattedDate = dateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

        let displayStatus: ChildStatus = "En Proceso";
        if (don.status === "CONFIRMED") displayStatus = "Recogido";

        return {
          id: `DON-${don.donationId?.value || don.id}`,
          realId: don.donationId?.value || don.id,
          type: "donation",
          date: formattedDate,
          headquarterName: headquarter?.description || "Sede Desconocida",
          status: don.status === "CONFIRMED" ? "Completada" as ParentStatus : "En Proceso" as ParentStatus,
          items: [{
            id: don.id,
            product: shrinkage?.name || "Cargando...",
            category: shrinkage?.category?.name || "Sin Categoría",
            quantity: shrinkage?.quantity || 0,
            status: displayStatus
          }]
        };
      });

      const combined = [...mappedDonations, ...mappedRequests];
      setDonations(combined);
      if (combined.length > 0 && !expandedId) {
        setExpandedId(combined[0].id);
      }
    } catch (err) {
      console.error("Error fetching follow-ups", err);
      toast.error("Error al cargar los seguimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleMarkAsRecogidoClick = (realId: number) => {
    setConfirmingDonationId(realId);
    setConfirmModalOpen(true);
  };

  const handleConfirmReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingDonationId) return;
    setIsSubmittingConfirm(true);
    try {
      await api.patch(`/donations/${confirmingDonationId}/confirm`, {
        receptionDate: receptionDate,
        comment: comment || "Entrega realizada satisfactoriamente"
      });
      toast.success("¡Donación confirmada como recogida!");
      setConfirmModalOpen(false);
      setConfirmingDonationId(null);
      setComment("");
      fetchFollowUps();
    } catch (err: any) {
      const msg = err.response?.data || "Error al confirmar la recepción";
      toast.error(`Error: ${msg}`);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Seguimientos</h1>
        <p className="text-slate-500 mt-2">Haz seguimiento a tus solicitudes de donación activas e históricas.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      ) : (
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
                                  
                                  {donation.type === "donation" && item.status === "En Proceso" && (
                                    <button
                                      onClick={() => handleMarkAsRecogidoClick(donation.realId)}
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
      )}

      {/* Confirmation Modal (Form) */}
      {createPortal(
        <AnimatePresence>
          {confirmModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmModalOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                    Confirmar Recepción
                  </h3>
                </div>

                <form onSubmit={handleConfirmReception} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 block">Fecha de Recepción *</label>
                    <input
                      type="date"
                      required
                      value={receptionDate}
                      onChange={(e) => setReceptionDate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 block">Comentarios / Observaciones</label>
                    <textarea
                      placeholder="Ingrese algún comentario sobre el estado de la entrega..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white resize-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setConfirmModalOpen(false)}
                      className="px-5 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingConfirm}
                      className="px-6 py-2 text-white bg-cyan-600 hover:bg-cyan-700 font-bold rounded-xl transition-colors shadow-sm text-sm flex items-center gap-1.5"
                    >
                      {isSubmittingConfirm ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Confirmando...
                        </>
                      ) : "Confirmar Entrega"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
