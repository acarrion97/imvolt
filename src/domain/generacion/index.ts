import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/**
 * Máquina de estados §09:
 * created → quoted → queued → processing → completed/failed/canceled
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

export interface GenerationOutput {
  output_id: string;
  generation_id: string;
  output_index: number;
  media_type: "image" | "video";
  url: string;
  mime_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

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
  price_usd: number | null;
  provider_request_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  outputs?: GenerationOutput[];
}

export interface GeneracionQuoteInput {
  model_id: string;
  parametros: Record<string, unknown>;
}

export interface GeneracionQuote {
  price_usd: number;
}

export type GeneracionCreate = Omit<
  Generacion,
  "generation_id" | "organization_id" | "status" | "price_usd" | "provider_request_id" | "error_message" | "created_at" | "updated_at"
> & {
  idempotency_key: string;
  quoted_price_usd: number;
  status?: GeneracionStatus;
  price_usd?: number | null;
};

export interface GeneracionRepository
  extends CrudRepository<Generacion, string, GeneracionCreate> {
  getByPropiedadId(propertyId: string, filters?: FilterParams): Promise<Generacion[]>;
  getOutputs(generationId: string): Promise<GenerationOutput[]>;
  quote(input: GeneracionQuoteInput): Promise<GeneracionQuote>;
}
