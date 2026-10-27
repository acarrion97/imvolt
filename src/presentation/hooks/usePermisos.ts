import { AUTH_ENABLED, useAuth } from "@/presentation/auth/AuthProvider";

/**
 * Capacidades de la sesión para puertear la UI (el API sigue siendo la
 * autoridad: esto solo evita mostrar acciones que devolverían 403).
 *
 * En modo mock no hay sesión y se permite todo. `propietario` hereda todos
 * los permisos, igual que en el API.
 */
export function usePermisos() {
  const { perfil, rol } = useAuth();
  const roles = (perfil?.roles ?? []).map((r) => r.nombre);
  const esPropietario = !AUTH_ENABLED || roles.includes("propietario") || rol === "propietario";
  const esAdmin = esPropietario || roles.includes("administrador") || rol === "administrador";

  return {
    /** Puede invitar miembros y cambiar roles. */
    puedeGestionarUsuarios: esPropietario || Boolean(perfil?.permisos.includes("gestionar_usuarios")),
    /** La bitácora (`GET /v1/auditoria`) es solo para propietario y administrador. */
    puedeVerAuditoria: esAdmin,
    /** Edición del perfil de la organización (`writeByOwnerOrAdmin`). */
    puedeEditarEmpresa: esAdmin,
  };
}
