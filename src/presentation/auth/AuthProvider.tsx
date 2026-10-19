import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { LoginInput, Perfil, Session } from "@/domain/auth";
import { getContainer } from "@/infrastructure/container";
import { resolveDataProvider } from "@/infrastructure/container/create-repositories";
import {
  clearSession,
  patchSession,
  readSession,
  subscribeToSession,
  writeSession,
} from "@/infrastructure/auth/sessionStore";
import { clearCachePersistence } from "@/infrastructure/cache/persistQueryClient";
import { ApiError } from "@/infrastructure/http/httpClient";

/**
 * Estado de sesión de la app.
 *
 *  - "disabled":   VITE_DATA_PROVIDER=mock → no hay backend ni login
 *                  (el prototipo arranca directo, como hasta ahora).
 *  - "loading":    restaurando la sesión persistida con GET /auth/me.
 *  - "authenticated": token válido (y perfil, si el API respondió).
 *  - "anonymous":  sin sesión → las rutas protegidas mandan a /login.
 */
export type AuthStatus = "disabled" | "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  /** Perfil local (usuario + roles); `null` mientras carga o en modo mock. */
  perfil: Perfil | null;
  /** Rol principal (§13) o `null` si aún no hay perfil. */
  rol: string | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** La autenticación solo existe contra el API real. */
export const AUTH_ENABLED = resolveDataProvider() === "rest";

/** 401 (token inválido) o 404 (sin cuenta local) = la sesión no sirve. */
function isSessionInvalid(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 404);
}

/** Fija el tenant de las siguientes peticiones (`X-Empresa-Id`). */
function syncEmpresa(perfil: Perfil, session: Session | null): void {
  const empresaId = perfil.usuario.empresa_id;
  if (empresaId && session?.empresa_id !== empresaId) {
    patchSession({ empresa_id: empresaId });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Estado inicial derivado de la sesión persistida (sin efectos sincrónicos).
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (!AUTH_ENABLED) return "disabled";
    return readSession() ? "loading" : "anonymous";
  });
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // ── Restaura la sesión persistida al abrir la app ──────────────────────────
  useEffect(() => {
    if (!AUTH_ENABLED) return;

    const session = readSession();
    if (!session) return;

    let cancelled = false;

    getContainer()
      .obtenerPerfil.execute()
      .then((data) => {
        if (cancelled) return;
        setPerfil(data);
        syncEmpresa(data, session);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isSessionInvalid(error)) {
          // Token vencido o cuenta sin usuario local: se descarta la sesión.
          clearSession();
          setPerfil(null);
          setStatus("anonymous");
          return;
        }
        // El API no respondió (caída, red): la sesión sigue siendo válida,
        // se entra igual y el perfil se verá más tarde.
        setStatus("authenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Reacciona a cualquier cierre de sesión (logout o 401 del API) ──────────
  useEffect(() => {
    if (!AUTH_ENABLED) return;
    return subscribeToSession(() => {
      if (readSession()) return;
      setPerfil(null);
      setStatus((current) => (current === "authenticated" ? "anonymous" : current));
    });
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    const container = getContainer();
    const session = await container.login.execute(input);
    writeSession(session);

    try {
      const data = await container.obtenerPerfil.execute();
      setPerfil(data);
      syncEmpresa(data, session);
    } catch (error) {
      // Sin usuario local no hay tenant ni roles: no se puede usar la app.
      if (isSessionInvalid(error)) {
        clearSession();
        throw error;
      }
      // API momentáneamente caído: se entra con el token y el perfil se
      // resuelve en el próximo refresco.
      setPerfil(null);
    }

    setStatus("authenticated");
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    clearSession();
    setPerfil(null);
    setStatus("anonymous");
    // Los datos en caché (IndexedDB incluida) pertenecen a esta sesión.
    await clearCachePersistence(queryClient);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      perfil,
      rol: perfil?.roles[0]?.nombre ?? null,
      login,
      logout,
    }),
    [status, perfil, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Estado de sesión (throws si se usa fuera del `AuthProvider`). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
