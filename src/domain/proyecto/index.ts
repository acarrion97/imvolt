import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

/** Tipos de proyecto inmobiliario (schema.sql → proyectos.tipo). */
export type ProyectoTipo =
  | "lotizacion"
  | "urbanizacion"
  | "edificio"
  | "proyecto_planos"
  | "individual";

/** Estado lógico (`BaseModel.estado` del API). */
export type ProyectoEstado = "activo" | "inactivo";

/** Empresa incrustada (FK → `public.empresas`). */
export interface ProyectoEmpresa {
  empresa_id: number;
  razon_social: string;
}

/**
 * Referencia ligera de un proyecto, incrustada en propiedades y medios
 * (`ProyectoReferencia` del API): basta para identificarlo y navegar.
 */
export interface ProyectoReferencia {
  proyecto_id: string | number;
  nombre: string;
  tipo: ProyectoTipo;
}

/** Entidad `public.proyectos`, tal como la devuelve `GET /api/v1/proyectos`. */
export interface Proyecto {
  proyecto_id: string;
  empresa_id: number;
  nombre: string;
  tipo: ProyectoTipo;
  descripcion: string | null;
  ubicacion: string | null;
  total_lotes: number | null;
  estado: ProyectoEstado;
  /** Relación incrustada (FK → empresas). */
  empresa: ProyectoEmpresa | null;
  creado_en: string;
  actualizado_en: string;
}

/** `empresa_id` NO viaja: lo inyecta la API desde la sesión. */
export type ProyectoCreate = {
  nombre: string;
  tipo: ProyectoTipo;
  descripcion?: string | null;
  ubicacion?: string | null;
  total_lotes?: number | null;
};

export interface ProyectoRepository extends CrudRepository<Proyecto, string, ProyectoCreate> {}
