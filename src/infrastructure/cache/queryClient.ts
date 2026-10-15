import { QueryClient } from "@tanstack/react-query";

const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5; // 5 minutos
const DEFAULT_GC_TIME_MS = 1000 * 60 * 30; // 30 minutos

/**
 * staleTime es la "válvula" para no bombardear al backend: mientras los
 * datos estén frescos, cualquier componente que monte la misma consulta
 * recibe la respuesta de la caché sin salir una sola petición.
 * Se controla con VITE_QUERY_STALE_TIME (.env) sin tocar código.
 */
function readStaleTime(): number {
  const parsed = Number(import.meta.env.VITE_QUERY_STALE_TIME);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_STALE_TIME_MS;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: readStaleTime(),
        gcTime: DEFAULT_GC_TIME_MS,
        retry: 1,
        // Evita ráfagas de peticiones al volver a la pestaña; la frescura
        // la gobierna staleTime + la invalidación explícita tras cada escritura.
        refetchOnWindowFocus: false,
      },
    },
  });
}
