import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "@/presentation/auth/AuthProvider";

/**
 * Guardia de las rutas privadas.
 *
 *  - modo mock (`VITE_DATA_PROVIDER=mock`) → deja pasar: no hay backend.
 *  - sesión válida → renderiza la app.
 *  - sin sesión    → /login, recordando la ruta original en `state.from`.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "disabled" || status === "authenticated") return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="auth-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  );
}
