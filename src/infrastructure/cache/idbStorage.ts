import { get, set, del } from "idb-keyval";
import type { AsyncStorage } from "@tanstack/query-persist-client-core";

/**
 * Adapta idb-keyval a la forma `AsyncStorage` que espera el persister de
 * TanStack Query: la caché vive en IndexedDB (más capacidad que
 * localStorage y sin bloquear el hilo principal).
 */
export const idbAsyncStorage: AsyncStorage<string> = {
  getItem: async (key: string) => (await get(key)) ?? null,
  setItem: async (key: string, value: string) => {
    await set(key, value);
  },
  removeItem: async (key: string) => {
    await del(key);
  },
};
