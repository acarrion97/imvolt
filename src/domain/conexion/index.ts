import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

export type ConexionEstado = "conectada" | "pendiente" | "revocada";

/** Entidad `public.meta_connections` — cuentas publicitarias de Meta. */
export interface Conexion {
  connection_id: string;
  organization_id: string;
  cuenta_publicitaria_id: string;
  nombre_cuenta: string;
  estado: ConexionEstado;
  permisos: Record<string, unknown> | null;
  created_at: string;
}

export type ConexionCreate = Omit<
  Conexion,
  "connection_id" | "organization_id" | "estado" | "permisos" | "created_at"
> & {
  estado?: ConexionEstado;
};

export interface ConexionRepository extends CrudRepository<Conexion, string, ConexionCreate> {}
