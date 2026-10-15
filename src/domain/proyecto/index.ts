import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

/** Tipos de proyecto inmobiliario (schema.sql → proyectos.tipo). */
export type ProyectoTipo =
  | "lotizacion"
  | "urbanizacion"
  | "edificio"
  | "proyecto_planos"
  | "individual";

export type ProyectoEstado = "activo" | "pausado" | "terminado";

/** Entidad `public.proyectos` — camelCase inexistente: snake_case igual que la API. */
export interface Proyecto {
  project_id: string;
  organization_id: string;
  nombre: string;
  tipo: ProyectoTipo;
  descripcion: string | null;
  ubicacion: string | null;
  total_lotes: number | null;
  estado: ProyectoEstado;
  created_at: string;
}

export type ProyectoCreate = Omit<
  Proyecto,
  "project_id" | "organization_id" | "created_at" | "estado"
> & {
  estado?: ProyectoEstado;
};

export interface ProyectoRepository extends CrudRepository<Proyecto, string, ProyectoCreate> {}
