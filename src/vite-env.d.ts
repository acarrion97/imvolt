/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (datos en memoria) o "rest" (API REST). Por defecto: "mock". */
  readonly VITE_DATA_PROVIDER?: string;
  /** URL base de la API REST (https:// en producción). Requerida con el proveedor "rest". */
  readonly VITE_API_URL?: string;
  /** Public Meta App ID (safe to include in the browser bundle). */
  readonly VITE_META_APP_ID?: string;
  /** Facebook Login for Business configuration ID. */
  readonly VITE_META_LOGIN_CONFIG_ID?: string;
  /** Meta Graph API version, e.g. v24.0. */
  readonly VITE_META_GRAPH_API_VERSION?: string;
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

interface MetaLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    grantedScopes?: string;
  };
}

interface MetaFacebookSdk {
  init(options: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
  getLoginStatus(callback: (response: MetaLoginResponse) => void): void;
  XFBML: { parse(element?: HTMLElement): void };
}

interface Window {
  FB?: MetaFacebookSdk;
  fbAsyncInit?: () => void;
  checkLoginState?: () => void;
}
