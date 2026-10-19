import type { Session } from "@/domain/auth";

/**
 * Sesión activa en `localStorage` (clave `imvolt-session`).
 *
 * Es la única fuente de verdad del token: `httpClient` la lee en cada
 * petición para armar `Authorization: Bearer …` y `X-Empresa-Id`, y el
 * `AuthProvider` la escucha para reaccionar a un cierre de sesión (logout
 * manual o 401 del API) desde cualquier punto de la app.
 *
 * Módulo sin dependencias: no importa ni http ni container (rompería el
 * ciclo httpClient → sessionStore → …).
 */

const STORAGE_KEY = "imvolt-session";

type Listener = () => void;
const listeners = new Set<Listener>();

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.access_token === "string" &&
    candidate.access_token.length > 0 &&
    typeof candidate.user_id === "string"
  );
}

function notify(): void {
  for (const listener of listeners) listener();
}

function persist(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Safari en modo privado / cuota llena: la sesión no persiste entre
    // recargas, pero la app sigue funcionando en memoria.
  }
  notify();
}

/** Devuelve la sesión persistida o `null` si no hay (o está corrupta). */
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  persist(session);
}

/** Combina la sesión guardada con cambios parciales (p.ej. `empresa_id`). */
export function patchSession(patch: Partial<Session>): Session | null {
  const current = readSession();
  if (!current) return null;
  const next: Session = { ...current, ...patch };
  persist(next);
  return next;
}

export function clearSession(): void {
  persist(null);
}

/**
 * Se suscribe a cambios de sesión (logout, 401 del API, otra pestaña).
 * Devuelve la función de baja.
 */
export function subscribeToSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Cerrar sesión en otra pestaña de la misma app.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === STORAGE_KEY) notify();
  });
}
