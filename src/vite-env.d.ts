/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (datos en memoria) o "rest" (API REST). Por defecto: "mock". */
  readonly VITE_DATA_PROVIDER?: string;
  /** URL base de la API REST. Requerida cuando el proveedor es "rest". */
  readonly VITE_API_URL?: string;
  /** Token Bearer opcional enviado en cada petición. */
  /** staleTime en ms para TanStack Query. Por defecto: 300000 (5 min). */
  readonly VITE_QUERY_STALE_TIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
