import type { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { idbAsyncStorage } from "./idbStorage";
import { isCacheableQueryKey, MAX_PERSISTED_AGE_MS, QUERY_CACHE_KEY } from "./cachePolicy";

const persister = createAsyncStoragePersister({
  storage: idbAsyncStorage,
  key: QUERY_CACHE_KEY,
});

/**
 * Conecta el QueryClient con IndexedDB.
 *
 * Solo se persisten las queries cuya clave pase `isCacheableQueryKey`
 * (allowlist en cachePolicy.ts) Y que hayan terminado con éxito: una
 * consulta deshabilitada o fallida nunca se guarda. El efecto es que al
 * reabrir la app los catálogos aparecen al instante desde disco y el
 * backend solo se consulta para datos no cacheados o vencidos.
 */
export function setupCachePersistence(queryClient: QueryClient): void {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: MAX_PERSISTED_AGE_MS,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && isCacheableQueryKey(query.queryKey),
    },
  });
}

/**
 * Borra toda la caché persistida. Llamar en logout o cambio de tenant
 * para que los datos de una sesión no sobrevivan a la siguiente.
 */
export async function clearCachePersistence(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  await idbAsyncStorage.removeItem(QUERY_CACHE_KEY);
}
