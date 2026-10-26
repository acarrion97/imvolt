import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

export type PlantillaCategoria =
  | "lotizaciones"
  | "casas"
  | "departamentos"
  | "proyecto_planos"
  | "publicidad_comercial"
  | "marca_inmobiliaria";

export type PlantillaObjetivo = "visitas" | "mensajes" | "formularios" | "branding";

export type PlantillaFormato = "reels_9_16" | "imagen_4_5" | "feed_1_1" | "banner_16_9";

/** Entidad `public.ai_templates` — plantillas creativas del sistema. */
export interface Plantilla {
  template_id: string;
  organization_id: string | null;
  nombre: string;
  categoria: PlantillaCategoria;
  tipo_plantilla_id: string;
  objetivo: PlantillaObjetivo;
  media_type: "image" | "video";
  formato: PlantillaFormato;
  variables: string[];
  estructura_narrativa: string | null;
  movimiento_camara: string | null;
  estilo_visual: string | null;
  prompt_base: string;
  requiere_referencia_original: boolean;
  creditos_base: number;
  activo: boolean;
  created_at: string;
}
export interface TipoPlantilla {
  tipo_plantilla_id: string;
  nombre: string;
  creado_en: string;
  actualizado_en: string;
}

export type TipoPlantillaCreate = {
  nombre: string;
};

export type PlantillaCreate = Omit<
  Plantilla,
  "template_id" | "organization_id" | "created_at" | "variables" | "activo" | "creditos_base"
> & {
  variables?: string[];
  activo?: boolean;
  creditos_base?: number;
};

export interface PlantillaRepository extends CrudRepository<Plantilla, string, PlantillaCreate> {}
export interface TipoPlantillaRepository extends CrudRepository<TipoPlantilla, string, TipoPlantillaCreate> {}
