/**
 * Política de caché persistida (IndexedDB).
 *
 * Un dominio NO es elegible por defecto: hay que agregarlo aquí a propósito.
 *   - "plantillas" y "modelos": catálogos del sistema que casi no cambian →
 *     sobreviven al cierre del navegador y permiten arrancar sin conexión.
 *   - "wallet", "leads", "campanas", ...: deliberadamente fuera (dinero y datos
 *     sensibles); siempre se refrescan contra el backend.
 */
export const CACHEABLE_DOMAINS = ["plantillas", "modelos", "proyectos"] as const;

export type CacheableDomain = (typeof CACHEABLE_DOMAINS)[number];

/** Clave bajo la que vive la caché de queries en IndexedDB. */
export const QUERY_CACHE_KEY = "imvolt-query-cache";

/** Techo de la caché persistida (la fresura real la gobierna staleTime). */
export const MAX_PERSISTED_AGE_MS = 1000 * 60 * 60 * 24; // 24 horas

/**
 * Toda query key elegible tiene la forma `[dominio, ...]`.
 * Si el dominio no está en la allowlist o no es string, no se persiste.
 */
export function isCacheableQueryKey(queryKey: readonly unknown[]): boolean {
  const [domain] = queryKey;
  return typeof domain === "string" && (CACHEABLE_DOMAINS as readonly string[]).includes(domain);
}
