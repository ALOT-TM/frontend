import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, ShieldCheck, Search, Plus, UserPlus, 
  CheckCircle2, XCircle, Mail, 
  Lock, Key, Edit, Trash2, ChevronDown, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";

import { api } from "../../services/api";


// --- Tipos ---
interface User {
  id: string;
  username: string;
  email: string;
  role: string; // Stores roleId
  status: "active" | "inactive";
  avatarUrl?: string;
  lastLogin: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  isCustom: boolean;
}

export const Accesos = () => {
  const [activeTab, setActiveTab] = useState<"usuarios" | "roles">("usuarios");

  // State - Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const roleFilterRef = useRef<HTMLDivElement>(null);
  
  // User Form State
  const [userForm, setUserForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "", status: "active" as "active"|"inactive" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormRoleOpen, setIsFormRoleOpen] = useState(false);
  const formRoleRef = useRef<HTMLDivElement>(null);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // State - Roles
  const [roles, setRoles] = useState<Role[]>([]);

  // Modals State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Role Form State
  const [roleForm, setRoleForm] = useState({ name: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Permissions List
  const availablePermissions = [
    { id: "p1", name: "Dashboard", desc: "Métricas y resumen general" },
    { id: "p2", name: "Merma", desc: "Declarar y revisar mermas" },
    { id: "p3", name: "Donaciones", desc: "Aprobar donaciones y peticiones" },
    { id: "p4", name: "Locales", desc: "Crear y editar sucursales" },
    { id: "p5", name: "Usuarios y Roles", desc: "Administración de usuarios y roles" }
  ];

  const fetchRoles = async () => {
    try {
      const response = await api.get("/auth/roles");
      const mappedRoles = response.data.map((r: any) => ({
        id: r.roleId.toString(),
        name: r.name,
        description: "Rol en la empresa",
        userCount: 0,
        permissions: ["Todo el sistema"],
        isCustom: true
      }));
      setRoles(mappedRoles);
    } catch (err) {
      console.error("Error fetching roles", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/retail-users");
      const mappedUsers = response.data.map((u: any) => ({
        id: u.id.toString(),
        username: u.username,
        email: u.email,
        role: u.roleId ? u.roleId.toString() : "",
        status: u.retailUserActive ? "active" : "inactive",
        lastLogin: "Hace poco"
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleFilterRef.current && !roleFilterRef.current.contains(event.target as Node)) {
        setIsRoleFilterOpen(false);
      }
      if (formRoleRef.current && !formRoleRef.current.contains(event.target as Node)) {
        setIsFormRoleOpen(false);
      }
      if (!(event.target as Element).closest('.perm-tooltip-container')) {
        setOpenTooltipId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || "Sin Rol";
  };

  // Handlers - Usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.email.toLowerCase().includes(userSearch.toLowerCase());
      const roleName = getRoleName(u.role);
      const matchesRole = roleFilter === "all" || roleName === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter, roles]);

  const handleQuickRoleChange = async (userId: string, newRoleId: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, {
        roleId: parseInt(newRoleId)
      });
      toast.success("Rol del trabajador actualizado dinámicamente.");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar el rol.");
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      await api.patch(`/auth/retail-users/${id}/status`);
      toast.success("Estado del usuario actualizado exitosamente.");
      fetchUsers();
    } catch (err: any) {
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/auth/retail-users/${id}`);
      toast.success("Usuario eliminado del sistema.");
      fetchUsers();
    } catch (err: any) {
      toast.error("Error al eliminar usuario");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({
      username: user.username,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      status: user.status
    });
    setIsUserModalOpen(true);
  };

  // Handlers - Roles
  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleForm({ name: role.name });
    const permIds = availablePermissions.filter(p => role.permissions.includes(p.name)).map(p => p.id);
    setSelectedPermissions(permIds);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await api.delete(`/auth/roles/${id}`);
      toast.success("Rol eliminado del sistema.");
      fetchRoles();
    } catch (err: any) {
      toast.error("Error al eliminar rol");
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.role) {
      toast.error("Completa los campos obligatorios.");
      return;
    }
    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    try {
      if (editingUserId) {
        await api.put(`/auth/retail-users/${editingUserId}`, {
          username: userForm.username,
          email: userForm.email || `${userForm.username}@fluxus.com`,
          roleId: parseInt(userForm.role),
          password: userForm.password || undefined
        });
        await api.put(`/auth/users/${editingUserId}/role`, {
          roleId: parseInt(userForm.role)
        });
        toast.success("Usuario actualizado exitosamente.");
      } else {
        if (!userForm.password) {
          toast.error("La contraseña es requerida para nuevos usuarios.");
          return;
        }
        await api.post("/auth/retail-users", {
          username: userForm.username,
          email: userForm.email || `${userForm.username}@fluxus.com`,
          password: userForm.password,
          roleId: parseInt(userForm.role)
        });
        toast.success("Usuario creado exitosamente.");
      }
      setIsUserModalOpen(false);
      setUserForm({ username: "", email: "", password: "", confirmPassword: "", role: "", status: "active" });
      setEditingUserId(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar usuario");
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name) {
      toast.error("El rol debe tener un nombre.");
      return;
    }
    try {
      if (editingRoleId) {
        await api.put(`/auth/roles/${editingRoleId}`, {
          name: roleForm.name
        });
        toast.success("Rol actualizado exitosamente.");
      } else {
        await api.post("/auth/roles", {
          name: roleForm.name
        });
        toast.success("Rol creado exitosamente.");
      }
      setIsRoleModalOpen(false);
      setRoleForm({ name: "" });
      setEditingRoleId(null);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar el rol");
    }
  };

  // Render Helpers
  const renderInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Accesos</h2>
          <p className="text-sm text-slate-500 mt-1">Administra tu personal y configura niveles de seguridad.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("usuarios")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "usuarios" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "roles" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Roles y Permisos
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: USUARIOS */}
        {activeTab === "usuarios" && (
          <motion.div
            key="tab-usuarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por username o correo..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white shadow-sm"
                  />
                </div>
                <div className="relative w-full sm:w-48" ref={roleFilterRef}>
                  <button 
                    onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                    className={cn(
                      "flex items-center justify-between w-full bg-white border rounded-xl px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm",
                      isRoleFilterOpen ? "border-primary" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className="font-medium text-slate-700 truncate">
                      {roleFilter === "all" ? "Todos los Roles" : roleFilter}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isRoleFilterOpen ? "rotate-180" : "")} />
                  </button>
                  
                  <AnimatePresence>
                    {isRoleFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setRoleFilter("all");
                            setIsRoleFilterOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors",
                            roleFilter === "all" 
                              ? "bg-primary/5 text-primary font-semibold" 
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          Todos los Roles
                        </button>
                        {roles.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setRoleFilter(r.name);
                              setIsRoleFilterOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 text-sm transition-colors truncate",
                              roleFilter === r.name 
                                ? "bg-primary/5 text-primary font-semibold" 
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            )}
                          >
                            {r.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Añadir Usuario
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-semibold rounded-tl-2xl">Usuario</th>
                      <th className="p-4 font-semibold">Rol</th>
                      <th className="p-4 font-semibold">Estado</th>
                      <th className="p-4 font-semibold">Último Acceso</th>
                      <th className="p-4 font-semibold text-right rounded-tr-2xl">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {filteredUsers.map((user) => (
                        <motion.tr 
                          key={user.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200">
                                {renderInitials(user.username)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">@{user.username}</p>
                                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                  <Mail className="w-3 h-3 mr-1" /> {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="relative inline-block w-48">
                              <select
                                value={user.role}
                                onChange={(e) => handleQuickRoleChange(user.id, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium cursor-pointer"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                              user.status === "active" 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                : "bg-red-50 text-red-600 border border-red-200"
                            )}>
                              {user.status === "active" ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-500">
                            {user.lastLogin}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleToggleUserStatus(user.id)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title={user.status === "active" ? "Desactivar" : "Activar"}
                              >
                                {user.status === "active" ? <Lock className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No se encontraron usuarios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ROLES Y PERMISOS */}
        {activeTab === "roles" && (
          <motion.div
            key="tab-roles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-end items-center mb-6">
              <button 
                onClick={() => setIsRoleModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Nuevo Rol
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {roles.map((role) => (
                  <motion.div
                    key={role.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col h-full relative group"
                  >
                    {/* Role Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mr-3">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6 flex-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Permisos Clave</p>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((perm, idx) => {
                            const fullPerm = availablePermissions.find(p => p.name === perm);
                            const tooltipId = `${role.id}-${perm}`;
                            return (
                              <div key={idx} className="relative inline-block perm-tooltip-container">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTooltipId(openTooltipId === tooltipId ? null : tooltipId);
                                  }}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none"
                                >
                                  {perm}
                                </button>
                                <AnimatePresence>
                                  {openTooltipId === tooltipId && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute left-0 bottom-full mb-2 w-48 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50 text-left leading-relaxed font-medium"
                                    >
                                      {fullPerm?.desc || perm}
                                      <div className="absolute top-full left-4 -mt-px border-[5px] border-transparent border-t-slate-800" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center text-sm font-medium text-slate-600">
                        <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                        {role.userCount} {role.userCount === 1 ? 'Usuario' : 'Usuarios'}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleEditRole(role)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {roles.length === 0 && (
              <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                No se encontraron roles.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Modals (Portals) --- */}
      {createPortal(
        <AnimatePresence>
          {isUserModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsUserModalOpen(false);
                  setUserForm({ username: "", email: "", password: "", confirmPassword: "", role: "", status: "active" });
                  setEditingUserId(null);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center text-primary">
                    <UserPlus className="w-5 h-5 mr-2" />
                    <h3 className="text-xl font-bold text-slate-900">Añadir Usuario</h3>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">Username *</label>
                      <input 
                        type="text"
                        value={userForm.username}
                        onChange={e => setUserForm({...userForm, username: e.target.value.replace(/\s/g, "")})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                        placeholder="ej. jdoe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">Correo (Opcional)</label>
                      <input 
                        type="email"
                        value={userForm.email}
                        onChange={e => setUserForm({...userForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                        placeholder="ej. john@fluxus.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">Contraseña *</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={userForm.password}
                          onChange={e => setUserForm({...userForm, password: e.target.value})}
                          className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">Confirmar Contraseña *</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          value={userForm.confirmPassword}
                          onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})}
                          className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="relative" ref={formRoleRef}>
                      <label className="text-sm font-semibold text-slate-700 block mb-1.5">Rol *</label>
                      <button
                        type="button"
                        onClick={() => setIsFormRoleOpen(!isFormRoleOpen)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors",
                          isFormRoleOpen ? "border-primary" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span className={cn("truncate", !userForm.role && "text-slate-500")}>
                          {userForm.role ? roles.find(r => r.id === userForm.role)?.name : "Selecciona un rol"}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", isFormRoleOpen ? "rotate-180" : "")} />
                      </button>

                      <AnimatePresence>
                        {isFormRoleOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                          >
                            {roles.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setUserForm({ ...userForm, role: r.id });
                                  setIsFormRoleOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-sm transition-colors truncate",
                                  userForm.role === r.id
                                    ? "bg-primary/5 text-primary font-semibold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                {r.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50 justify-end shrink-0 mt-6">
                  <button
                    onClick={() => {
                      setIsUserModalOpen(false);
                      setUserForm({ username: "", email: "", password: "", confirmPassword: "", role: "", status: "active" });
                      setEditingUserId(null);
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-8 py-2.5 text-white bg-primary hover:bg-primary/90 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Guardar Usuario
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isRoleModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setEditingRoleId(null);
                  setRoleForm({ name: "" });
                  setSelectedPermissions([]);
                }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center text-slate-800">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    <h3 className="text-xl font-bold text-slate-900">{editingRoleId ? "Editar Rol" : "Crear Nuevo Rol"}</h3>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-slate-700 block mb-1.5">Nombre del Rol *</label>
                    <input 
                      type="text"
                      value={roleForm.name}
                      onChange={e => setRoleForm({name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      placeholder="ej. Supervisor de Inventario"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-700 block">Permisos (Selecciona al menos 1) *</label>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        {selectedPermissions.length} seleccionados
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availablePermissions.map(perm => {
                        const isSelected = selectedPermissions.includes(perm.id);
                        return (
                          <div 
                            key={perm.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                              } else {
                                setSelectedPermissions([...selectedPermissions, perm.id]);
                              }
                            }}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none",
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                            )}
                          >
                            <div className="mt-0.5">
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
                            <div>
                              <h4 className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-slate-800")}>
                                {perm.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{perm.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50 justify-end shrink-0">
                  <button
                    onClick={() => {
                      setIsRoleModalOpen(false);
                      setEditingRoleId(null);
                      setRoleForm({ name: "" });
                      setSelectedPermissions([]);
                    }}
                    className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveRole}
                    className="px-8 py-2.5 text-white bg-primary hover:bg-primary/90 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {editingRoleId ? "Guardar Cambios" : "Crear Rol"}
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
