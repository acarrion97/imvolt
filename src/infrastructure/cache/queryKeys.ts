/**
 * Fábrica de query keys: única fuente de verdad de las claves de caché.
 *
 * Reglas:
 *  - Toda clave empieza con el dominio ("proyectos" | "propiedades" | ...).
 *  - Las consultas anidadas agregan scope: ["propiedades", "proyecto", id].
 *    Así, invalidar `["propiedades"]` refresca TODAS las variantes de un golpe.
 *  - Siempre se construyen desde aquí; nunca a mano en los componentes.
 */
export const queryKeys = {
  proyectos: () => ["proyectos"] as const,
  proyecto: (id: string) => ["proyectos", id] as const,

  propiedades: () => ["propiedades"] as const,
  propiedad: (id: string) => ["propiedades", id] as const,

  tiposPropiedad: () => ["tipos_propiedad"] as const,
  tipoPropiedad: (id: string) => ["tipos_propiedad", id] as const,

  plantillas: () => ["plantillas"] as const,
  plantilla: (id: string) => ["plantillas", id] as const,

  modelos: () => ["modelos"] as const,
  modelo: (id: string) => ["modelos", id] as const,

  generaciones: () => ["generaciones"] as const,
  generacion: (id: string) => ["generaciones", id] as const,
  generacionesByPropiedad: (propertyId: string) =>
    ["generaciones", "propiedad", propertyId] as const,

  conexiones: () => ["conexiones"] as const,
  conexion: (id: string) => ["conexiones", id] as const,

  campanas: () => ["campanas"] as const,
  campana: (id: string) => ["campanas", id] as const,
  campanasByPropiedad: (propertyId: string) => ["campanas", "propiedad", propertyId] as const,

  leads: () => ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
  leadsByCampana: (campaignId: string) => ["leads", "campana", campaignId] as const,

  wallet: () => ["wallet"] as const,
  transacciones: () => ["transacciones"] as const,

  brandAssets: () => ["brand_assets"] as const,
  brandAsset: (id: string) => ["brand_assets", id] as const,
  brandAssetVersiones: (assetId: string) => ["brand_assets", assetId, "versiones"] as const,
  /** URL firmada de la versión activa (caduca a los 5 minutos). */
  brandAssetPreview: (id: string) => ["brand_assets", id, "preview"] as const,

  brandColors: () => ["brand_colors"] as const,
  brandColor: (id: string) => ["brand_colors", id] as const,

  // Identity: equipo, roles (catálogo §13), bitácora y organización.
  miembros: () => ["miembros"] as const,
  miembro: (id: string) => ["miembros", id] as const,
  roles: () => ["roles"] as const,
  auditoria: () => ["auditoria"] as const,
  empresa: () => ["empresa"] as const,
} as const;

/** Dominios que admiten prefijo (p.ej. invalidar todos los hijos de un dominio). */
export type QueryDomain = keyof typeof queryKeys;

/** Invalida todas las variantes de un dominio tras una escritura. */
export function domainKey(domain: QueryDomain): readonly unknown[] {
  return [domain];
}
