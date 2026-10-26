import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermisos } from "@/presentation/hooks";

type Capacidad = "puedeGestionarUsuarios" | "puedeVerAuditoria" | "puedeEditarEmpresa";

/**
 * Guardia por capacidad (mínimo privilegio): sin ella la ruta redirige al
 * Inicio en vez de mostrar una pantalla cuyas llamadas el API rechazaría con
 * 403. Es solo UX: la autoridad sigue siendo el API.
 */
export function RequirePermiso({
  capacidad,
  children,
}: {
  capacidad: Capacidad;
  children: ReactNode;
}) {
  const permisos = usePermisos();
  return permisos[capacidad] ? <>{children}</> : <Navigate to="/inicio" replace />;
}
