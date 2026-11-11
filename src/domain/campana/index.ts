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
  duration_days: number | null;
  copy: string | null;
  titulo: string | null;
  cta: string | null;
  creative_url: string | null;
  meta_page_id?: string | null;
  meta_page_name?: string | null;
  meta_instagram_id?: string | null;
  target_location_key?: string | null;
  target_location_name?: string | null;
  target_location_country_code?: string | null;
  privacy_policy_url?: string | null;
  media_type?: "image" | "video" | null;
  meta_campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CampanaCreate = Omit<
  Campana,
  "campaign_id" | "organization_id" | "estado" | "duration_days" | "meta_campaign_id" | "created_at" | "updated_at"
> & {
  estado?: CampanaEstado;
  duration_days?: number | null;
};

export interface PublicacionCampana {
  message: string;
  campania_publicitaria_id: string | number;
  meta_campaign_id: string;
  meta_estado: "published_paused";
  simulado: boolean;
  validado_solo: boolean;
  replayed?: boolean;
}

export interface VarianteEstrategia {
  variante: "A" | "B";
  enfoque: string;
  titular: string;
  copy_corto: string;
  copy_largo: string;
  cta: string;
}

export interface EstrategiaCampana {
  estrategia_id?: number;
  creado_en?: string;
  presupuesto?: number;
  publico_objetivo?: string;
  datos_confirmados?: Record<string, string | number>;
  datos_faltantes?: string[];
  generador_version?: string;
  propiedad: string;
  objetivo: string;
  angulos: Array<{ id: string; nombre: string; enfoque: string; copy_sugerido: string }>;
  titular: string;
  copy_corto: string;
  copy_largo: string;
  variantes_ab: VarianteEstrategia[];
  cta: string;
  guion_audiovisual: string;
  guion_15s: string;
  guion_30s: string;
  formatos_recomendados: string[];
  checklist_editorial: string[];
  advertencias: string[];
}

export interface CampanaRepository extends CrudRepository<Campana, string, CampanaCreate> {
  getByPropiedadId(propertyId: string, filters?: FilterParams): Promise<Campana[]>;
  validar(campaignId: string): Promise<Campana>;
  solicitarAprobacion(campaignId: string): Promise<Campana>;
  aprobar(campaignId: string): Promise<Campana>;
  sincronizarEstadoMeta(campaignId: string): Promise<Campana>;
  generarEstrategia(propertyId: string, objective: CampanaObjetivo, presupuesto: number, publicoObjetivo: string): Promise<EstrategiaCampana>;
  publicar(campaignId: string, idempotencyKey: string): Promise<PublicacionCampana>;
}
