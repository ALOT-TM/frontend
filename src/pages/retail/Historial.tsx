import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, History, Package, Archive, CheckCircle, AlertCircle, ArrowDownUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { CustomSelect } from "../../components/ui/CustomSelect";

type MermaStatus = "Pendiente" | "Donable" | "No Donable" | "Solicitado" | "Procesando" | "Donado";

interface AuditEvent {
  id: string;
  productName: string;
  sku: string;
  oldStatus: MermaStatus;
  newStatus: MermaStatus;
  timestamp: string;
  date: string;
  user: string;
  icon: React.ElementType;
}

const statusColors: Record<MermaStatus, string> = {
  "Pendiente": "bg-slate-50 text-slate-700 border-slate-200",
  "Donable": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "No Donable": "bg-red-50 text-red-700 border-red-200",
  "Solicitado": "bg-amber-50 text-amber-700 border-amber-200",
  "Procesando": "bg-blue-50 text-blue-700 border-blue-200",
  "Donado": "bg-purple-50 text-purple-700 border-purple-200",
};

interface StatusChangeLogDto {
  id: number;
  entityType: string;
  entityId: number;
  fromStatus?: string | null;
  toStatus: string;
  changedByUserId?: number | null;
  changedAt: string;
}

interface ShrinkageDto {
  shrinkageId: number;
  name: string;
}

interface UserDto {
  username?: string | null;
}


export const Historial = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const logsResponse = await api.get("/audit/status-changes", {
          params: { entityType: "SHRINKAGE" },
        });
        const logs = (logsResponse.data || []) as StatusChangeLogDto[];
        const shrinkageIds = Array.from(new Set(logs.map((log) => log.entityId)));
        const userIds = Array.from(
          new Set(logs.map((log) => log.changedByUserId).filter((id): id is number => Boolean(id)))
        );

        const shrinkageResults = await Promise.all(
          shrinkageIds.map((id) =>
            api.get(`/shrinkages/${id}`).then((response) => ({ id, data: response.data as ShrinkageDto }))
          )
        );
        const userResults = await Promise.all(
          userIds.map((id) =>
            api.get(`/auth/users/${id}`).then((response) => ({ id, data: response.data as UserDto }))
          )
        );

        const shrinkageMap = new Map<number, ShrinkageDto>();
        shrinkageResults.forEach((item) => shrinkageMap.set(item.id, item.data));
        const userMap = new Map<number, UserDto>();
        userResults.forEach((item) => userMap.set(item.id, item.data));

        setEvents(logs.map((log) => mapLogToEvent(log, shrinkageMap, userMap)));
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const mapStatus = (value?: string | null): MermaStatus => {
    switch (value) {
      case "DONABLE":
        return "Donable";
      case "NOT_DONABLE":
        return "No Donable";
      case "REQUESTED":
        return "Solicitado";
      case "IN_PROCESS":
        return "Procesando";
      case "DONATED":
        return "Donado";
      case "NONE":
      case "REGISTERED":
      default:
        return "Pendiente";
    }
  };

  const formatDateDash = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  };

  const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const datePart = parsed.toISOString().slice(0, 10);
    const timePart = parsed.toISOString().slice(11, 16);
    return `${datePart} ${timePart}`;
  };

  const iconForStatus = (status: MermaStatus) => {
    switch (status) {
      case "Solicitado":
        return Archive;
      case "Procesando":
        return Package;
      case "Donado":
        return CheckCircle;
      case "No Donable":
        return AlertCircle;
      default:
        return History;
    }
  };

  const mapLogToEvent = (
    log: StatusChangeLogDto,
    shrinkageMap: Map<number, ShrinkageDto>,
    userMap: Map<number, UserDto>
  ): AuditEvent => {
    const shrinkage = shrinkageMap.get(log.entityId);
    const user = log.changedByUserId ? userMap.get(log.changedByUserId) : null;
    const oldStatus = mapStatus(log.fromStatus);
    const newStatus = mapStatus(log.toStatus);
    return {
      id: String(log.id),
      productName: shrinkage?.name || `Merma #${log.entityId}`,
      sku: `shr-${log.entityId}`,
      oldStatus,
      newStatus,
      timestamp: formatTimestamp(log.changedAt),
      date: formatDateDash(log.changedAt),
      user: user?.username ? `@${user.username}` : log.changedByUserId ? `Usuario ${log.changedByUserId}` : "Sistema",
      icon: iconForStatus(newStatus),
    };
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesSearch = event.productName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === "desc" ? diff : -diff;
      });
  }, [events, searchTerm, sortOrder]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, itemsPerPage]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-slate-200 pb-6">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center shrink-0">
            <History className="w-6 h-6 mr-3 text-primary shrink-0" />
            Historial de Movimientos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Registro de actividad y transiciones de estado de los productos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm shrink-0 w-full sm:w-auto"
          >
            <ArrowDownUp className="w-4 h-4 text-slate-500" />
            {sortOrder === "desc" ? "Más recientes" : "Más antiguos"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 sm:pl-8">
        {/* Vertical Line */}
        <div className="absolute top-4 bottom-4 left-4 sm:left-6 w-[2px] bg-slate-100 rounded-full" />

        <div className="space-y-8">
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-slate-500"
            >
              Cargando historial...
            </motion.div>
          )}
          {paginatedEvents.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                className="relative flex items-start group"
              >
                {/* Timeline Node */}
                <div className="absolute -left-6 sm:-left-8 mt-1.5 bg-white p-1 rounded-full border-2 border-primary/20 z-10 transition-colors group-hover:border-primary/40">
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Event Card */}
                <div className="w-full ml-8 sm:ml-12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{event.productName}</h3>
                    </div>

                    {/* Status Transition Block */}
                    <div className="flex-1 flex sm:justify-center">
                      <div className="flex items-center w-fit">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", statusColors[event.oldStatus])}>
                          {event.oldStatus}
                        </span>
                        
                        <div className="px-3 text-slate-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", statusColors[event.newStatus])}>
                          {event.newStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex sm:justify-end items-center text-sm text-slate-400 font-medium">
                      <span>{event.timestamp}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredEvents.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-slate-500"
            >
              No se encontraron movimientos.
            </motion.div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
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
              className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
