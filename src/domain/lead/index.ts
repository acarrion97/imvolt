import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

export type LeadFuente =
  | "meta_formulario"
  | "whatsapp"
  | "landing"
  | "manual"
  | "lotes_al_mando";

export type LeadEstado =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "visitado"
  | "cerrado"
  | "perdido";

/** Entidad `public.leads`. */
export interface Lead {
  lead_id: string;
  organization_id: string;
  campaign_id: string | null;
  property_id: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
  fuente: LeadFuente;
  estado: LeadEstado;
  notas: string | null;
  /** ID externo para deduplicar (§11). */
  provider_lead_id: string | null;
  created_at: string;
}

export type LeadCreate = Omit<
  Lead,
  "lead_id" | "organization_id" | "provider_lead_id" | "created_at"
> & {
  provider_lead_id?: string | null;
};

export interface LeadRepository extends CrudRepository<Lead, string, LeadCreate> {
  getByCampanaId(campaignId: string, filters?: FilterParams): Promise<Lead[]>;
}
