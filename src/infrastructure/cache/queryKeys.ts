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
  propiedadesByProyecto: (projectId: string) =>
    ["propiedades", "proyecto", projectId] as const,

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
  campanasByPropiedad: (propertyId: string) =>
    ["campanas", "propiedad", propertyId] as const,

  leads: () => ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
  leadsByCampana: (campaignId: string) => ["leads", "campana", campaignId] as const,

  wallet: () => ["wallet"] as const,
  transacciones: () => ["transacciones"] as const,
} as const;

/** Dominios que admiten prefijo (p.ej. invalidar todos los hijos de un dominio). */
export type QueryDomain = keyof typeof queryKeys;

/** Invalida todas las variantes de un dominio tras una escritura. */
export function domainKey(domain: QueryDomain): readonly unknown[] {
  return [domain];
}
