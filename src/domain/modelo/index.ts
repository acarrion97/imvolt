import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

/** Entidad `public.model_registry` — catálogo vivo de modelos (§09: no hardcodear). */
export interface Modelo {
  model_id: string;
  provider: string;
  provider_model_id: string;
  nombre: string;
  media_type: "image" | "video";
  capabilities: Record<string, unknown>;
  duracion_min_s: number | null;
  duracion_max_s: number | null;
  ratios: string[] | null;
  quote_creditos: number;
  status: "activo" | "inactivo" | "no_disponible";
  created_at: string;
}

export type ModeloCreate = Omit<Modelo, "model_id" | "created_at">;

export interface ModeloRepository extends CrudRepository<Modelo, string, ModeloCreate> {}
