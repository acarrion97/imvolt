import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

export type CampanaObjetivo = "mensajes" | "formularios" | "visitas" | "trafico" | "branding";

export type CampanaDestino = "whatsapp" | "formulario" | "landing";

/**
 * Flujo §10:
 * local_draft → validated → awaiting_approval → approved → published_paused → active
 */
export type CampanaEstado =
  | "local_draft"
  | "validated"
  | "awaiting_approval"
  | "approved"
  | "published_paused"
  | "active"
  | "rejected"
  | "failed"
  | "archived";

/** Entidad `public.campaigns`. */
export interface Campana {
  campaign_id: string;
  organization_id: string;
  connection_id: string | null;
  property_id: string | null;
  nombre: string;
  objetivo: CampanaObjetivo;
  destino: CampanaDestino;
  estado: CampanaEstado;
  presupuesto_maximo: number;
  moneda: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  copy: string | null;
  titulo: string | null;
  cta: string | null;
  creative_url: string | null;
  meta_campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CampanaCreate = Omit<
  Campana,
  "campaign_id" | "organization_id" | "estado" | "meta_campaign_id" | "created_at" | "updated_at"
> & {
  estado?: CampanaEstado;
};

export interface PublicacionCampana {
  message: string;
  campania_publicitaria_id: string | number;
  meta_campaign_id: string;
  meta_estado: "published_paused";
  simulado: boolean;
  validado_solo: boolean;
}

export interface CampanaRepository extends CrudRepository<Campana, string, CampanaCreate> {
  getByPropiedadId(propertyId: string, filters?: FilterParams): Promise<Campana[]>;
  publicar(campaignId: string): Promise<PublicacionCampana>;
}
