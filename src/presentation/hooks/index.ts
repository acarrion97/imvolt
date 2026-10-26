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

// ── Tipos de propiedad (catálogo de categorías) ──────────────────────────────
export const { useList: useTiposPropiedad } = createCrudHooks(
  getContainer().tiposPropiedad,
  "tiposPropiedad",
);

// ── Plantillas ───────────────────────────────────────────────────────────────
const plantillasHooks = createCrudHooks(getContainer().plantillas, "plantillas");
export const {
  useList: usePlantillas,
  useById: usePlantilla,
  useCreate: useCreatePlantilla,
  useUpdate: useUpdatePlantilla,
  useDelete: useDeletePlantilla,
} = plantillasHooks;


// ── Tipos de propiedad (catálogo de plantillas) ──────────────────────────────
export const { useList: useTiposPlantilla } = createCrudHooks(
  getContainer().tiposPlantilla,
  "tiposPlantilla" as Parameters<typeof createCrudHooks>[1],
);



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

// ── Brand Kit ────────────────────────────────────────────────────────────────
const brandAssetsHooks = createCrudHooks(getContainer().brandAssets, "brandAssets");
export const {
  useList: useBrandAssets,
  useById: useBrandAsset,
  useCreate: useCreateBrandAsset,
  useUpdate: useUpdateBrandAsset,
  useDelete: useDeleteBrandAsset,
} = brandAssetsHooks;

const brandColorsHooks = createCrudHooks(getContainer().brandColors, "brandColors");
export const {
  useList: useBrandColors,
  useById: useBrandColor,
  useCreate: useCreateBrandColor,
  useUpdate: useUpdateBrandColor,
  useDelete: useDeleteBrandColor,
} = brandColorsHooks;

/** Historial de versiones de un archivo del Brand Kit. */
export function useBrandAssetVersiones(assetId: string | undefined) {
  const { brandAssetStorage } = getContainer();
  return useQuery({
    queryKey: queryKeys.brandAssetVersiones(assetId ?? ""),
    queryFn: () => brandAssetStorage.listarVersiones(assetId as string),
    enabled: Boolean(assetId),
  });
}

/**
 * URL firmada de la versión activa, para previsualizar la tarjeta.
 * `staleTime` por debajo de los 5 minutos de caducidad para que la URL
 * vuelva a pedirse antes de expirar.
 */
export function useBrandAssetPreview(assetId: string | undefined, activo: boolean) {
  const { brandAssetStorage } = getContainer();
  return useQuery({
    queryKey: queryKeys.brandAssetPreview(assetId ?? ""),
    queryFn: () => brandAssetStorage.descargar(assetId as string),
    enabled: Boolean(assetId) && activo,
    staleTime: 4 * 60 * 1000,
    retry: false,
  });
}

/** Sube una nueva versión del archivo (pasa a ser la activa). */
export function useSubirBrandAssetVersion() {
  const queryClient = useQueryClient();
  const { brandAssetStorage } = getContainer();
  return useMutation({
    mutationFn: ({
      assetId,
      file,
      nota,
    }: {
      assetId: string;
      file: File;
      nota?: string | null;
    }) => brandAssetStorage.subirVersion(assetId, file, nota),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: domainKey("brandAssets") });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brandAssetVersiones(variables.assetId),
      });
    },
  });
}

/** Devuelve la URL firmada de descarga (caduca en 5 minutos). */
export function useDescargarBrandAsset() {
  const { brandAssetStorage } = getContainer();
  return useMutation({
    mutationFn: ({ assetId, versionId }: { assetId: string; versionId?: string }) =>
      versionId
        ? brandAssetStorage.descargarVersion(assetId, versionId)
        : brandAssetStorage.descargar(assetId),
  });
}

/** Vuelve a activar una versión antigua. */
export function useRestaurarBrandAssetVersion() {
  const queryClient = useQueryClient();
  const { brandAssetStorage } = getContainer();
  return useMutation({
    mutationFn: ({ assetId, versionId }: { assetId: string; versionId: string }) =>
      brandAssetStorage.restaurarVersion(assetId, versionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: domainKey("brandAssets") });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brandAssetVersiones(variables.assetId),
      });
    },
  });
}

/** Elimina una versión y su blob del bucket. */
export function useEliminarBrandAssetVersion() {
  const queryClient = useQueryClient();
  const { brandAssetStorage } = getContainer();
  return useMutation({
    mutationFn: ({ assetId, versionId }: { assetId: string; versionId: string }) =>
      brandAssetStorage.eliminarVersion(assetId, versionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: domainKey("brandAssets") });
      queryClient.invalidateQueries({
        queryKey: queryKeys.brandAssetVersiones(variables.assetId),
      });
    },
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
export { useAuth } from "@/presentation/auth/AuthProvider";
