import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

export type PlantillaEstado = "activo" | "inactivo";

/** Entidad `public.plantillas` de la API. */
export interface Plantilla {
  plantilla_id: number;
  nombre: string;
  descripcion: string | null;
  url_logo: string | null;
  tipo_plantilla_id: number;
  estado: PlantillaEstado;
  creado_en: string;
  actualizado_en: string;
  tipo_plantilla?: TipoPlantilla | null;
}

export interface TipoPlantilla {
  tipo_plantilla_id: number;
  nombre: string;
  descripcion: string;
  estado: PlantillaEstado;
  creado_en: string;
  actualizado_en: string;
}

export type TipoPlantillaCreate = Pick<TipoPlantilla, "nombre" | "descripcion">;

export type PlantillaCreate = Pick<
  Plantilla,
  "nombre" | "descripcion" | "url_logo" | "tipo_plantilla_id"
>;

export type PlantillaRepository = CrudRepository<Plantilla, string, PlantillaCreate>;
export type TipoPlantillaRepository = CrudRepository<
  TipoPlantilla,
  string,
  TipoPlantillaCreate
>;
