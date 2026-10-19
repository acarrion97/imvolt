import type { FilterParams } from "@/domain/core/repositories/CrudRepository";
import { clearSession, readSession } from "@/infrastructure/auth/sessionStore";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TIMEOUT_MS = 15000;

/** Error normalizado del backend: siempre tiene status (0 = error de red). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Convierte los filtros en query string, descartando valores vacíos. */
export function buildQuery(filters?: FilterParams): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (typeof body === "string" && body) return body;
  return `Error ${status} en la petición`;
}

/**
 * Cliente HTTP mínimo y único del template.
 * Toda la infraestructura REST pasa por aquí: centraliza URL base,
 * timeout, JSON, token Bearer y la normalización de errores a `ApiError`.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "VITE_API_URL no está definido. Configúralo en .env para usar el proveedor REST.",
      0,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init?.body) headers["Content-Type"] = "application/json";

    // La sesión del login manda; VITE_API_TOKEN queda como alternativa de
    // desarrollo para golpear el API sin pasar por /auth/login.
    const session = readSession();
    const token = session?.access_token ?? import.meta.env.VITE_API_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    // Tenant activo (multiempresa): el API lo resuelve por defecto con la
    // empresa del usuario y este header permite alternar (README del API).
    if (session?.empresa_id) headers["X-Empresa-Id"] = String(session.empresa_id);

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    const body = parseBody(await response.text());

    if (!response.ok) {
      // Token vencido o revocado: la sesión deja de servir en toda la app.
      if (response.status === 401 && session) clearSession();
      throw new ApiError(extractMessage(body, response.status), response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Tiempo de espera agotado: el servidor no respondió.", 0);
    }
    throw new ApiError(error instanceof Error ? error.message : "Error de red", 0);
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
