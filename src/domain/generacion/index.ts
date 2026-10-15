import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/**
 * Máquina de estados §09:
 * created → quoted → credits_reserved → queued → processing → completed/failed/canceled
 */
export type GeneracionStatus =
  | "created"
  | "quoted"
  | "credits_reserved"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

/** Entidad `public.generation_jobs`. */
export interface Generacion {
  generation_id: string;
  organization_id: string;
  property_id: string | null;
  template_id: string | null;
  model_id: string;
  modo: "facil" | "pro";
  prompt: string;
  parametros: Record<string, unknown>;
  status: GeneracionStatus;
  credits_cost: number;
  provider_request_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type GeneracionCreate = Omit<
  Generacion,
  "generation_id" | "organization_id" | "status" | "credits_cost" | "provider_request_id" | "error_message" | "created_at" | "updated_at"
> & {
  status?: GeneracionStatus;
  credits_cost?: number;
};

export interface GeneracionRepository
  extends CrudRepository<Generacion, string, GeneracionCreate> {
  getByPropiedadId(propertyId: string, filters?: FilterParams): Promise<Generacion[]>;
}
