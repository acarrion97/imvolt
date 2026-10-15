import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getContainer } from "@/infrastructure/container";
import { createCrudHooks } from "./createCrudHooks";
import { domainKey, queryKeys } from "@/infrastructure/cache/queryKeys";

// ── Proyectos ────────────────────────────────────────────────────────────────
const proyectosHooks = createCrudHooks(getContainer().proyectos, "proyectos");
export const {
  useList: useProyectos,
  useById: useProyecto,
  useCreate: useCreateProyecto,
  useUpdate: useUpdateProyecto,
  useDelete: useDeleteProyecto,
} = proyectosHooks;

// ── Propiedades ──────────────────────────────────────────────────────────────
const propiedadesHooks = createCrudHooks(getContainer().propiedades, "propiedades");
export const {
  useList: usePropiedades,
  useById: usePropiedad,
  useCreate: useCreatePropiedad,
  useUpdate: useUpdatePropiedad,
  useDelete: useDeletePropiedad,
} = propiedadesHooks;

/** Propiedades filtradas por proyecto (la foránea es el scope más usado). */
export function usePropiedadesByProyecto(projectId: string | undefined) {
  const { propiedades } = getContainer();
  return useQuery({
    queryKey: queryKeys.propiedadesByProyecto(projectId ?? ""),
    queryFn: () => propiedades.list.execute({ project_id: projectId }),
    enabled: Boolean(projectId),
  });
}

// ── Plantillas ───────────────────────────────────────────────────────────────
const plantillasHooks = createCrudHooks(getContainer().plantillas, "plantillas");
export const {
  useList: usePlantillas,
  useById: usePlantilla,
  useCreate: useCreatePlantilla,
  useUpdate: useUpdatePlantilla,
  useDelete: useDeletePlantilla,
} = plantillasHooks;

// ── Modelos (catálogo vivo §09) ──────────────────────────────────────────────
export function useModelos() {
  const { modelos } = getContainer();
  return useQuery({
    queryKey: queryKeys.modelos(),
    queryFn: () => modelos.list.execute(),
  });
}

// ── Generaciones ─────────────────────────────────────────────────────────────
const generacionesHooks = createCrudHooks(getContainer().generaciones, "generaciones");
export const {
  useList: useGeneraciones,
  useById: useGeneracion,
  useCreate: useCreateGeneracion,
  useUpdate: useUpdateGeneracion,
  useDelete: useDeleteGeneracion,
} = generacionesHooks;

export function useGeneracionesByPropiedad(propertyId: string | undefined) {
  const { generaciones } = getContainer();
  return useQuery({
    queryKey: queryKeys.generacionesByPropiedad(propertyId ?? ""),
    queryFn: () => generaciones.list.execute({ property_id: propertyId }),
    enabled: Boolean(propertyId),
  });
}

// ── Conexiones Meta ──────────────────────────────────────────────────────────
const conexionesHooks = createCrudHooks(getContainer().conexiones, "conexiones");
export const {
  useList: useConexiones,
  useById: useConexion,
  useCreate: useCreateConexion,
  useUpdate: useUpdateConexion,
  useDelete: useDeleteConexion,
} = conexionesHooks;

// ── Campañas ─────────────────────────────────────────────────────────────────
const campanasHooks = createCrudHooks(getContainer().campanas, "campanas");
export const {
  useList: useCampanas,
  useById: useCampana,
  useCreate: useCreateCampana,
  useUpdate: useUpdateCampana,
  useDelete: useDeleteCampana,
} = campanasHooks;

/** Avanza el flujo §10 (local_draft → validated → awaiting_approval). */
export function useValidarCampana() {
  const queryClient = useQueryClient();
  const { validarCampana } = getContainer();
  return useMutation({
    mutationFn: (campaignId: string) => validarCampana.execute(campaignId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: domainKey("campanas") }),
  });
}

// ── Leads ────────────────────────────────────────────────────────────────────
const leadsHooks = createCrudHooks(getContainer().leads, "leads");
export const {
  useList: useLeads,
  useById: useLead,
  useCreate: useCreateLead,
  useUpdate: useUpdateLead,
  useDelete: useDeleteLead,
} = leadsHooks;

export function useLeadsByCampana(campaignId: string | undefined) {
  const { leads } = getContainer();
  return useQuery({
    queryKey: queryKeys.leadsByCampana(campaignId ?? ""),
    queryFn: () => leads.list.execute({ campaign_id: campaignId }),
    enabled: Boolean(campaignId),
  });
}

// ── Créditos (billetera) ─────────────────────────────────────────────────────
export function useWallet() {
  const { getWallet } = getContainer();
  return useQuery({
    queryKey: queryKeys.wallet(),
    queryFn: () => getWallet.execute(),
  });
}

export function useTransacciones() {
  const { getTransacciones } = getContainer();
  return useQuery({
    queryKey: queryKeys.transacciones(),
    queryFn: () => getTransacciones.execute(),
  });
}

export function useRecargarCreditos() {
  const queryClient = useQueryClient();
  const { recargarCreditos } = getContainer();
  return useMutation({
    mutationFn: ({ monto, idempotencyKey }: { monto: number; idempotencyKey?: string }) =>
      recargarCreditos.execute(monto, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: domainKey("transacciones") });
    },
  });
}

// ── Utilidades ───────────────────────────────────────────────────────────────
export { useOnlineStatus } from "./useOnlineStatus";
