import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AUTH_ENABLED, useAuth } from "@/presentation/auth/AuthProvider";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();
  return !AUTH_ENABLED || perfil?.es_super_admin ? (
    <>{children}</>
  ) : (
    <Navigate to="/inicio" replace />
  );
}
