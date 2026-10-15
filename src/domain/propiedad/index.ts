import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

export type PropiedadCategoria =
  | "lote"
  | "casa"
  | "departamento"
  | "oficina"
  | "local"
  | "proyecto";

export type PropiedadEstado = "disponible" | "reservada" | "vendida" | "no_disponible";

/** Entidad `public.propiedades`. */
export interface Propiedad {
  property_id: string;
  organization_id: string;
  project_id: string | null;
  nombre: string;
  categoria: PropiedadCategoria;
  titulo_publicacion: string | null;
  descripcion: string | null;
  precio: number | null;
  moneda: string;
  superficie_m2: number | null;
  habitaciones: number | null;
  banos: number | null;
  estacionamientos: number | null;
  direccion: string | null;
  ciudad: string | null;
  pais: string;
  estado: PropiedadEstado;
  /** Fidelidad de contenido (§07): los renders conceptuales deben etiquetarse. */
  tiene_render_conceptual: boolean;
  created_at: string;
}

export type PropiedadCreate = Omit<
  Propiedad,
  "property_id" | "organization_id" | "created_at"
> & {
  project_id?: string | null;
};

export interface PropiedadRepository extends CrudRepository<Propiedad, string, PropiedadCreate> {
  getByProyectoId(projectId: string, filters?: FilterParams): Promise<Propiedad[]>;
}
