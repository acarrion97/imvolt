import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConfiguracionSistema,
  ConfiguracionSistemaInput,
  EmpresasAdminPage,
  Plan,
  PlanInput,
} from "@/domain/admin";
import { http } from "@/infrastructure/http/httpClient";

const ADMIN_QUERY_KEY = ["platform-admin"] as const;
const PAGE_SIZE = 20;

export function useAdminResumenEmpresas() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "empresas", "resumen"],
    queryFn: () => http.get<{ total: number; activas: number }>("/v1/admin/empresas/resumen"),
  });
}

export function useAdminPlanes() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "planes"],
    queryFn: () => http.get<Plan[]>("/v1/admin/planes"),
  });
}

export function useAdminEmpresas(pagina: number, busqueda: string, estado: string) {
  const params = new URLSearchParams({
    pagina: String(pagina),
    limite: String(PAGE_SIZE),
  });
  if (busqueda) params.set("q", busqueda);
  if (estado) params.set("estado", estado);

  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "empresas", pagina, busqueda, estado],
    queryFn: () => http.get<EmpresasAdminPage>(`/v1/admin/empresas?${params}`),
  });
}

export function useAdminConfiguraciones() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "configuraciones"],
    queryFn: () => http.get<ConfiguracionSistema[]>("/v1/admin/configuraciones"),
  });
}

export function useGuardarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: PlanInput }) =>
      id
        ? http.patch<Plan>(`/v1/admin/planes/${id}`, data)
        : http.post<Plan>("/v1/admin/planes", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEY, "planes"] }),
  });
}

export function useActualizarEmpresaAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { estado: "activo" | "inactivo"; plan_id: number | null };
    }) => http.patch(`/v1/admin/empresas/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEY, "empresas"] }),
  });
}

export interface AdminHiggsfieldConfig {
  configurado: boolean;
  entorno: "sandbox" | "produccion";
  api_key_configurada: boolean;
  app_secret_configurado: boolean;
}

export function useAdminHiggsfield(empresaId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "empresas", empresaId, "higgsfield"],
    queryFn: () => http.get<AdminHiggsfieldConfig>(`/v1/admin/empresas/${empresaId}/higgsfield`),
    enabled: Boolean(empresaId) && enabled,
  });
}

export function useGuardarAdminHiggsfield(empresaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entorno: "sandbox" | "produccion";
      api_key?: string;
      app_secret?: string;
    }) => http.put<AdminHiggsfieldConfig>(`/v1/admin/empresas/${empresaId}/higgsfield`, data),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...ADMIN_QUERY_KEY, "empresas", empresaId, "higgsfield"],
      }),
  });
}

export function useGuardarConfiguracion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id?: number;
      data: ConfiguracionSistemaInput;
    }) =>
      id
        ? http.patch<ConfiguracionSistema>(`/v1/admin/configuraciones/${id}`, data)
        : http.post<ConfiguracionSistema>("/v1/admin/configuraciones", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEY, "configuraciones"] }),
  });
}
