/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (datos en memoria) o "rest" (API REST). Por defecto: "mock". */
  readonly VITE_DATA_PROVIDER?: string;
  /** URL base de la API REST (https:// en producción). Requerida con el proveedor "rest". */
  readonly VITE_API_URL?: string;
  /**
   * Token Bearer SOLO para desarrollo local (se ignora en builds de producción).
   * Nunca pongas secretos en variables VITE_*: terminan en el bundle público.
   */
  readonly VITE_API_TOKEN?: string;
  /** staleTime en ms para TanStack Query. Por defecto: 300000 (5 min). */
  readonly VITE_QUERY_STALE_TIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
